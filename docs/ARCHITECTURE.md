# Mimari ve Dosya Yönlendirme

Bu doküman, kodda değişiklik yaparken hangi dosyaya gidileceğini gösterir.
Bilimsel formüller için `MODEL_NOTES.md`, veri/preset kuralları için
`DATA_GUIDE.md`, teslim öncesi kontroller için `VALIDATION.md` kullanılmalıdır.

## Çalışma Yığını

- Vite uygulamayı geliştirir ve paketler.
- React state, layout, kontroller ve sekme seçimini yönetir.
- Tailwind ana stil sistemi olarak kullanılır.
- Recharts 2B grafikleri çizer.
- Three.js 3B yüzey görünümünü üretir.
- `lucide-react` arayüz ikonlarını sağlar.

## Kaynak Ağacı

```text
src/
  main.jsx                    React giriş noktası
  App.jsx                     Uygulama iskeleti, sekmeler, model/eksen modu
  index.css                   Tailwind ve global stiller

  physics/                    Saf model ve matematik fonksiyonları
    constants.js              R sabiti
    vdw.js                    Klasik vdW, ters T(P,Vm), kritik değerler
    metastable.js             deltaPm, lambda, TA-vdW basıncı
    density.js                Vm-rho dönüşümleri
    spinodal.js               Spinodal kökleri ve sapma hesabı
    thermogram.js             T-t termogram üretimi

  data/
    gases.js                  Gaz presetleri ve türetilmiş sınırlar
    axisPresets.js            3B eksen değişkenleri ve hazır görünümler

  hooks/
    useParams.js              Parametre state'i ve preset seçimi
    useChartZoom.js           2B grafik yakınlaştırma
    useAnimation.js           Genel requestAnimationFrame döngüsü

  components/
    controls/                 Sol panel ve model/gaz seçim kontrolleri
    ui/                       Tekrar kullanılabilir arayüz parçaları
    views/                    Beş ana görselleştirme sekmesi

  utils/
    format.js                 linspace, formatTick, clamp
    exportChart.js            PNG, SVG, CSV dışa aktarma
```

## Veri Akışı

`src/main.jsx`, `App` bileşenini bağlar. `src/App.jsx` şu üst seviye state'i
tutar:

- `tab`: `iso`, `isobar`, `3d`, `jump`, `thermo`
- `modelMode`: `classic`, `compare`, `tag`
- `axisMode`: `Vm`, `rho`

Alan parametreleri `src/hooks/useParams.js` içinden gelir. Bu hook:

- presetleri `src/data/gases.js` dosyasından yükler,
- seçili sıcaklık `T` ve basınç `P` değerlerini tutar,
- `a` veya `b` değiştiğinde `Tcr` ve `Pcr` değerlerini vdW formülleriyle yeniden hesaplar,
- özel madde moduna geçişi yönetir.

## Değişiklik Rotaları

- Yeni gaz eklemek veya preset düzeltmek: `src/data/gases.js`.
- Yeni parametre kontrolü eklemek: `src/components/controls/ParameterPanel.jsx` ve gerekirse `src/hooks/useParams.js`.
- Formül veya sayısal hesap değiştirmek: yalnızca `src/physics/` içinde başlat.
- 2B grafik davranışı değiştirmek: ilgili `src/components/views/*View.jsx`.
- 3B eksen seçeneği eklemek: `src/data/axisPresets.js`.
- Ortak UI parçası eklemek: önce `src/components/ui/`.

## Görünüm Sorumlulukları

- `IsothermsView.jsx`: sabit sıcaklıkta `p-Vm` veya `p-rho`.
- `IsobarsView.jsx`: sabit basınçta `T-Vm` veya `T-rho`.
- `Surface3DView.jsx`: seçilebilir eksenli 3B model yüzeyi.
- `JumpAnimationView.jsx`: spinodal ve aynı basınçta gaz koluna sıçrama.
- `ThermogramView.jsx`: zaman-sıcaklık termogram modeli.

## Sınırlar

- `src/physics/` React, DOM veya grafik kütüphanesi import etmemelidir.
- Formül tekrarları view bileşenlerine kopyalanmamalıdır.
- Yoğunluk dönüşümü gereken her yerde `src/physics/density.js` kullanılmalıdır.
- Grafik bileşenleri render verisini hazırlayabilir; model denkleminin sahibi olmamalıdır.
