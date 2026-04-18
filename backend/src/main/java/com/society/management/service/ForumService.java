package com.society.management.service;

import com.society.management.dto.*;
import com.society.management.entity.ForumPost;
import com.society.management.entity.ForumTopic;
import com.society.management.entity.User;
import com.society.management.repository.ForumPostRepository;
import com.society.management.repository.ForumTopicRepository;
import com.society.management.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ForumService {

    private final ForumTopicRepository topicRepository;
    private final ForumPostRepository postRepository;
    private final UserRepository userRepository;

    public ForumService(ForumTopicRepository topicRepository, ForumPostRepository postRepository, UserRepository userRepository) {
        this.topicRepository = topicRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    public List<ForumTopicResponse> getAllTopics() {
        return topicRepository.findByActiveTrueOrderByPinnedDescLastActivityAtDesc()
                .stream().map(ForumTopicResponse::from).toList();
    }

    public List<ForumTopicResponse> getTopicsByCategory(String category) {
        return topicRepository.findByCategoryAndActiveTrueOrderByPinnedDescLastActivityAtDesc(category)
                .stream().map(ForumTopicResponse::from).toList();
    }

    public ForumTopicResponse createTopic(ForumTopicRequest req, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ForumTopic topic = ForumTopic.builder()
                .title(req.getTitle())
                .category(req.getCategory() != null ? req.getCategory() : "GENERAL")
                .author(user)
                .build();
        topic = topicRepository.save(topic);

        // Create the original post
        ForumPost post = ForumPost.builder()
                .topic(topic)
                .author(user)
                .content(req.getContent())
                .originalPost(true)
                .build();
        postRepository.save(post);

        return ForumTopicResponse.from(topic);
    }

    public List<ForumPostResponse> getTopicPosts(Long topicId) {
        return postRepository.findByTopicIdAndActiveTrueOrderByCreatedAtAsc(topicId)
                .stream().map(ForumPostResponse::from).toList();
    }

    public ForumPostResponse replyToTopic(Long topicId, ForumPostRequest req, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ForumTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new RuntimeException("Topic not found"));

        if (topic.isLocked()) {
            throw new RuntimeException("Topic is locked");
        }

        ForumPost post = ForumPost.builder()
                .topic(topic)
                .author(user)
                .content(req.getContent())
                .build();
        post = postRepository.save(post);

        topic.setReplyCount(topic.getReplyCount() + 1);
        topic.setLastActivityAt(LocalDateTime.now());
        topicRepository.save(topic);

        return ForumPostResponse.from(post);
    }

    public ForumTopicResponse togglePin(Long topicId) {
        ForumTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new RuntimeException("Topic not found"));
        topic.setPinned(!topic.isPinned());
        return ForumTopicResponse.from(topicRepository.save(topic));
    }

    public ForumTopicResponse toggleLock(Long topicId) {
        ForumTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new RuntimeException("Topic not found"));
        topic.setLocked(!topic.isLocked());
        return ForumTopicResponse.from(topicRepository.save(topic));
    }

    public void deleteTopic(Long topicId) {
        ForumTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new RuntimeException("Topic not found"));
        topic.setActive(false);
        topicRepository.save(topic);
    }

    public void deletePost(Long postId) {
        ForumPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        post.setActive(false);
        postRepository.save(post);
    }
}
