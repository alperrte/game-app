# 🎮 LTZ Proje Test & Güvenlik Planı

---
## 📋 İçindekiler
1. [Swagger/Postman API Testleri](#1-swaggerpostman-api-testleri)
2. [Docker & Container Sağlığı Testleri](#2-docker--container-sağlığı-testleri)
3. [Güvenlik & Veri Sızıntısı Kontrolleri](#3-güvenlik--veri-sızıntısı-kontrolleri)
4. [Performans & Bellek İzleme](#4-performans--bellek-izleme)
5. [Özet & Sonuçlar](#5-özet--sonuçlar)

---
## 1. Swagger/Postman API Testleri
### 📌 Servislerin Swagger Adresleri (API Gateway üzerinden)
*   **Auth Service**: `http://localhost:7070/swagger-ui/index.html` (veya doğrudan `http://localhost:8081/swagger-ui.html`)
*   **User Service**: `http://localhost:7070/swagger-ui/index.html` (veya doğrudan `http://localhost:8084/swagger-ui.html`)
*   **Game Service**: `http://localhost:7070/swagger-ui/index.html` (veya doğrudan `http://localhost:8082/swagger-ui.html`)
*   **Social Service**: `http://localhost:7070/swagger-ui/index.html` (veya doğrudan `http://localhost:8083/swagger-ui.html`)

### 📝 Test Edilecek Temel Senaryolar
#### 1.1 Auth Service (Kimlik Doğrulama)
- [ ] Yeni kullanıcı kaydı (`POST /api/auth/register`)
- [ ] Giriş yapma ve JWT token alma (`POST /api/auth/login`)
- [ ] Token yenileme (`POST /api/auth/refresh-token`)
- [ ] Token geçerliliğini doğrulama (`POST /api/auth/validate-token`)
- [ ] Çıkış yapma (`POST /api/auth/logout`)
- [ ] Geçersiz kimlik bilgileriyle giriş (hata kontrolü)

#### 1.2 User Service (Kullanıcı Profili)
- [ ] Kendi profilini oluşturma/görme (`GET /api/users/me`)
- [ ] Profil bilgilerini güncelleme (`PUT /api/users/profile`)
- [ ] Profil avatar/kapak fotoğrafı yükleme (`POST /api/users/profile/upload`)
- [ ] Kullanıcı adına göre profil arama (`GET /api/users/profile/username/{username}`)
- [ ] Bağlı hesapları yönetme (Steam/Discord)
- [ ] Gizlilik ayarlarını değiştirme
- [ ] Aktivite loglarını görme

#### 1.3 Social Service (Sosyal İşlemler)
- [ ] Takip etme/takibi bırakma (`POST /api/social/follows`, `DELETE /api/social/follows`)
- [ ] Takipçi/takip edilen listesini görme (`GET /api/social/users/{userId}/followers`, `GET /api/social/users/{userId}/following`)
- [ ] Arkadaşlık isteği gönderme (`POST /api/social/friend-requests`)
- [ ] Arkadaşlık isteğini kabul etme/reddetme (`PUT /api/social/friend-requests/{id}/accept`, `PUT /api/social/friend-requests/{id}/reject`)
- [ ] Arkadaş listesini görme (`GET /api/social/users/{userId}/friends`)
- [ ] Post oluşturma/görme/silme (`POST /api/social/posts`, `GET /api/social/users/{userId}/posts`, `DELETE /api/social/posts/{id}`)
- [ ] Posta yorum yapma/beğenme

#### 1.4 Game Service (Oyunlar)
- [ ] Tüm oyunları listeleme (`GET /api/games`)
- [ ] Oyun detayını görme (`GET /api/games/{id}`)
- [ ] Oyun filtreleme (`GET /api/games/filter`)
- [ ] Popüler oyunları görme (`GET /api/games/popular`)
- [ ] Oyun oluşturma/güncelleme/silme (yetkili kullanıcı)

---
## 2. Docker & Container Sağlığı Testleri
### 📝 Komutlar
```powershell
# Docker Compose ile tüm servisleri başlat
cd C:\Users\gsker\Desktop\lobby-two-zero
docker-compose up -d --build

# Container durumlarını kontrol et
docker-compose ps

# Container loglarını izle (tüm servisler)
docker-compose logs -f

# Container loglarını izle (tek servis, örn: user-service)
docker-compose logs -f user-service

# Tüm containerları durdur ve sil
docker-compose down -v
```

### ✅ Container Sağlığı Kontrolleri
- [ ] Tüm containerlar `Up` durumda mı? (`docker-compose ps`)
- [ ] MSSQL containerı `healthy` durumda mı?
- [ ] Hiçbir container crash oluyor mu? (log kontrolü)
- [ ] API Gateway tüm servisleri route ediyor mu?
- [ ] Servisler arası iletişim sağlıklı mı?

---
## 3. Güvenlik & Veri Sızıntısı Kontrolleri
### 3.1 Authentication & Authorization
- [ ] JWT Token olmadan korunan endpointlere erişim denemesi (401/403 almalısınız)
- [ ] Başka bir kullanıcının profilini güncellemeye çalışma (yetkisiz erişim reddedilmeli)
- [ ] Token süresi dolduktan sonra istek atma (401 almalısınız)
- [ ] Token manipülasyonu denemesi (geçersiz imzalı token)

### 3.2 Veri Sızıntısı (Data Leak)
- [ ] Loglarda hassas veriler (şifre, token) görünüyor mu?
- [ ] Profil gizlilik ayarları doğru çalışıyor mu? (PRIVATE profil diğer kullanıcılar tarafından görünmemeli)
- [ ] Donanım bilgileri gizlilik ayarlarına göre gösteriliyor mu?

### 3.3 Input Validation
- [ ] SQL Injection denemeleri (inputlara zararlı SQL sorguları gönderme)
- [ ] XSS (Cross-Site Scripting) denemeleri (inputlara HTML/JS kodu gönderme)
- [ ] Çok büyük dosya yükleme denemesi (sınır denetimi)
- [ ] Uzun metin alanları sınırlandırılmış mı? (veri patlaması önleme)

---
## 4. Performans & Bellek İzleme
### 📝 Kullanılacak Araçlar/Komutlar
```powershell
# Container kaynak kullanımını izle
docker stats

# Spring Boot Actuator (eğer aktifse) ile health check
# Genellikle: http://localhost:8084/actuator/health (user-service için)

# Frontend için: tarayıcı geliştirici konsolu (Performance sekmesi)
```

### ✅ Kontroller
- [ ] Uzun süreli çalışmada memory leak var mı? (container ram kullanımı artarak gidiyor mu?)
- [ ] Yüksek istek sayısında performans düşüyor mu?
- [ ] Veritabanı bağlantı havuzu doğru yapılandırılmış mı?
- [ ] Frontend ilk yükleme hızı uygun mu?

---
## 5. Özet & Sonuçlar
Testleri tamamladıktan sonra buraya sonuçları ekleyin!
