ALTER TABLE posts
    DROP CONSTRAINT chk_post_visibility;

ALTER TABLE posts
    ADD CONSTRAINT chk_post_visibility
        CHECK (visibility IN ('PUBLIC', 'FOLLOWERS_ONLY', 'FRIENDS', 'PRIVATE'));
