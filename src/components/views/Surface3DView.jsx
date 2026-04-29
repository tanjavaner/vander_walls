/**
 * 3D Yüzey Görünümü — p(Vₘ, T) ve türevleri
 *
 * Three.js ile kuşbakışı dönebilen yüzey. X, Y, Z eksenleri değiştirilebilir.
 * Eksen uçlarında canvas sprite etiketleri, tick değerleri ve renkli çizgiler.
 */
import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { AXIS_VARS, AXIS_PRESETS, computeVar } from '../../data/axisPresets.js';
import { formatTick, clamp } from '../../utils/format.js';

export default function Surface3DView({ params, modelMode }) {
  const mountRef = useRef(null);
  const isTag = modelMode === 'tag' || modelMode === 'compare';
  const isCompareMode = modelMode === 'compare';

  const [axisX, setAxisX] = useState('Vm');
  const [axisY, setAxisY] = useState('T');
  const [axisZ, setAxisZ] = useState('p');

  const applyAxisPreset = (idx) => {
    const p = AXIS_PRESETS[idx];
    if (!p) return;
    setAxisX(p.x); setAxisY(p.y); setAxisZ(p.z);
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e1a);
    scene.fog = new THREE.Fog(0x0a0e1a, 4, 12);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.2, 2.5, 3.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x404050, 1.0));
    const dir = new THREE.DirectionalLight(0xfbbf24, 0.7);
    dir.position.set(5, 8, 4); scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0x60a5fa, 0.4);
    dir2.position.set(-5, -2, -4); scene.add(dir2);

    const segments = 80;
    const geometry = new THREE.PlaneGeometry(2, 2, segments, segments);
    const positions = geometry.attributes.position;
    const colors = [];

    const { a, b, Tcr, Pcr, Vmin, Vmax, Tmin, Tmax } = params;
    const Vlo = Math.max(Vmin, b * 1.05);
    const Vhi = Vmax;
    const Tlo = Tmin, Thi = Tmax;

    // Izgara — her (i,j) için X, Y, Z hesapla
    const rawPts = [];
    const N = segments + 1;
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const u = i / segments, v = j / segments;
        const Vm = Vlo + (Vhi - Vlo) * u;
        const Tpt = Tlo + (Thi - Tlo) * v;
        rawPts.push({
          x: computeVar(axisX, Vm, Tpt, params, isTag),
          y: computeVar(axisY, Vm, Tpt, params, isTag),
          z: computeVar(axisZ, Vm, Tpt, params, isTag),
        });
      }
    }

    const isPressureLike = (k) => k === 'p' || k === 'dp';
    const rng = (vals, clampP) => {
      const f = vals.filter(Number.isFinite);
      if (!f.length) return { lo: 0, hi: 1 };
      let lo = Math.min(...f), hi = Math.max(...f);
      if (clampP) { lo = Math.max(lo, -Pcr * 0.5); hi = Math.min(hi, Pcr * 2.5); }
      if (Math.abs(hi - lo) < 1e-9) hi = lo + 1;
      return { lo, hi };
    };
    const xR = rng(rawPts.map(p => p.x), isPressureLike(axisX));
    const yR = rng(rawPts.map(p => p.y), isPressureLike(axisY));
    const zR = rng(rawPts.map(p => p.z), isPressureLike(axisZ));

    for (let idx = 0; idx < positions.count; idx++) {
      const pt = rawPts[idx];
      const x = Number.isFinite(pt.x) ? pt.x : xR.hi;
      const y = Number.isFinite(pt.y) ? pt.y : yR.hi;
      const z = Number.isFinite(pt.z) ? pt.z : zR.hi;
      const wx = ((clamp(x, xR.lo, xR.hi) - xR.lo) / (xR.hi - xR.lo)) * 2 - 1;
      const wz = ((clamp(y, yR.lo, yR.hi) - yR.lo) / (yR.hi - yR.lo)) * 2 - 1;
      const wy = ((clamp(z, zR.lo, zR.hi) - zR.lo) / (zR.hi - zR.lo)) * 1.6 - 0.3;
      positions.setX(idx, wx);
      positions.setY(idx, wy);
      positions.setZ(idx, wz);

      const zN = (clamp(z, zR.lo, zR.hi) - zR.lo) / (zR.hi - zR.lo);
      const zCritVal = axisZ === 'p' ? Pcr : null;
      const distToCr = zCritVal !== null ? Math.abs(z - zCritVal) / (zR.hi - zR.lo) : 1;
      let r, g, bc;
      if (distToCr < 0.04) { r = 0.94; g = 0.27; bc = 0.27; }
      else if (zN < 0.5) {
        const s = zN / 0.5;
        r = 0.29 + s * 0.6; g = 0.56 + s * 0.15; bc = 0.94 - s * 0.6;
      } else {
        const s = (zN - 0.5) / 0.5;
        r = 0.89 + s * 0.07; g = 0.71 - s * 0.5; bc = 0.34 - s * 0.2;
      }
      colors.push(r, g, bc);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true, side: THREE.DoubleSide, roughness: 0.4, metalness: 0.15,
    });
    const surface = new THREE.Mesh(geometry, material);
    scene.add(surface);

    const wireGeo = geometry.clone();
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b, wireframe: true, transparent: true, opacity: 0.25,
    });
    scene.add(new THREE.Mesh(wireGeo, wireMat));

    // Renkli eksen çizgileri
    const mkLine = (a0, b0, color) => {
      const g = new THREE.BufferGeometry().setFromPoints([a0, b0]);
      return new THREE.Line(g, new THREE.LineBasicMaterial({ color }));
    };
    scene.add(mkLine(new THREE.Vector3(-1, -0.32, -1), new THREE.Vector3(1, -0.32, -1), 0x60a5fa));
    scene.add(mkLine(new THREE.Vector3(-1, -0.32, -1), new THREE.Vector3(-1, -0.32, 1), 0xfbbf24));
    scene.add(mkLine(new THREE.Vector3(-1, -0.32, -1), new THREE.Vector3(-1, 1.4, -1), 0x10b981));

    // Canvas tabanlı text sprite
    const makeTextSprite = (text, { color = '#e2e8f0', size = 64, bold = false } = {}) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const font = `${bold ? 'bold ' : ''}${size}px 'JetBrains Mono', monospace`;
      ctx.font = font;
      const metrics = ctx.measureText(text);
      const pad = 16;
      canvas.width = Math.ceil(metrics.width) + pad * 2;
      canvas.height = size + pad * 2;
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
      const sp = new THREE.Sprite(mat);
      const aspect = canvas.width / canvas.height;
      const h = 0.11;
      sp.scale.set(h * aspect, h, 1);
      return sp;
    };

    // Eksen etiketleri
    const xLabel = makeTextSprite(AXIS_VARS[axisX].label.split('  ')[0] + ` [${AXIS_VARS[axisX].unit}]`, { color: '#93c5fd', bold: true });
    xLabel.position.set(1.25, -0.32, -1); scene.add(xLabel);
    const yLabel = makeTextSprite(AXIS_VARS[axisY].label.split('  ')[0] + ` [${AXIS_VARS[axisY].unit}]`, { color: '#fcd34d', bold: true });
    yLabel.position.set(-1, -0.32, 1.25); scene.add(yLabel);
    const zLabel = makeTextSprite(AXIS_VARS[axisZ].label.split('  ')[0] + ` [${AXIS_VARS[axisZ].unit}]`, { color: '#6ee7b7', bold: true });
    zLabel.position.set(-1, 1.55, -1); scene.add(zLabel);

    // Tick değerleri
    const addTicks = (range, axisDir) => {
      for (let k = 0; k <= 2; k++) {
        const frac = k / 2;
        const val = range.lo + frac * (range.hi - range.lo);
        const worldPos = -1 + frac * 2;
        const sp = makeTextSprite(formatTick(val), { color: '#94a3b8', size: 48 });
        if (axisDir === 'x') sp.position.set(worldPos, -0.45, -1);
        else if (axisDir === 'y') sp.position.set(-1, -0.45, worldPos);
        else { const h = -0.3 + frac * 1.6; sp.position.set(-1.15, h, -1); }
        scene.add(sp);
      }
    };
    addTicks(xR, 'x'); addTicks(yR, 'y'); addTicks(zR, 'z');

    // Kritik nokta
    if (axisZ === 'p') {
      const Vc = 3 * b;
      const cxv = computeVar(axisX, Vc, Tcr, params, isTag);
      const cyv = computeVar(axisY, Vc, Tcr, params, isTag);
      const wx = ((clamp(cxv, xR.lo, xR.hi) - xR.lo) / (xR.hi - xR.lo)) * 2 - 1;
      const wz = ((clamp(cyv, yR.lo, yR.hi) - yR.lo) / (yR.hi - yR.lo)) * 2 - 1;
      const wy = ((clamp(Pcr, zR.lo, zR.hi) - zR.lo) / (zR.hi - zR.lo)) * 1.6 - 0.3;
      const cr = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 20, 20),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      cr.position.set(wx, wy, wz); scene.add(cr);
      const crLabel = makeTextSprite('● Kritik Nokta', { color: '#f87171', bold: true, size: 48 });
      crLabel.position.set(wx + 0.2, wy + 0.08, wz); scene.add(crLabel);
    }

    // Mouse kontrolü
    let rotY = Math.PI / 6, rotX = Math.PI / 8;
    let isDragging = false; let prevX = 0, prevY = 0;
    const onDown = (e) => {
      isDragging = true;
      prevX = e.clientX ?? e.touches?.[0]?.clientX;
      prevY = e.clientY ?? e.touches?.[0]?.clientY;
    };
    const onMove = (e) => {
      if (!isDragging) return;
      const cx = e.clientX ?? e.touches?.[0]?.clientX;
      const cy = e.clientY ?? e.touches?.[0]?.clientY;
      rotY += (cx - prevX) * 0.008;
      rotX = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotX + (cy - prevY) * 0.008));
      prevX = cx; prevY = cy;
    };
    const onUp = () => { isDragging = false; };
    let zoom = 1;
    const onWheel = (e) => {
      e.preventDefault();
      zoom *= e.deltaY > 0 ? 1.05 : 0.95;
      zoom = Math.max(0.5, Math.min(2.5, zoom));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onDown);
    dom.addEventListener('mousemove', onMove);
    dom.addEventListener('mouseup', onUp);
    dom.addEventListener('mouseleave', onUp);
    dom.addEventListener('touchstart', onDown);
    dom.addEventListener('touchmove', onMove);
    dom.addEventListener('touchend', onUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const r = 5 * zoom;
      camera.position.x = r * Math.sin(rotY) * Math.cos(rotX);
      camera.position.y = r * Math.sin(rotX) + 0.4;
      camera.position.z = r * Math.cos(rotY) * Math.cos(rotX);
      camera.lookAt(0, 0.3, 0);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      dom.removeEventListener('mousedown', onDown);
      dom.removeEventListener('mousemove', onMove);
      dom.removeEventListener('mouseup', onUp);
      dom.removeEventListener('mouseleave', onUp);
      dom.removeEventListener('touchstart', onDown);
      dom.removeEventListener('touchmove', onMove);
      dom.removeEventListener('touchend', onUp);
      dom.removeEventListener('wheel', onWheel);
      geometry.dispose();
      wireGeo.dispose();
      material.dispose();
      wireMat.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, [params, isTag, axisX, axisY, axisZ]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
          <h3 className="text-lg font-semibold text-slate-900">
            3B Yüzey  {AXIS_VARS[axisZ].label.split(' ')[0]}({AXIS_VARS[axisX].label.split(' ')[0]}, {AXIS_VARS[axisY].label.split(' ')[0]})
            <span className={`ml-3 text-xs font-mono px-2 py-0.5 rounded ${
              isCompareMode ? 'border border-cyan-200 bg-cyan-50 text-cyan-700'
                : isTag ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              {isCompareMode ? 'Karşılaştırma (TAĞ)' : isTag ? 'TAĞ-vdW' : 'Klasik vdW'}
            </span>
          </h3>
          <div className="text-[10px] font-mono text-slate-500">
            döndür: sürükle · yakınlaştır: tekerlek
          </div>
        </div>

        {/* Eksen seçici */}
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-3 items-center mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Eksenler:</span>
            {[{ ax: 'x', val: axisX, setter: setAxisX, color: '#60a5fa' },
              { ax: 'y', val: axisY, setter: setAxisY, color: '#fbbf24' },
              { ax: 'z', val: axisZ, setter: setAxisZ, color: '#10b981' }].map(({ ax, val, setter, color }) => (
              <div key={ax} className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold uppercase" style={{ color }}>{ax}:</span>
                <select value={val} onChange={(e) => setter(e.target.value)}
                  className="cursor-pointer rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] font-mono text-slate-800 hover:border-slate-400 focus:border-slate-900 focus:outline-none">
                  {Object.entries(AXIS_VARS).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 md:justify-end">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Hazır:</span>
            <select
              onChange={(e) => { if (e.target.value !== '') applyAxisPreset(parseInt(e.target.value, 10)); e.target.value = ''; }}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 hover:border-slate-400">
              <option value="">Hazır görünümler…</option>
              {AXIS_PRESETS.map((p, i) => (<option key={i} value={i}>{p.name}</option>))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-2 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5" style={{ background: '#60a5fa' }} />
            <span className="text-blue-700">X = {AXIS_VARS[axisX].label.split('  ')[0]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5" style={{ background: '#fbbf24' }} />
            <span className="text-amber-700">Y = {AXIS_VARS[axisY].label.split('  ')[0]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5" style={{ background: '#10b981' }} />
            <span className="text-emerald-700">Z = {AXIS_VARS[axisZ].label.split('  ')[0]}</span>
          </div>
        </div>
      </div>
      <div ref={mountRef} className="flex-1 cursor-grab active:cursor-grabbing" />
    </div>
  );
}
