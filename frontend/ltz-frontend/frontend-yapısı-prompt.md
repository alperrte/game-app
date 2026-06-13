LobbyTwoZero / LTZ adlı oyun odaklı sosyal platformun frontend tarafını geliştiriyoruz.

Frontend teknolojileri:

* React
* TypeScript
* Vite
* Tailwind CSS

Backend mikroservis mimarisiyle geliştiriliyor. Frontend hiçbir mikroservise doğrudan istek atmamalı. Tüm API istekleri API Gateway üzerinden gitmelidir. API Gateway base URL değeri environment değişkeninden alınmalıdır.

Frontend mimarisi feature-based architecture olmalıdır. Kodlar modül bazlı ayrılmalıdır. Her şeyi tek bir pages, components veya services klasörüne doldurma.

Kullanılacak ana klasör yapısı:

* src/app
* src/components
* src/features
* src/hooks
* src/lib
* src/store
* src/types
* src/utils
* src/assets

src/app içinde uygulamanın ana yapısı bulunmalıdır:

* router.tsx: Sayfa yönlendirmeleri
* providers.tsx: Uygulama genel sağlayıcıları
* MainLayout.tsx: Login/register dışındaki ana uygulama ekranlarının ortak layout yapısı

src/components içinde tüm projede ortak kullanılabilecek componentler bulunmalıdır:

* ui: Button, Input, Card, Modal gibi genel UI parçaları
* layout: Navbar, Sidebar gibi layout parçaları
* common: Loading, ErrorMessage, EmptyState gibi ortak durum componentleri

src/features içinde her modül kendi içinde ayrılmalıdır:

Her feature mümkünse şu yapıya sahip olmalıdır:

* pages
* components
* services
* types

Feature içinde hooks klasörü başlangıçta oluşturulmayacak. Genel hooklar sadece src/hooks altında tutulacak.

src/lib içinde teknik altyapı dosyaları bulunmalıdır:

* axios.ts: Merkezi API istemcisi
* token.ts: Token okuma, yazma ve silme işlemleri
* constants.ts: Uygulama sabitleri, route isimleri ve localStorage key değerleri

src/store içinde uygulama genelinde paylaşılacak state yapıları bulunmalıdır. Başlangıçta authStore yeterlidir.

src/utils içinde küçük yardımcı fonksiyonlar bulunmalıdır. Örneğin tarih formatlama, metin kısaltma, className birleştirme gibi işlemler burada tutulmalıdır.

src/index.css global tasarım kuralları için kullanılmalıdır. Tüm component tasarımları bu dosyaya yazılmamalıdır. Component tasarımları mümkün olduğunca Tailwind classlarıyla ilgili component içinde yönetilmelidir.

Kod yazarken dikkat edilecek kurallar:

* TypeScript tipleri mutlaka kullanılmalı
* any kullanımından mümkün olduğunca kaçınılmalı
* API istekleri component içinde doğrudan yazılmamalı, ilgili feature’ın service dosyasında olmalı
* Componentler mümkün olduğunca küçük ve okunabilir olmalı
* Tekrar eden UI parçaları components/ui altına alınmalı
* Modüle özel componentler ilgili feature/components altında tutulmalı
* Route yapısı router.tsx içinde merkezi olarak yönetilmeli
* Login ve register sayfaları MainLayout dışında olmalı
* Giriş sonrası sayfalar MainLayout içinde açılmalı
* Frontend API base URL olarak yalnızca API Gateway kullanmalı



Bu kurallara bağlı kalarak kod üret. Yeni dosya oluştururken mutlaka bu klasör yapısına uygun konumlandır. Gereksiz klasör açma ve mevcut mimariyi bozma.
