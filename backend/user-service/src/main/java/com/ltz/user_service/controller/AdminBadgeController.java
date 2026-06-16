package com.ltz.user_service.controller;

import com.ltz.user_service.dto.request.AssignBadgeRequest;
import com.ltz.user_service.dto.response.AssignedBadgeResponse;
import com.ltz.user_service.dto.response.BadgeCatalogItemResponse;
import com.ltz.user_service.security.JwtUserPrincipal;
import com.ltz.user_service.service.AdminBadgeService;
import com.ltz.user_service.util.ClientRequestContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/admin")
public class AdminBadgeController {

    private final AdminBadgeService adminBadgeService;
    private final HttpServletRequest httpServletRequest;

    public AdminBadgeController(AdminBadgeService adminBadgeService, HttpServletRequest httpServletRequest) {
        this.adminBadgeService = adminBadgeService;
        this.httpServletRequest = httpServletRequest;
    }

    @GetMapping("/badges/catalog")
    public ResponseEntity<List<BadgeCatalogItemResponse>> getCatalog(
            @AuthenticationPrincipal JwtUserPrincipal principal) {
        adminBadgeService.assertAdminRole(principal.role());
        return ResponseEntity.ok(adminBadgeService.getCatalog());
    }

    @GetMapping("/{userId}/badges")
    public ResponseEntity<List<AssignedBadgeResponse>> getUserBadges(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable String userId) {
        adminBadgeService.assertAdminRole(principal.role());
        return ResponseEntity.ok(adminBadgeService.getUserBadges(userId));
    }

    @PutMapping("/{userId}/badges")
    public ResponseEntity<AssignedBadgeResponse> assignBadge(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable String userId,
            @Valid @RequestBody AssignBadgeRequest request) {
        adminBadgeService.assertAdminRole(principal.role());
        return ResponseEntity.ok(adminBadgeService.assignBadge(
                userId,
                request,
                principal.userId().toString(),
                ClientRequestContext.from(httpServletRequest)));
    }

    @DeleteMapping("/{userId}/badges/{badgeKey}")
    public ResponseEntity<Void> removeBadge(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @PathVariable String userId,
            @PathVariable String badgeKey) {
        adminBadgeService.assertAdminRole(principal.role());
        adminBadgeService.removeBadge(
                userId,
                badgeKey,
                principal.userId().toString(),
                ClientRequestContext.from(httpServletRequest));
        return ResponseEntity.noContent().build();
    }
}
