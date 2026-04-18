package com.society.management.service;

import com.society.management.dto.PollRequest;
import com.society.management.dto.PollResponse;
import com.society.management.dto.PollVoteRequest;
import com.society.management.entity.*;
import com.society.management.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PollService {

    private final PollRepository pollRepository;
    private final PollOptionRepository optionRepository;
    private final PollVoteRepository voteRepository;
    private final UserRepository userRepository;

    public PollService(PollRepository pollRepository, PollOptionRepository optionRepository,
                       PollVoteRepository voteRepository, UserRepository userRepository) {
        this.pollRepository = pollRepository;
        this.optionRepository = optionRepository;
        this.voteRepository = voteRepository;
        this.userRepository = userRepository;
    }

    public List<PollResponse> getAllPolls(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return pollRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(p -> toPollResponse(p, user.getId()))
                .collect(Collectors.toList());
    }

    public List<PollResponse> getActivePolls(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return pollRepository.findByActiveTrueOrderByCreatedAtDesc().stream()
                .filter(p -> p.getExpiresAt() == null || !p.getExpiresAt().isBefore(LocalDate.now()))
                .map(p -> toPollResponse(p, user.getId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public PollResponse createPoll(PollRequest request, String username) {
        User creator = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Poll poll = Poll.builder()
                .question(request.getQuestion())
                .description(request.getDescription())
                .author(creator)
                .multipleChoice(request.getMultipleChoice() != null ? request.getMultipleChoice() : false)
                .active(request.getActive() != null ? request.getActive() : true)
                .expiresAt(request.getExpiresAt() != null ? LocalDate.parse(request.getExpiresAt()) : null)
                .build();

        poll = pollRepository.save(poll);

        for (String optText : request.getOptions()) {
            PollOption option = PollOption.builder()
                    .poll(poll)
                    .optionText(optText)
                    .build();
            poll.getOptions().add(optionRepository.save(option));
        }

        return toPollResponse(poll, creator.getId());
    }

    @Transactional
    public PollResponse togglePollActive(Long id) {
        Poll poll = pollRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Poll not found"));
        poll.setActive(!poll.isActive());
        return toPollResponse(pollRepository.save(poll), null);
    }

    @Transactional
    public void deletePoll(Long id) {
        if (!pollRepository.existsById(id)) {
            throw new RuntimeException("Poll not found");
        }
        pollRepository.deleteById(id);
    }

    @Transactional
    public PollResponse vote(Long pollId, PollVoteRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new RuntimeException("Poll not found"));

        if (!poll.isActive()) {
            throw new RuntimeException("This poll is no longer active");
        }

        if (poll.getExpiresAt() != null && poll.getExpiresAt().isBefore(LocalDate.now())) {
            throw new RuntimeException("This poll has expired");
        }

        if (voteRepository.existsByPollIdAndUserId(pollId, user.getId())) {
            throw new RuntimeException("You have already voted on this poll");
        }

        PollOption option = optionRepository.findById(request.getOptionId())
                .orElseThrow(() -> new RuntimeException("Option not found"));

        if (!option.getPoll().getId().equals(pollId)) {
            throw new RuntimeException("Option does not belong to this poll");
        }

        option.setVoteCount(option.getVoteCount() + 1);
        optionRepository.save(option);

        PollVote vote = PollVote.builder()
                .poll(poll)
                .user(user)
                .option(option)
                .build();
        voteRepository.save(vote);

        return toPollResponse(poll, user.getId());
    }

    private PollResponse toPollResponse(Poll poll, Long userId) {
        boolean hasVoted = false;
        Long votedOptionId = null;
        if (userId != null) {
            var voteOpt = voteRepository.findByPollIdAndUserId(poll.getId(), userId);
            if (voteOpt.isPresent()) {
                hasVoted = true;
                votedOptionId = voteOpt.get().getOption().getId();
            }
        }
        return PollResponse.from(poll, hasVoted, votedOptionId);
    }
}
