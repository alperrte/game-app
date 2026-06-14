package com.ltz.user_service.controller;

import tools.jackson.databind.ObjectMapper;
import com.ltz.user_service.dto.request.UserProfileRequest;
import com.ltz.user_service.dto.response.UserProfileResponse;
import com.ltz.user_service.security.CustomAccessDeniedHandler;
import com.ltz.user_service.security.CustomAuthenticationEntryPoint;
import com.ltz.user_service.security.JwtAuthenticationFilter;
import com.ltz.user_service.security.JwtService;
import com.ltz.user_service.security.JwtUserPrincipal;
import com.ltz.user_service.service.UserProfileService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.web.servlet.MockMvc;
import com.ltz.user_service.config.SecurityConfig;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserProfileService userProfileService;

    @MockitoBean
    private JwtService jwtService;

    private UserProfileResponse userProfileResponse;
    private JwtUserPrincipal principal;

    @BeforeEach
    void setUp() {
        principal = new JwtUserPrincipal(123L, "gamer123@example.com", "gamer123", "ROLE_USER");
        userProfileResponse = UserProfileResponse.builder()
                .userId("123")
                .username("gamer123")
                .email("gamer123@example.com")
                .displayName("Gamer One")
                .bio("Just a simple gamer")
                .build();
    }

    @Test
    void testHealthCheck_PermitAll() throws Exception {
        mockMvc.perform(get("/api/users/health"))
                .andExpect(status().isOk())
                .andExpect(content().string("user-service is running"));
    }

    @Test
    void testGetProfile_Authenticated() throws Exception {
        when(userProfileService.getProfile("123")).thenReturn(userProfileResponse);

        mockMvc.perform(get("/api/users/profile/123")
                        .with(authentication(new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("123"))
                .andExpect(jsonPath("$.username").value("gamer123"));
    }

    @Test
    void testGetProfile_UnauthenticatedReturns401() throws Exception {
        mockMvc.perform(get("/api/users/profile/123"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void testUpdateProfile_Success() throws Exception {
        when(userProfileService.getProfile("123")).thenReturn(userProfileResponse);
        when(userProfileService.createOrUpdateProfile(eq("123"), anyString(), anyString(), any(UserProfileRequest.class), anyString()))
                .thenReturn(userProfileResponse);

        UserProfileRequest request = new UserProfileRequest();
        request.setDisplayName("New Name");
        request.setBio("Updated Bio");

        mockMvc.perform(put("/api/users/profile")
                        .with(csrf())
                        .with(authentication(new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void testUpdateProfile_ValidationError() throws Exception {
        UserProfileRequest request = new UserProfileRequest();
        StringBuilder longBio = new StringBuilder();
        for (int i = 0; i < 110; i++) {
            longBio.append("abcdefghij");
        }
        request.setBio(longBio.toString()); // 1100 characters

        mockMvc.perform(put("/api/users/profile")
                        .with(csrf())
                        .with(authentication(new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"))
                .andExpect(jsonPath("$.message").value("Validation failed"));
    }
}
