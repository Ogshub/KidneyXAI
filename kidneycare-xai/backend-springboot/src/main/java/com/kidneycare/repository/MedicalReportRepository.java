package com.kidneycare.repository;

import com.kidneycare.entity.MedicalReport;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.List;
import java.time.LocalDate;

public interface MedicalReportRepository extends JpaRepository<MedicalReport, Long> {
    Optional<MedicalReport> findByIdAndUserId(Long id, Long userId);
    Optional<MedicalReport> findFirstByUserIdOrderByReportDateDescIdDesc(Long userId);
    Page<MedicalReport> findByUserIdOrderByReportDateDescIdDesc(Long userId, Pageable page);
    List<MedicalReport> findFirst2ByUserIdAndReportDateOrderByIdDesc(Long userId, LocalDate reportDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from MedicalReport r where r.id = :id and r.userId = :userId")
    Optional<MedicalReport> lockOwned(Long id, Long userId);
}
