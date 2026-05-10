# Bilimsel Model ve Formüller

Bu doküman, uygulamada kullanılan denklemlerin tek doğruluk kaynağıdır.
Formül değişikliği yapılırsa önce bu dosya güncellenmeli, sonra
`src/physics/` uygulanmalı ve `VALIDATION.md` kontrolleri çalıştırılmalıdır.

## Birim Sistemi

- Basınç `p`: model içinde atm. Kullanıcı arayüzünde basınç kontrolleri,
  grafik eksenleri, lejantlar ve tooltip değerleri bar olarak gösterilir.
- Sıcaklık `T`: K
- Molar hacim `Vm`: L/mol
- Yoğunluk `rho`: g/L
- Molar kütle `M`: g/mol
- vdW sabiti `a`: L^2 atm / mol^2
- vdW sabiti `b`: L/mol
- Gaz sabiti `R`: 0.08206 L atm / (mol K)

## Klasik van der Waals

Uygulama dosyası: `src/physics/vdw.js`.

```text
p(Vm, T) = R T / (Vm - b) - a / Vm^2
```

Geçerlilik sınırı:

```text
Vm > b
```

`Vm <= b` veya sonlu olmayan girdiler fiziksel olmayan durum kabul edilir ve
`NaN` döndürülür.

## Ters İzobar Formu

Sabit basınçta sıcaklık grafiği için kullanılan ters form:

```text
T(Vm, P) = (P + a / Vm^2) (Vm - b) / R
```

TA-vdW izobarında toplam basınç sabit tutulur. Ek metastabil basınç katkısı
basınç tarafında çıkarılarak klasik ters forma verilir:

```text
meta(Vm) = deltaPm(Vm) * lambda(tau)
T_tag(Vm, P) = ((P - meta(Vm)) + a / Vm^2) (Vm - b) / R
```

## Kritik Değerler

vdW denkleminin kendi kritik değerleri `a` ve `b` sabitlerinden türetilebilir:

```text
Vc  = 3 b
Tcr = 8 a / (27 R b)
Pcr = a / (27 b^2)
```

Preset ilk yüklenirken varsayılan `Tcr/Pcr` bu vdW türetiminden gelir. Kullanıcı
arayüzünde ise `Tcr` ve `Pcr` düzenlenebilir referans değerlerdir; `a` veya `b`
değiştiğinde otomatik olarak ezilmezler ve birbirlerini değiştirmezler. Bu
referanslar kritik çizgileri, tooltipte gösterilen `Pcr` satırını ve çalışma
noktası aralıklarını belirler.

## TA-vdW Metastabil Katkısı

Uygulama dosyası: `src/physics/metastable.js`.

```text
p_tag(Vm, T) = p_vdw(Vm, T) + deltaPm(Vm) * lambda(tau)
deltaPm(Vm) = A * exp(-(Vm - V0)^2 / (2 sigma^2))
lambda(tau) = exp(-1 / tau), tau > 1e-6
lambda(tau) = 0, tau <= 1e-6
```

`lambda` üstelinin negatif olması kasıtlıdır. `tau -> 0` limitinde
`lambda -> 0` olur ve TA-vdW modeli klasik vdW formuna döner.

Bu uygulamadaki `deltaPm` Gauss penceresidir. Deneysel kalibrasyon yapılmadan
gerçek madde için nicel metastabil basınç düzeltmesi gibi sunulmamalıdır.

## Yoğunluk Dönüşümü

Uygulama dosyası: `src/physics/density.js`.

```text
rho = M / Vm
Vm = M / rho
rhoCr = M / (3 b)
```

`rho` ekseni kullanılan her görünümde dönüşüm yardımcıları kullanılmalıdır.
View bileşenlerinde bu matematik yeniden yazılmamalıdır.

## Spinodal Noktalar

Uygulama dosyası: `src/physics/spinodal.js`.

Spinodal koşulu:

```text
dp/dVm = -R T / (Vm - b)^2 + 2 a / Vm^3 = 0
```

Spinodal çözümü vdW denkleminin `a,b` sabitlerinden türettiği model kritik
sıcaklığını kullanır. `T < Tcr_model` iken iki kök beklenir:

- `Vliq`: küçük hacim tarafı, yerel basınç minimumu `pMin`.
- `Vgas`: büyük hacim tarafı, yerel basınç maksimumu `pMax`.

Doğru sıra:

```text
Vliq < Vc < Vgas
pMin < pMax
```

Kökler analitik türev koşulundan bisection ile çözülür. Bu nedenle grafik
örnek sayısı spinodal değerini değiştirmemelidir.

## Sıçrama Modeli

Sıçrama görünümü, spinodal varsa sıvı spinodalındaki basınca yatay bir çizgi
çeker ve gaz kolunda aynı basınca karşılık gelen molar hacmi çözer:

```text
p_vdw(Vgas_land, T) = pMin
Vgas_land > Vgas
```

`T >= Tcr_model` için spinodal yoktur; görünüm tek faz olarak davranmalıdır ve
sıçrama animasyonu çalışmamalıdır.

## T-t Termogram

Uygulama dosyası: `src/physics/thermogram.js`.

Termogram beş parçadan oluşur:

- `ab`: sıvı soğuması, doğrusal düşüş.
- `bc`: aşırı soğuma, `Tfreeze` değerinden `Tmin = Tfreeze - deltaT` değerine iniş.
- `cd`: gizli ısı açığa çıkışı, normalize sigmoid ile `Tmin -> Tfreeze`.
- `de`: izotermik donma, `T = Tfreeze`.
- `ef`: katı faz soğuması.

`cd` segmenti uç noktalarda `Tmin` ve `Tfreeze` ile tutarlı olmalıdır.

## Kapsam Dışı

- Maxwell eş alan inşası şu anda uygulanmıyor.
- Gerçek madde faz dengesi için kalibre edilmiş bir EOS iddiası yoktur.
- `tau(P,T)` fonksiyonu deneysel model olarak kalibre edilmemiştir; arayüzdeki
  `tau` boyutsuz görselleştirme parametresidir.
