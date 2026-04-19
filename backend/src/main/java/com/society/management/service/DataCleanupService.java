package com.society.management.service;

import com.society.management.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Cleans up all transactional/operational data while preserving
 * the admin and guard user accounts, society config, and type definitions.
 */
@Service
public class DataCleanupService {

    private static final Logger log = LoggerFactory.getLogger(DataCleanupService.class);

    private final VisitorParkingRepository visitorParkingRepository;
    private final EventRsvpRepository eventRsvpRepository;
    private final ForumPostRepository forumPostRepository;
    private final PollVoteRepository pollVoteRepository;
    private final PollOptionRepository pollOptionRepository;
    private final PropertyHistoryRepository propertyHistoryRepository;
    private final PaymentRefundRepository paymentRefundRepository;
    private final FundReleaseRepository fundReleaseRepository;
    private final NotificationRepository notificationRepository;
    private final VendorBankAccountRepository vendorBankAccountRepository;
    private final DeliveryLogRepository deliveryLogRepository;
    private final AmenityBookingRepository amenityBookingRepository;
    private final ComplaintRepository complaintRepository;
    private final DailyHelpRepository dailyHelpRepository;
    private final VisitLogRepository visitLogRepository;
    private final VehicleRepository vehicleRepository;
    private final PaymentRepository paymentRepository;
    private final ExpenseRepository expenseRepository;
    private final NoticeRepository noticeRepository;
    private final SocietyDocumentRepository documentRepository;
    private final MoveRequestRepository moveRequestRepository;
    private final SocietyEventRepository eventRepository;
    private final ForumTopicRepository forumTopicRepository;
    private final PollRepository pollRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final VendorRepository vendorRepository;
    private final PropertyRepository propertyRepository;
    private final VisitorRepository visitorRepository;
    private final AmenityRepository amenityRepository;
    private final EmergencyContactRepository emergencyContactRepository;
    private final UserRepository userRepository;

    public DataCleanupService(
            VisitorParkingRepository visitorParkingRepository,
            EventRsvpRepository eventRsvpRepository,
            ForumPostRepository forumPostRepository,
            PollVoteRepository pollVoteRepository,
            PollOptionRepository pollOptionRepository,
            PropertyHistoryRepository propertyHistoryRepository,
            PaymentRefundRepository paymentRefundRepository,
            FundReleaseRepository fundReleaseRepository,
            NotificationRepository notificationRepository,
            VendorBankAccountRepository vendorBankAccountRepository,
            DeliveryLogRepository deliveryLogRepository,
            AmenityBookingRepository amenityBookingRepository,
            ComplaintRepository complaintRepository,
            DailyHelpRepository dailyHelpRepository,
            VisitLogRepository visitLogRepository,
            VehicleRepository vehicleRepository,
            PaymentRepository paymentRepository,
            ExpenseRepository expenseRepository,
            NoticeRepository noticeRepository,
            SocietyDocumentRepository documentRepository,
            MoveRequestRepository moveRequestRepository,
            SocietyEventRepository eventRepository,
            ForumTopicRepository forumTopicRepository,
            PollRepository pollRepository,
            ParkingSlotRepository parkingSlotRepository,
            FamilyMemberRepository familyMemberRepository,
            VendorRepository vendorRepository,
            PropertyRepository propertyRepository,
            VisitorRepository visitorRepository,
            AmenityRepository amenityRepository,
            EmergencyContactRepository emergencyContactRepository,
            UserRepository userRepository) {
        this.visitorParkingRepository = visitorParkingRepository;
        this.eventRsvpRepository = eventRsvpRepository;
        this.forumPostRepository = forumPostRepository;
        this.pollVoteRepository = pollVoteRepository;
        this.pollOptionRepository = pollOptionRepository;
        this.propertyHistoryRepository = propertyHistoryRepository;
        this.paymentRefundRepository = paymentRefundRepository;
        this.fundReleaseRepository = fundReleaseRepository;
        this.notificationRepository = notificationRepository;
        this.vendorBankAccountRepository = vendorBankAccountRepository;
        this.deliveryLogRepository = deliveryLogRepository;
        this.amenityBookingRepository = amenityBookingRepository;
        this.complaintRepository = complaintRepository;
        this.dailyHelpRepository = dailyHelpRepository;
        this.visitLogRepository = visitLogRepository;
        this.vehicleRepository = vehicleRepository;
        this.paymentRepository = paymentRepository;
        this.expenseRepository = expenseRepository;
        this.noticeRepository = noticeRepository;
        this.documentRepository = documentRepository;
        this.moveRequestRepository = moveRequestRepository;
        this.eventRepository = eventRepository;
        this.forumTopicRepository = forumTopicRepository;
        this.pollRepository = pollRepository;
        this.parkingSlotRepository = parkingSlotRepository;
        this.familyMemberRepository = familyMemberRepository;
        this.vendorRepository = vendorRepository;
        this.propertyRepository = propertyRepository;
        this.visitorRepository = visitorRepository;
        this.amenityRepository = amenityRepository;
        this.emergencyContactRepository = emergencyContactRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Map<String, Long> cleanupAll() {
        Map<String, Long> deleted = new LinkedHashMap<>();
        log.warn("DATA CLEANUP initiated — deleting all data except admin/guard users");

        // Tier 1: Leaf entities (no dependents)
        deleted.put("visitorParking", deleteAll(visitorParkingRepository));
        deleted.put("eventRsvps", deleteAll(eventRsvpRepository));
        deleted.put("forumPosts", deleteAll(forumPostRepository));
        deleted.put("pollVotes", deleteAll(pollVoteRepository));
        deleted.put("pollOptions", deleteAll(pollOptionRepository));
        deleted.put("propertyHistory", deleteAll(propertyHistoryRepository));
        deleted.put("paymentRefunds", deleteAll(paymentRefundRepository));
        deleted.put("fundReleases", deleteAll(fundReleaseRepository));
        deleted.put("notifications", deleteAll(notificationRepository));
        deleted.put("vendorBankAccounts", deleteAll(vendorBankAccountRepository));

        // Tier 2: Transaction/activity records
        deleted.put("deliveryLogs", deleteAll(deliveryLogRepository));
        deleted.put("amenityBookings", deleteAll(amenityBookingRepository));
        deleted.put("complaints", deleteAll(complaintRepository));
        deleted.put("dailyHelp", deleteAll(dailyHelpRepository));
        deleted.put("visitLogs", deleteAll(visitLogRepository));
        deleted.put("vehicles", deleteAll(vehicleRepository));
        deleted.put("payments", deleteAll(paymentRepository));
        deleted.put("expenses", deleteAll(expenseRepository));
        deleted.put("notices", deleteAll(noticeRepository));
        deleted.put("documents", deleteAll(documentRepository));

        // Tier 3: Booking/scheduling
        deleted.put("moveRequests", deleteAll(moveRequestRepository));
        deleted.put("events", deleteAll(eventRepository));
        deleted.put("forumTopics", deleteAll(forumTopicRepository));
        deleted.put("polls", deleteAll(pollRepository));

        // Tier 4: Parking & family
        deleted.put("parkingSlots", deleteAll(parkingSlotRepository));
        deleted.put("familyMembers", deleteAll(familyMemberRepository));

        // Tier 5: Vendors
        deleted.put("vendors", deleteAll(vendorRepository));

        // Tier 6: Visitors & amenities
        deleted.put("visitors", deleteAll(visitorRepository));
        deleted.put("amenities", deleteAll(amenityRepository));
        deleted.put("emergencyContacts", deleteAll(emergencyContactRepository));

        // Tier 7: Properties
        deleted.put("properties", deleteAll(propertyRepository));

        // Tier 8: Users — keep admin and guard
        long usersBefore = userRepository.count();
        userRepository.findAll().stream()
                .filter(u -> {
                    String roles = u.getRoles() != null ? u.getRoles().toUpperCase() : "";
                    return !roles.contains("ADMIN") && !roles.contains("GUARD");
                })
                .forEach(userRepository::delete);
        long usersAfter = userRepository.count();
        deleted.put("users", usersBefore - usersAfter);

        long total = deleted.values().stream().mapToLong(Long::longValue).sum();
        deleted.put("totalRecords", total);

        log.warn("DATA CLEANUP complete — {} total records deleted", total);
        return deleted;
    }

    private long deleteAll(org.springframework.data.jpa.repository.JpaRepository<?, ?> repo) {
        long count = repo.count();
        if (count > 0) {
            repo.deleteAllInBatch();
        }
        return count;
    }
}
