package com.kidneycare;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kidneycare.dto.response.MlPredictionResponse;
import com.kidneycare.service.MlService;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.DriverManager;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@EnabledIfEnvironmentVariable(named = "KIDNEY_XAI_TEST_PG_PORT", matches = "[0-9]+")
class MedicalRecordsIntegrationTest {
    private static final String DB = "kidney_test_" + UUID.randomUUID().toString().replace("-", "");
    private static final String JWT_SECRET = UUID.randomUUID().toString() + UUID.randomUUID();
    private static final Path SQL = Path.of("..", "docs", "database");
    private static final byte[] PDF = "%PDF-1.7\n%%EOF\n".getBytes(StandardCharsets.US_ASCII);

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired JdbcTemplate jdbc;
    @MockBean MlService ml;

    private static String url(String database) {
        int port = Integer.parseInt(System.getenv("KIDNEY_XAI_TEST_PG_PORT"));
        return "jdbc:postgresql://127.0.0.1:" + port + "/" + database + "?sslmode=disable";
    }

    private static String username() {
        return System.getenv().getOrDefault("KIDNEY_XAI_TEST_PG_USER", "kidneytest");
    }

    private static String password() {
        return System.getenv().getOrDefault("KIDNEY_XAI_TEST_PG_PASSWORD", "");
    }

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) throws Exception {
        try (var admin = DriverManager.getConnection(url("postgres"), username(), password());
             var statement = admin.createStatement()) {
            statement.execute("CREATE DATABASE " + DB);
        }
        try (var db = DriverManager.getConnection(url(DB), username(), password());
             var statement = db.createStatement()) {
            statement.execute(Files.readString(SQL.resolve("schema.sql")));
            statement.execute(Files.readString(SQL.resolve("migration_v2.sql")));
            statement.execute(Files.readString(SQL.resolve("migration_v3.sql")));
            statement.execute(Files.readString(SQL.resolve("migration_v3.sql")));
            statement.execute(Files.readString(SQL.resolve("migration_v4.sql")));
        }
        registry.add("spring.datasource.url", () -> url(DB));
        registry.add("spring.datasource.username", MedicalRecordsIntegrationTest::username);
        registry.add("spring.datasource.password", MedicalRecordsIntegrationTest::password);
        registry.add("jwt.secret", () -> JWT_SECRET);
    }

    @AfterAll
    static void dropTestDatabase() throws Exception {
        try (var admin = DriverManager.getConnection(url("postgres"), username(), password());
             var statement = admin.createStatement()) {
            statement.execute("DROP DATABASE IF EXISTS " + DB + " WITH (FORCE)");
        }
    }

    @Test
    void replaysV2OnRepresentativeLegacyRows() throws Exception {
        try (var connection = DriverManager.getConnection(url(DB), username(), password());
             var statement = connection.createStatement()) {
            connection.setAutoCommit(false);
            statement.execute("CREATE SCHEMA legacy_fixture");
            statement.execute("SET LOCAL search_path = legacy_fixture");
            statement.execute("CREATE TABLE daily_activities (id bigint PRIMARY KEY, water_intake_liters double precision)");
            statement.execute("CREATE TABLE recommendations (id bigint PRIMARY KEY, recommendation text)");
            statement.execute("INSERT INTO daily_activities VALUES (1,1.5)");
            statement.execute("INSERT INTO recommendations VALUES (1,'fixture')");
            String v2 = Files.readString(SQL.resolve("migration_v2.sql"));
            statement.execute(v2);
            statement.execute(v2);
            try (var rows = statement.executeQuery(
                    "SELECT water_intake_liters, medication_status, systolic_bp, exercise_type FROM daily_activities")) {
                assertTrue(rows.next());
                assertEquals(1.5, rows.getDouble(1));
                assertEquals("NOT_RECORDED", rows.getString(2));
                assertNull(rows.getObject(3));
                assertNull(rows.getObject(4));
            }
            try (var rows = statement.executeQuery("SELECT recommendation, rule_id FROM recommendations")) {
                assertTrue(rows.next());
                assertEquals("fixture", rows.getString(1));
                assertNull(rows.getObject(2));
            }
            var savepoint = connection.setSavepoint();
            assertThrows(java.sql.SQLException.class,
                    () -> statement.execute("UPDATE daily_activities SET medication_status = 'INVALID'"));
            connection.rollback(savepoint);
            connection.rollback();
        }
    }

    @Test
    void upgradesExistingDatabaseToV3AndRejectsInconsistentOwnership() throws Exception {
        try (var connection = DriverManager.getConnection(url(DB), username(), password());
             var statement = connection.createStatement()) {
            connection.setAutoCommit(false);
            statement.execute("CREATE SCHEMA v3_fixture");
            statement.execute("SET LOCAL search_path = v3_fixture");
            statement.execute("CREATE TABLE users (id bigint PRIMARY KEY, name text NOT NULL)");
            statement.execute("INSERT INTO users VALUES (1,'Existing fixture'), (2,'Other fixture')");
            String v3 = Files.readString(SQL.resolve("migration_v3.sql"));
            statement.execute(v3);
            statement.execute(v3);
            try (var existing = statement.executeQuery("SELECT name FROM users WHERE id=1")) {
                assertTrue(existing.next());
                assertEquals("Existing fixture", existing.getString(1));
            }
            statement.execute("INSERT INTO medical_reports(id,user_id,report_date,report_type) VALUES (1,1,CURRENT_DATE,'bloodwork')");
            var beforeInvalidOwner = connection.setSavepoint();
            var error = assertThrows(java.sql.SQLException.class, () -> statement.execute("""
                    INSERT INTO lab_results(report_id,user_id,parameter_name,original_value,original_unit,
                        normalized_value,normalized_unit,recorded_at,source)
                    VALUES (1,2,'hemoglobin',14,'g/dL',14,'g/dL',CURRENT_DATE,'fixture')
                    """));
            assertEquals("23503", error.getSQLState());
            connection.rollback(beforeInvalidOwner);
            try (var secured = statement.executeQuery("""
                    SELECT count(*) FROM pg_class WHERE relnamespace='v3_fixture'::regnamespace
                      AND relname IN ('medical_reports','medical_report_files','lab_results') AND relrowsecurity
                    """)) {
                assertTrue(secured.next());
                assertEquals(3, secured.getInt(1));
            }
            connection.rollback();
        }
    }

    @Test
    void reportAndMeasurementLifecycleArePrivateAndTransactional() throws Exception {
        String a = register();
        String b = register();
        var day = LocalDate.now().minusDays(3);
        String report = json.writeValueAsString(Map.of("reportType", "bloodwork", "reportDate", day, "labName", "Synthetic Lab"));
        MockMultipartFile metadata = new MockMultipartFile("report", "", "application/json", report.getBytes(StandardCharsets.UTF_8));
        mvc.perform(multipart("/api/reports").file(metadata)
                .file(new MockMultipartFile("file", "wrong.pdf", "application/pdf", new byte[]{1, 2}))
                .header("Authorization", a)).andExpect(status().isBadRequest());
        assertEquals(0, body(mvc.perform(get("/api/reports").header("Authorization", a)), 200).path("totalElements").asInt());

        long first = body(mvc.perform(multipart("/api/reports").file(metadata)
                .file(new MockMultipartFile("file", "synthetic.pdf", "application/pdf", PDF))
                .header("Authorization", a)), 201).path("id").asLong();
        String firstPath = "/api/reports/" + first;
        long second = body(send(post("/api/reports"), a, Map.of("reportType", "bloodwork", "reportDate", day.plusDays(1))), 201)
                .path("id").asLong();
        String secondPath = "/api/reports/" + second;
        mvc.perform(get(firstPath)).andExpect(status().isForbidden());
        mvc.perform(get(firstPath).header("Authorization", b)).andExpect(status().isNotFound());
        mvc.perform(delete(firstPath).header("Authorization", b)).andExpect(status().isNotFound());
        assertEquals(0, body(mvc.perform(get("/api/reports").header("Authorization", b)), 200).path("totalElements").asInt());
        body(send(put(firstPath), a, Map.of("reportType", "bloodwork", "reportDate", day, "notes", "edited")), 200);
        assertEquals("edited", body(mvc.perform(get(firstPath).header("Authorization", a)), 200).path("notes").asText());

        String signed = "/api" + body(mvc.perform(get(firstPath + "/file-link").header("Authorization", a)), 200)
                .path("path").asText();
        mvc.perform(get(java.net.URI.create(signed))).andExpect(status().isForbidden());
        mvc.perform(get(java.net.URI.create(signed)).header("Authorization", b)).andExpect(status().isNotFound());
        mvc.perform(get(java.net.URI.create(signed.replaceFirst("expires=[0-9]+", "expires=1"))).header("Authorization", a))
                .andExpect(status().isNotFound());
        mvc.perform(get(java.net.URI.create(signed)).header("Authorization", a))
                .andExpect(status().isOk()).andExpect(content().bytes(PDF))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
        mvc.perform(multipart(org.springframework.http.HttpMethod.PUT, firstPath + "/file")
                .file(new MockMultipartFile("file", "replacement.pdf", "application/pdf", PDF))
                .header("Authorization", a)).andExpect(status().isOk());
        mvc.perform(get(java.net.URI.create(signed)).header("Authorization", a)).andExpect(status().isNotFound());

        var creatinine = Map.of("parameterName", "serum_creatinine", "value", 88.4, "unit", "µmol/L",
                "recordedAt", day, "source", "Synthetic source", "transcriptionConfirmed", true);
        JsonNode result = body(send(post(firstPath + "/lab-results"), a, creatinine), 201);
        long id = result.path("id").asLong();
        assertEquals(88.4, result.path("value").asDouble());
        assertEquals(1.0, result.path("normalizedValue").asDouble());
        assertEquals("Synthetic source", result.path("source").asText());
        String resultPath = firstPath + "/lab-results/" + id;
        send(put(resultPath), b, creatinine).andExpect(status().isNotFound());
        send(put(secondPath + "/lab-results/" + id), a, creatinine).andExpect(status().isNotFound());

        var latest = Map.of("parameterName", "serum_creatinine", "value", 1.5, "unit", "mg/dL",
                "recordedAt", day.plusDays(1), "source", "Second synthetic source", "transcriptionConfirmed", false);
        long newer = body(send(post(secondPath + "/lab-results"), a, latest), 201).path("id").asLong();
        var egfr = Map.of("parameterName", "egfr", "value", 60, "unit", "mL/min/1.73m²",
                "recordedAt", day, "source", "Synthetic test", "transcriptionConfirmed", true);
        body(send(post(firstPath + "/lab-results"), a, egfr), 201);
        var invalidUnit = new java.util.HashMap<>(creatinine);
        invalidUnit.put("unit", "g/L");
        send(post(firstPath + "/lab-results"), a, invalidUnit).andExpect(status().isBadRequest());

        String labs = "/api/lab-results";
        var inputs = body(mvc.perform(get(labs + "/assessment-inputs").header("Authorization", a)), 200);
        assertEquals(1.0, inputs.path("serumCreatinine").path("normalizedValue").asDouble());
        assertFalse(inputs.has("egfr"));
        assertTrue(body(mvc.perform(get(labs + "/assessment-inputs").header("Authorization", b)), 200).isEmpty());
        var history = body(mvc.perform(get(labs).param("parameter", "serum_creatinine").header("Authorization", a)), 200);
        assertEquals(id, history.get(0).path("id").asLong());
        assertEquals(newer, history.get(1).path("id").asLong());

        var compare = get(labs + "/compare").param("a", Long.toString(first)).param("b", Long.toString(second));
        var comparison = body(mvc.perform(compare.header("Authorization", a)), 200);
        var rows = comparison.path("rows");
        assertTrue(rows.get(0).path("delta").isNull());
        assertEquals(0.5, rows.get(1).path("delta").asDouble());
        mvc.perform(get(labs + "/compare").param("a", Long.toString(first)).param("b", Long.toString(second))
                .header("Authorization", b)).andExpect(status().isNotFound());

        var edited = new java.util.HashMap<>(creatinine);
        edited.put("value", 176.8);
        assertEquals(2.0, body(send(put(resultPath), a, edited), 200).path("normalizedValue").asDouble());
        mvc.perform(delete(resultPath).header("Authorization", a)).andExpect(status().isNoContent());
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM lab_results WHERE id = ?", Integer.class, id));
        mvc.perform(delete(firstPath).header("Authorization", a)).andExpect(status().isNoContent());
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM medical_report_files WHERE report_id = ?", Integer.class, first));
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM lab_results WHERE report_id = ?", Integer.class, first));
    }

    @Test
    void preservesTrackerSemanticsAndRecommendationProvenance() throws Exception {
        String auth = register();
        var date = LocalDate.now();
        var first = body(send(post("/api/activities"), auth, Map.of("activityDate", date, "waterIntakeLiters", 1.25)), 201);
        var edit = body(send(post("/api/activities"), auth, Map.of("activityDate", date, "waterIntakeLiters", 1.75)), 201);
        assertEquals(first.path("id"), edit.path("id"));
        assertEquals("NOT_RECORDED", edit.path("medicationStatus").asText());
        for (String period : new String[]{"weekly", "monthly"}) {
            var summary = body(mvc.perform(get("/api/activities/summary").param("period", period)
                    .param("date", date.toString()).header("Authorization", auth)), 200);
            assertEquals(1, summary.path("recordedDays").asInt());
            assertEquals(1.75, summary.path("hydration").path("averageLiters").asDouble());
            assertEquals(0, summary.path("medicationAdherenceCounts").path("MISSED").asInt());
        }

        var prediction = new MlPredictionResponse();
        prediction.setPrediction("notckd");
        prediction.setRiskScore(0.1);
        prediction.setModelVersion("1.0");
        when(ml.predict(any())).thenReturn(prediction);
        body(send(post("/api/assessments"), auth, Map.of("age", 42, "bloodPressure", 80)), 201);
        JsonNode recommendations = body(mvc.perform(get("/api/recommendations").header("Authorization", auth)), 200);
        assertFalse(recommendations.isEmpty());
        for (JsonNode recommendation : recommendations) {
            assertTrue(recommendation.path("ruleId").asText().startsWith("RULE-"));
            assertFalse(recommendation.path("source").asText().isBlank());
            assertFalse(recommendation.path("createdAt").asText().isBlank());
        }
    }

    @Test
    void v4PreservesMedicalDataAndDeletesOnlyOwnedConversations() throws Exception {
        String owner = register();
        String other = register();
        long report = body(send(post("/api/reports"), owner,
                Map.of("reportType", "bloodwork", "reportDate", LocalDate.now())), 201).path("id").asLong();
        String v4 = Files.readString(SQL.resolve("migration_v4.sql"));
        jdbc.execute(v4);
        jdbc.execute(v4);
        body(mvc.perform(get("/api/reports/" + report).header("Authorization", owner)), 200);

        mvc.perform(get("/api/assistant/conversations")).andExpect(status().isForbidden());
        var response = body(send(post("/api/assistant/chat"), owner, Map.of("message", "What is eGFR?")), 200);
        String id = response.path("conversationId").asText();
        String message = response.path("messageId").asText();
        String path = "/api/assistant/conversations/" + id;
        body(mvc.perform(get(path).header("Authorization", owner)), 200);
        mvc.perform(get(path).header("Authorization", other)).andExpect(status().isNotFound());
        mvc.perform(delete(path).header("Authorization", other)).andExpect(status().isNotFound());
        send(post("/api/assistant/chat"), other, Map.of("message", "Follow-up", "conversationId", id))
                .andExpect(status().isNotFound());
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM ai_audit_logs WHERE message_id=?::uuid", Integer.class, message));
        mvc.perform(delete(path).header("Authorization", owner)).andExpect(status().isNoContent());
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM ai_audit_logs WHERE message_id=?::uuid", Integer.class, message));
        mvc.perform(get(path).header("Authorization", owner)).andExpect(status().isNotFound());
    }

    private String register() throws Exception {
        String email = UUID.randomUUID() + "@example.test";
        return "Bearer " + body(send(post("/api/auth/register"), null,
                Map.of("name", "Synthetic Test", "email", email, "password", UUID.randomUUID().toString())), 201)
                .path("token").asText();
    }

    private ResultActions send(MockHttpServletRequestBuilder request, String auth, Object value) throws Exception {
        if (auth != null) request.header("Authorization", auth);
        return mvc.perform(request.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsBytes(value)));
    }

    private JsonNode body(ResultActions request, int expected) throws Exception {
        return json.readTree(request.andExpect(MockMvcResultMatchers.status().is(expected))
                .andReturn().getResponse().getContentAsByteArray());
    }
}
