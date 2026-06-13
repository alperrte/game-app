## MainLayout Nedir?

MainLayout, React uygulamasında giriş yaptıktan sonra kullanılan ana sayfa iskeletidir. 
Login ve register gibi sayfalar dışında kalan ana uygulama ekranlarında ortak olarak görünen alanları yönetir.

MainLayout içinde genellikle şu yapılar bulunur:

* Navbar
* Sidebar
* Ana içerik alanı
* Sayfa arka planı
* Genel responsive düzen

MainLayout’un amacı, her sayfada tekrar tekrar Navbar veya Sidebar yazmayı engellemektir. 
Örneğin oyunlar sayfası, profil sayfası, mesajlar sayfası ve bildirimler sayfası aynı ana layout içinde gösterilir.

React Router kullanıldığında MainLayout içinde `<Outlet />` kullanılır. `<Outlet />`, 
o an hangi sayfa açıldıysa o sayfanın layout içindeki ana içerik alanına yerleşmesini sağlar.

Örnek akış:

`/app/games` adresine gidilirse MainLayout içindeki `<Outlet />` yerine GamesPage gelir.

`/app/profile/:userId` adresine gidilirse MainLayout içindeki `<Outlet />` yerine ProfilePage gelir.

Login ve register sayfaları MainLayout içine alınmaz. Çünkü bu sayfalarda genellikle Navbar ve Sidebar bulunmaz.

Özetle MainLayout, uygulamanın ortak kabuğudur. Sayfaların ortak tasarımını taşır, değişen sayfa içeriği ise `<Outlet />` ile gösterilir.

## providers.tsx

`providers.tsx`, React uygulamasında bütün uygulamayı saran genel sağlayıcıların toplandığı dosyadır. 
Uygulama genelinde kullanılacak sistemlerin tek noktadan yönetilmesini sağlar.

Bu dosya başlangıçta zorunlu değildir ancak proje büyüdükçe önemli hale gelir. 
Tema yönetimi, kullanıcı giriş durumu, API istek yönetimi, bildirim sistemi veya genel context yapıları bu dosya üzerinden 
uygulamaya bağlanabilir.

`providers.tsx` kullanılmasının temel amacı, `App.tsx` dosyasını sade tutmaktır. 
Böylece uygulama büyüdüğünde tüm global ayarlar tek bir dosyada toplanır ve proje daha düzenli olur.

Özetle `providers.tsx`, uygulamanın genel sağlayıcılarını yöneten merkezi yapı dosyasıdır.

## router.tsx

`router.tsx`, React uygulamasında sayfa yönlendirmelerinin tanımlandığı dosyadır. 
Kullanıcı hangi URL adresine giderse hangi sayfanın ekranda gösterileceği bu dosyada belirlenir.

Bu dosya, uygulamanın yol haritası gibi çalışır. 
Örneğin giriş sayfası, kayıt sayfası, oyun listesi sayfası, oyun detay sayfası ve profil sayfası gibi ekranların hangi 
adreslerde açılacağı `router.tsx` içinde tanımlanır.

`router.tsx` içinde public ve private sayfalar ayrılabilir. 
Login ve register gibi sayfalar genellikle public sayfalardır. 
Giriş yaptıktan sonra görülen oyunlar, profil, mesajlar ve bildirimler gibi sayfalar ise ana uygulama düzeni içinde gösterilir.

Giriş sonrası sayfalar çoğunlukla `MainLayout` içinde açılır. 
Böylece Navbar, Sidebar ve ana içerik alanı gibi ortak yapılar her sayfada tekrar yazılmaz.

Özetle `router.tsx`, uygulamadaki URL ve sayfa eşleşmelerini yöneten merkezi yönlendirme dosyasıdır.

## hooks klasörü kararı

Projede genel bir `src/hooks` klasörü kullanılacaktır. Ancak başlangıç aşamasında her feature içinde ayrı `hooks` klasörü açılmayacaktır.

Bunun nedeni, projenin ilk aşamasında feature bazlı hook ayrımının gereksiz klasör kalabalığı oluşturmasıdır. Genel olarak birden fazla sayfada kullanılabilecek hooklar `src/hooks` klasörü altında tutulacaktır.

Örneğin localStorage yönetimi, debounce işlemi ve tema yönetimi gibi genel hooklar bu klasörde yer alabilir.

İleride sadece belirli bir modüle ait özel bir hook ortaya çıkarsa, o zaman ilgili feature klasörü altında ayrı bir hooks yapısı oluşturulabilir. Ancak başlangıç için sade ve merkezi bir hooks klasörü yeterlidir.

Özetle başlangıç kararı: Genel hooklar `src/hooks` içinde tutulacak, feature bazlı hooks klasörleri şimdilik açılmayacaktır.


## axios.ts, token.ts ve constants.ts

`axios.ts`, frontend uygulamasının backend’e istek atarken kullandığı ana API bağlantı dosyasıdır. API base URL, Authorization header, JWT token ekleme ve genel hata yakalama gibi işlemler burada yönetilir. Projede frontend tüm backend isteklerini API Gateway üzerinden göndereceği için `axios.ts` merkezi API çıkış noktası gibi çalışır.

`token.ts`, kullanıcı giriş işlemlerinden sonra alınan tokenların yönetildiği yardımcı dosyadır. Access token ve refresh token kaydetme, okuma, silme ve kullanıcının giriş durumunu kontrol etme gibi işlemler bu dosyada toplanır. Böylece token işlemleri farklı sayfalarda tekrar tekrar yazılmaz.

`constants.ts`, uygulama genelinde değişmeyen sabit değerlerin tutulduğu dosyadır. Uygulama adı, kısa ad, route adresleri, rol isimleri, localStorage key değerleri ve varsayılan ayarlar bu dosyada yer alabilir. Sabit değerleri tek yerde tutmak yazım hatalarını azaltır ve projenin yönetimini kolaylaştırır.

Özetle `axios.ts` API bağlantısını, `token.ts` token yönetimini, `constants.ts` ise uygulama sabitlerini merkezi olarak yönetir.


## store

`store`, frontend uygulamasında uygulama genelinde paylaşılması gereken verilerin merkezi olarak tutulduğu yapıdır.

Bir bilgi sadece tek bir component veya sayfa tarafından kullanılmıyorsa, birden fazla yerde ihtiyaç duyuluyorsa store içinde tutulabilir. Örneğin giriş yapan kullanıcı bilgisi, kullanıcının rolü, tema durumu, okunmamış bildirim sayısı veya oturum bilgisi store içinde yönetilebilir.

Store kullanmanın amacı, aynı veriyi farklı sayfalarda tekrar tekrar yönetmek yerine merkezi bir yerden kontrol etmektir. Böylece Navbar, profil sayfası, router kontrolü veya bildirim alanı aynı kullanıcı durumuna erişebilir.

Store ile localStorage aynı şey değildir. Store, uygulama çalışırken React içinde tutulan canlı durumdur. LocalStorage ise tarayıcıda kalıcı olarak saklanan veridir. Sayfa yenilendiğinde store sıfırlanabilir, ancak localStorage içindeki veriler kalır.

Başlangıçta store içinde en önemli yapı authStore olacaktır. AuthStore, kullanıcının giriş yapıp yapmadığını, kullanıcı bilgisini ve çıkış işlemlerini yönetmek için kullanılabilir.

Özetle store, uygulama genelinde ortak kullanılan verileri merkezi şekilde yönetmek için kullanılan yapıdır.


## index.css

`index.css`, React projesinde global tasarım kurallarının bulunduğu ana CSS dosyasıdır. Uygulamanın genel görünümünü etkileyen temel stiller burada tanımlanır.

Bu dosyada genellikle Tailwind importları, body arka planı, varsayılan yazı tipi, genel yazı rengi, scrollbar tasarımı, seçim rengi ve temel reset ayarları yer alır.

Ancak `index.css` tüm component tasarımlarının yazıldığı dosya değildir. Button, Card, Navbar, Sidebar veya GameCard gibi özel componentlerin tasarımları kendi component dosyalarında Tailwind classlarıyla yönetilmelidir.

Tasarım sistemine ait renk paleti, font ayarları, gölge değerleri ve ekran kırılımları gibi genel tema değerleri ise `tailwind.config.js` içinde tutulabilir.

Özetle `index.css`, projenin genel tasarım zeminini belirler. Componentlere özel tasarımlar ise ilgili component dosyalarında veya ortak UI componentlerinde yönetilir.


## utils

`utils`, projede tekrar kullanılabilir küçük yardımcı fonksiyonların tutulduğu klasördür. Bu fonksiyonlar belirli bir sayfaya veya feature’a özel olmak zorunda değildir. Uygulamanın farklı yerlerinde kullanılabilecek genel işlemleri merkezi hale getirir.

Utils klasöründe genellikle tarih formatlama, sayı formatlama, metin kısaltma, dosya boyutu düzenleme, className birleştirme veya kullanıcı adından baş harf üretme gibi küçük yardımcı işlemler bulunur.

`utils` ile `hooks` aynı şey değildir. Hooklar React component davranışları ve state yönetimiyle ilgilenirken, utils dosyaları daha çok düz yardımcı fonksiyonlardan oluşur. Örneğin tema yönetimi veya localStorage davranışı hook olarak düşünülebilirken, tarih formatlama veya metin kısaltma utils olarak düşünülebilir.

Utils kullanmanın amacı, aynı küçük işlemleri farklı dosyalarda tekrar tekrar yazmayı önlemektir. Böylece kod daha düzenli, okunabilir ve yönetilebilir hale gelir.

Özetle `utils`, uygulama genelinde kullanılan küçük yardımcı fonksiyonların toplandığı klasördür.



