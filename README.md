# TA-vdW Metastabil Modeli Gorsellestirici

Bu proje, klasik van der Waals denklemini metastabil faz omru `tau` ile
genisleten interaktif bir Vite React uygulamasidir. Amac; izoterm,
izobar, 3B yuzey, spinodal/sicrama ve T-t termogram davranislarini ayni
parametre setiyle tutarli bicimde gorsellestirmektir.

## Hızlı Başlangıç

```bash
npm install
npm run dev
npm run build
npm run preview
```

Node.js 18 veya daha yenisi gerekir. Geliştirme sunucusu varsayılan olarak
`http://localhost:5173` adresinde çalışır.

## Dokümantasyon Haritası

Dokümanları şu kategori düzeninde tutuyoruz:

- **Başlangıç ve kullanım:** bu dosya.
- **Mimari ve dosya yönlendirme:** `docs/ARCHITECTURE.md`.
- **Bilimsel model ve formüller:** `docs/MODEL_NOTES.md`.
- **Gaz verisi ve parametre politikası:** `docs/DATA_GUIDE.md`.
- **Grafik ve sekme davranışları:** `docs/VISUALIZATION_GUIDE.md`.
- **Doğrulama ve teslim kontrolü:** `docs/VALIDATION.md`.

Kısa indeks için `docs/README.md` dosyasına bakın.

## Temel Model

```text
p(Vm, T) = R T / (Vm - b) - a / Vm^2 + deltaPm(Vm) * lambda(tau)
deltaPm(Vm) = A * exp(-(Vm - V0)^2 / (2 sigma^2))
lambda(tau) = exp(-1 / tau)
```

Tüm formüller ve birimler `docs/MODEL_NOTES.md` içinde tutulur. Formül veya
grafik davranışı değişirse `npm run build` ve `docs/VALIDATION.md` kontrol
listesi çalıştırılmadan teslim yapılmamalıdır.
