/**
 * T-t Termogram Modeli (Dokümanda bölüm 4:1)
 * ============================================
 *
 * Deneysel olarak sıvı bir maddenin sabit basınçta soğutulmasını takip eden
 * sıcaklık-zaman eğrisi. Metastabil aşırı soğuma ve sonrasındaki ani sıçrama
 * davranışını DOĞRUDAN gözlemlemek için kullanılır.
 *
 * Bir tipik T-t eğrisi 5 aşamadan oluşur:
 *
 *       T (K)
 *        │ a─╲                 (ab) sıvının başlangıç soğuması
 *        │    ╲                      yavaş eğimli iniş
 *        │     ╲ b ── Tdonma (normal donma sıcaklığı)
 *        │      ╲
 *        │       ╲              (bc) aşırı soğuma — METASTABİL
 *        │        ╲                   donma noktasının altına iniş
 *        │         c (Tmin = Tdonma - ΔT)
 *        │         │
 *        │         │ d  ← (cd) ANİ SIÇRAMA — gizli ısı açığa çıkıyor
 *        │         │╱        neredeyse dikey yukarı
 *        │   ──────d────── (de) izotermik donma, T sabit = Tdonma
 *        │                 ╲
 *        │                  ╲ (ef) katı fazın soğuması
 *        │                   ╲f
 *        └──────────────────────── t (s)
 *              t₁    t₂   t₃
 *
 * Aşama süreleri:
 *   t₁ = süpersoğuma süresi (bc)
 *   t₂ = ani sıçrama süresi (cd) — çok kısa
 *   t₃ = izotermik donma süresi (de)
 *
 * τ_metastabil = t₁ (dokümandaki τ parametresinin doğrudan deneysel karşılığı)
 */

/**
 * T-t termogramını parametrik olarak üret.
 *
 * @param {object} p - parametre nesnesi
 * @param {number} p.Tstart     - başlangıç sıcaklığı (K)
 * @param {number} p.Tfreeze    - normal donma sıcaklığı (K)
 * @param {number} p.deltaT     - aşırı soğuma derinliği (K) — bc segmenti
 * @param {number} p.coolRate   - sıvı soğuma hızı (K/s)
 * @param {number} p.tauMeta    - metastabil ömür (s) — bc süresi
 * @param {number} p.tauJump    - sıçrama süresi (s) — cd süresi (çok kısa)
 * @param {number} p.tauFreeze  - izotermik donma süresi (s) — de süresi
 * @param {number} p.tauSolid   - katı soğuma kısmının göstereceğimiz süresi (s) — ef
 * @param {number} p.nPoints    - toplam örnek sayısı
 * @returns {Array<{t: number, T: number, phase: string}>}
 */
export function generateThermogram(p) {
  const {
    Tstart = 350,
    Tfreeze = 278, // ör. benzen için yaklaşık donma noktası
    deltaT = 15,
    coolRate = 0.5, // K/s
    tauMeta = 40,
    tauJump = 1.5,
    tauFreeze = 60,
    tauSolid = 30,
    nPoints = 500,
  } = p;

  const Tmin = Tfreeze - deltaT; // en düşük sıcaklık (c noktası)

  // (ab) sıvı soğuması: Tstart → Tfreeze
  const tAB = (Tstart - Tfreeze) / coolRate;

  // Aşama süreleri
  const t1 = tauMeta;      // bc (aşırı soğuma, metastabil)
  const t2 = tauJump;      // cd (ani sıçrama)
  const t3 = tauFreeze;    // de (izotermik donma)
  const t4 = tauSolid;     // ef (katı soğuması)

  const tTotal = tAB + t1 + t2 + t3 + t4;

  const data = [];
  for (let i = 0; i < nPoints; i++) {
    const t = (i / (nPoints - 1)) * tTotal;
    let T;
    let phase;

    if (t < tAB) {
      // ab: doğrusal iniş
      T = Tstart - coolRate * t;
      phase = 'ab';
    } else if (t < tAB + t1) {
      // bc: aşırı soğuma (metastabil, üstel yavaşlayan iniş)
      const u = (t - tAB) / t1;
      // Yumuşak ama monoton bir iniş eğrisi (tersine üstel)
      T = Tfreeze - deltaT * (1 - Math.exp(-3 * u)) / (1 - Math.exp(-3));
      phase = 'bc';
    } else if (t < tAB + t1 + t2) {
      // cd: ani sıçrama (yukarı, gizli ısı açığa çıkar)
      const u = (t - tAB - t1) / t2;
      // Hızlı sigmoid ile sıçrama
      T = Tmin + deltaT * sigmoid(u * 6 - 3);
      phase = 'cd';
    } else if (t < tAB + t1 + t2 + t3) {
      // de: izotermik donma — T sabit = Tfreeze
      T = Tfreeze;
      phase = 'de';
    } else {
      // ef: katı fazın soğuması — yine doğrusal iniş
      const u = (t - tAB - t1 - t2 - t3) / t4;
      T = Tfreeze - coolRate * u * t4 * 0.7; // biraz daha yavaş
      phase = 'ef';
    }

    data.push({ t, T, phase });
  }

  // Önemli anahtar noktaların zaman konumlarını da geri döndürelim
  const keyPoints = {
    a: { t: 0, T: Tstart },
    b: { t: tAB, T: Tfreeze },
    c: { t: tAB + t1, T: Tmin },
    d: { t: tAB + t1 + t2, T: Tfreeze },
    e: { t: tAB + t1 + t2 + t3, T: Tfreeze },
    f: { t: tTotal, T: data[data.length - 1].T },
    tAB, t1, t2, t3, t4, tTotal,
    Tstart, Tfreeze, Tmin, deltaT,
  };

  return { data, keyPoints };
}

/** Yumuşak sigmoid — sıçrama anı için. */
function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Termogram ile TAĞ modelini matematiksel olarak birleştir.
 *
 *   t₁ (metastabil süre) = deneysel ölçüm ↔ τ (dokümanda)
 *   ΔT (aşırı soğuma)    = deneysel ölçüm ↔ A, V₀, σ'nın kalibrasyonunda girdi
 *
 * Bu fonksiyon t₁ ve ΔT deneysel ölçümlerinden τ için bir tahmin çıkarır.
 * Model: τ ≈ t₁ / tref  (tref bir referans zaman — standart 1 saniye)
 */
export function estimateTauFromExperiment(t1, tref = 1.0) {
  return t1 / tref;
}
