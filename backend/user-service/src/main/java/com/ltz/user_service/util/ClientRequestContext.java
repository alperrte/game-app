package com.ltz.user_service.util;

import jakarta.servlet.http.HttpServletRequest;

public record ClientRequestContext(
        String ipAddress,
        String userAgent,
        String deviceInfo
) {
    public static ClientRequestContext from(HttpServletRequest request) {
        String ip = resolveClientIp(request);
        String userAgent = request.getHeader("User-Agent");
        String deviceInfo = UserAgentParser.summarize(userAgent);
        return new ClientRequestContext(ip, userAgent, deviceInfo);
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor == null || xForwardedFor.isBlank()) {
            return request.getRemoteAddr();
        }
        return xForwardedFor.split(",")[0].trim();
    }
}
