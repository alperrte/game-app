package com.ltz.social_service.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "post_poll_options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostPollOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "poll_id", nullable = false)
    private Long pollId;

    @Column(name = "option_text", nullable = false, length = 120)
    private String optionText;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;
}
