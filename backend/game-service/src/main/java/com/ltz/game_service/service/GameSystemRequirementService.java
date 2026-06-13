package com.ltz.game_service.service;

import com.ltz.game_service.dto.request.GameSystemRequirementRequest;
import com.ltz.game_service.dto.response.GameSystemRequirementResponse;
import com.ltz.game_service.entity.GameSystemRequirement;
import com.ltz.game_service.repository.GameRepository;
import com.ltz.game_service.repository.GameSystemRequirementRepository;
import org.springframework.stereotype.Service;

@Service
public class GameSystemRequirementService {

    private final GameSystemRequirementRepository gameSystemRequirementRepository;
    private final GameRepository gameRepository;

    public GameSystemRequirementService(
            GameSystemRequirementRepository gameSystemRequirementRepository,
            GameRepository gameRepository
    ) {
        this.gameSystemRequirementRepository = gameSystemRequirementRepository;
        this.gameRepository = gameRepository;
    }

    public GameSystemRequirementResponse getSystemRequirementByGameId(Long gameId) {
        GameSystemRequirement systemRequirement = gameSystemRequirementRepository.findByGameId(gameId)
                .orElseThrow(() -> new RuntimeException("Bu oyuna ait sistem gereksinimi bulunamadı. Game ID: " + gameId));

        return mapToResponse(systemRequirement);
    }

    public GameSystemRequirementResponse createSystemRequirement(
            Long gameId,
            GameSystemRequirementRequest request
    ) {
        if (!gameRepository.existsById(gameId)) {
            throw new RuntimeException("Sistem gereksinimi eklenecek oyun bulunamadı. Game ID: " + gameId);
        }

        if (gameSystemRequirementRepository.existsByGameId(gameId)) {
            throw new RuntimeException("Bu oyun için sistem gereksinimi zaten mevcut. Game ID: " + gameId);
        }

        GameSystemRequirement systemRequirement = new GameSystemRequirement();

        systemRequirement.setGameId(gameId);
        setSystemRequirementFields(systemRequirement, request);

        GameSystemRequirement savedSystemRequirement = gameSystemRequirementRepository.save(systemRequirement);

        return mapToResponse(savedSystemRequirement);
    }

    public GameSystemRequirementResponse updateSystemRequirement(
            Long gameId,
            GameSystemRequirementRequest request
    ) {
        GameSystemRequirement systemRequirement = gameSystemRequirementRepository.findByGameId(gameId)
                .orElseThrow(() -> new RuntimeException("Güncellenecek sistem gereksinimi bulunamadı. Game ID: " + gameId));

        setSystemRequirementFields(systemRequirement, request);

        GameSystemRequirement updatedSystemRequirement = gameSystemRequirementRepository.save(systemRequirement);

        return mapToResponse(updatedSystemRequirement);
    }

    public void deleteSystemRequirement(Long gameId) {
        GameSystemRequirement systemRequirement = gameSystemRequirementRepository.findByGameId(gameId)
                .orElseThrow(() -> new RuntimeException("Silinecek sistem gereksinimi bulunamadı. Game ID: " + gameId));

        gameSystemRequirementRepository.delete(systemRequirement);
    }

    private void setSystemRequirementFields(
            GameSystemRequirement systemRequirement,
            GameSystemRequirementRequest request
    ) {
        systemRequirement.setMinimumOs(request.getMinimumOs());
        systemRequirement.setMinimumCpu(request.getMinimumCpu());
        systemRequirement.setMinimumGpu(request.getMinimumGpu());
        systemRequirement.setMinimumRam(request.getMinimumRam());
        systemRequirement.setMinimumStorage(request.getMinimumStorage());

        systemRequirement.setRecommendedOs(request.getRecommendedOs());
        systemRequirement.setRecommendedCpu(request.getRecommendedCpu());
        systemRequirement.setRecommendedGpu(request.getRecommendedGpu());
        systemRequirement.setRecommendedRam(request.getRecommendedRam());
        systemRequirement.setRecommendedStorage(request.getRecommendedStorage());

        systemRequirement.setNotes(request.getNotes());
    }

    private GameSystemRequirementResponse mapToResponse(GameSystemRequirement systemRequirement) {
        return new GameSystemRequirementResponse(
                systemRequirement.getId(),
                systemRequirement.getGameId(),
                systemRequirement.getMinimumOs(),
                systemRequirement.getMinimumCpu(),
                systemRequirement.getMinimumGpu(),
                systemRequirement.getMinimumRam(),
                systemRequirement.getMinimumStorage(),
                systemRequirement.getRecommendedOs(),
                systemRequirement.getRecommendedCpu(),
                systemRequirement.getRecommendedGpu(),
                systemRequirement.getRecommendedRam(),
                systemRequirement.getRecommendedStorage(),
                systemRequirement.getNotes(),
                systemRequirement.getCreatedAt(),
                systemRequirement.getUpdatedAt()
        );
    }
}