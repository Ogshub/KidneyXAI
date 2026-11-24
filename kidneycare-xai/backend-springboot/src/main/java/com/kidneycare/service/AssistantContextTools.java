package com.kidneycare.service;

import com.kidneycare.dto.response.LabResultResponse;
import com.kidneycare.dto.response.MedicalReportResponse;
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
                        List<String> reportIds) {}
    public record Context(List<String> lines, List<Map<String, Object>> references,
                          String status, LocalDate recordedOn, List<String> missing) {
        static Context missing(String detail) {
            return new Context(List.of(), List.of(), "missing", null, List.of(detail));
        }
    }
    private final PatientContextService patient;
    private final MedicalRecordService records;

    public Context read(String email, Route route) {
        try {
            return switch (route.intent()) {
                case "REPORT_LOOKUP", "REPORT_EXPLANATION" -> reports(email, route);
                case "LAB_HISTORY" -> laboratories(email, route.parameter(), route.latestLabs());
                case "REPORT_COMPARISON" -> comparison(email, route.reportIds());
                case "LIFESTYLE_SUMMARY" -> lifestyle(email, route.period(), route.previousPeriod());
                case "ASSESSMENT_EXPLANATION" -> assessment(email);
                case "RECOMMENDATION_EXPLANATION" -> recommendations(email);
                default -> Context.missing("No patient record is needed");
            };
        } catch (ResourceNotFoundException | IllegalArgumentException e) {
            return Context.missing("Matching records in your account");
        }
    }

    private Context reports(String email, Route route) {
        if (route.profile()) {
            return patient.healthProfile(email).map(p -> facts(List.of("A health profile is available in your account.",
                    "Any measurements or conditions in the profile are self-reported."), List.of(ref("profile", p.getId(), "/profile")), null))
                    .orElseGet(() -> Context.missing("Health profile"));
        }
        if (route.history()) {
            var reports = records.list(email, 0, 5).getContent();
            return reports.isEmpty() ? Context.missing("Medical report") : facts(
                    reports.stream().map(this::reportLabel).toList(), reports.stream().map(this::reportRef).toList(),
                    reports.get(0).reportDate());
        }
        return patient.latestReport(email).map(report -> facts(List.of(reportLabel(report),
                "Open the report to see its dated measurements and the attached document."), List.of(reportRef(report)), report.reportDate()))
                .orElseGet(() -> Context.missing("Medical report"));
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

    private Context comparison(String email, List<String> ids) {
        if (ids == null || ids.size() != 2) return Context.missing("Two report numbers, for example #12 and #15");
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

    private Context assessment(String email) {
        return patient.latestAssessment(email).filter(a -> !Boolean.TRUE.equals(a.getIsDemoMode())).map(a -> {
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

    private Context recommendations(String email) {
        var rules = patient.educationalRecommendations(email).stream().filter(r -> r.getRuleId() != null && r.getSource() != null).limit(5).toList();
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
