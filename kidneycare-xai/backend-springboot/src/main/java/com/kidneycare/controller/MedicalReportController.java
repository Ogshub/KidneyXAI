package com.kidneycare.controller;

import com.kidneycare.dto.request.LabResultRequest;
import com.kidneycare.dto.request.MedicalReportRequest;
import com.kidneycare.dto.response.LabResultResponse;
import com.kidneycare.dto.response.MedicalReportResponse;
import com.kidneycare.service.MedicalRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class MedicalReportController {
    public record DownloadLink(String path, long expiresAt) {}
    private final MedicalRecordService records;

    @GetMapping
    public Page<MedicalReportResponse> list(Authentication auth, @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size) {
        return records.list(auth.getName(), page, size);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public MedicalReportResponse create(Authentication auth, @Valid @RequestBody MedicalReportRequest request) {
        return records.create(auth.getName(), request, null);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public MedicalReportResponse createWithFile(Authentication auth,
            @Valid @RequestPart("report") MedicalReportRequest request, @RequestPart("file") MultipartFile file) {
        return records.create(auth.getName(), request, file);
    }

    @GetMapping("/{id}")
    public MedicalReportResponse detail(Authentication auth, @PathVariable long id) {
        return records.get(auth.getName(), id);
    }

    @PutMapping("/{id}")
    public MedicalReportResponse edit(Authentication auth, @PathVariable long id,
                                      @Valid @RequestBody MedicalReportRequest request) {
        return records.edit(auth.getName(), id, request);
    }

    @PutMapping(path = "/{id}/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MedicalReportResponse upload(Authentication auth, @PathVariable long id, @RequestPart("file") MultipartFile file) {
        return records.upload(auth.getName(), id, file);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication auth, @PathVariable long id) {
        records.delete(auth.getName(), id);
    }

    @GetMapping("/{id}/file-link")
    public ResponseEntity<DownloadLink> fileLink(Authentication auth, @PathVariable long id) {
        var grant = records.sign(auth.getName(), id);
        String path = "/reports/" + id + "/file?expires=" + grant.expires() + "&signature=" + grant.signature();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(new DownloadLink(path, grant.expires()));
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<byte[]> download(Authentication auth, @PathVariable long id,
                                           @RequestParam long expires, @RequestParam String signature) {
        var file = records.download(auth.getName(), id, expires, signature);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .contentType(MediaType.parseMediaType(file.mediaType()))
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(file.name(), StandardCharsets.UTF_8).build().toString())
                .body(file.contents());
    }

    @PostMapping("/{id}/lab-results")
    @ResponseStatus(HttpStatus.CREATED)
    public LabResultResponse addResult(Authentication auth, @PathVariable long id,
                                      @Valid @RequestBody LabResultRequest request) {
        return records.saveResult(auth.getName(), id, null, request);
    }

    @PutMapping("/{id}/lab-results/{resultId}")
    public LabResultResponse editResult(Authentication auth, @PathVariable long id, @PathVariable long resultId,
                                        @Valid @RequestBody LabResultRequest request) {
        return records.saveResult(auth.getName(), id, resultId, request);
    }

    @DeleteMapping("/{id}/lab-results/{resultId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteResult(Authentication auth, @PathVariable long id, @PathVariable long resultId) {
        records.deleteResult(auth.getName(), id, resultId);
    }
}
