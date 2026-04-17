package com.society.management.service;

import com.society.management.dto.*;
import com.society.management.entity.*;
import com.society.management.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ParkingService {

    private final VehicleRepository vehicleRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final VisitorParkingRepository visitorParkingRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    public ParkingService(VehicleRepository vehicleRepository,
                          ParkingSlotRepository parkingSlotRepository,
                          VisitorParkingRepository visitorParkingRepository,
                          PropertyRepository propertyRepository,
                          UserRepository userRepository) {
        this.vehicleRepository = vehicleRepository;
        this.parkingSlotRepository = parkingSlotRepository;
        this.visitorParkingRepository = visitorParkingRepository;
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
    }

    // ---- Vehicles ----

    public List<VehicleResponse> getAllVehicles() {
        return vehicleRepository.findByActiveTrueOrderByPropertyUnitNumberAscCreatedAtDesc()
                .stream().map(VehicleResponse::from).toList();
    }

    public List<VehicleResponse> getVehiclesByProperty(String unitNumber) {
        return vehicleRepository.findByPropertyUnitNumberAndActiveTrueOrderByCreatedAtDesc(unitNumber)
                .stream().map(VehicleResponse::from).toList();
    }

    public List<VehicleResponse> getMyVehicles(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return vehicleRepository.findByPropertyUnitNumberAndActiveTrueOrderByCreatedAtDesc(user.getUnitNumber())
                .stream().map(VehicleResponse::from).toList();
    }

    public VehicleResponse addVehicle(VehicleRequest req, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        String unitNum = req.getUnitNumber() != null ? req.getUnitNumber() : user.getUnitNumber();
        Property property = propertyRepository.findByUnitNumber(unitNum)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (vehicleRepository.existsByVehicleNumberAndActiveTrue(req.getVehicleNumber())) {
            throw new RuntimeException("Vehicle number already registered");
        }

        Vehicle v = Vehicle.builder()
                .property(property)
                .registeredBy(user)
                .vehicleNumber(req.getVehicleNumber().toUpperCase())
                .vehicleType(req.getVehicleType() != null ? VehicleType.valueOf(req.getVehicleType()) : VehicleType.CAR)
                .make(req.getMake())
                .model(req.getModel())
                .color(req.getColor())
                .stickerNumber(req.getStickerNumber())
                .build();
        return VehicleResponse.from(vehicleRepository.save(v));
    }

    public VehicleResponse updateVehicle(Long id, VehicleRequest req) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        v.setVehicleNumber(req.getVehicleNumber().toUpperCase());
        if (req.getVehicleType() != null) v.setVehicleType(VehicleType.valueOf(req.getVehicleType()));
        v.setMake(req.getMake());
        v.setModel(req.getModel());
        v.setColor(req.getColor());
        v.setStickerNumber(req.getStickerNumber());
        return VehicleResponse.from(vehicleRepository.save(v));
    }

    public void deactivateVehicle(Long id) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        v.setActive(false);
        vehicleRepository.save(v);
    }

    public VehicleResponse verifyVehicle(String vehicleNumber) {
        Vehicle v = vehicleRepository.findByVehicleNumberAndActiveTrue(vehicleNumber.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Vehicle not found"));
        return VehicleResponse.from(v);
    }

    // ---- Parking Slots ----

    public List<ParkingSlotResponse> getAllSlots() {
        return parkingSlotRepository.findByActiveTrueOrderBySlotNumberAsc()
                .stream().map(ParkingSlotResponse::from).toList();
    }

    public List<ParkingSlotResponse> getSlotsByProperty(Long propertyId) {
        return parkingSlotRepository.findByAssignedPropertyIdAndActiveTrueOrderBySlotNumberAsc(propertyId)
                .stream().map(ParkingSlotResponse::from).toList();
    }

    public List<ParkingSlotResponse> getMySlots(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Property property = propertyRepository.findByUnitNumber(user.getUnitNumber())
                .orElseThrow(() -> new RuntimeException("Property not found"));
        return parkingSlotRepository.findByAssignedPropertyIdAndActiveTrueOrderBySlotNumberAsc(property.getId())
                .stream().map(ParkingSlotResponse::from).toList();
    }

    public List<ParkingSlotResponse> getAvailableSlots() {
        return parkingSlotRepository.findByOccupiedFalseAndActiveTrueOrderBySlotNumberAsc()
                .stream().map(ParkingSlotResponse::from).toList();
    }

    public ParkingSlotResponse createSlot(ParkingSlotRequest req) {
        if (parkingSlotRepository.existsBySlotNumberAndActiveTrue(req.getSlotNumber())) {
            throw new RuntimeException("Slot number already exists");
        }
        ParkingSlot slot = ParkingSlot.builder()
                .slotNumber(req.getSlotNumber())
                .slotType(ParkingSlotType.valueOf(req.getSlotType()))
                .zone(req.getZone())
                .build();

        if (req.getAssignedUnitNumber() != null) {
            Property property = propertyRepository.findByUnitNumber(req.getAssignedUnitNumber())
                    .orElseThrow(() -> new RuntimeException("Property not found"));
            slot.setAssignedProperty(property);
        }
        if (req.getAssignedVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(req.getAssignedVehicleId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));
            slot.setAssignedVehicle(vehicle);
            slot.setOccupied(true);
        }
        return ParkingSlotResponse.from(parkingSlotRepository.save(slot));
    }

    public ParkingSlotResponse updateSlot(Long id, ParkingSlotRequest req) {
        ParkingSlot slot = parkingSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parking slot not found"));
        slot.setSlotNumber(req.getSlotNumber());
        slot.setSlotType(ParkingSlotType.valueOf(req.getSlotType()));
        slot.setZone(req.getZone());

        if (req.getAssignedUnitNumber() != null) {
            Property property = propertyRepository.findByUnitNumber(req.getAssignedUnitNumber())
                    .orElseThrow(() -> new RuntimeException("Property not found"));
            slot.setAssignedProperty(property);
        } else {
            slot.setAssignedProperty(null);
        }
        if (req.getAssignedVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(req.getAssignedVehicleId())
                    .orElseThrow(() -> new RuntimeException("Vehicle not found"));
            slot.setAssignedVehicle(vehicle);
            slot.setOccupied(true);
        } else {
            slot.setAssignedVehicle(null);
            slot.setOccupied(false);
        }
        return ParkingSlotResponse.from(parkingSlotRepository.save(slot));
    }

    public void deactivateSlot(Long id) {
        ParkingSlot slot = parkingSlotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Parking slot not found"));
        slot.setActive(false);
        parkingSlotRepository.save(slot);
    }

    // ---- Visitor Parking ----

    public List<VisitorParkingResponse> getActiveVisitorParking() {
        return visitorParkingRepository.findByCheckOutIsNullOrderByCheckInDesc()
                .stream().map(VisitorParkingResponse::from).toList();
    }

    public List<VisitorParkingResponse> getAllVisitorParking() {
        return visitorParkingRepository.findAllByOrderByCheckInDesc()
                .stream().map(VisitorParkingResponse::from).toList();
    }

    public VisitorParkingResponse checkInVisitorParking(VisitorParkingRequest req, String username) {
        User guard = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ParkingSlot slot = parkingSlotRepository.findById(req.getSlotId())
                .orElseThrow(() -> new RuntimeException("Parking slot not found"));

        if (slot.isOccupied()) {
            throw new RuntimeException("Parking slot is already occupied");
        }

        VisitorParking vp = VisitorParking.builder()
                .slot(slot)
                .vehicleNumber(req.getVehicleNumber())
                .visitorName(req.getVisitorName())
                .checkIn(LocalDateTime.now())
                .checkedInBy(guard)
                .build();

        slot.setOccupied(true);
        parkingSlotRepository.save(slot);

        return VisitorParkingResponse.from(visitorParkingRepository.save(vp));
    }

    public VisitorParkingResponse checkOutVisitorParking(Long id) {
        VisitorParking vp = visitorParkingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Visitor parking record not found"));

        if (vp.getCheckOut() != null) {
            throw new RuntimeException("Already checked out");
        }

        vp.setCheckOut(LocalDateTime.now());

        ParkingSlot slot = vp.getSlot();
        // Only free the slot if no other active visitor parking on it
        List<VisitorParking> activeOnSlot = visitorParkingRepository.findBySlotIdAndCheckOutIsNull(slot.getId());
        if (activeOnSlot.size() <= 1) {
            slot.setOccupied(false);
            parkingSlotRepository.save(slot);
        }

        return VisitorParkingResponse.from(visitorParkingRepository.save(vp));
    }
}
