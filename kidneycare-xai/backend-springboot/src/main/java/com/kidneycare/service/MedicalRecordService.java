package com.kidneycare.service;

import com.kidneycare.dto.request.LabResultRequest;
import com.kidneycare.dto.request.MedicalReportRequest;
import com.kidneycare.dto.response.LabResultResponse;
import com.kidneycare.dto.response.MedicalReportResponse;
import com.kidneycare.entity.LabResult;
import com.kidneycare.entity.MedicalReport;
import com.kidneycare.exception.ResourceNotFoundException;
import com.kidneycare.repository.LabResultRepository;
import com.kidneycare.repository.MedicalReportRepository;
import com.kidneycare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MedicalRecordService {
    public record ComparisonRow(String parameter, LabResultResponse first, LabResultResponse second, BigDecimal delta) {}
    public record Comparison(MedicalReportResponse first, MedicalReportResponse second, List<ComparisonRow> rows) {}

    private final UserRepository users;
    private final MedicalReportRepository reports;
    private final LabResultRepository results;
    private final LabParameterRegistry registry;
    private final PrivateReportStorage storage;

    public Page<MedicalReportResponse> list(String email, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new IllegalArgumentException("Use a page starting at zero and a size between 1 and 100");
        }
        return reports.findByUserIdOrderByReportDateDescIdDesc(owner(email), PageRequest.of(page, size))
                .map(report -> response(report, List.of()));
    }

    public MedicalReportResponse get(String email, long reportId) {
        return detail(owned(reportId, owner(email)));
    }

    public Optional<MedicalReportResponse> latestReport(String email) {
        return reports.findFirstByUserIdOrderByReportDateDescIdDesc(owner(email)).map(this::detail);
    }

    @Transactional
    public MedicalReportResponse create(String email, MedicalReportRequest request, MultipartFile file) {
        MedicalReport report = new MedicalReport();
        report.setUserId(owner(email));
        report.setCreatedAt(Instant.now());
        updateMetadata(report, request);
        reports.save(report);
        if (file != null) {
            storage.store(report.getId(), file);
        }
        return detail(report);
    }

    @Transactional
    public MedicalReportResponse edit(String email, long reportId, MedicalReportRequest request) {
        MedicalReport report = lock(reportId, owner(email));
        updateMetadata(report, request);
        return detail(report);
    }

    @Transactional
    public MedicalReportResponse upload(String email, long reportId, MultipartFile file) {
        MedicalReport report = lock(reportId, owner(email));
        storage.store(reportId, file);
        report.setUpdatedAt(Instant.now());
        return detail(report);
    }

    @Transactional
    public void delete(String email, long reportId) {
        reports.delete(lock(reportId, owner(email)));
    }

    public PrivateReportStorage.SignedDownload sign(String email, long reportId) {
        long userId = owner(email);
        owned(reportId, userId);
        return storage.metadata(reportId).map(file -> storage.sign(reportId, userId, file.key()))
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "report", reportId));
    }

    public PrivateReportStorage.Download download(String email, long reportId, long expires, String signature) {
        long userId = owner(email);
        owned(reportId, userId);
        return storage.download(reportId, userId, expires, signature)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", "report", reportId));
    }

    @Transactional
    public LabResultResponse saveResult(String email, long reportId, Long resultId, LabResultRequest request) {
        long userId = owner(email);
        lock(reportId, userId);
        LabResult result = resultId == null ? new LabResult() : ownedResult(userId, reportId, resultId);
        if (request.referenceLow() != null && request.referenceHigh() != null
                && request.referenceLow().compareTo(request.referenceHigh()) > 0) {
            throw new IllegalArgumentException("Reference interval lower bound must not exceed its upper bound");
        }
        var normalized = registry.normalize(request.parameterName(), request.value(), request.unit());
        if (resultId == null) {
            result.setReportId(reportId);
            result.setUserId(userId);
            result.setCreatedAt(Instant.now());
        }
        result.setParameterName(request.parameterName());
        result.setOriginalValue(request.value());
        result.setOriginalUnit(request.unit());
        result.setNormalizedValue(normalized.value());
        result.setNormalizedUnit(normalized.unit());
        result.setReferenceLow(request.referenceLow());
        result.setReferenceHigh(request.referenceHigh());
        result.setRecordedAt(request.recordedAt());
        result.setSource(request.source().strip());
        result.setTranscriptionConfirmed(request.transcriptionConfirmed());
        result.setUpdatedAt(Instant.now());
        return LabResultResponse.from(results.save(result));
    }

    @Transactional
    public void deleteResult(String email, long reportId, long resultId) {
        long userId = owner(email);
        lock(reportId, userId);
        results.delete(ownedResult(userId, reportId, resultId));
    }

    public List<LabResultResponse> history(String email, String parameter, int limit) {
        registry.require(parameter);
        if (limit < 1 || limit > 250) {
            throw new IllegalArgumentException("Use a history limit between 1 and 250");
        }
        var recent = new java.util.ArrayList<>(results.findByUserIdAndParameterNameOrderByRecordedAtDescIdDesc(
                owner(email), parameter, PageRequest.of(0, limit)));
        java.util.Collections.reverse(recent);
        return recent.stream().map(LabResultResponse::from).toList();
    }

    public Map<String, LabResultResponse> latestMeasurements(String email) {
        long userId = owner(email);
        Map<String, LabResultResponse> measurements = new LinkedHashMap<>();
        for (var parameter : registry.all()) {
            results.findFirstByUserIdAndParameterNameOrderByRecordedAtDescIdDesc(userId, parameter.name())
                    .ifPresent(result -> measurements.put(parameter.name(), LabResultResponse.from(result)));
        }
        return measurements;
    }

    public Map<String, LabResultResponse> assessmentInputs(String email) {
        long userId = owner(email);
        Map<String, LabResultResponse> inputs = new LinkedHashMap<>();
        for (var parameter : registry.all()) {
            if (parameter.assessmentField() != null) {
                results.findFirstByUserIdAndParameterNameAndTranscriptionConfirmedTrueOrderByRecordedAtDescIdDesc(
                                userId, parameter.name())
                        .ifPresent(result -> inputs.put(parameter.assessmentField(), LabResultResponse.from(result)));
            }
        }
        return inputs;
    }

    public Comparison compare(String email, long firstId, long secondId) {
        if (firstId == secondId) {
            throw new IllegalArgumentException("Choose two different reports");
        }
        long userId = owner(email);
        var first = detail(owned(firstId, userId));
        var second = detail(owned(secondId, userId));
        var firstResults = latestByParameter(first.measurements());
        var secondResults = latestByParameter(second.measurements());
        var names = new TreeSet<>(firstResults.keySet());
        names.addAll(secondResults.keySet());
        return new Comparison(first, second, names.stream().map(name -> {
            var a = firstResults.get(name);
            var b = secondResults.get(name);
            BigDecimal delta = a != null && b != null && a.normalizedUnit().equals(b.normalizedUnit())
                    ? b.normalizedValue().subtract(a.normalizedValue()) : null;
            return new ComparisonRow(name, a, b, delta);
        }).toList());
    }

    private static Map<String, LabResultResponse> latestByParameter(List<LabResultResponse> results) {
        return results.stream().collect(Collectors.toMap(LabResultResponse::parameterName, result -> result,
                (first, duplicate) -> first));
    }

    private long owner(String email) {
        return users.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("Account", "principal", "current")).getId();
    }

    private MedicalReport owned(long reportId, long userId) {
        return reports.findByIdAndUserId(reportId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical report", "id", reportId));
    }

    private MedicalReport lock(long reportId, long userId) {
        return reports.lockOwned(reportId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Medical report", "id", reportId));
    }

    private LabResult ownedResult(long userId, long reportId, long resultId) {
        return results.findByIdAndReportIdAndUserId(resultId, reportId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Laboratory result", "id", resultId));
    }

    private MedicalReportResponse detail(MedicalReport report) {
        return response(report, results.findByReportIdAndUserIdOrderByRecordedAtDescIdDesc(report.getId(),
                report.getUserId()).stream().map(LabResultResponse::from).toList());
    }

    private MedicalReportResponse response(MedicalReport report, List<LabResultResponse> measurements) {
        String fileName = storage.metadata(report.getId()).map(PrivateReportStorage.Attachment::name).orElse(null);
        return new MedicalReportResponse(report.getId(), report.getReportDate(), report.getReportType(),
                report.getLabName(), report.getDoctorName(), report.getNotes(), fileName, report.getUpdatedAt(), measurements);
    }

    private void updateMetadata(MedicalReport report, MedicalReportRequest request) {
        report.setReportDate(request.reportDate());
        report.setReportType(request.reportType());
        report.setLabName(request.labName());
        report.setDoctorName(request.doctorName());
        report.setNotes(request.notes());
        report.setUpdatedAt(Instant.now());
    }
}
