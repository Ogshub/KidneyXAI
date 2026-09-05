package com.kidneycare.repository;

import com.kidneycare.entity.Assessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentRepository extends JpaRepository<Assessment, Long> {

    List<Assessment> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT a FROM Assessment a WHERE a.user.id = :userId ORDER BY a.createdAt DESC LIMIT 1")
    Optional<Assessment> findLatestByUserId(@Param("userId") Long userId);

    Optional<Assessment> findByIdAndUserId(Long id, Long userId);
}
