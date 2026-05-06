# Dokümantasyon İndeksi

Dokümantasyonu konuya göre ayırıyoruz. Bir değişiklik yaparken önce ilgili
kategoriyi açın; formül veya veri değişiyorsa doğrulama dosyasını da kullanın.

## Kategoriler

- **Başlangıç:** `../README.md`
  Kurulum, çalıştırma komutları ve kısa proje özeti.

- **Mimari:** `ARCHITECTURE.md`
  Dosya yapısı, veri akışı, hangi değişiklik için hangi dosyanın düzenleneceği.

- **Bilimsel model:** `MODEL_NOTES.md`
  vdW, TA-vdW, yoğunluk dönüşümü, spinodal, sıçrama ve termogram formülleri.

- **Veri yönetimi:** `DATA_GUIDE.md`
  Gaz preset alanları, birimler, `Tcr/Pcr` politikası, yeni madde ekleme kuralı.

- **Görselleştirme:** `VISUALIZATION_GUIDE.md`
  Her sekmenin ne çizdiği, model/eksen modları, grafiklerde hangi değerlerin gösterildiği.

- **Doğrulama:** `VALIDATION.md`
  Build, sayısal invariant kontrolleri ve teslim öncesi manuel kontrol listesi.

## Ne Zaman Hangi Dosya?

- Formül değiştiyse: `MODEL_NOTES.md`, `src/physics/`, `VALIDATION.md`.
- Yeni gaz eklendiyse: `DATA_GUIDE.md`, `src/data/gases.js`, `VALIDATION.md`.
- Yeni grafik veya sekme eklendiyse: `ARCHITECTURE.md`, `VISUALIZATION_GUIDE.md`.
- Sadece UI metni/stili değiştiyse: çoğu zaman `VISUALIZATION_GUIDE.md` yeterlidir.
