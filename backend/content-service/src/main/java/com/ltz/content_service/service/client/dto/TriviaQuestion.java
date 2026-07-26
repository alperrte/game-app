package com.ltz.content_service.service.client.dto;

import java.util.List;

public record TriviaQuestion(String question, List<String> options, int correctOptionIndex) {
}
