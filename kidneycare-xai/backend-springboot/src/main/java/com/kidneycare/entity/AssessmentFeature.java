package com.kidneycare.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "assessment_features")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class AssessmentFeature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @Column(name = "feature_name", nullable = false, length = 100)
    private String featureName;

    @Column(name = "feature_value", nullable = false)
    private Double featureValue;

    @Column(name = "shap_value", nullable = false)
    private Double shapValue;
}
