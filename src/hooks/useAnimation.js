/**
 * Animasyon loop'u için genel-amaçlı hook.
 *
 * requestAnimationFrame üzerine oturur, delta-time geçirir ve durabilir.
 * Sıçrama ve T-t termogramı animasyonları bundan yararlanır.
 */

import { useEffect, useRef } from 'react';

/**
 * @param {boolean} running - animasyon çalışıyor mu
 * @param {(dt: number) => void} tick - her frame'de çalışacak fonksiyon (dt = saniye)
 */
export function useAnimation(running, tick) {
  const lastRef = useRef(Date.now());
  const rafRef = useRef();

  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    lastRef.current = Date.now();

    const loop = () => {
      const now = Date.now();
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      tick(dt);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, tick]);
}
