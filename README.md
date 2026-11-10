# KonuYok

Mobil öncelikli sohbet konusu çarkı. Sorular `public/questions.json` dosyasından yüklenir; kullanılan sorular cihazda modlara ayrı kaydedilir.

## Yerelde çalıştırma

Node.js 20.19+ veya 22.12+ gerekir.

```sh
npm install
npm run dev
```

Terminalde gösterilen adresi açın. Kontrol ve üretim derlemesi için `npm test` ve `npm run build` çalıştırın. Siteyi dosyaya çift tıklayarak değil, HTTP sunucusu üzerinden açın.

## GitHub Pages

1. Bu klasörün içeriğini `package-lock.json` dahil bir GitHub deposunun `main` dalına gönderin.
2. Depoda **Settings → Pages → Build and deployment → Source** seçeneğini **GitHub Actions** olarak ayarlayın.
3. `main` dalına her gönderimde `.github/workflows/deploy.yml` test ve derlemeyi çalıştırır, ardından Pages üzerinde yayınlar. İlk çalışmayı **Actions** sekmesinden izleyin; adres Pages ayarlarında görünür.

Vite `base: './'` kullandığından proje depo alt yolunda da çalışır.

Soru JSON'u her derlemede farklı bir URL sürümüyle (`?v=...`) ve tarayıcı önbelleği kullanılmadan istenir. Bu, dağıtım sonrası eski soru dosyasının yeni arayüzle karışmasını önler.
