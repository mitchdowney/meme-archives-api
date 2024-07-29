CREATE MATERIALIZED VIEW image_random_order_materialized_view AS
SELECT id, type, has_animation, has_border, has_no_border, has_video
FROM image
ORDER BY RANDOM();
