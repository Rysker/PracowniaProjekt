import React, { useRef, useEffect } from 'react';
import '../styles/emoji.css';

export default function EmojiFace({ state = 'idle', size = 140 }) 
{
  const faceRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    function computeAndApply(e) 
    {
      const el = faceRef.current;

      if (!el)
         return;

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      const maxX = Math.round(rect.width / 22);
      const maxY = Math.round(rect.height / 26);
      const nx = Math.max(-1, Math.min(1, dx / (rect.width / 2)));
      const ny = Math.max(-1, Math.min(1, dy / (rect.height / 2)));
      const px = Math.round(nx * maxX);
      const py = Math.round(ny * maxY);

      const pupils = el.querySelectorAll('.pupil');

      if (!pupils || pupils.length === 0) 
        return;

      pupils.forEach(p => {
        p.style.transform = `translate(${px}px, ${py}px)`;
      });
      
    }

    function onMove(e) 
    {
      if (rafRef.current) 
        cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => computeAndApply(e));
    }

    window.addEventListener('pointermove', onMove);
    setTimeout(() => {
      const el = faceRef.current;
      if (!el) 
        return;
      const rect = el.getBoundingClientRect();
      const fake = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
      onMove(fake);
    }, 50);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  return (
    <div ref={faceRef} className={`emoji-face ${state}`} style={{ width: size, height: size }}>
      <div className="eyes">
        <div className="eye"><div className="pupil" /></div>
        <div className="eye"><div className="pupil" /></div>
      </div>
      <div className="mouth" />
      <div className="hand left" aria-hidden="true" />
      <div className="hand right" aria-hidden="true" />
    </div>
  );
}
