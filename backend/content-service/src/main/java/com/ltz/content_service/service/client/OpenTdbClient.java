package com.ltz.content_service.service.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.HtmlUtils;
import reactor.core.publisher.Mono;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class OpenTdbClient {

    private final WebClient webClient;

    @SuppressWarnings("unchecked")
    public Mono<Map<String, Object>> fetchRandomTrivia() {
        return webClient.get()
                .uri("https://opentdb.com/api.php?amount=1&category=15&type=multiple")
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    try {
                        int responseCode = ((Number) response.get("response_code")).intValue();
                        if (responseCode != 0) {
                            throw new IllegalStateException("OpenTDB API returned error code: " + responseCode);
                        }
                        List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
                        if (results == null || results.isEmpty()) {
                            throw new IllegalStateException("No results returned from OpenTDB");
                        }
                        return results.get(0);
                    } catch (Exception e) {
                        throw new IllegalStateException("Failed to parse OpenTDB response", e);
                    }
                })
                .map(result -> {
                    String question = HtmlUtils.htmlUnescape((String) result.get("question"));
                    String correctAnswer = HtmlUtils.htmlUnescape((String) result.get("correct_answer"));
                    List<String> incorrectAnswers = (List<String>) result.get("incorrect_answers");

                    List<String> options = new ArrayList<>();
                    options.add(correctAnswer);
                    for (String inc : incorrectAnswers) {
                        options.add(HtmlUtils.htmlUnescape(inc));
                    }

                    Collections.shuffle(options);
                    int correctOptionIndex = options.indexOf(correctAnswer);

                    Map<String, Object> mapped = new HashMap<>();
                    mapped.put("question", question);
                    mapped.put("options", options);
                    mapped.put("correctOptionIndex", correctOptionIndex);
                    return mapped;
                })
                .onErrorResume(e -> {
                    log.error("Failed to fetch trivia from OpenTDB: ", e);
                    return Mono.empty();
                });
    }
}
