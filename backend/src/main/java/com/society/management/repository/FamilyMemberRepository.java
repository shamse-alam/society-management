package com.society.management.repository;

import com.society.management.entity.FamilyMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FamilyMemberRepository extends JpaRepository<FamilyMember, Long> {
    List<FamilyMember> findByPropertyUnitNumberAndActiveTrueOrderByCreatedAtAsc(String unitNumber);
    List<FamilyMember> findByPropertyIdAndActiveTrueOrderByCreatedAtAsc(Long propertyId);
    List<FamilyMember> findByActiveTrueOrderByPropertyUnitNumberAscCreatedAtAsc();
}
