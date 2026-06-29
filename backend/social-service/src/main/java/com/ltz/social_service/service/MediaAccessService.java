package com.ltz.social_service.service;

import com.ltz.social_service.entity.MediaAsset;
import com.ltz.social_service.entity.Post;
import com.ltz.social_service.entity.Community;
import com.ltz.social_service.entity.CommunityEvent;
import com.ltz.social_service.enums.CommunityVisibility;
import com.ltz.social_service.enums.MediaAssetStatus;
import com.ltz.social_service.enums.PostVisibility;
import com.ltz.social_service.repository.FriendshipRepository;
import com.ltz.social_service.repository.MediaAssetRepository;
import com.ltz.social_service.repository.PostRepository;
import com.ltz.social_service.repository.CommunityRepository;
import com.ltz.social_service.repository.CommunityEventRepository;
import com.ltz.social_service.repository.CommunityMemberRepository;
import com.ltz.social_service.repository.ChatRoomMemberRepository;
import com.ltz.social_service.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MediaAccessService {

    private final MediaAssetRepository mediaAssetRepository;
    private final PostRepository postRepository;
    private final FriendshipRepository friendshipRepository;
    private final CommunityRepository communityRepository;
    private final CommunityEventRepository communityEventRepository;
    private final CommunityMemberRepository communityMemberRepository;
    private final MessageRepository messageRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;

    @Transactional(readOnly = true)
    public boolean canAccess(String fileName, Long viewerUserId) {
        MediaAsset media = mediaAssetRepository.findByFileName(fileName).orElse(null);
        if (media == null || MediaAssetStatus.DELETED.equals(media.getStatus())) {
            return false;
        }

        if (viewerUserId != null && viewerUserId.equals(media.getOwnerUserId())) {
            return true;
        }

        if (!MediaAssetStatus.ATTACHED.equals(media.getStatus()) || media.getPostId() == null) {
            if (media.getMessageId() != null) {
                return messageRepository.findById(media.getMessageId())
                        .map(message -> viewerUserId != null
                                && chatRoomMemberRepository.existsByChatRoomIdAndUserId(
                                message.getChatRoomId(),
                                viewerUserId))
                        .orElse(false);
            }
            if (media.getChatRoomId() != null) {
                return viewerUserId != null
                        && chatRoomMemberRepository.existsByChatRoomIdAndUserId(
                        media.getChatRoomId(),
                        viewerUserId);
            }
            if (media.getCommunityId() != null) {
                return canViewCommunity(media.getCommunityId(), viewerUserId);
            }
            if (media.getCommunityEventId() != null) {
                CommunityEvent event = communityEventRepository.findById(media.getCommunityEventId())
                        .orElse(null);
                return event != null && canViewCommunity(event.getCommunityId(), viewerUserId);
            }
            return false;
        }

        Post post = postRepository.findById(media.getPostId()).orElse(null);
        if (post == null || Boolean.TRUE.equals(post.getIsDeleted())) {
            return false;
        }

        if (post.getCommunityId() != null) {
            return viewerUserId != null
                    && communityMemberRepository.existsByCommunityIdAndUserId(
                            post.getCommunityId(),
                            viewerUserId);
        }

        if (PostVisibility.PUBLIC.equals(post.getVisibility())) {
            return true;
        }

        return PostVisibility.FRIENDS.equals(post.getVisibility())
                && viewerUserId != null
                && friendshipRepository.existsByUserIdAndFriendUserId(post.getUserId(), viewerUserId);
    }

    private boolean canViewCommunity(Long communityId, Long viewerUserId) {
        Community community = communityRepository.findById(communityId).orElse(null);
        return community != null
                && (CommunityVisibility.PUBLIC.equals(community.getVisibility())
                || viewerUserId != null
                && communityMemberRepository.existsByCommunityIdAndUserId(
                        communityId,
                        viewerUserId));
    }
}
