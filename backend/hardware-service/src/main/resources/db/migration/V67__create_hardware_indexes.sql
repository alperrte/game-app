CREATE INDEX idx_hardware_components_type_category
    ON hardware_components(component_type, category);

CREATE INDEX idx_hardware_components_brand
    ON hardware_components(brand_id);

CREATE INDEX idx_hardware_components_model_name
    ON hardware_components(model_name);

CREATE INDEX idx_user_hardware_user_id
    ON user_hardware(user_id);

CREATE INDEX idx_hardware_reviews_component_id
    ON hardware_reviews(component_id);

CREATE INDEX idx_hardware_reviews_user_id
    ON hardware_reviews(user_id);

CREATE INDEX idx_hardware_reviews_review_type
    ON hardware_reviews(review_type);

CREATE INDEX idx_game_performance_reports_game_id
    ON game_performance_reports(game_id);

CREATE INDEX idx_game_performance_reports_user_id
    ON game_performance_reports(user_id);

CREATE INDEX idx_game_performance_reports_game_gpu
    ON game_performance_reports(game_id, gpu_component_id);

CREATE INDEX idx_hardware_deals_component_id
    ON hardware_deals(component_id);

CREATE INDEX idx_hardware_deals_active
    ON hardware_deals(active);