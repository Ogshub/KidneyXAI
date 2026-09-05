package com.kidneycare.repository;

import com.kidneycare.entity.HealthProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HealthProfileRepository extends JpaRepository<HealthProfile, Long> {

    Optional<HealthProfile> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
