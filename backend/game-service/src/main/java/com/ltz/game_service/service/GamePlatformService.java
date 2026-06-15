package com.ltz.game_service.service;

import com.ltz.game_service.dto.request.GamePlatformRequest;
import com.ltz.game_service.dto.response.GamePlatformResponse;
import com.ltz.game_service.entity.GamePlatform;
import com.ltz.game_service.repository.GamePlatformRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GamePlatformService {

    private final GamePlatformRepository gamePlatformRepository;

    public GamePlatformService(GamePlatformRepository gamePlatformRepository) {
        this.gamePlatformRepository = gamePlatformRepository;
    }

    public List<GamePlatformResponse> getAllPlatforms() {
        return gamePlatformRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public GamePlatformResponse getPlatformById(Long id) {
        GamePlatform platform = gamePlatformRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Platform bulunamadı. ID: " + id));

        return mapToResponse(platform);
    }

    public GamePlatformResponse createPlatform(GamePlatformRequest request) {
        if (gamePlatformRepository.existsByNameIgnoreCase(request.getName())) {
            throw new RuntimeException("Bu platform zaten mevcut: " + request.getName());
        }

        GamePlatform platform = new GamePlatform();
        platform.setName(trimOrNull(request.getName()));
        platform.setDescription(trimOrNull(request.getDescription()));
        platform.setLogoUrl(trimOrNull(request.getLogoUrl()));

        GamePlatform savedPlatform = gamePlatformRepository.save(platform);

        return mapToResponse(savedPlatform);
    }

    public GamePlatformResponse updatePlatform(Long id, GamePlatformRequest request) {
        GamePlatform platform = gamePlatformRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Güncellenecek platform bulunamadı. ID: " + id));

        platform.setName(trimOrNull(request.getName()));
        platform.setDescription(trimOrNull(request.getDescription()));
        platform.setLogoUrl(trimOrNull(request.getLogoUrl()));

        GamePlatform updatedPlatform = gamePlatformRepository.save(platform);

        return mapToResponse(updatedPlatform);
    }

    public void deletePlatform(Long id) {
        if (!gamePlatformRepository.existsById(id)) {
            throw new RuntimeException("Silinecek platform bulunamadı. ID: " + id);
        }

        gamePlatformRepository.deleteById(id);
    }

    private GamePlatformResponse mapToResponse(GamePlatform platform) {
        return new GamePlatformResponse(
                platform.getId(),
                platform.getName(),
                platform.getDescription(),
                platform.getLogoUrl(),
                platform.getCreatedAt(),
                platform.getUpdatedAt()
        );
    }

    private String trimOrNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        return value.trim();
    }
}