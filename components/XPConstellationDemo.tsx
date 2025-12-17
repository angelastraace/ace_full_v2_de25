"use client";
import React, { useEffect, useRef } from 'react';

type Props = { xp?: number };

export default function XPConstellationDemo({ xp = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = (canvas.width = canvas.clientWidth);
    const h = (canvas.height = canvas.clientHeight);
    ctx.clearRect(0,0,w,h);

    // Create some stars; higher xp -> bigger and more bright stars
    const count = 30 + Math.min(100, Math.floor(xp / 10));
    for (let i=0;i<count;i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const size = 1 + Math.random() * (1 + xp / 100);
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.random()*0.6})`;
      ctx.arc(x, y, size, 0, Math.PI*2);
      ctx.fill();
    }
    // center highlight showing total xp
    ctx.fillStyle = 'white';
    ctx.font = '16px monospace';
    ctx.fillText(`XP: ${xp}`, 10, 20);
  }, [xp]);

  return (
    <div style={{width:'100%', height:300, border:'1px solid #111', borderRadius:8, overflow:'hidden'}}>
      <canvas ref={canvasRef} style={{width:'100%', height:'100%', display:'block'}} />
    </div>
  );
}
