package com.society.management.dto;

import com.society.management.entity.Poll;
import com.society.management.entity.PollOption;
import lombok.Data;

import java.util.List;
import java.util.stream.Collectors;

@Data
public class PollResponse {
    private Long id;
    private String question;
    private String description;
    private String createdByName;
    private boolean multipleChoice;
    private boolean active;
    private String expiresAt;
    private String createdAt;
    private int totalVotes;
    private boolean hasVoted;
    private Long votedOptionId;
    private List<OptionResponse> options;

    @Data
    public static class OptionResponse {
        private Long id;
        private String optionText;
        private int voteCount;
    }

    public static PollResponse from(Poll poll, boolean hasVoted, Long votedOptionId) {
        PollResponse r = new PollResponse();
        r.setId(poll.getId());
        r.setQuestion(poll.getQuestion());
        r.setDescription(poll.getDescription());
        r.setCreatedByName(poll.getCreatedBy() != null ? poll.getCreatedBy().getFullName() : null);
        r.setMultipleChoice(poll.isMultipleChoice());
        r.setActive(poll.isActive());
        r.setExpiresAt(poll.getExpiresAt() != null ? poll.getExpiresAt().toString() : null);
        r.setCreatedAt(poll.getCreatedAt() != null ? poll.getCreatedAt().toString() : null);
        r.setHasVoted(hasVoted);
        r.setVotedOptionId(votedOptionId);

        List<OptionResponse> opts = poll.getOptions().stream().map(o -> {
            OptionResponse or = new OptionResponse();
            or.setId(o.getId());
            or.setOptionText(o.getOptionText());
            or.setVoteCount(o.getVoteCount());
            return or;
        }).collect(Collectors.toList());
        r.setOptions(opts);
        r.setTotalVotes(opts.stream().mapToInt(OptionResponse::getVoteCount).sum());
        return r;
    }
}
