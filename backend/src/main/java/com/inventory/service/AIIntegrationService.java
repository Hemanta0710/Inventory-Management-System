package com.inventory.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.dto.AiChatRequest;
import com.inventory.model.*;
import com.inventory.model.enums.AlertSeverity;
import com.inventory.model.enums.AlertType;
import com.inventory.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIIntegrationService {

    private final ProductRepository productRepo;
    private final AiAlertRepository alertRepo;
    private final UserRepository userRepo;
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${app.ai.anthropic-api-key}")
    private String apiKey;

    @Value("${app.ai.model:claude-sonnet-4-6}")
    private String model;

    @Value("${app.ai.base-url:https://api.anthropic.com/v1/messages}")
    private String baseUrl;

    // ── Core API call ──────────────────────────────────────────────
    private String callClaude(String systemPrompt, String userMessage) {
        try {
            String body = mapper.writeValueAsString(Map.of(
                    "model", model,
                    "max_tokens", 1024,
                    "system", systemPrompt,
                    "messages", List.of(Map.of("role", "user", "content", userMessage))
            ));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl))
                    .header("Content-Type", "application/json")
                    .header("x-api-key", apiKey)
                    .header("anthropic-version", "2023-06-01")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());
            JsonNode json = mapper.readTree(response.body());
            return json.path("content").get(0).path("text").asText();
        } catch (Exception e) {
            log.error("Claude API call failed: {}", e.getMessage());
            return "AI service temporarily unavailable.";
        }
    }

    // ── AI Chat assistant ──────────────────────────────────────────
    public String chat(AiChatRequest request) {
        List<Product> lowStock = productRepo.findLowStockProducts();
        long totalProducts = productRepo.count();
        StringBuilder context = new StringBuilder();
        context.append("Inventory context:\n");
        context.append("- Total active products: ").append(totalProducts).append("\n");
        context.append("- Low stock items (").append(lowStock.size()).append("):\n");
        lowStock.forEach(p -> context.append("  * ").append(p.getName())
                .append(" (SKU: ").append(p.getSku()).append(")")
                .append(" qty=").append(p.getQuantityOnHand())
                .append("/min=").append(p.getReorderLevel()).append("\n"));

        String system = """
                You are an intelligent inventory management assistant.
                You help users understand their stock levels, make reorder decisions,
                and optimize their inventory. Be concise, practical, and data-driven.
                Always reference specific product names and numbers when available.
                """;
        return callClaude(system, context + "\nUser question: " + request.getMessage());
    }

    // ── Generate daily AI alerts ───────────────────────────────────
    @Transactional
    public void generateAlerts() {
        log.info("Running AI alert generation...");
        List<Product> lowStock = productRepo.findLowStockProducts();
        if (lowStock.isEmpty()) return;

        List<User> managers = userRepo.findAll().stream()
                .filter(u -> u.getRole().name().equals("ROLE_ADMIN")
                        || u.getRole().name().equals("ROLE_MANAGER"))
                .toList();

        StringBuilder productList = new StringBuilder();
        lowStock.forEach(p -> productList.append("- ").append(p.getName())
                .append(": qty=").append(p.getQuantityOnHand())
                .append(", reorder_level=").append(p.getReorderLevel())
                .append(", reorder_qty=").append(p.getReorderQuantity())
                .append(", supplier_lead_days=")
                .append(p.getSupplier() != null ? p.getSupplier().getLeadTimeDays() : "unknown")
                .append("\n"));

        String system = "You are an inventory analyst. Respond ONLY with valid JSON.";
        String prompt = """
                Analyze these low-stock items and return a JSON array of alert objects.
                Each object must have: title (string), message (string), severity (INFO/WARNING/CRITICAL).
                Be specific with product names and recommended quantities.
                Items:
                """ + productList;

        try {
            String aiResponse = callClaude(system, prompt);
            // Extract JSON array from response
            int start = aiResponse.indexOf('[');
            int end = aiResponse.lastIndexOf(']') + 1;
            if (start >= 0 && end > start) {
                String jsonArray = aiResponse.substring(start, end);
                JsonNode alerts = mapper.readTree(jsonArray);
                for (JsonNode alert : alerts) {
                    Product product = lowStock.get(0); // associate with most critical
                    String severityStr = alert.path("severity").asText("WARNING");
                    AlertSeverity severity;
                    try { severity = AlertSeverity.valueOf(severityStr); }
                    catch (Exception e) { severity = AlertSeverity.WARNING; }

                    for (User manager : managers) {
                        alertRepo.save(AiAlert.builder()
                                .product(product)
                                .alertType(AlertType.LOW_STOCK)
                                .severity(severity)
                                .title(alert.path("title").asText("Low Stock Alert"))
                                .message(alert.path("message").asText())
                                .createdFor(manager)
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse AI alerts: {}", e.getMessage());
        }
    }

    // ── Demand forecast ────────────────────────────────────────────
    public String getDemandForecast() {
        List<Product> products = productRepo.findByIsActiveTrue();
        StringBuilder data = new StringBuilder("Current inventory snapshot:\n");
        products.stream().limit(20).forEach(p ->
                data.append("- ").append(p.getName())
                        .append(": qty=").append(p.getQuantityOnHand())
                        .append(", category=")
                        .append(p.getCategory() != null ? p.getCategory().getName() : "N/A")
                        .append("\n"));

        String system = "You are an inventory demand forecasting expert. Be concise and actionable.";
        String prompt = data + "\nProvide a 30-day demand forecast summary with reorder priorities.";
        return callClaude(system, prompt);
    }

    // ── Auto-categorize product ────────────────────────────────────
    public String suggestCategory(String productName, String description) {
        String system = "You are a product categorization expert. Reply with just the category name.";
        String prompt = "Suggest the best inventory category for:\nName: " + productName
                + "\nDescription: " + description;
        return callClaude(system, prompt);
    }
}
