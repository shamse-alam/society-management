package com.society.management.repository;

import com.society.management.entity.ForumPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ForumPostRepository extends JpaRepository<ForumPost, Long> {
    List<ForumPost> findByTopicIdAndActiveTrueOrderByCreatedAtAsc(Long topicId);
}
