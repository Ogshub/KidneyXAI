package com.kidneycare.service;

import com.kidneycare.dto.response.LabResultResponse;
import com.kidneycare.dto.response.MedicalReportResponse;
import com.kidneycare.dto.request.AssistantPageContext;
import com.kidneycare.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AssistantContextTools {
    public record Route(String intent, String parameter, String period, boolean latestLabs, boolean previousPeriod, boolean profile, boolean history,
                        List<String> reportIds, String tool, Long targetReportId, Long targetAssessmentId,
                        boolean latestPair, LocalDate reportDate, LocalDate journalDate, String ruleId) {}
    public record Context(List<String> lines, List<Map<String, Object>> references,
                          String status, LocalDate recordedOn, List<String> missing) {
        static Context missing(String detail) {
            return new Context(List.of(), List.of(), "missing", null, List.of(detail));
        }
    }
    private final PatientContextService patient;

    public void validatePage(String email, AssistantPageContext page) {
        if (page == null) return;
        if (page.reportId() != null) patient.report(email, page.reportId());
        if (page.assessmentId() != null) patient.assessment(email, page.assessmentId());
    }

    public Context read(String email, Route route) {
        try {
            if (route.tool() != null) return invoke(email, route);
            return switch (route.intent()) {
                case "REPORT_LOOKUP", "REPORT_EXPLANATION" -> reports(email, route);
                case "LAB_HISTORY" -> laboratories(email, route.parameter(), route.latestLabs());
                case "REPORT_COMPARISON" -> comparison(email, route);
                case "LIFESTYLE_SUMMARY" -> lifestyle(email, route.period(), route.previousPeriod());
                case "ASSESSMENT_EXPLANATION" -> assessment(email, route.targetAssessmentId());
                case "RECOMMENDATION_EXPLANATION" -> recommendations(email, null);
                default -> Context.missing("No patient record is needed");
            };
        } catch (ResourceNotFoundException | IllegalArgumentException e) {
            return Context.missing("Matching records in your account");
        }
    }

    private Context invoke(String email, Route route) {
        return switch (route.tool()) {
            case "get_health_profile" -> profile(email);
            case "list_medical_reports" -> reportList(email);
            case "get_latest_medical_report" -> latestReport(email);
            case "get_report_details" -> reportDetails(email, route.targetReportId(), route.reportDate());
            case "get_latest_lab_results" -> laboratories(email, null, true);
            case "get_lab_parameter_history" -> laboratories(email, route.parameter(), false);
            case "compare_medical_reports" -> comparison(email, route);
            case "get_lifestyle_summary" -> lifestyle(email, route.period(), route.previousPeriod());
            case "get_journal_entry" -> journal(email, route.journalDate());
            case "get_latest_assessment" -> assessment(email, null);
            case "get_assessment_details" -> route.targetAssessmentId() == null
                    ? Context.missing("Select an assessment result in the app") : assessment(email, route.targetAssessmentId());
            case "get_recommendations" -> recommendations(email, null);
            case "explain_recommendation_rule" -> route.ruleId() == null
                    ? Context.missing("Recommendation rule identifier") : recommendations(email, route.ruleId());
            case "search_medical_knowledge", "get_application_navigation", "appointment_preparation", "clarify", "abstain" ->
                    Context.missing("No patient record is needed");
            default -> Context.missing("Supported assistant request");
        };
    }

    private Context reports(String email, Route route) {
        if (route.profile()) return profile(email);
        if (route.history()) return reportList(email);
        if (route.targetReportId() != null) return reportDetails(email, route.targetReportId(), null);
        return latestReport(email);
    }

    private Context profile(String email) {
        return patient.healthProfile(email).map(p -> facts(List.of("A health profile is available in your account.",
                    "Any measurements or conditions in the profile are self-reported."), List.of(ref("profile", p.getId(), "/profile")), null))
                    .orElseGet(() -> Context.missing("Health profile"));
    }

    private Context reportList(String email) {
        var reports = patient.recentReports(email, 5);
        return reports.isEmpty() ? Context.missing("Medical report") : facts(
                reports.stream().map(this::reportLabel).toList(), reports.stream().map(this::reportRef).toList(),
                reports.get(0).reportDate());
    }

    private Context latestReport(String email) {
        return patient.latestReport(email).map(report -> facts(List.of(reportLabel(report),
                "Open the report to see its dated measurements and the attached document."), List.of(reportRef(report)), report.reportDate()))
                .orElseGet(() -> Context.missing("Medical report"));
    }

    private Context reportDetails(String email, Long id, LocalDate date) {
        MedicalReportResponse report;
        if (id != null && date == null) {
            report = patient.report(email, id);
        } else if (date != null) {
            var matches = patient.reportsOnDate(email, date);
            if (matches.size() != 1) return Context.missing("A single matching report for " + date);
            report = patient.report(email, matches.get(0));
        } else {
            return Context.missing("Select a report or provide its report number or date");
        }
        if (hasConflictingMeasurements(report)) {
            return new Context(List.of("The report contains conflicting measurements."),
                    List.of(reportRef(report)), "conflicting", report.reportDate(), List.of());
        }
        var lines = new ArrayList<String>();
        lines.add(reportLabel(report));
        report.measurements().stream().limit(8).map(this::labLabel).forEach(lines::add);
        if (report.measurements().isEmpty()) lines.add("No laboratory values have been entered for this report.");
        return facts(lines, List.of(reportRef(report)), report.reportDate());
    }

    private Context laboratories(String email, String parameter, boolean latest) {
        if (parameter == null && !latest) return Context.missing("Laboratory parameter or a request for latest lab results");
        var values = parameter == null ? patient.latestMeasurements(email).values().stream().limit(8).toList()
                : patient.laboratoryHistory(email, parameter, 8);
        if (values.isEmpty()) return Context.missing("Laboratory measurement");
        var seen = new java.util.HashMap<String, LabResultResponse>();
        for (var value : values) {
            if (value.normalizedUnit() == null || value.normalizedUnit().isBlank()) {
                return new Context(List.of("A matching record has no comparable unit."), List.of(labRef(value)),
                        "unsupported_units", value.recordedAt(), List.of());
            }
            var earlier = seen.putIfAbsent(value.parameterName() + ":" + value.recordedAt() + ":" + value.reportId(), value);
            if (earlier != null && earlier.normalizedValue().compareTo(value.normalizedValue()) != 0) {
                return new Context(List.of("The report has different values for the same parameter and date."),
                        List.of(labRef(earlier), labRef(value)), "conflicting", value.recordedAt(), List.of());
            }
        }
        return facts(values.stream().map(this::labLabel).toList(), values.stream().map(this::labRef).toList(),
                values.stream().map(LabResultResponse::recordedAt).max(LocalDate::compareTo).orElse(null));
    }

    private Context comparison(String email, Route route) {
        var ids = route.reportIds();
        if (route.latestPair() && (ids == null || ids.isEmpty())) {
            var latest = patient.recentReports(email, 2);
            ids = latest.size() == 2 ? List.of(latest.get(1).id().toString(), latest.get(0).id().toString()) : List.of();
        }
        if (ids == null || ids.size() != 2 || ids.get(0).equals(ids.get(1))) {
            return Context.missing("Two distinct report numbers");
        }
        var comparison = patient.compareReports(email, Long.parseLong(ids.get(0)), Long.parseLong(ids.get(1)));
        var lines = new ArrayList<String>();
        lines.add(reportLabel(comparison.first()) + " compared with " + reportLabel(comparison.second()));
        if (hasConflictingMeasurements(comparison.first()) || hasConflictingMeasurements(comparison.second())) {
            return new Context(List.of("One report contains conflicting measurements."),
                    List.of(reportRef(comparison.first()), reportRef(comparison.second())), "conflicting", null, List.of());
        }
        var numeric = comparison.rows().stream().filter(r -> r.delta() != null).limit(8).toList();
        if (numeric.isEmpty()) return Context.missing("Measurements with a common parameter and comparable unit");
        numeric.forEach(r -> lines.add(r.parameter().replace('_', ' ') + ": " + r.first().normalizedValue().stripTrailingZeros().toPlainString()
                + " to " + r.second().normalizedValue().stripTrailingZeros().toPlainString() + " " + r.second().normalizedUnit()
                + " (second minus first: " + r.delta().stripTrailingZeros().toPlainString() + ")."));
        return facts(lines, List.of(reportRef(comparison.first()), reportRef(comparison.second())),
                comparison.first().reportDate().isAfter(comparison.second().reportDate())
                        ? comparison.first().reportDate() : comparison.second().reportDate());
    }

    private boolean hasConflictingMeasurements(MedicalReportResponse report) {
        var seen = new java.util.HashMap<String, LabResultResponse>();
        for (var value : report.measurements()) {
            var earlier = seen.putIfAbsent(value.parameterName() + ":" + value.recordedAt(), value);
            if (earlier != null && (!earlier.normalizedUnit().equals(value.normalizedUnit())
                    || earlier.normalizedValue().compareTo(value.normalizedValue()) != 0)) return true;
        }
        return false;
    }

    private Context lifestyle(String email, String period, boolean previousPeriod) {
        boolean monthly = "monthly".equals(period);
        LocalDate anchor = LocalDate.now();
        if (previousPeriod) anchor = monthly ? anchor.minusMonths(1) : anchor.minusWeeks(1);
        var summary = patient.lifestyleSummary(email, monthly ? "monthly" : "weekly", anchor);
        if (summary.getRecordedDays() == 0) return Context.missing("Journal entry for that period");
        var lines = new ArrayList<String>();
        lines.add("Journal from " + summary.getStartDate() + " through " + summary.getEndDate() + ": "
                + summary.getRecordedDays() + " of " + summary.getTotalDaysInPeriod() + " days recorded.");
        if (summary.getHydration() != null && summary.getHydration().getAverageLiters() != null) {
            lines.add("Recorded water intake averaged " + summary.getHydration().getAverageLiters()
                    + " L across " + summary.getHydration().getRecordedCount() + " entries. This is a journal statistic.");
        }
        return facts(lines, List.of(Map.of("kind", "lifestyle_summary", "path", "/tracker",
                "startDate", summary.getStartDate(), "endDate", summary.getEndDate())), null);
    }

    private Context journal(String email, LocalDate date) {
        if (date == null || date.isAfter(LocalDate.now())) return Context.missing("Past or current journal date");
        return patient.journalEntry(email, date).map(entry -> {
            var lines = new ArrayList<String>();
            lines.add("A journal entry was recorded on " + entry.getActivityDate() + ".");
            if (entry.getWaterIntakeLiters() != null) lines.add("Recorded water: " + entry.getWaterIntakeLiters() + " L.");
            if (entry.getExerciseMinutes() != null) lines.add("Recorded exercise: " + entry.getExerciseMinutes() + " minutes.");
            if (entry.getSleepHours() != null) lines.add("Recorded sleep: " + entry.getSleepHours() + " hours.");
            return facts(lines, List.of(ref("journal_entry", entry.getId(), "/tracker")), entry.getActivityDate());
        }).orElseGet(() -> Context.missing("Journal entry for " + date));
    }

    private Context assessment(String email, Long id) {
        var record = id == null ? patient.latestAssessment(email) : java.util.Optional.of(patient.assessment(email, id));
        return record.filter(a -> !Boolean.TRUE.equals(a.getIsDemoMode())).map(a -> {
            var lines = new ArrayList<String>();
            lines.add("Assessment #" + a.getId() + " recorded on " + a.getCreatedAt().toLocalDate()
                    + " has an educational model score of " + a.getRiskScore() + ".");
            if ("available".equals(a.getExplanationStatus()) && a.getExplanations() != null) {
                a.getExplanations().stream().limit(3).forEach(feature -> lines.add(feature.getFeature()
                        + ": " + feature.getShapValue() + " log-odds contribution to the model output."));
            } else {
                lines.add("A verified local SHAP explanation is unavailable for this assessment.");
            }
            return facts(lines, List.of(ref("assessment", a.getId(), "/assessment/result/" + a.getId())), a.getCreatedAt().toLocalDate());
        }).orElseGet(() -> Context.missing("Verified assessment"));
    }

    private Context recommendations(String email, String ruleId) {
        var rules = patient.educationalRecommendations(email).stream()
                .filter(r -> r.getRuleId() != null && r.getSource() != null)
                .filter(r -> ruleId == null || ruleId.equals(r.getRuleId())).limit(5).toList();
        if (rules.isEmpty()) return Context.missing("Educational recommendation");
        return facts(rules.stream().map(r -> "Rule " + r.getRuleId() + " (" + r.getCategory() + ") cites "
                + r.getSource() + ". Review the application card for limitations and restrictions.").toList(),
                rules.stream().<Map<String, Object>>map(r -> Map.of("kind", "educational_rule", "id", r.getRuleId(),
                        "path", "/recommendations", "source", r.getSource())).toList(), null);
    }

    private Context facts(List<String> lines, List<Map<String, Object>> refs, LocalDate date) {
        return new Context(lines, refs, "complete", date, List.of());
    }

    private String reportLabel(MedicalReportResponse report) {
        return "Report #" + report.id() + " is dated " + report.reportDate() + " (" + report.reportType() + ").";
    }

    private Map<String, Object> reportRef(MedicalReportResponse report) {
        return Map.of("kind", "report", "id", report.id(), "path", "/reports/" + report.id(), "date", report.reportDate());
    }

    private String labLabel(LabResultResponse value) {
        return value.parameterName().replace('_', ' ') + ": " + value.value().stripTrailingZeros().toPlainString()
                + " " + value.unit() + " on " + value.recordedAt() + " ("
                + (value.transcriptionConfirmed() ? "user-confirmed transcription" : "unconfirmed transcription") + ").";
    }

    private Map<String, Object> labRef(LabResultResponse value) {
        return Map.of("kind", "laboratory", "id", value.id(), "path", "/reports/" + value.reportId(),
                "date", value.recordedAt(), "unit", value.unit(), "parameter", value.parameterName(), "transcriptionConfirmed", value.transcriptionConfirmed());
    }

    private Map<String, Object> ref(String kind, Long id, String path) {
        return Map.of("kind", kind, "id", id, "path", path);
    }
}
