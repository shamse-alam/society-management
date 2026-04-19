package com.society.management.service;

import com.society.management.dto.AmenityRequest;
import com.society.management.dto.AmenityResponse;
import com.society.management.dto.BookingRequest;
import com.society.management.dto.BookingResponse;
import com.society.management.entity.*;
import com.society.management.repository.AmenityBookingRepository;
import com.society.management.repository.AmenityRepository;
import com.society.management.repository.PaymentRepository;
import com.society.management.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AmenityBookingService {

    private final AmenityBookingRepository bookingRepository;
    private final AmenityRepository amenityRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;

    public AmenityBookingService(AmenityBookingRepository bookingRepository,
                                  AmenityRepository amenityRepository,
                                  UserRepository userRepository,
                                  PaymentRepository paymentRepository) {
        this.bookingRepository = bookingRepository;
        this.amenityRepository = amenityRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
    }

    public List<AmenityResponse> getAllAmenities() {
        return amenityRepository.findAll().stream()
                .map(AmenityResponse::from).collect(Collectors.toList());
    }

    public AmenityResponse createAmenity(AmenityRequest request) {
        Amenity amenity = Amenity.builder()
                .name(request.getName())
                .description(request.getDescription())
                .chargePerDay(request.getChargePerDay())
                .available(request.getAvailable() != null ? request.getAvailable() : true)
                .totalUnits(request.getTotalUnits() != null ? request.getTotalUnits() : 1)
                .build();
        return AmenityResponse.from(amenityRepository.save(amenity));
    }

    public AmenityResponse updateAmenity(Long id, AmenityRequest request) {
        Amenity amenity = amenityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Amenity not found"));
        amenity.setName(request.getName());
        amenity.setDescription(request.getDescription());
        amenity.setChargePerDay(request.getChargePerDay());
        if (request.getAvailable() != null) {
            amenity.setAvailable(request.getAvailable());
        }
        if (request.getTotalUnits() != null) {
            amenity.setTotalUnits(request.getTotalUnits());
        }
        return AmenityResponse.from(amenityRepository.save(amenity));
    }

    public void deleteAmenity(Long id) {
        if (!amenityRepository.existsById(id)) {
            throw new RuntimeException("Amenity not found");
        }
        amenityRepository.deleteById(id);
    }

    @Transactional
    public BookingResponse createBooking(BookingRequest request, String currentUsername) {
        Long userId = request.getUserId();
        if (userId == null) {
            User current = userRepository.findByUsername(currentUsername)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            userId = current.getId();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Amenity amenity = amenityRepository.findById(request.getAmenityId())
                .orElseThrow(() -> new RuntimeException("Amenity not found"));

        if (!amenity.isAvailable()) {
            throw new RuntimeException("This amenity is currently not available for booking");
        }

        LocalDate startDate = LocalDate.parse(request.getBookingDate());
        LocalDate endDate = LocalDate.parse(request.getBookingEndDate());

        if (endDate.isBefore(startDate)) {
            throw new RuntimeException("End date cannot be before start date");
        }

        // Check availability - count overlapping confirmed/pending bookings
        long overlapping = bookingRepository.countOverlappingBookings(
                amenity.getId(), startDate, endDate, BookingStatus.CONFIRMED);
        long overlappingPending = bookingRepository.countOverlappingBookings(
                amenity.getId(), startDate, endDate, BookingStatus.PENDING);

        if ((overlapping + overlappingPending) >= amenity.getTotalUnits()) {
            throw new RuntimeException("No units available for " + amenity.getName() + " on the selected dates");
        }

        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;
        BigDecimal totalCharge = amenity.getChargePerDay().multiply(BigDecimal.valueOf(days));

        AmenityBooking booking = AmenityBooking.builder()
                .user(user)
                .amenity(amenity)
                .bookingDate(startDate)
                .bookingEndDate(endDate)
                .totalCharge(totalCharge)
                .status(BookingStatus.PENDING)
                .purpose(request.getPurpose())
                .build();

        booking = bookingRepository.save(booking);

        return BookingResponse.from(booking);
    }

    @Transactional
    public BookingResponse confirmBooking(Long bookingId) {
        AmenityBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Only pending bookings can be confirmed");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        booking = bookingRepository.save(booking);

        // Create a PENDING invoice on confirmation — payment captured separately
        Payment payment = Payment.builder()
                .user(booking.getUser())
                .paymentType("AMENITY_BOOKING")
                .amount(booking.getTotalCharge())
                .status(PaymentStatus.PENDING)
                .description("Booking: " + booking.getAmenity().getName() + " (" + booking.getBookingDate() + " to " + booking.getBookingEndDate() + ")")
                .receiptNumber("RCP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .bookingId(booking.getId())
                .paidAt(null)
                .build();
        paymentRepository.save(payment);

        return BookingResponse.from(booking);
    }

    @Transactional
    public BookingResponse cancelBooking(Long bookingId) {
        AmenityBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        booking.setStatus(BookingStatus.CANCELLED);
        booking = bookingRepository.save(booking);

        // Delete the linked payment
        paymentRepository.findByBookingId(bookingId).ifPresent(paymentRepository::delete);

        return BookingResponse.from(booking);
    }

    @Transactional
    public BookingResponse cancelMyBooking(Long bookingId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        AmenityBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only cancel your own bookings");
        }
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking is already cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking = bookingRepository.save(booking);

        paymentRepository.findByBookingId(bookingId).ifPresent(paymentRepository::delete);

        return BookingResponse.from(booking);
    }

    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponseWithPayment).collect(Collectors.toList());
    }

    public List<BookingResponse> getMyBookings(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toResponseWithPayment).collect(Collectors.toList());
    }

    private BookingResponse toResponseWithPayment(AmenityBooking booking) {
        BookingResponse r = BookingResponse.from(booking);
        paymentRepository.findByBookingId(booking.getId())
                .ifPresent(p -> r.setPaymentStatus(p.getStatus().name()));
        return r;
    }
}
