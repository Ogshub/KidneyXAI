package com.kidneycare.repository;

import com.kidneycare.entity.AssessmentFeature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssessmentFeatureRepository extends JpaRepository<AssessmentFeature, Long> {

    List<AssessmentFeature> findByAssessmentIdOrderByShapValueDesc(Long assessmentId);
}
