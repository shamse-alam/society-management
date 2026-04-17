package com.society.management.repository;

import com.society.management.entity.AmenityBooking;
import com.society.management.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AmenityBookingRepository extends JpaRepository<AmenityBooking, Long> {
    List<AmenityBooking> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<AmenityBooking> findAllByOrderByCreatedAtDesc();

    @Query("SELECT COUNT(b) FROM AmenityBooking b WHERE b.amenity.id = :amenityId " +
           "AND b.status = :status " +
           "AND b.bookingDate <= :endDate AND b.bookingEndDate >= :startDate")
    long countOverlappingBookings(@Param("amenityId") Long amenityId,
                                  @Param("startDate") LocalDate startDate,
                                  @Param("endDate") LocalDate endDate,
                                  @Param("status") BookingStatus status);
}
