# KonuYok

İki kişi veya küçük gruplar için mobil öncelikli, statik sohbet çarkı. Eğlence, Kişisel ve yedi Kişisel dokunuşuyla açılan Gizli Kişisel havuzları bulunur. Soruyu yanıtlamadan başka soruya geçilebilir.

## Yerelde çalıştırma

Node.js 20.19+ veya 22.12+ gerekir.

```sh
npm ci
npm run dev
npm test
npm run build
```

Uygulamayı HTTP üzerinden açın. Vite `base: './'` sayesinde GitHub Pages depo alt yolunda çalışır. `main` dalındaki Actions iş akışı test ve derlemenin ardından Pages dağıtımı yapar.

## Soru seçimi ve geçmiş

Çark, kullanılmamış sorusu olan kategorileri eşit olasılıkla seçer; her dilimdeki sorular `weight` ile seçilir. Bir kategori tükendiğinde sonraki seçimden önce çark yalnızca kullanılabilir kategorileri gösterir. Havuz bittiğinde yalnızca o havuzun geçmişi sıfırlanır. Eski `konuyok-<mod>` kayıtları ve soru kimlikleri korunur. Gizli havuzdan Kişisel havuzuna taşınan soruların geçmişi bir kez aktarılır. Sorular ve cevaplar sunucuya gönderilmez; özel cevaplar kaydedilmez. Depolama kullanılamıyorsa geçmiş açık sekmede tutulur.

Soru JSON'u her derlemede farklı bir URL sürümüyle ve tarayıcı önbelleği kullanılmadan istenir. İçerik kararları için `CONTENT_REVIEW.md` dosyasına bakın.
