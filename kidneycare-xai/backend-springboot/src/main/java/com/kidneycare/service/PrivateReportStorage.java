package com.kidneycare.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Component
public class PrivateReportStorage {
    public record Attachment(UUID key, String name, String mediaType) {}
    public record Download(String name, String mediaType, byte[] contents) {}
    public record SignedDownload(long expires, String signature) {}

    static final int MAX_SIZE = 10 * 1024 * 1024;
    private final JdbcTemplate jdbc;
    private final SecretKeySpec secret;

    public PrivateReportStorage(JdbcTemplate jdbc, @Value("${jwt.secret}") String secret) {
        this.jdbc = jdbc;
        this.secret = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    public Optional<Attachment> metadata(long reportId) {
        return jdbc.query("SELECT object_key, file_name, media_type FROM medical_report_files WHERE report_id = ?",
                (row, index) -> new Attachment(row.getObject("object_key", UUID.class),
                        row.getString("file_name"), row.getString("media_type")), reportId).stream().findFirst();
    }

    public void store(long reportId, MultipartFile file) {
        if (file.isEmpty() || file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("Choose a non-empty PDF, PNG or JPEG of up to 10 MB");
        }
        String name = file.getOriginalFilename();
        if (name == null || name.length() > 255 || name.matches(".*[\\\\/].*")
                || name.codePoints().anyMatch(Character::isISOControl)) {
            throw new IllegalArgumentException("Invalid attachment filename");
        }
        byte[] contents;
        try {
            contents = file.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("The attachment could not be read");
        }
        String mediaType = validateContent(name, file.getContentType(), contents);
        jdbc.update("""
                INSERT INTO medical_report_files(report_id, object_key, file_name, media_type, contents)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT (report_id) DO UPDATE SET object_key = EXCLUDED.object_key,
                    file_name = EXCLUDED.file_name, media_type = EXCLUDED.media_type, contents = EXCLUDED.contents
                """, reportId, UUID.randomUUID(), name, mediaType, contents);
    }

    static String validateContent(String name, String contentType, byte[] contents) {
        String suffix = name.toLowerCase(Locale.ROOT);
        if (contents.length > 0 && contents.length <= MAX_SIZE) {
            String prefix = HexFormat.of().formatHex(contents, 0, Math.min(contents.length, 8));
            if (suffix.endsWith(".pdf") && "application/pdf".equals(contentType) && prefix.startsWith("255044462d")) {
                return "application/pdf";
            }
            if (suffix.endsWith(".png") && "image/png".equals(contentType) && prefix.equals("89504e470d0a1a0a")) {
                return "image/png";
            }
            if ((suffix.endsWith(".jpg") || suffix.endsWith(".jpeg")) && "image/jpeg".equals(contentType)
                    && prefix.startsWith("ffd8ff")) {
                return "image/jpeg";
            }
        }
        throw new IllegalArgumentException("The filename, file type and signature must match a PDF, PNG or JPEG");
    }

    public SignedDownload sign(long reportId, long userId, UUID key) {
        long expires = Instant.now().getEpochSecond() + 120;
        return new SignedDownload(expires, signature(reportId, userId, key, expires));
    }

    public Optional<Download> download(long reportId, long userId, long expires, String supplied) {
        long now = Instant.now().getEpochSecond();
        if (expires <= now || expires > now + 120 || supplied.length() != 43) {
            return Optional.empty();
        }
        return metadata(reportId).filter(file -> MessageDigest.isEqual(
                        signature(reportId, userId, file.key(), expires).getBytes(StandardCharsets.US_ASCII),
                        supplied.getBytes(StandardCharsets.US_ASCII)))
                .flatMap(file -> jdbc.query("""
                        SELECT file_name, media_type, contents FROM medical_report_files
                        WHERE report_id = ? AND object_key = ?
                        """, (row, index) -> new Download(row.getString(1), row.getString(2), row.getBytes(3)),
                        reportId, file.key()).stream().findFirst());
    }

    private String signature(long reportId, long userId, UUID key, long expires) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(secret);
            String payload = "medical-report-download:" + reportId + ":" + userId + ":" + key + ":" + expires;
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Failed to sign report download", e);
        }
    }
}
