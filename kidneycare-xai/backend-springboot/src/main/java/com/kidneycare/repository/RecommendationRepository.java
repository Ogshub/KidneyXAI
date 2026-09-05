package com.kidneycare.repository;

import com.kidneycare.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {

    List<Recommendation> findByAssessmentIdOrderByPriorityDesc(Long assessmentId);

    @Query("SELECT r FROM Recommendation r WHERE r.assessment.user.id = :userId " +
           "ORDER BY r.createdAt DESC")
    List<Recommendation> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    @Query(value = "SELECT r.* FROM recommendations r " +
           "JOIN assessments a ON r.assessment_id = a.id " +
           "WHERE a.user_id = :userId ORDER BY r.created_at DESC LIMIT :limit",
           nativeQuery = true)
    List<Recommendation> findRecentByUserId(@Param("userId") Long userId,
                                            @Param("limit") int limit);
}
