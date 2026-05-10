# Veri ve Parametre Rehberi

Bu doküman `src/data/` altındaki statik verinin nasıl tutulacağını açıklar.
Bilimsel formüller için `MODEL_NOTES.md` esas alınmalıdır.

## Dosyalar

- `src/data/gases.js`: gaz presetleri, molar kütleler, donma noktaları ve
  grafik sınırı türetme fonksiyonları.
- `src/data/axisPresets.js`: 3B görünümde seçilebilir eksen değişkenleri ve
  hazır eksen kombinasyonları.

## Gaz Preset Alanları

Her gaz girdisi şu temel alanları içermelidir:

```js
{
  name: 'Benzen C6H6',
  group: 'Hidrokarbonlar',
  a: 18.00,
  b: 0.1154,
  Tcr: 562.0,
  Pcr: 48.30,
  M: 78.114,
  Tfreeze: 278.68
}
```

Alan anlamları:

- `name`: arayüzde görünen madde adı.
- `group`: seçim listesindeki kategori.
- `a`: vdW çekim sabiti, L^2 atm / mol^2.
- `b`: vdW dışlanmış hacim sabiti, L/mol.
- `Tcr`: deneysel kritik sıcaklık referansı, K.
- `Pcr`: deneysel kritik basınç referansı, atm.
- `M`: molar kütle, g/mol.
- `Tfreeze`: 1 atm donma sıcaklığı, K.

## Kritik Değer Politikası

Preset içinde yazılan `Tcr` ve `Pcr`, veri kaynağı referansı olarak kabul edilir.
`expandPreset` çalıştıktan sonra:

- deneysel referanslar `TcrRef` ve `PcrRef` alanlarına taşınır,
- ilk uygulama varsayılanı olarak kullanılan `Tcr` ve `Pcr`, `a,b` değerlerinden
  yeniden hesaplanır.

Kullanıcı arayüzünde `Tcr` ve `Pcr` artık düzenlenebilir referanslardır. `a,b`
değişikliği bu iki değeri otomatik değiştirmez; kullanıcı kritik referansları
ayrı ayrı girebilir. `autoFitBounds` butonu ise bilinçli olarak `a,b` değerlerine
göre yeni sınırlar üretir.

Basınç değerleri veri/model içinde atm tutulur. Arayüzde ve grafiklerde basınç
bar olarak gösterilir.

## Türetilmiş Grafik Sınırları

`deriveBounds(a, b)` şu değerleri üretir:

- `Vmin = 1.05 b`
- `Vmax = 10 Vc`
- `Tmin = 0.3 Tcr`
- `Tmax = 1.8 Tcr`
- `Tdef = 0.9 Tcr`
- `Pmin = max(0.01, 0.05 Pcr)`
- `Pmax = 2.0 Pcr`
- `Pdef = 0.7 Pcr`
- `A = 0.08 Pcr`
- `V0 = 0.6 Vc`
- `sigma = 0.18 Vc`

Yeni gaz eklendiğinde bu sınırlar otomatik türetildiği için ayrıca manuel
grafik sınırı yazılmamalıdır.

## Yeni Gaz Ekleme Kontrolü

Yeni veya düzeltilmiş bir gaz için:

- `a`, `b`, `M`, `Tfreeze` birimleri kontrol edilmeli.
- `Tcr/Pcr` deneysel referans ise kaynak notu commit veya PR açıklamasında belirtilmeli.
- `npm run build` çalışmalı.
- `VALIDATION.md` içindeki kritik değer ve ters denklem kontrolleri çalışmalı.

## 3B Eksen Verisi

`axisPresets.js` içindeki `computeVar` yalnızca `Vm,T,params` girdilerinden değer
üretir. Yeni eksen değişkeni eklenirse:

- birim ve etiket `AXIS_VARS` içine eklenmeli,
- hesap `computeVar` içinde yapılmalı,
- fiziksel formül gerekiyorsa önce `src/physics/` içine taşınmalı.

`p` ve `Δp` eksenleri kullanıcıya bar biriminde döner; vdW hesabı içeride atm ile
yapılır ve sonuç gösterim sırasında bar'a çevrilir.
