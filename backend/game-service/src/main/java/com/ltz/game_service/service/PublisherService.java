package com.ltz.game_service.service;

import com.ltz.game_service.dto.request.PublisherRequest;
import com.ltz.game_service.dto.response.PublisherResponse;
import com.ltz.game_service.entity.Publisher;
import com.ltz.game_service.repository.PublisherRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PublisherService {

    private final PublisherRepository publisherRepository;

    public PublisherService(PublisherRepository publisherRepository) {
        this.publisherRepository = publisherRepository;
    }

    public List<PublisherResponse> getAllPublishers() {
        return publisherRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public PublisherResponse getPublisherById(Long id) {
        Publisher publisher = publisherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Yayıncı bulunamadı. ID: " + id));

        return mapToResponse(publisher);
    }

    public PublisherResponse createPublisher(PublisherRequest request) {
        if (publisherRepository.existsByNameIgnoreCase(request.getName())) {
            throw new RuntimeException("Bu yayıncı zaten mevcut: " + request.getName());
        }

        Publisher publisher = new Publisher();
        publisher.setName(request.getName());
        publisher.setDescription(request.getDescription());
        publisher.setWebsiteUrl(request.getWebsiteUrl());
        publisher.setCountry(request.getCountry());

        Publisher savedPublisher = publisherRepository.save(publisher);

        return mapToResponse(savedPublisher);
    }

    public PublisherResponse updatePublisher(Long id, PublisherRequest request) {
        Publisher publisher = publisherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Güncellenecek yayıncı bulunamadı. ID: " + id));

        publisher.setName(request.getName());
        publisher.setDescription(request.getDescription());
        publisher.setWebsiteUrl(request.getWebsiteUrl());
        publisher.setCountry(request.getCountry());

        Publisher updatedPublisher = publisherRepository.save(publisher);

        return mapToResponse(updatedPublisher);
    }

    public void deletePublisher(Long id) {
        if (!publisherRepository.existsById(id)) {
            throw new RuntimeException("Silinecek yayıncı bulunamadı. ID: " + id);
        }

        publisherRepository.deleteById(id);
    }

    private PublisherResponse mapToResponse(Publisher publisher) {
        return new PublisherResponse(
                publisher.getId(),
                publisher.getName(),
                publisher.getDescription(),
                publisher.getWebsiteUrl(),
                publisher.getCountry(),
                publisher.getCreatedAt(),
                publisher.getUpdatedAt()
        );
    }
}