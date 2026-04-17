package com.society.management.repository;

import com.society.management.entity.ForumTopic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ForumTopicRepository extends JpaRepository<ForumTopic, Long> {
    List<ForumTopic> findByActiveTrueOrderByPinnedDescLastActivityAtDesc();
    List<ForumTopic> findByCategoryAndActiveTrueOrderByPinnedDescLastActivityAtDesc(String category);
}
