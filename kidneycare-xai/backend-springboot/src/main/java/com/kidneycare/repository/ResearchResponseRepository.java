package com.kidneycare.repository;

import com.kidneycare.entity.ResearchResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResearchResponseRepository extends JpaRepository<ResearchResponse, Long> {

    List<ResearchResponse> findByRole(String role);

    long countByRole(String role);
}
