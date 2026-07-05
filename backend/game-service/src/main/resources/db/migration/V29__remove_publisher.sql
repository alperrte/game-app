-- Publisher/yayıncı modeli kaldırılıyor; yalnızca developer/geliştirici bilgisi korunuyor.

-- games tablosundaki publisher kolonunu kaldır
IF COL_LENGTH('games', 'publisher') IS NOT NULL
BEGIN
    ALTER TABLE games DROP COLUMN publisher;
END;

-- Ayrı publishers tablosunu (standalone Publisher modülü) kaldır
IF OBJECT_ID('publishers', 'U') IS NOT NULL
BEGIN
    DROP TABLE publishers;
END;
