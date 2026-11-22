# KonuYok 2.0

Mobil öncelikli, statik bir sohbet oyunu. Çark, Tahmin Et ve Birlikte Uyduralım deneyimleri hesap veya sunucu gerektirmez.

## Çalıştırma ve doğrulama

Node.js 20.19+ veya 22.12+ gerekir.

```sh
npm ci
npm run dev
npm test
npm run build
```

Siteyi dosyaya çift tıklayarak değil, HTTP sunucusu üzerinden açın. Vite `base: './'` kullandığından GitHub Pages depo alt yolunda çalışır. `main` dalındaki GitHub Actions iş akışı test ve derlemenin ardından Pages'e yayın yapar.

## Soru seçimi

Çark, seçili yoğunlukta kullanılmamış sorusu olan kategorileri eşit olasılıkla seçer. Kategori içinde `weight` kullanılır. Filtredeki sorular bitince yalnızca o havuzun geçmişi yenilenir. Alternatif varsa son soru hemen tekrarlanmaz. Eski şemada yoğunluğu eksik olan soru 2. seviyede, ağırlığı eksik olan soru 1 ağırlığında kabul edilir.

Kişisel'de 280, Kişisel sekmesine art arda yedi kez basarak açılan Gizli Kişisel'de 100 soru var. Kişisel 1–3, Gizli Kişisel 2–3 aralığında açılır. 5. seviye Cesur sorular için 5. seviyeyi veya tüm seviyeleri seç. Bazı sorularda isteğe bağlı devam soruları sırayla açılır. Bir sonraki ana soruya dilediğin anda geçebilirsin.

Yeni bankaların geçmişi `konuyok-kisisel-v2` ve `konuyok-gizli-kisisel-v2` anahtarlarında saklanır. Eğlence geçmişi `konuyok-eglence` anahtarını kullanmaya devam eder. Tahmin ve hikâye yanıtları saklanmaz.

Soru JSON'u her derlemede farklı bir URL sürümüyle ve tarayıcı önbelleği kullanılmadan istenir.
