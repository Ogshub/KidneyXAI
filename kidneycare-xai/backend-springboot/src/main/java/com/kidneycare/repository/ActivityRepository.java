package com.kidneycare.repository;

import com.kidneycare.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    Optional<Activity> findByUserIdAndActivityDate(Long userId, LocalDate activityDate);

    List<Activity> findByUserIdAndActivityDateBetweenOrderByActivityDateAsc(
            Long userId, LocalDate from, LocalDate to);

    List<Activity> findByUserIdOrderByActivityDateDesc(Long userId);
}
