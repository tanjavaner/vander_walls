# Görselleştirme Rehberi

Bu doküman sekmelerin hangi veriyi çizdiğini ve grafiklerde hangi değerlerin
gösterileceğini açıklar. Formüllerin ayrıntısı `MODEL_NOTES.md` içindedir.

## Ortak Modlar

Model modu:

- `classic`: yalnızca klasik vdW.
- `compare`: klasik vdW ve TA-vdW birlikte.
- `tag`: TA-vdW tek eğri olarak.

Eksen modu:

- `Vm`: molar hacim, L/mol.
- `rho`: yoğunluk, g/L. Tüm dönüşümler `src/physics/density.js` ile yapılır.

## İzotermler

Dosya: `src/components/views/IsothermsView.jsx`.

Çizilen ana değerler:

- `pClassic = vdw(Vm, T, a, b)`
- `pTag = pClassic + deltaPm(Vm) * lambda(tau)`
- `pCritical = vdw(Vm, Tcr, a, b)`
- `pSub = vdw(Vm, 0.85 Tcr, a, b)`
- `pSup = vdw(Vm, 1.15 Tcr, a, b)`
- `delta = pTag - pClassic`

Spinodal aralığı `findSpinodal` çıktısıyla gösterilir. `rho` ekseninde aralık
ters yönde olacağı için `Vgas` ve `Vliq` dönüşümlerinin sırası özellikle
korunmalıdır.

## İzobarlar

Dosya: `src/components/views/IsobarsView.jsx`.

Çizilen ana değerler:

- `Tclassic = tAtP(Vm, P, a, b)`
- `Ttag = tAtP(Vm, P - meta(Vm), a, b)`
- `Tcritical = tAtP(Vm, Pcr, a, b)`
- `Tlow = tAtP(Vm, 0.5 Pcr, a, b)`
- `Thigh = tAtP(Vm, 1.5 Pcr, a, b)`
- `deltaT = Ttag - Tclassic`

TA-vdW izobarında sabit tutulan büyüklük toplam basınçtır. Bu yüzden metastabil
basınç katkısı, ters vdW sıcaklığına verilmeden önce `P` değerinden çıkarılır.

## 3B Yüzey

Dosya: `src/components/views/Surface3DView.jsx`.

3B yüzey `axisPresets.js` içindeki `computeVar` ile üretilir. Hazır eksenler:

- `Vm`
- `rho`
- `T`
- `p`
- `dp`
- `lambda`

Klasik kritik nokta yalnızca klasik yüzeyde işaretlenmelidir. TA-vdW modunda
klasik `Pcr,Tcr,Vc` noktası düzeltilmiş yüzeyin kritik noktası gibi
sunulmamalıdır.

## Sıçrama

Dosya: `src/components/views/JumpAnimationView.jsx`.

Sıçrama görünümü şu yolu izler:

- seçili `T` için spinodal kökleri bulunur,
- sıvı spinodal basıncı `pMin` alınır,
- gaz kolunda `p_vdw(Vm,T)=pMin` kökü çözülür,
- yatay sıçrama çizgisi bu basınçta çizilir.

`T >= Tcr` veya kök bulunamayan durumda görünüm tek faz olarak davranır ve
sıçrama animasyonu devre dışı kalır.

## T-t Termogram

Dosya: `src/components/views/ThermogramView.jsx`.

Termogram doğrudan `generateThermogram` çıktısını çizer. Anahtar noktalar:

- `a`: başlangıç sıcaklığı.
- `b`: normal donma sıcaklığına ulaşma.
- `c`: aşırı soğuma minimumu.
- `d`: sıçrama sonrası donma sıcaklığı.
- `e`: izotermik donmanın sonu.
- `f`: katı faz soğumasının sonu.

`cd` sıçrama eğrisi normalize edildiği için teorik uç noktalarla tutarlı
olmalıdır.

## Dışa Aktarma

2B grafiklerde PNG, SVG ve CSV dışa aktarımı desteklenir. 3B görünümde PNG ve
CSV desteklenir. CSV kolonları grafikte kullanılan hesaplanmış değerlerle aynı
olmalıdır; sadece ekranda görünen eğriler değil, karşılaştırma için gereken
temel değerler de korunmalıdır.
