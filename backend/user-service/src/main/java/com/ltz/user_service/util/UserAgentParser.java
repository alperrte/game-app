package com.ltz.user_service.util;

public final class UserAgentParser {

    private UserAgentParser() {
    }

    public static String summarize(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "Bilinmeyen cihaz";
        }

        String ua = userAgent.toLowerCase();
        String os = detectOs(ua);
        String browser = detectBrowser(ua);

        if (!"Bilinmeyen".equals(os) && !"Bilinmeyen".equals(browser)) {
            return browser + " / " + os;
        }
        if (!"Bilinmeyen".equals(os)) {
            return os;
        }
        if (!"Bilinmeyen".equals(browser)) {
            return browser;
        }

        return userAgent.length() > 80 ? userAgent.substring(0, 80) + "..." : userAgent;
    }

    private static String detectOs(String ua) {
        if (ua.contains("windows")) return "Windows";
        if (ua.contains("mac os") || ua.contains("macintosh")) return "macOS";
        if (ua.contains("android")) return "Android";
        if (ua.contains("iphone") || ua.contains("ipad") || ua.contains("ios")) return "iOS";
        if (ua.contains("linux")) return "Linux";
        return "Bilinmeyen";
    }

    private static String detectBrowser(String ua) {
        if (ua.contains("edg/")) return "Edge";
        if (ua.contains("chrome/") && !ua.contains("edg/")) return "Chrome";
        if (ua.contains("firefox/")) return "Firefox";
        if (ua.contains("safari/") && !ua.contains("chrome/")) return "Safari";
        if (ua.contains("opr/") || ua.contains("opera")) return "Opera";
        return "Bilinmeyen";
    }
}
