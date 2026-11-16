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

Çark, seçili yoğunlukta kullanılmamış sorusu olan kategorileri eşit olasılıkla seçer; kategori içinde `weight` kullanılır. Bir filtrede sorular bitince yalnızca o filtredeki soru geçmişi sıfırlanır. Mevcut `konuyok-<mod>` localStorage anahtarları ve soru kimlikleri korunur. Sorular eski şemayla da çalışır: eksik yoğunluk 2, eksik ağırlık 1 kabul edilir. İlk yoğunluk sınıflandırması kategoriye göre yapılmıştır ve içerik editörü tarafından soru bazında geliştirilebilir. Tahmin ve hikâye yanıtları saklanmaz.

Soru JSON'u her derlemede farklı bir URL sürümüyle ve tarayıcı önbelleği kullanılmadan istenir.
