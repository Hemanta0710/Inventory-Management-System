package com.inventory.dto;
import lombok.Data;
import java.math.BigDecimal;
@Data
public class ProductRequest {
    private String name;
    private String sku;
    private String barcode;
    private String description;
    private Long categoryId;
    private Long supplierId;
    private BigDecimal unitPrice;
    private BigDecimal costPrice;
    private Integer quantityOnHand;
    private Integer reorderLevel;
    private Integer reorderQuantity;
    private String valuationMethod;
    private String location;
}
