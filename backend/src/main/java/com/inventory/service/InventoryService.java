package com.inventory.service;

import com.inventory.dto.StockMovementDTO;
import com.inventory.dto.StockAdjustRequest;
import com.inventory.model.*;
import com.inventory.model.enums.MovementType;
import com.inventory.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductRepository productRepo;
    private final StockMovementRepository movementRepo;
    private final UserRepository userRepo;

    @Transactional
    public StockMovementDTO adjustStock(Long productId, StockAdjustRequest req, String username) {
        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        MovementType type = MovementType.valueOf(req.getMovementType());
        int newQty = switch (type) {
            case IN, RETURN -> product.getQuantityOnHand() + req.getQuantity();
            case OUT, TRANSFER -> {
                if (product.getQuantityOnHand() < req.getQuantity())
                    throw new RuntimeException("Insufficient stock");
                yield product.getQuantityOnHand() - req.getQuantity();
            }
            case ADJUSTMENT -> req.getQuantity();
        };

        product.setQuantityOnHand(newQty);
        productRepo.save(product);

        StockMovement movement = StockMovement.builder()
                .product(product).user(user)
                .movementType(type)
                .quantity(req.getQuantity())
                .unitCost(req.getUnitCost())
                .referenceNo(req.getReferenceNo())
                .notes(req.getNotes())
                .build();
        movement = movementRepo.save(movement);
        return toDTO(movement);
    }

    public List<StockMovementDTO> getMovementsByProduct(Long productId) {
        return movementRepo.findByProductIdOrderByCreatedAtDesc(productId)
                .stream().map(this::toDTO).toList();
    }

    // FIFO valuation
    public BigDecimal calculateFIFOValue(Long productId) {
        List<StockMovement> movements = movementRepo
                .findByProductIdOrderByCreatedAtDesc(productId);
        int remaining = productRepo.findById(productId)
                .map(Product::getQuantityOnHand).orElse(0);
        BigDecimal totalValue = BigDecimal.ZERO;
        for (StockMovement m : movements) {
            if (remaining <= 0) break;
            if (m.getMovementType() == MovementType.IN && m.getUnitCost() != null) {
                int use = Math.min(remaining, m.getQuantity());
                totalValue = totalValue.add(m.getUnitCost().multiply(BigDecimal.valueOf(use)));
                remaining -= use;
            }
        }
        return totalValue.setScale(2, RoundingMode.HALF_UP);
    }

    // EOQ calculation
    public Map<String, BigDecimal> calculateEOQ(Long productId,
                                                 BigDecimal annualDemand,
                                                 BigDecimal orderCost,
                                                 BigDecimal holdingCost) {
        // EOQ = sqrt(2 * D * S / H)
        BigDecimal two = BigDecimal.valueOf(2);
        double eoq = Math.sqrt(two.multiply(annualDemand).multiply(orderCost)
                .divide(holdingCost, 10, RoundingMode.HALF_UP).doubleValue());
        BigDecimal eoqVal = BigDecimal.valueOf(eoq).setScale(2, RoundingMode.HALF_UP);
        BigDecimal ordersPerYear = annualDemand.divide(eoqVal, 2, RoundingMode.HALF_UP);
        BigDecimal totalCost = orderCost.multiply(ordersPerYear)
                .add(holdingCost.multiply(eoqVal.divide(two, 2, RoundingMode.HALF_UP)));
        return Map.of("eoq", eoqVal, "ordersPerYear", ordersPerYear,
                "totalAnnualCost", totalCost.setScale(2, RoundingMode.HALF_UP));
    }

    // Dashboard stats
    public Map<String, Object> getDashboardStats() {
        long totalProducts = productRepo.count();
        long lowStockCount = productRepo.findLowStockProducts().size();
        BigDecimal totalValue = productRepo.findByIsActiveTrue().stream()
                .map(p -> p.getCostPrice().multiply(BigDecimal.valueOf(p.getQuantityOnHand())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of(
                "totalProducts", totalProducts,
                "lowStockCount", lowStockCount,
                "totalInventoryValue", totalValue.setScale(2, RoundingMode.HALF_UP),
                "activeProducts", productRepo.findByIsActiveTrue().size()
        );
    }

    private StockMovementDTO toDTO(StockMovement m) {
        return StockMovementDTO.builder()
                .id(m.getId())
                .productId(m.getProduct().getId())
                .productName(m.getProduct().getName())
                .productSku(m.getProduct().getSku())
                .username(m.getUser().getUsername())
                .movementType(m.getMovementType().name())
                .quantity(m.getQuantity())
                .unitCost(m.getUnitCost())
                .referenceNo(m.getReferenceNo())
                .notes(m.getNotes())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
