import { useCallback, useEffect, useState } from 'react';

export function useFullscreen(targetRef) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(document.fullscreenElement === targetRef.current);
    };

    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, [targetRef]);

  const enterFullscreen = useCallback(() => {
    const target = targetRef.current;
    if (!target || document.fullscreenElement === target) return;
    target.requestFullscreen?.();
  }, [targetRef]);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement === targetRef.current) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen, targetRef]);

  return { isFullscreen, enterFullscreen, exitFullscreen, toggleFullscreen };
}
