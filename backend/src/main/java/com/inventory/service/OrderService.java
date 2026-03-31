package com.inventory.service;

import com.inventory.dto.OrderDTO;
import com.inventory.dto.CreateOrderRequest;
import com.inventory.model.*;
import com.inventory.model.enums.MovementType;
import com.inventory.model.enums.OrderStatus;
import com.inventory.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final PurchaseOrderRepository orderRepo;
    private final ProductRepository productRepo;
    private final SupplierRepository supplierRepo;
    private final UserRepository userRepo;
    private final StockMovementRepository movementRepo;
    private static final AtomicInteger counter = new AtomicInteger(1000);

    @Transactional
    public OrderDTO createOrder(CreateOrderRequest req, String username) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Supplier supplier = supplierRepo.findById(req.getSupplierId())
                .orElseThrow(() -> new RuntimeException("Supplier not found"));

        PurchaseOrder order = PurchaseOrder.builder()
                .orderNo("PO-" + DateTimeFormatter.ofPattern("yyyyMMdd")
                        .format(LocalDate.now()) + "-" + counter.incrementAndGet())
                .supplier(supplier).createdBy(user)
                .status(OrderStatus.PENDING)
                .expectedDate(req.getExpectedDate())
                .notes(req.getNotes())
                .build();

        List<OrderItem> items = req.getItems().stream().map(i -> {
            Product p = productRepo.findById(i.getProductId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + i.getProductId()));
            return OrderItem.builder()
                    .purchaseOrder(order).product(p)
                    .quantityOrdered(i.getQuantity())
                    .unitCost(i.getUnitCost())
                    .build();
        }).collect(Collectors.toList());

        order.setItems(items);
        BigDecimal total = items.stream()
                .map(i -> i.getUnitCost().multiply(BigDecimal.valueOf(i.getQuantityOrdered())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        order.setTotalAmount(total);

        return toDTO(orderRepo.save(order));
    }

    @Transactional
    public OrderDTO approveOrder(Long id, String username) {
        PurchaseOrder order = orderRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        User approver = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        order.setStatus(OrderStatus.APPROVED);
        order.setApprovedBy(approver);
        return toDTO(orderRepo.save(order));
    }

    @Transactional
    public OrderDTO receiveOrder(Long id, String username) {
        PurchaseOrder order = orderRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        if (order.getStatus() != OrderStatus.APPROVED)
            throw new RuntimeException("Order must be approved before receiving");

        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update stock for each item
        order.getItems().forEach(item -> {
            Product product = item.getProduct();
            product.setQuantityOnHand(product.getQuantityOnHand() + item.getQuantityOrdered());
            productRepo.save(product);
            movementRepo.save(StockMovement.builder()
                    .product(product).user(user)
                    .movementType(MovementType.IN)
                    .quantity(item.getQuantityOrdered())
                    .unitCost(item.getUnitCost())
                    .referenceNo(order.getOrderNo())
                    .notes("Received from PO: " + order.getOrderNo())
                    .build());
            item.setQuantityReceived(item.getQuantityOrdered());
        });

        order.setStatus(OrderStatus.RECEIVED);
        order.setReceivedDate(LocalDate.now());
        return toDTO(orderRepo.save(order));
    }

    @Transactional
    public OrderDTO cancelOrder(Long id) {
        PurchaseOrder order = orderRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(OrderStatus.CANCELLED);
        return toDTO(orderRepo.save(order));
    }

    public List<OrderDTO> getAllOrders() {
        return orderRepo.findAll().stream().map(this::toDTO).toList();
    }

    public List<OrderDTO> getOrdersByStatus(String status) {
        return orderRepo.findByStatus(OrderStatus.valueOf(status))
                .stream().map(this::toDTO).toList();
    }

    public OrderDTO getById(Long id) {
        return orderRepo.findById(id).map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }

    private OrderDTO toDTO(PurchaseOrder o) {
        return OrderDTO.builder()
                .id(o.getId()).orderNo(o.getOrderNo())
                .supplierId(o.getSupplier().getId())
                .supplierName(o.getSupplier().getName())
                .createdByUsername(o.getCreatedBy().getUsername())
                .approvedByUsername(o.getApprovedBy() != null ? o.getApprovedBy().getUsername() : null)
                .status(o.getStatus().name())
                .totalAmount(o.getTotalAmount())
                .notes(o.getNotes())
                .expectedDate(o.getExpectedDate())
                .receivedDate(o.getReceivedDate())
                .createdAt(o.getCreatedAt())
                .itemCount(o.getItems() != null ? o.getItems().size() : 0)
                .build();
    }
}
