package com.momentum.app.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.momentum.app.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByUserId(Long userId);
    Optional<Category> findByUserIdAndName(Long userId, String name);
    boolean existsByUserIdAndName(Long userId, String name);
}
