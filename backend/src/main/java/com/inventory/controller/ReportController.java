package com.inventory.controller;

import com.inventory.model.Product;
import com.inventory.model.StockMovement;
import com.inventory.repository.ProductRepository;
import com.inventory.repository.StockMovementRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ProductRepository productRepo;
    private final StockMovementRepository movementRepo;

    @GetMapping("/products/export")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<byte[]> exportProducts() throws Exception {
        List<Product> products = productRepo.findByIsActiveTrue();

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Products");

            // Header style
            CellStyle headerStyle = wb.createCellStyle();
            Font font = wb.createFont();
            font.setBold(true);
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Header row
            String[] headers = {"ID","Name","SKU","Barcode","Category","Supplier",
                    "Unit Price","Cost Price","Qty on Hand","Reorder Level","Location","Valuation"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 4000);
            }

            // Data rows
            int rowNum = 1;
            for (Product p : products) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(p.getId());
                row.createCell(1).setCellValue(p.getName());
                row.createCell(2).setCellValue(p.getSku());
                row.createCell(3).setCellValue(p.getBarcode() != null ? p.getBarcode() : "");
                row.createCell(4).setCellValue(p.getCategory() != null ? p.getCategory().getName() : "");
                row.createCell(5).setCellValue(p.getSupplier() != null ? p.getSupplier().getName() : "");
                row.createCell(6).setCellValue(p.getUnitPrice().doubleValue());
                row.createCell(7).setCellValue(p.getCostPrice().doubleValue());
                row.createCell(8).setCellValue(p.getQuantityOnHand());
                row.createCell(9).setCellValue(p.getReorderLevel());
                row.createCell(10).setCellValue(p.getLocation() != null ? p.getLocation() : "");
                row.createCell(11).setCellValue(p.getValuationMethod().name());
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);

            HttpHeaders respHeaders = new HttpHeaders();
            respHeaders.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            respHeaders.setContentDispositionFormData("attachment", "products-export.xlsx");

            return ResponseEntity.ok().headers(respHeaders).body(out.toByteArray());
        }
    }

    @GetMapping("/stock-movements/export")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<byte[]> exportMovements() throws Exception {
        List<StockMovement> movements = movementRepo.findAll();

        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Stock Movements");

            String[] headers = {"ID","Product","SKU","Type","Quantity","Unit Cost","Reference","Notes","Date"};
            Row headerRow = sheet.createRow(0);
            CellStyle headerStyle = wb.createCellStyle();
            Font font = wb.createFont(); font.setBold(true);
            headerStyle.setFont(font);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 4000);
            }

            int rowNum = 1;
            for (StockMovement m : movements) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(m.getId());
                row.createCell(1).setCellValue(m.getProduct().getName());
                row.createCell(2).setCellValue(m.getProduct().getSku());
                row.createCell(3).setCellValue(m.getMovementType().name());
                row.createCell(4).setCellValue(m.getQuantity());
                row.createCell(5).setCellValue(m.getUnitCost() != null ? m.getUnitCost().doubleValue() : 0);
                row.createCell(6).setCellValue(m.getReferenceNo() != null ? m.getReferenceNo() : "");
                row.createCell(7).setCellValue(m.getNotes() != null ? m.getNotes() : "");
                row.createCell(8).setCellValue(m.getCreatedAt().toString());
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);

            HttpHeaders respHeaders = new HttpHeaders();
            respHeaders.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            respHeaders.setContentDispositionFormData("attachment", "stock-movements-export.xlsx");

            return ResponseEntity.ok().headers(respHeaders).body(out.toByteArray());
        }
    }
}
