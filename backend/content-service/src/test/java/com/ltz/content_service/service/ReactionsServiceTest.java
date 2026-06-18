package com.ltz.content_service.service;

import com.ltz.content_service.model.entity.ContentReaction;
import com.ltz.content_service.model.enums.ReactionType;
import com.ltz.content_service.repository.ContentReactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReactionsService Unit Tests")
class ReactionsServiceTest {

    @Mock
    private ContentReactionRepository reactionRepository;

    @InjectMocks
    private ReactionsService reactionsService;

    private ContentReaction existingReaction;

    @BeforeEach
    void setUp() {
        existingReaction = ContentReaction.builder()
                .id(1L)
                .userId(42L)
                .contentId(100L)
                .contentType("NEWS")
                .reactionType(ReactionType.HYPE)
                .createdAt(LocalDateTime.now().minusMinutes(5))
                .build();
    }

    // ─── reactToContent ──────────────────────────────────────────────────────

    @Test
    @DisplayName("reactToContent() → yeni reaksiyon → kayıt oluşturulur")
    void reactToContent_whenNoExistingReaction_shouldCreateNew() {
        when(reactionRepository.findByUserIdAndContentIdAndContentType(42L, 100L, "NEWS"))
                .thenReturn(Optional.empty());
        when(reactionRepository.save(any(ContentReaction.class))).thenReturn(existingReaction);

        reactionsService.reactToContent(42L, 100L, "NEWS", ReactionType.HYPE);

        verify(reactionRepository).save(argThat(r ->
                r.getUserId().equals(42L) &&
                r.getContentId().equals(100L) &&
                r.getContentType().equals("NEWS") &&
                r.getReactionType() == ReactionType.HYPE
        ));
    }

    @Test
    @DisplayName("reactToContent() → mevcut reaksiyon → güncelleme yapılır")
    void reactToContent_whenReactionExists_shouldUpdateReactionType() {
        when(reactionRepository.findByUserIdAndContentIdAndContentType(42L, 100L, "NEWS"))
                .thenReturn(Optional.of(existingReaction));
        when(reactionRepository.save(any(ContentReaction.class))).thenReturn(existingReaction);

        reactionsService.reactToContent(42L, 100L, "NEWS", ReactionType.WORTH_IT);

        verify(reactionRepository).save(argThat(r ->
                r.getReactionType() == ReactionType.WORTH_IT
        ));
    }

    @Test
    @DisplayName("reactToContent() → geçersiz contentType → IllegalArgumentException fırlatılır")
    void reactToContent_whenInvalidContentType_shouldThrowException() {
        assertThatThrownBy(() ->
                reactionsService.reactToContent(42L, 100L, "INVALID_TYPE", ReactionType.HYPE)
        ).isInstanceOf(IllegalArgumentException.class)
         .hasMessageContaining("Invalid content type");
    }

    @Test
    @DisplayName("reactToContent() → CAMPAIGN tipi → geçerli, kayıt oluşturulur")
    void reactToContent_whenCampaignType_shouldAccept() {
        when(reactionRepository.findByUserIdAndContentIdAndContentType(42L, 200L, "CAMPAIGN"))
                .thenReturn(Optional.empty());

        reactionsService.reactToContent(42L, 200L, "CAMPAIGN", ReactionType.MEH);

        verify(reactionRepository).save(argThat(r ->
                r.getContentType().equals("CAMPAIGN") &&
                r.getReactionType() == ReactionType.MEH
        ));
    }

    @Test
    @DisplayName("reactToContent() → küçük harf contentType → normalize edilir")
    void reactToContent_whenLowercaseContentType_shouldNormalize() {
        when(reactionRepository.findByUserIdAndContentIdAndContentType(42L, 100L, "NEWS"))
                .thenReturn(Optional.empty());

        reactionsService.reactToContent(42L, 100L, "news", ReactionType.TRASH);

        verify(reactionRepository).save(argThat(r ->
                r.getContentType().equals("NEWS")
        ));
    }

    // ─── removeReaction ──────────────────────────────────────────────────────

    @Test
    @DisplayName("removeReaction() → var olan reaksiyon → silinir")
    void removeReaction_whenExists_shouldDelete() {
        when(reactionRepository.findByUserIdAndContentIdAndContentType(42L, 100L, "NEWS"))
                .thenReturn(Optional.of(existingReaction));

        reactionsService.removeReaction(42L, 100L, "NEWS");

        verify(reactionRepository).delete(existingReaction);
    }

    @Test
    @DisplayName("removeReaction() → yok olan reaksiyon → delete çağrılmaz")
    void removeReaction_whenNotExists_shouldNotDelete() {
        when(reactionRepository.findByUserIdAndContentIdAndContentType(42L, 100L, "NEWS"))
                .thenReturn(Optional.empty());

        reactionsService.removeReaction(42L, 100L, "NEWS");

        verify(reactionRepository, never()).delete(any());
    }

    // ─── getReactionsSummary ─────────────────────────────────────────────────

    @Test
    @DisplayName("getReactionsSummary() → tüm ReactionType'lar 0 ile başlatılır")
    void getReactionsSummary_shouldInitializeAllReactionTypes() {
        when(reactionRepository.countReactionsByContent(100L, "NEWS")).thenReturn(List.of());

        Map<String, Long> result = reactionsService.getReactionsSummary(100L, "NEWS");

        assertThat(result).containsKey("HYPE");
        assertThat(result).containsKey("WORTH_IT");
        assertThat(result).containsKey("MEH");
        assertThat(result).containsKey("TRASH");
        assertThat(result.values()).allMatch(count -> count == 0L);
    }

    @Test
    @DisplayName("getReactionsSummary() → HYPE reaksiyonu var → count doğru döner")
    void getReactionsSummary_whenHypeExists_shouldReturnCorrectCount() {
        Object[] hypeRow = new Object[]{ReactionType.HYPE, 7L};
        List<Object[]> rawCounts = new java.util.ArrayList<>();
        rawCounts.add(hypeRow);
        when(reactionRepository.countReactionsByContent(100L, "NEWS")).thenReturn(rawCounts);

        Map<String, Long> result = reactionsService.getReactionsSummary(100L, "NEWS");

        assertThat(result.get("HYPE")).isEqualTo(7L);
        assertThat(result.get("MEH")).isEqualTo(0L);
    }

    // ─── getUserReaction ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getUserReaction() → userId null → null döner")
    void getUserReaction_whenUserIdIsNull_shouldReturnNull() {
        String result = reactionsService.getUserReaction(null, 100L, "NEWS");

        assertThat(result).isNull();
        verifyNoInteractions(reactionRepository);
    }

    @Test
    @DisplayName("getUserReaction() → reaksiyon var → reaksiyon adı döner")
    void getUserReaction_whenReactionExists_shouldReturnReactionName() {
        when(reactionRepository.findByUserIdAndContentIdAndContentType(42L, 100L, "NEWS"))
                .thenReturn(Optional.of(existingReaction));

        String result = reactionsService.getUserReaction(42L, 100L, "NEWS");

        assertThat(result).isEqualTo("HYPE");
    }

    @Test
    @DisplayName("getUserReaction() → reaksiyon yok → null döner")
    void getUserReaction_whenNoReaction_shouldReturnNull() {
        when(reactionRepository.findByUserIdAndContentIdAndContentType(42L, 100L, "NEWS"))
                .thenReturn(Optional.empty());

        String result = reactionsService.getUserReaction(42L, 100L, "NEWS");

        assertThat(result).isNull();
    }
}
