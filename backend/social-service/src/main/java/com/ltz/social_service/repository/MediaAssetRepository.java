package com.ltz.social_service.repository;

import com.ltz.social_service.entity.MediaAsset;
import com.ltz.social_service.enums.MediaAssetStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MediaAssetRepository extends JpaRepository<MediaAsset, Long> {

    Optional<MediaAsset> findByUrl(String url);

    Optional<MediaAsset> findByFileName(String fileName);

    List<MediaAsset> findByPostIdAndStatusOrderByIdAsc(Long postId, MediaAssetStatus status);

    List<MediaAsset> findByCommunityEventId(Long communityEventId);
    List<MediaAsset> findByCommunityId(Long communityId);

    List<MediaAsset> findByStatusAndCreatedAtBefore(MediaAssetStatus status, LocalDateTime createdAt);

    @Query("""
            select coalesce(sum(mediaAsset.sizeBytes), 0)
            from MediaAsset mediaAsset
            where mediaAsset.ownerUserId = :ownerUserId
              and mediaAsset.status in :statuses
            """)
    long sumSizeBytesByOwnerAndStatuses(
            @Param("ownerUserId") Long ownerUserId,
            @Param("statuses") Collection<MediaAssetStatus> statuses
    );

    long countByOwnerUserIdAndCreatedAtAfterAndStatusNot(
            Long ownerUserId,
            LocalDateTime createdAt,
            MediaAssetStatus status
    );
}
