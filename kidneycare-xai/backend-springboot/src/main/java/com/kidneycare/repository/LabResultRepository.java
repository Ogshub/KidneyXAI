package com.kidneycare.repository;

import com.kidneycare.entity.LabResult;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LabResultRepository extends JpaRepository<LabResult, Long> {
    List<LabResult> findByReportIdAndUserIdOrderByRecordedAtDescIdDesc(Long reportId, Long userId);
    Optional<LabResult> findByIdAndReportIdAndUserId(Long id, Long reportId, Long userId);
    List<LabResult> findByUserIdAndParameterNameOrderByRecordedAtDescIdDesc(Long userId, String parameter, Pageable page);
    Optional<LabResult> findFirstByUserIdAndParameterNameOrderByRecordedAtDescIdDesc(Long userId, String parameter);
    Optional<LabResult> findFirstByUserIdAndParameterNameAndTranscriptionConfirmedTrueOrderByRecordedAtDescIdDesc(
            Long userId, String parameter);
}
