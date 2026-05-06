# Doğrulama ve Teslim Kontrolü

Bu proje bilimsel görselleştirme amacı taşıdığı için formül, veri veya grafik
davranışı değiştiğinde sadece gözle bakmak yeterli değildir. Aşağıdaki
kontroller teslimden önce uygulanmalıdır.

## Zorunlu Build

```bash
npm run build
```

Build uyarısı olarak büyük bundle uyarısı görülebilir; bu hesap doğruluğu
hatası değildir. Derleme hatası varsa teslim yapılmamalıdır.

## Sayısal İnvariant Kontrolleri

Aşağıdaki komut, presetler üzerinde kritik nokta, ters vdW ve spinodal
tutarlılığını kontrol eder:

```bash
node --input-type=module -e "import { PRESETS } from './src/data/gases.js'; import { vdw, tAtP, criticalVolume } from './src/physics/vdw.js'; import { findSpinodal } from './src/physics/spinodal.js'; import { R } from './src/physics/constants.js'; let maxCritErr=0,maxInvErr=0,maxDeriv=0,badSpinodal=0; for (const p of Object.values(PRESETS)) { const Vc=criticalVolume(p.b); maxCritErr=Math.max(maxCritErr, Math.abs(vdw(Vc,p.Tcr,p.a,p.b)-p.Pcr)); for (const Vm of [p.b*1.2,Vc,Vc*5]) { maxInvErr=Math.max(maxInvErr, Math.abs(tAtP(Vm,vdw(Vm,p.Tdef,p.a,p.b),p.a,p.b)-p.Tdef)); } const s=findSpinodal(p.Tcr*0.9,p.a,p.b,p.Vmin,p.Vmax); if(!s || !(s.Vliq < Vc && Vc < s.Vgas && s.pMin < s.pMax)) badSpinodal++; else for(const Vm of [s.Vliq,s.Vgas]) maxDeriv=Math.max(maxDeriv, Math.abs(-(R*p.Tcr*0.9)/((Vm-p.b)**2)+2*p.a/(Vm**3))); } console.log({maxCritErr,maxInvErr,badSpinodal,maxDeriv});"
```

Beklenen toleranslar:

- `maxCritErr < 1e-10`
- `maxInvErr < 1e-10`
- `badSpinodal = 0`
- `maxDeriv < 1e-5`

Yoğunluk ve TA-vdW katkısı için ek kontrol:

```bash
node --input-type=module -e "import { rhoFromVm, vmFromRho, criticalDensity } from './src/physics/density.js'; import { vdw } from './src/physics/vdw.js'; import { deltaPm, lambda, tagVdw, metaContribution } from './src/physics/metastable.js'; import { PRESETS } from './src/data/gases.js'; let densityErr=0, metaErr=0; for(const p of Object.values(PRESETS)){ for(const Vm of [p.b*1.2,3*p.b,p.Vmax]){ const rho=rhoFromVm(Vm,p.M); densityErr=Math.max(densityErr, Math.abs(vmFromRho(rho,p.M)-Vm)); } densityErr=Math.max(densityErr, Math.abs(criticalDensity(p.b,p.M)-p.M/(3*p.b))); for(const Vm of [p.V0,p.V0+p.sigma]){ const d=deltaPm(Vm,p.A,p.V0,p.sigma)*lambda(p.tau); metaErr=Math.max(metaErr, Math.abs(metaContribution(Vm,p)-d)); metaErr=Math.max(metaErr, Math.abs(tagVdw(Vm,p.Tdef,p)-(vdw(Vm,p.Tdef,p.a,p.b)+d))); } } console.log({densityErr,metaErr,lambdaZero:lambda(0),lambdaTwo:lambda(2)});"
```

Beklenen toleranslar:

- `densityErr < 1e-12`
- `metaErr < 1e-12`
- `lambdaZero = 0`
- `lambdaTwo` yaklaşık `0.6065306597`

## Manuel Grafik Kontrolü

Formül veya görselleştirme değiştiyse geliştirme sunucusunda şu sekmeler
kontrol edilmelidir:

- İzotermler: klasik, karşılaştırma ve TA-vdW modları.
- İzotermler: `Vm` ve `rho` eksenleri.
- İzobarlar: `Ttag - Tclassic` alt panelinin işareti ve büyüklüğü.
- 3B yüzey: klasik modda kritik nokta, TA-vdW modunda yanlış kritik işaret olmaması.
- Sıçrama: subkritik sıcaklıkta yatay sıçrama, süperkritik sıcaklıkta tek faz.
- T-t termogram: `c` noktası `Tmin`, `d/e` noktaları `Tfreeze`.

## Teslim Notu

Teslim mesajında en az şunlar belirtilmelidir:

- hangi formül/veri/grafik davranışının değiştiği,
- `npm run build` sonucunun başarılı olup olmadığı,
- sayısal invariant kontrollerinde görülen en yüksek hata veya tolerans durumu.
