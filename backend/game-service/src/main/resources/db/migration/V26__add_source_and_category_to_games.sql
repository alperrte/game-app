ALTER TABLE games
    ADD source VARCHAR(50) NULL,
    category_id BIGINT NULL;

ALTER TABLE games
    ADD CONSTRAINT fk_games_category
        FOREIGN KEY (category_id)
            REFERENCES game_categories(id);