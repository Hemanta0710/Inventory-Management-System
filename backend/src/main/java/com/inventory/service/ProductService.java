package com.inventory.service;

import com.inventory.dto.ProductDTO;
import com.inventory.dto.ProductRequest;
import com.inventory.model.*;
import com.inventory.model.enums.MovementType;
import com.inventory.model.enums.ValuationMethod;
import com.inventory.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;
    private final SupplierRepository supplierRepo;

    public List<ProductDTO> getAllProducts() {
        return productRepo.findByIsActiveTrue().stream().map(this::toDTO).toList();
    }

    public ProductDTO getById(Long id) {
        return productRepo.findById(id).map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    public ProductDTO getByBarcode(String barcode) {
        return productRepo.findByBarcode(barcode).map(this::toDTO)
                .orElseThrow(() -> new RuntimeException("Product not found for barcode: " + barcode));
    }

    public List<ProductDTO> getLowStock() {
        return productRepo.findLowStockProducts().stream().map(this::toDTO).toList();
    }

    @Transactional
    public ProductDTO create(ProductRequest req) {
        Product product = Product.builder()
                .name(req.getName()).sku(req.getSku()).barcode(req.getBarcode())
                .description(req.getDescription())
                .unitPrice(req.getUnitPrice()).costPrice(req.getCostPrice())
                .quantityOnHand(req.getQuantityOnHand() != null ? req.getQuantityOnHand() : 0)
                .reorderLevel(req.getReorderLevel() != null ? req.getReorderLevel() : 10)
                .reorderQuantity(req.getReorderQuantity() != null ? req.getReorderQuantity() : 50)
                .valuationMethod(req.getValuationMethod() != null ?
                        ValuationMethod.valueOf(req.getValuationMethod()) : ValuationMethod.FIFO)
                .location(req.getLocation())
                .build();
        if (req.getCategoryId() != null)
            product.setCategory(categoryRepo.findById(req.getCategoryId()).orElse(null));
        if (req.getSupplierId() != null)
            product.setSupplier(supplierRepo.findById(req.getSupplierId()).orElse(null));
        return toDTO(productRepo.save(product));
    }

    @Transactional
    public ProductDTO update(Long id, ProductRequest req) {
        Product product = productRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        if (req.getName() != null) product.setName(req.getName());
        if (req.getUnitPrice() != null) product.setUnitPrice(req.getUnitPrice());
        if (req.getCostPrice() != null) product.setCostPrice(req.getCostPrice());
        if (req.getReorderLevel() != null) product.setReorderLevel(req.getReorderLevel());
        if (req.getReorderQuantity() != null) product.setReorderQuantity(req.getReorderQuantity());
        if (req.getLocation() != null) product.setLocation(req.getLocation());
        if (req.getCategoryId() != null)
            product.setCategory(categoryRepo.findById(req.getCategoryId()).orElse(null));
        if (req.getSupplierId() != null)
            product.setSupplier(supplierRepo.findById(req.getSupplierId()).orElse(null));
        return toDTO(productRepo.save(product));
    }

    @Transactional
    public void delete(Long id) {
        Product product = productRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setIsActive(false);
        productRepo.save(product);
    }

    public ProductDTO toDTO(Product p) {
        return ProductDTO.builder()
                .id(p.getId()).name(p.getName()).sku(p.getSku()).barcode(p.getBarcode())
                .description(p.getDescription())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .supplierId(p.getSupplier() != null ? p.getSupplier().getId() : null)
                .supplierName(p.getSupplier() != null ? p.getSupplier().getName() : null)
                .unitPrice(p.getUnitPrice()).costPrice(p.getCostPrice())
                .quantityOnHand(p.getQuantityOnHand())
                .reorderLevel(p.getReorderLevel()).reorderQuantity(p.getReorderQuantity())
                .valuationMethod(p.getValuationMethod().name())
                .location(p.getLocation()).isActive(p.getIsActive())
                .isLowStock(p.getQuantityOnHand() <= p.getReorderLevel())
                .createdAt(p.getCreatedAt()).build();
    }
}
