-- ============================================================
-- V69: Seed Hardware Components
-- CPU (Intel + AMD) ve GPU (NVIDIA + AMD) popüler modeller.
-- Brand ID'leri V68'de oluşturulan hardware_brands tablosundan
-- subquery ile alınır; idempotent (tekrar çalıştırılabilir).
-- ============================================================


-- ============================================================
-- INTEL CPUs
-- ============================================================

-- Core i9 14th Gen
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i9', 'Core i9-14900K', 'core i9-14900k', 24, 32, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i9-14900K');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i9', 'Core i9-14900KF', 'core i9-14900kf', 24, 32, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i9-14900KF');

-- Core i9 13th Gen
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i9', 'Core i9-13900K', 'core i9-13900k', 24, 32, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i9-13900K');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i9', 'Core i9-13900KF', 'core i9-13900kf', 24, 32, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i9-13900KF');

-- Core i9 12th Gen
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i9', 'Core i9-12900K', 'core i9-12900k', 16, 24, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i9-12900K');

-- Core i7 14th Gen
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i7', 'Core i7-14700K', 'core i7-14700k', 20, 28, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i7-14700K');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i7', 'Core i7-14700KF', 'core i7-14700kf', 20, 28, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i7-14700KF');

-- Core i7 13th Gen
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i7', 'Core i7-13700K', 'core i7-13700k', 16, 24, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i7-13700K');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i7', 'Core i7-13700KF', 'core i7-13700kf', 16, 24, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i7-13700KF');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i7', 'Core i7-13700', 'core i7-13700', 16, 24, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i7-13700');

-- Core i7 12th Gen
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i7', 'Core i7-12700K', 'core i7-12700k', 12, 20, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i7-12700K');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i7', 'Core i7-12700', 'core i7-12700', 12, 20, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i7-12700');

-- Core i5 14th Gen
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i5', 'Core i5-14600K', 'core i5-14600k', 14, 20, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i5-14600K');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i5', 'Core i5-14600KF', 'core i5-14600kf', 14, 20, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i5-14600KF');

-- Core i5 13th Gen
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i5', 'Core i5-13600K', 'core i5-13600k', 14, 20, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i5-13600K');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i5', 'Core i5-13600KF', 'core i5-13600kf', 14, 20, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i5-13600KF');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i5', 'Core i5-13400F', 'core i5-13400f', 10, 16, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i5-13400F');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i5', 'Core i5-13400', 'core i5-13400', 10, 16, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i5-13400');

-- Core i5 12th Gen
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i5', 'Core i5-12600K', 'core i5-12600k', 10, 16, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i5-12600K');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i5', 'Core i5-12400F', 'core i5-12400f', 6, 12, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i5-12400F');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i5', 'Core i5-12400', 'core i5-12400', 6, 12, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i5-12400');

-- Core i3
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i3', 'Core i3-12100F', 'core i3-12100f', 4, 8, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i3-12100F');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core i3', 'Core i3-13100F', 'core i3-13100f', 4, 8, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core i3-13100F');

-- Intel Core Ultra (Arrow Lake / Raptor Lake Refresh)
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core Ultra 9', 'Core Ultra 9 285K', 'core ultra 9 285k', 24, 24, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core Ultra 9 285K');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core Ultra 7', 'Core Ultra 7 265K', 'core ultra 7 265k', 20, 20, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core Ultra 7 265K');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Core Ultra 5', 'Core Ultra 5 245K', 'core ultra 5 245k', 14, 14, 1, 1
FROM hardware_brands b WHERE b.name = 'Intel'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Core Ultra 5 245K');


-- ============================================================
-- AMD CPUs
-- ============================================================

-- Ryzen 9 9000 Series (Zen 5)
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 9', 'Ryzen 9 9950X', 'ryzen 9 9950x', 16, 32, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 9 9950X');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 9', 'Ryzen 9 9900X', 'ryzen 9 9900x', 12, 24, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 9 9900X');

-- Ryzen 9 7000 Series (Zen 4)
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 9', 'Ryzen 9 7950X', 'ryzen 9 7950x', 16, 32, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 9 7950X');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 9', 'Ryzen 9 7950X3D', 'ryzen 9 7950x3d', 16, 32, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 9 7950X3D');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 9', 'Ryzen 9 7900X', 'ryzen 9 7900x', 12, 24, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 9 7900X');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 9', 'Ryzen 9 7900X3D', 'ryzen 9 7900x3d', 12, 24, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 9 7900X3D');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 9', 'Ryzen 9 7900', 'ryzen 9 7900', 12, 24, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 9 7900');

-- Ryzen 9 5000 Series (Zen 3)
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 9', 'Ryzen 9 5950X', 'ryzen 9 5950x', 16, 32, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 9 5950X');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 9', 'Ryzen 9 5900X', 'ryzen 9 5900x', 12, 24, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 9 5900X');

-- Ryzen 7 9000 Series
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 7', 'Ryzen 7 9700X', 'ryzen 7 9700x', 8, 16, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 7 9700X');

-- Ryzen 7 7000 Series
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 7', 'Ryzen 7 7800X3D', 'ryzen 7 7800x3d', 8, 16, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 7 7800X3D');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 7', 'Ryzen 7 7700X', 'ryzen 7 7700x', 8, 16, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 7 7700X');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 7', 'Ryzen 7 7700', 'ryzen 7 7700', 8, 16, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 7 7700');

-- Ryzen 7 5000 Series
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 7', 'Ryzen 7 5800X3D', 'ryzen 7 5800x3d', 8, 16, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 7 5800X3D');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 7', 'Ryzen 7 5800X', 'ryzen 7 5800x', 8, 16, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 7 5800X');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 7', 'Ryzen 7 5700X', 'ryzen 7 5700x', 8, 16, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 7 5700X');

-- Ryzen 5 9000 Series
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 5', 'Ryzen 5 9600X', 'ryzen 5 9600x', 6, 12, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 5 9600X');

-- Ryzen 5 7000 Series
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 5', 'Ryzen 5 7600X', 'ryzen 5 7600x', 6, 12, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 5 7600X');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 5', 'Ryzen 5 7600', 'ryzen 5 7600', 6, 12, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 5 7600');

-- Ryzen 5 5000 Series
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 5', 'Ryzen 5 5600X', 'ryzen 5 5600x', 6, 12, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 5 5600X');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 5', 'Ryzen 5 5600', 'ryzen 5 5600', 6, 12, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 5 5600');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, core_count, thread_count, verified, active)
SELECT 'CPU', 'PROCESSOR', b.id, 'Ryzen 5', 'Ryzen 5 5500', 'ryzen 5 5500', 6, 12, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Ryzen 5 5500');


-- ============================================================
-- NVIDIA GPUs
-- ============================================================

-- RTX 40 Series
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 40 Series', 'GeForce RTX 4090', 'geforce rtx 4090', 24, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 4090');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 40 Series', 'GeForce RTX 4080 Super', 'geforce rtx 4080 super', 16, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 4080 Super');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 40 Series', 'GeForce RTX 4080', 'geforce rtx 4080', 16, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 4080');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 40 Series', 'GeForce RTX 4070 Ti Super', 'geforce rtx 4070 ti super', 16, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 4070 Ti Super');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 40 Series', 'GeForce RTX 4070 Ti', 'geforce rtx 4070 ti', 12, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 4070 Ti');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 40 Series', 'GeForce RTX 4070 Super', 'geforce rtx 4070 super', 12, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 4070 Super');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 40 Series', 'GeForce RTX 4070', 'geforce rtx 4070', 12, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 4070');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 40 Series', 'GeForce RTX 4060 Ti 16GB', 'geforce rtx 4060 ti 16gb', 16, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 4060 Ti 16GB');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 40 Series', 'GeForce RTX 4060 Ti', 'geforce rtx 4060 ti', 8, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 4060 Ti');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 40 Series', 'GeForce RTX 4060', 'geforce rtx 4060', 8, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 4060');

-- RTX 50 Series
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 50 Series', 'GeForce RTX 5090', 'geforce rtx 5090', 32, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 5090');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 50 Series', 'GeForce RTX 5080', 'geforce rtx 5080', 16, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 5080');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 50 Series', 'GeForce RTX 5070 Ti', 'geforce rtx 5070 ti', 16, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 5070 Ti');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 50 Series', 'GeForce RTX 5070', 'geforce rtx 5070', 12, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 5070');

-- RTX 30 Series
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 30 Series', 'GeForce RTX 3090 Ti', 'geforce rtx 3090 ti', 24, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 3090 Ti');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 30 Series', 'GeForce RTX 3090', 'geforce rtx 3090', 24, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 3090');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 30 Series', 'GeForce RTX 3080 Ti', 'geforce rtx 3080 ti', 12, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 3080 Ti');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 30 Series', 'GeForce RTX 3080 12GB', 'geforce rtx 3080 12gb', 12, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 3080 12GB');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 30 Series', 'GeForce RTX 3080', 'geforce rtx 3080', 10, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 3080');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 30 Series', 'GeForce RTX 3070 Ti', 'geforce rtx 3070 ti', 8, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 3070 Ti');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 30 Series', 'GeForce RTX 3070', 'geforce rtx 3070', 8, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 3070');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 30 Series', 'GeForce RTX 3060 Ti', 'geforce rtx 3060 ti', 8, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 3060 Ti');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 30 Series', 'GeForce RTX 3060', 'geforce rtx 3060', 12, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 3060');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'GeForce RTX 30 Series', 'GeForce RTX 3050', 'geforce rtx 3050', 8, 1, 1
FROM hardware_brands b WHERE b.name = 'NVIDIA'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'GeForce RTX 3050');


-- ============================================================
-- AMD GPUs
-- ============================================================

-- RX 9000 Series
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 9000 Series', 'Radeon RX 9070 XT', 'radeon rx 9070 xt', 16, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 9070 XT');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 9000 Series', 'Radeon RX 9070', 'radeon rx 9070', 16, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 9070');

-- RX 7000 Series
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 7000 Series', 'Radeon RX 7900 XTX', 'radeon rx 7900 xtx', 24, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 7900 XTX');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 7000 Series', 'Radeon RX 7900 XT', 'radeon rx 7900 xt', 20, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 7900 XT');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 7000 Series', 'Radeon RX 7900 GRE', 'radeon rx 7900 gre', 16, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 7900 GRE');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 7000 Series', 'Radeon RX 7800 XT', 'radeon rx 7800 xt', 16, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 7800 XT');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 7000 Series', 'Radeon RX 7700 XT', 'radeon rx 7700 xt', 12, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 7700 XT');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 7000 Series', 'Radeon RX 7600 XT', 'radeon rx 7600 xt', 16, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 7600 XT');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 7000 Series', 'Radeon RX 7600', 'radeon rx 7600', 8, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 7600');

-- RX 6000 Series
INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 6000 Series', 'Radeon RX 6950 XT', 'radeon rx 6950 xt', 16, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 6950 XT');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 6000 Series', 'Radeon RX 6900 XT', 'radeon rx 6900 xt', 16, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 6900 XT');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 6000 Series', 'Radeon RX 6800 XT', 'radeon rx 6800 xt', 16, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 6800 XT');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 6000 Series', 'Radeon RX 6800', 'radeon rx 6800', 16, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 6800');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 6000 Series', 'Radeon RX 6750 XT', 'radeon rx 6750 xt', 12, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 6750 XT');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 6000 Series', 'Radeon RX 6700 XT', 'radeon rx 6700 xt', 12, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 6700 XT');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 6000 Series', 'Radeon RX 6650 XT', 'radeon rx 6650 xt', 8, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 6650 XT');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 6000 Series', 'Radeon RX 6600 XT', 'radeon rx 6600 xt', 8, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 6600 XT');

INSERT INTO hardware_components (component_type, category, brand_id, series_name, model_name, normalized_name, vram_gb, verified, active)
SELECT 'GPU', 'GRAPHICS_CARD', b.id, 'Radeon RX 6000 Series', 'Radeon RX 6600', 'radeon rx 6600', 8, 1, 1
FROM hardware_brands b WHERE b.name = 'AMD'
AND NOT EXISTS (SELECT 1 FROM hardware_components WHERE model_name = 'Radeon RX 6600');
