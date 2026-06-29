package com.ltz.user_service.entity;

public enum UploadType {
    AVATAR,
    COVER,
    BACKGROUND;

    public static UploadType fromString(String type) {
        try {
            return UploadType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Geçersiz yükleme tipi: " + type);
        }
    }
}
