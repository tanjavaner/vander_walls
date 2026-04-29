/**
 * T-t Termogram Görünümü (Dokümanda Şekil 3)
 * ==========================================
 *
 * Sıvı maddenin sabit basınçta soğutulmasını takip eden sıcaklık-zaman eğrisi.
 * Dokümanın metastabilite tezinin DOĞRUDAN DENEYSEL karşılığı.
 *
 * Beş aşama:
 *   ab — sıvı soğuması
 *   bc — aşırı soğuma (metastabil)
 *   cd — ani sıçrama (gizli ısı açığa çıkar, T yükselir)
 *   de — izotermik donma (T sabit)
 *   ef — katı fazın soğuması
 *
 * Bu grafiğin kritik detayı: sistem donma noktasının ALTINA inip
 * sonra YUKARI SIÇRAR — klasik termodinamiğin öngöremediği davranış.
 */
import { useState, useMemo, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, ReferenceDot, Area, ComposedChart,
} from 'recharts';
import Slider from '../ui/Slider.jsx';
import Pill from '../ui/Pill.jsx';
import { generateThermogram, estimateTauFromExperiment } from '../../physics/thermogram.js';

export default function ThermogramView({ params }) {
  // Her madde için varsayılan donma noktası gelir; kullanıcı ince ayar yapabilir
  const defaultTfreeze = params.Tfreeze ?? 278;
  const defaultTstart = defaultTfreeze + 70;

  const [Tstart, setTstart] = useState(defaultTstart);
  const [Tfreeze, setTfreeze] = useState(defaultTfreeze);
  const [deltaT, setDeltaT] = useState(15);
  const [tauMeta, setTauMeta] = useState(40);
  const [coolRate, setCoolRate] = useState(0.5);
  const [tauFreeze, setTauFreeze] = useState(60);

  // Madde değişince donma noktası parametrelerini yenile
  useEffect(() => {
    setTfreeze(params.Tfreeze ?? 278);
    setTstart((params.Tfreeze ?? 278) + 70);
  }, [params.Tfreeze]);

  // Animasyon durumu
  const [animating, setAnimating] = useState(false);
  const [animTime, setAnimTime] = useState(0); // 0..1 arası (tüm eğride hangi noktadayız)
  const rafRef = useRef();
  const lastTickRef = useRef(Date.now());

  const thermo = useMemo(
    () => generateThermogram({
      Tstart, Tfreeze, deltaT, coolRate,
      tauMeta, tauJump: 1.5, tauFreeze, tauSolid: 30,
      nPoints: 500,
    }),
    [Tstart, Tfreeze, deltaT, coolRate, tauMeta, tauFreeze]
  );

  const { data, keyPoints } = thermo;

  // τ tahmini (deneysel → modele)
  const tauEstimate = estimateTauFromExperiment(keyPoints.t1, 10);

  // Animasyon loop'u
  useEffect(() => {
    if (!animating) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = () => {
      const now = Date.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setAnimTime((t) => {
        const next = t + dt / 15; // 15 saniyede tam eğriyi dolaşır
        if (next >= 1) { setAnimating(false); return 1; }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    lastTickRef.current = Date.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animating]);

  const reset = () => { setAnimTime(0); setAnimating(true); lastTickRef.current = Date.now(); };

  // Animasyon için şu anki konum
  const cursor = useMemo(() => {
    if (animTime <= 0) return null;
    const idx = Math.min(data.length - 1, Math.floor(animTime * data.length));
    return data[idx];
  }, [animTime, data]);

  // Görünür kısım — animasyon gitmeden ötesini opak göster
  const visibleData = useMemo(() => {
    if (!animating && animTime === 0) return data; // animasyon başlamadan tam eğri
    return data.map((d, i) => ({
      ...d,
      Tshown: (i / data.length) <= animTime ? d.T : null,
      Tghost: (i / data.length) > animTime ? d.T : null,
    }));
  }, [data, animTime, animating]);

  const Tmin = Tfreeze - deltaT;
  const yDomain = [Tmin - 10, Tstart + 5];

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            T–t Termogramı  ·  Sıcaklık–Zaman Eğrisi
            <Pill color="cyan">Deneysel şekil</Pill>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Dokümanın Şekil 3'ünün interaktif karşılığı. Sabit basınçta soğutulan sıvının
            sıcaklık-zaman eğrisi. Metastabilite burada <em>doğrudan</em> görülür.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAnimating((p) => !p)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:text-slate-950">
            {animating ? <Pause size={13} /> : <Play size={13} />}
            {animating ? 'Durdur' : 'Oynat'}
          </button>
          <button onClick={reset}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:text-slate-950">
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>

      {/* Aşama süreleri paneli */}
      <div className="mx-4 mb-2 grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px]">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-slate-500 uppercase tracking-wider text-[9px]">t₁ (süpersoğuma)</div>
          <div className="text-base tabular-nums text-slate-900">{keyPoints.t1.toFixed(1)} s</div>
          <div className="text-[9px] text-slate-500">metastabil ömür</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-slate-500 uppercase tracking-wider text-[9px]">t₂ (sıçrama)</div>
          <div className="text-rose-300 text-base tabular-nums">{keyPoints.t2.toFixed(2)} s</div>
          <div className="text-[9px] text-slate-500">ani yükseliş</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="text-slate-500 uppercase tracking-wider text-[9px]">t₃ (donma)</div>
          <div className="text-base tabular-nums text-slate-900">{keyPoints.t3.toFixed(1)} s</div>
          <div className="text-[9px] text-slate-500">izotermik</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
          <div className="text-emerald-400/60 uppercase tracking-wider text-[9px]">τ tahmini</div>
          <div className="text-base tabular-nums text-emerald-700">{tauEstimate.toFixed(3)}</div>
          <div className="text-emerald-500/60 text-[9px]">deneysel → model</div>
        </div>
      </div>

      {/* Ana grafik */}
      <div className="flex-1 min-h-0 px-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={animTime > 0 ? visibleData : data}
            margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
            <CartesianGrid stroke="#1e293b" strokeDasharray="2 4" />
            <XAxis dataKey="t" type="number" domain={[0, keyPoints.tTotal]}
              tickFormatter={(v) => v.toFixed(0)}
              stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              label={{ value: 'zaman  [s]', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }} />
            <YAxis domain={yDomain}
              stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              label={{ value: 'T  [K]', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 6, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
              labelFormatter={(v) => `t = ${Number(v).toFixed(1)} s`}
              formatter={(val) => [Number(val).toFixed(2) + ' K', 'T']} />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />

            {/* Referans çizgiler */}
            <ReferenceLine y={Tfreeze} stroke="#22d3ee" strokeDasharray="4 4"
              label={{ value: `T_donma = ${Tfreeze.toFixed(1)}K`, fill: '#22d3ee', fontSize: 10, position: 'right' }} />
            <ReferenceLine y={Tmin} stroke="#a78bfa" strokeDasharray="2 4"
              label={{ value: `T_min = ${Tmin.toFixed(1)}K (ΔT=${deltaT})`, fill: '#a78bfa', fontSize: 10, position: 'right' }} />

            {/* Metastabil bölge vurgusu */}
            <ReferenceLine x={keyPoints.b.t} stroke="#475569" strokeDasharray="1 3" />
            <ReferenceLine x={keyPoints.c.t} stroke="#a78bfa" strokeDasharray="1 3"
              label={{ value: 'c', fill: '#a78bfa', fontSize: 11, position: 'top' }} />
            <ReferenceLine x={keyPoints.d.t} stroke="#ef4444" strokeDasharray="1 3"
              label={{ value: 'd (sıçrama)', fill: '#ef4444', fontSize: 10, position: 'top' }} />

            {/* Ana eğri — animasyon modunda iki katmanlı */}
            {animTime > 0 ? (
              <>
                <Line dataKey="Tghost" stroke="#334155" dot={false} name="Henüz gelinmedi"
                  strokeWidth={1.5} strokeDasharray="2 3" connectNulls={false} isAnimationActive={false} />
                <Line dataKey="Tshown" stroke="#22d3ee" dot={false} name="T(t)"
                  strokeWidth={3} connectNulls={false} isAnimationActive={false} />
              </>
            ) : (
              <Line dataKey="T" stroke="#22d3ee" dot={false} name="T(t)"
                strokeWidth={3} isAnimationActive={false} />
            )}

            {/* Anahtar noktalar */}
            <ReferenceDot x={keyPoints.a.t} y={keyPoints.a.T} r={4} fill="#22d3ee" stroke="#fff" strokeWidth={1}
              label={{ value: 'a', fill: '#22d3ee', fontSize: 12, position: 'top' }} />
            <ReferenceDot x={keyPoints.b.t} y={keyPoints.b.T} r={4} fill="#22d3ee" stroke="#fff" strokeWidth={1}
              label={{ value: 'b', fill: '#22d3ee', fontSize: 12, position: 'top' }} />
            <ReferenceDot x={keyPoints.c.t} y={keyPoints.c.T} r={5} fill="#a78bfa" stroke="#fff" strokeWidth={2}
              label={{ value: 'c ← en düşük', fill: '#a78bfa', fontSize: 11, position: 'bottom' }} />
            <ReferenceDot x={keyPoints.d.t} y={keyPoints.d.T} r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} />
            <ReferenceDot x={keyPoints.e.t} y={keyPoints.e.T} r={4} fill="#10b981" stroke="#fff" strokeWidth={1}
              label={{ value: 'e', fill: '#10b981', fontSize: 12, position: 'top' }} />
            <ReferenceDot x={keyPoints.f.t} y={keyPoints.f.T} r={4} fill="#64748b" stroke="#fff" strokeWidth={1}
              label={{ value: 'f', fill: '#64748b', fontSize: 12, position: 'top' }} />

            {/* Animasyon imleci */}
            {cursor && (
              <ReferenceDot x={cursor.t} y={cursor.T} r={9}
                fill="#fbbf24" stroke="#fff" strokeWidth={2} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Parametre sliderları */}
      <div className="mx-4 mb-3 mt-1 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-3">
        <Slider label="T başlangıç" value={Tstart} min={Tfreeze + 20} max={Tfreeze + 200} step={1}
          onChange={setTstart} unit="K" format={(v) => v.toFixed(0)} />
        <Slider label="T donma" value={Tfreeze} min={50} max={600} step={1}
          onChange={setTfreeze} unit="K" format={(v) => v.toFixed(1)} />
        <Slider label="ΔT aşırı soğuma" value={deltaT} min={1} max={50} step={0.5}
          onChange={setDeltaT} unit="K" format={(v) => v.toFixed(1)} />
        <Slider label="t₁ süpersoğuma süresi" value={tauMeta} min={5} max={200} step={1}
          onChange={setTauMeta} unit="s" format={(v) => v.toFixed(0)} />
        <Slider label="Soğuma hızı" value={coolRate} min={0.1} max={3.0} step={0.05}
          onChange={setCoolRate} unit="K/s" format={(v) => v.toFixed(2)} />
        <Slider label="t₃ donma süresi" value={tauFreeze} min={10} max={200} step={1}
          onChange={setTauFreeze} unit="s" format={(v) => v.toFixed(0)} />
      </div>
    </div>
  );
}
