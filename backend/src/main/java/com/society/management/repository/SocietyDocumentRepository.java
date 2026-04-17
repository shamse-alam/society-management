package com.society.management.repository;

import com.society.management.entity.DocumentCategory;
import com.society.management.entity.SocietyDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SocietyDocumentRepository extends JpaRepository<SocietyDocument, Long> {
    List<SocietyDocument> findByActiveTrueOrderByCreatedAtDesc();
    List<SocietyDocument> findByCategoryAndActiveTrueOrderByCreatedAtDesc(DocumentCategory category);
}
