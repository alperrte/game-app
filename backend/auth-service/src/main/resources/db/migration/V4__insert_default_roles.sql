INSERT INTO roles (name)
VALUES
    ('USER'),
    ('ADMIN'),
    ('MODERATOR'),
    ('DEVELOPER'),
    ('CONTENT_CREATOR');
-- =========================================================
--
-- USER:
-- Platformun standart oyuncu kullanıcısıdır.
-- Kayıt olabilir, giriş yapabilir, profil oluşturabilir,
-- oyunları favorilerine ekleyebilir, yorum/puan verebilir,
-- arkadaş ekleyebilir, mesajlaşabilir ve sosyal özellikleri kullanabilir.
--
-- ADMIN:
-- Platformun yönetici rolüdür.
-- Kullanıcıları, oyunları, yorumları, gönderileri, raporlanan içerikleri,
-- sistem ayarlarını ve admin panelindeki yönetim işlemlerini kontrol eder.
--
-- MODERATOR:
-- Topluluk ve içerik denetiminden sorumlu roldür.
-- Raporlanan yorumları, gönderileri ve kullanıcı davranışlarını inceler.
-- Uygunsuz içerikleri gizleyebilir, silebilir veya işlem sürecine alabilir.
--
-- DEVELOPER:
-- Oyun geliştiricisi hesabıdır.
-- Kendi oyunlarını platformda tanıtabilir, oyun açıklaması, görsel,
-- video, demo bağlantısı ve güncelleme notları ekleyebilir.
-- Oyunculardan geri bildirim ve hata raporu alabilir.
--
-- CONTENT_CREATOR:
-- İçerik üreticisi / rehber yazarı rolüdür.
-- Oyun rehberleri, inceleme yazıları, oyun öneri listeleri,
-- video bağlantıları veya topluluk içerikleri paylaşabilir.
--
-- Not:
-- PREMIUM_USER rol olarak tutulmaz; ileride abonelik/paket tablosu ile yönetilmelidir.
-- BANNED_USER rol olarak tutulmaz; account_status alanı ile yönetilmelidir.
-- GUEST rol olarak tutulmaz; giriş yapmamış kullanıcıyı ifade eder.
-- =========================================================