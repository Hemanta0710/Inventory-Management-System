package com.inventory.controller;
import com.inventory.dto.AiChatRequest;
import com.inventory.model.AiAlert;
import com.inventory.repository.AiAlertRepository;
import com.inventory.repository.UserRepository;
import com.inventory.service.AIIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AIController {
    private final AIIntegrationService aiService;
    private final AiAlertRepository alertRepo;
    private final UserRepository userRepo;

    @PostMapping("/chat")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Map<String, String>> chat(@RequestBody AiChatRequest req) {
        return ResponseEntity.ok(Map.of("response", aiService.chat(req)));
    }

    @GetMapping("/forecast")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Map<String, String>> forecast() {
        return ResponseEntity.ok(Map.of("forecast", aiService.getDemandForecast()));
    }

    @PostMapping("/generate-alerts")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> generateAlerts() {
        aiService.generateAlerts();
        return ResponseEntity.ok(Map.of("status", "Alerts generated successfully"));
    }

    @GetMapping("/alerts")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<List<AiAlert>> getAlerts(@AuthenticationPrincipal UserDetails ud) {
        var user = userRepo.findByUsername(ud.getUsername()).orElseThrow();
        return ResponseEntity.ok(alertRepo.findByCreatedForIdOrderByCreatedAtDesc(user.getId()));
    }

    @PatchMapping("/alerts/{id}/read")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> markRead(@PathVariable Long id) {
        alertRepo.findById(id).ifPresent(a -> { a.setIsRead(true); alertRepo.save(a); });
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/alerts/unread-count")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Map<String, Long>> unreadCount(@AuthenticationPrincipal UserDetails ud) {
        var user = userRepo.findByUsername(ud.getUsername()).orElseThrow();
        long count = alertRepo.countByCreatedForIdAndIsReadFalse(user.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }
}
