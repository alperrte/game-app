package com.ltz.user_service.entity;

public enum UserRole {
    USER,
    ADMIN,
    MODERATOR;

    public static UserRole fromString(String role) {
        if (role == null)
            return USER;
        String cleanRole = role.toUpperCase().replace("ROLE_", "");
        try {
            return UserRole.valueOf(cleanRole);
        } catch (IllegalArgumentException e) {
            return USER; // Fallback varsayılan
        }
    }
}
