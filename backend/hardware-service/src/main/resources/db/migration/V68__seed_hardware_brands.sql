INSERT INTO hardware_brands (name, logo_url, website_url, active)
SELECT 'Razer', NULL, 'https://www.razer.com', 1
WHERE NOT EXISTS (SELECT 1 FROM hardware_brands WHERE name = 'Razer');

INSERT INTO hardware_brands (name, logo_url, website_url, active)
SELECT 'Logitech', NULL, 'https://www.logitech.com', 1
WHERE NOT EXISTS (SELECT 1 FROM hardware_brands WHERE name = 'Logitech');

INSERT INTO hardware_brands (name, logo_url, website_url, active)
SELECT 'SteelSeries', NULL, 'https://steelseries.com', 1
WHERE NOT EXISTS (SELECT 1 FROM hardware_brands WHERE name = 'SteelSeries');

INSERT INTO hardware_brands (name, logo_url, website_url, active)
SELECT 'Corsair', NULL, 'https://www.corsair.com', 1
WHERE NOT EXISTS (SELECT 1 FROM hardware_brands WHERE name = 'Corsair');

INSERT INTO hardware_brands (name, logo_url, website_url, active)
SELECT 'HyperX', NULL, 'https://hyperx.com', 1
WHERE NOT EXISTS (SELECT 1 FROM hardware_brands WHERE name = 'HyperX');

INSERT INTO hardware_brands (name, logo_url, website_url, active)
SELECT 'ASUS ROG', NULL, 'https://rog.asus.com', 1
WHERE NOT EXISTS (SELECT 1 FROM hardware_brands WHERE name = 'ASUS ROG');

INSERT INTO hardware_brands (name, logo_url, website_url, active)
SELECT 'MSI', NULL, 'https://www.msi.com', 1
WHERE NOT EXISTS (SELECT 1 FROM hardware_brands WHERE name = 'MSI');

INSERT INTO hardware_brands (name, logo_url, website_url, active)
SELECT 'Gigabyte', NULL, 'https://www.gigabyte.com', 1
WHERE NOT EXISTS (SELECT 1 FROM hardware_brands WHERE name = 'Gigabyte');

INSERT INTO hardware_brands (name, logo_url, website_url, active)
SELECT 'NVIDIA', NULL, 'https://www.nvidia.com', 1
WHERE NOT EXISTS (SELECT 1 FROM hardware_brands WHERE name = 'NVIDIA');

INSERT INTO hardware_brands (name, logo_url, website_url, active)
SELECT 'AMD', NULL, 'https://www.amd.com', 1
WHERE NOT EXISTS (SELECT 1 FROM hardware_brands WHERE name = 'AMD');

INSERT INTO hardware_brands (name, logo_url, website_url, active)
SELECT 'Intel', NULL, 'https://www.intel.com', 1
WHERE NOT EXISTS (SELECT 1 FROM hardware_brands WHERE name = 'Intel');

INSERT INTO hardware_brands (name, logo_url, website_url, active)
SELECT 'Samsung', NULL, 'https://www.samsung.com', 1
WHERE NOT EXISTS (SELECT 1 FROM hardware_brands WHERE name = 'Samsung');

INSERT INTO hardware_brands (name, logo_url, website_url, active)
SELECT 'Kingston', NULL, 'https://www.kingston.com', 1
WHERE NOT EXISTS (SELECT 1 FROM hardware_brands WHERE name = 'Kingston');

INSERT INTO hardware_brands (name, logo_url, website_url, active)
SELECT 'Western Digital', NULL, 'https://www.westerndigital.com', 1
WHERE NOT EXISTS (SELECT 1 FROM hardware_brands WHERE name = 'Western Digital');

INSERT INTO hardware_brands (name, logo_url, website_url, active)
SELECT 'Seagate', NULL, 'https://www.seagate.com', 1
WHERE NOT EXISTS (SELECT 1 FROM hardware_brands WHERE name = 'Seagate');

INSERT INTO hardware_brands (name, logo_url, website_url, active)
SELECT 'Other', NULL, NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM hardware_brands WHERE name = 'Other');