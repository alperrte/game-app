package com.ltz.game_service.service;

import com.ltz.game_service.dto.request.DeveloperRequest;
import com.ltz.game_service.dto.response.DeveloperResponse;
import com.ltz.game_service.entity.Developer;
import com.ltz.game_service.repository.DeveloperRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DeveloperService {

    private final DeveloperRepository developerRepository;

    public DeveloperService(DeveloperRepository developerRepository) {
        this.developerRepository = developerRepository;
    }

    public List<DeveloperResponse> getAllDevelopers() {
        return developerRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public DeveloperResponse getDeveloperById(Long id) {
        Developer developer = developerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Geliştirici bulunamadı. ID: " + id));

        return mapToResponse(developer);
    }

    public DeveloperResponse createDeveloper(DeveloperRequest request) {
        if (developerRepository.existsByNameIgnoreCase(request.getName())) {
            throw new RuntimeException("Bu geliştirici zaten mevcut: " + request.getName());
        }

        Developer developer = new Developer();
        developer.setName(request.getName());
        developer.setDescription(request.getDescription());
        developer.setWebsiteUrl(request.getWebsiteUrl());
        developer.setCountry(request.getCountry());

        Developer savedDeveloper = developerRepository.save(developer);

        return mapToResponse(savedDeveloper);
    }

    public DeveloperResponse updateDeveloper(Long id, DeveloperRequest request) {
        Developer developer = developerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Güncellenecek geliştirici bulunamadı. ID: " + id));

        developer.setName(request.getName());
        developer.setDescription(request.getDescription());
        developer.setWebsiteUrl(request.getWebsiteUrl());
        developer.setCountry(request.getCountry());

        Developer updatedDeveloper = developerRepository.save(developer);

        return mapToResponse(updatedDeveloper);
    }

    public void deleteDeveloper(Long id) {
        if (!developerRepository.existsById(id)) {
            throw new RuntimeException("Silinecek geliştirici bulunamadı. ID: " + id);
        }

        developerRepository.deleteById(id);
    }

    private DeveloperResponse mapToResponse(Developer developer) {
        return new DeveloperResponse(
                developer.getId(),
                developer.getName(),
                developer.getDescription(),
                developer.getWebsiteUrl(),
                developer.getCountry(),
                developer.getCreatedAt(),
                developer.getUpdatedAt()
        );
    }
}