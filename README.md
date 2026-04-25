# TAĞ-vdW Metastabil Modeli Görselleştirici

İnteraktif React uygulaması — klasik van der Waals denklemine metastabil faz ömrü
τ(P,T) ekleyerek faz geçişlerini matematiksel ve görsel olarak inceler.

## Kurulum ve Çalıştırma

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat (http://localhost:5173)
npm run dev

# Üretim build'i
npm run build

# Build'i önizle
npm run preview
```

Node.js 18+ gerekir.

## Proje Yapısı

```
src/
├── main.jsx                 ← React giriş noktası
├── App.jsx                  ← Ana uygulama (sekmeler, layout)
├── index.css                ← Tailwind + özel stiller
│
├── physics/                 ← SAF MATEMATİK (React yok, test edilebilir)
│   ├── constants.js         ← R = 0.08206
│   ├── vdw.js               ← Klasik vdW + ters çevirim + kritik nokta
│   ├── metastable.js        ← Δpₘ (Gauss) + Λ(τ) + TAĞ-vdW denklemi
│   ├── density.js           ← ρ ↔ Vₘ dönüşümü
│   ├── spinodal.js          ← Spinodal nokta tespiti + sapma ölçümü
│   └── thermogram.js        ← T-t termogram modeli (5 aşamalı)
│
├── data/
│   ├── gases.js             ← 28 gaz için a, b, Tcr, Pcr, M, Tdonma
│   └── axisPresets.js       ← 3D eksen seçenekleri + hazır görünümler
│
├── hooks/
│   ├── useParams.js         ← Parametre state ve preset yönetimi
│   └── useAnimation.js      ← rAF tabanlı animasyon döngüsü
│
├── utils/
│   └── format.js            ← linspace, formatTick, clamp
│
└── components/
    ├── ui/                  ← Genel parçalar
    │   ├── Slider.jsx       ← Etiket + değer + aralık sürgüsü
    │   ├── Toggle.jsx       ← Segmented buton grubu
    │   ├── Tab.jsx          ← Üst sekme düğmesi
    │   ├── Pill.jsx         ← Küçük renkli etiket
    │   └── ChartFrame.jsx   ← Grafik için başlık/altyazı sarmalayıcı
    │
    ├── controls/            ← Sol panel + üst bar
    │   ├── GasSelector.jsx  ← Gaz dropdown + özel mod
    │   ├── ModelToggle.jsx  ← Klasik / Karşılaştır / TAĞ + Vₘ/ρ
    │   └── ParameterPanel.jsx  ← Tüm sliderlar
    │
    └── views/               ← 5 sekme
        ├── IsothermsView.jsx      ← p vs Vₘ/ρ + Δp alt paneli
        ├── IsobarsView.jsx        ← T vs Vₘ/ρ + ΔT alt paneli
        ├── Surface3DView.jsx      ← Three.js 3D yüzey, eksen seçici
        ├── JumpAnimationView.jsx  ← τ→0 yatay sıçrama animasyonu
        └── ThermogramView.jsx     ← T-t termogram (Şekil 3'ün eşi)
```

## Temel Matematiksel Model

```
p(Vₘ, T) = RT/(Vₘ − b) − a/Vₘ²  +  Δpₘ(Vₘ) · Λ(τ)
```

Burada:
- `RT/(Vₘ − b) − a/Vₘ²` — klasik van der Waals
- `Δpₘ(Vₘ) = A·exp(−(Vₘ−V₀)²/(2σ²))` — metastabil katkı (Gauss)
- `Λ(τ) = exp(−1/τ)` — ağırlık fonksiyonu (τ=0'da Λ=0)

Yoğunluk dönüşümü:
```
ρ = M/Vₘ        (g/L)
ρcr = M/(3b)    (kritik yoğunluk)
```

## Özellikler

**5 farklı görünüm** — her biri teorinin başka bir yüzünü gösterir
**3 model modu** — Klasik vdW / Karşılaştırma / TAĞ-vdW tek tuşla
**2 eksen modu** — Vₘ (L/mol) ↔ ρ (g/L)
**28 hazır gaz** + özel mod
**3D eksen seçici** — X, Y, Z için Vₘ, ρ, T, p, Δp, Λ
**T-t termogramı** — deneysel eğri ile matematiksel modelin köprüsü

## Geliştirme İpuçları

Yeni madde eklemek: `src/data/gases.js` — tek satır.
Yeni fizik terimi: `src/physics/` altında yeni bir dosya.
Yeni görünüm: `src/components/views/` altında yeni bir `.jsx`, `App.jsx`'e sekme ekle.

Her fizik dosyası saf JavaScript'tir — React olmadan test edilebilir ve başka yerde kullanılabilir.
