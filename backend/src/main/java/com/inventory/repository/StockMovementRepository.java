package com.inventory.repository;
import com.inventory.model.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByProductIdOrderByCreatedAtDesc(Long productId);
    @Query("SELECT sm FROM StockMovement sm WHERE sm.product.id = :productId AND sm.createdAt >= :since ORDER BY sm.createdAt ASC")
    List<StockMovement> findByProductIdSince(@Param("productId") Long productId, @Param("since") LocalDateTime since);
}
