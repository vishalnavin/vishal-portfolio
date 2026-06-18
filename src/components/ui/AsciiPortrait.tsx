import { useRef, useEffect, useState } from 'react';

interface RawParticle {
  x: number;
  y: number;
  char: string;
  alpha: number;
}

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  char: string;
  fontSize: number;
  baseAlpha: number;
  currentAlpha: number;
  delay: number;
  shimmer: number;
}

// Match ParticlePortrait's responsive footprint: 250 / 300 / 450
const calculateSize = (width: number) => {
  if (width <= 480) return Math.min(250, width - 40);
  if (width <= 768) return 300;
  return 450;
};

// ASCII ramp from sparse to dense
const CHARS = ' .:-=+*#%@'.split('');

export default function AsciiPortrait({ imageSrc }: { imageSrc: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const mouseTargetRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(0);
  const [size, setSize] = useState(() => calculateSize(window.innerWidth));
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    const updateSize = () => setSize(calculateSize(window.innerWidth));
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Build the ASCII particle cloud from the source image
  useEffect(() => {
    const isMobileSize = size <= 300;
    const fontSize = isMobileSize ? 5 : 7;

    const createParticles = (raw: RawParticle[]): Particle[] =>
      raw.map((p) => ({
        x: p.x + (Math.random() - 0.5) * 400,
        y: p.y + (Math.random() - 0.5) * 400,
        targetX: p.x,
        targetY: p.y,
        vx: 0,
        vy: 0,
        char: p.char,
        fontSize,
        baseAlpha: p.alpha,
        currentAlpha: 0,
        delay: Math.random() * 0.4,
        shimmer: Math.random() * Math.PI * 2,
      }));

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      if (cancelled) return;

      const off = document.createElement('canvas');
      off.width = size;
      off.height = size;
      const offCtx = off.getContext('2d');
      if (!offCtx) return;

      // "Contain" fit at 80% scale, centred
      const scale = 0.8;
      const imgAspect = img.width / img.height;
      let drawHeight = size * scale;
      let drawWidth = drawHeight * imgAspect;
      if (drawWidth > size * scale) {
        drawWidth = size * scale;
        drawHeight = drawWidth / imgAspect;
      }
      const offsetX = (size - drawWidth) / 2;
      const offsetY = (size - drawHeight) / 2;
      offCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

      const pixels = offCtx.getImageData(0, 0, size, size).data;
      const colGap = fontSize * 0.7;
      const rowGap = fontSize * 1.1;
      const raw: RawParticle[] = [];

      for (let y = 0; y < size; y += rowGap) {
        for (let x = 0; x < size; x += colGap) {
          const i = (Math.floor(y) * size + Math.floor(x)) * 4;
          // Transparent background pixels are skipped — the cut-out's alpha
          // channel isolates the subject for us.
          if (pixels[i + 3] <= 128) continue;
          const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / (3 * 255);
          // Floor the index at 1 so even near-black areas (the dark jacket)
          // still draw a faint glyph and the full silhouette reads.
          const charIndex = Math.max(1, Math.round(brightness * (CHARS.length - 1)));
          raw.push({
            x,
            y,
            char: CHARS[charIndex],
            alpha: 0.45 + brightness * 0.55,
          });
        }
      }

      particlesRef.current = createParticles(raw);
      setDataReady(true);
      startTimeRef.current = performance.now();
    };

    return () => {
      cancelled = true;
    };
  }, [size, imageSrc]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let animationId = 0;
    const isMobileSize = size <= 300;
    const fontSize = isMobileSize ? 5 : 7;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, size, size);
      if (!dataReady || !particlesRef.current.length) return;

      const particles = particlesRef.current;
      const mouse = mouseRef.current;
      const mouseTarget = mouseTargetRef.current;
      const elapsed = (performance.now() - startTimeRef.current) / 1000;

      mouse.x += (mouseTarget.x - mouse.x) * 0.15;
      mouse.y += (mouseTarget.y - mouse.y) * 0.15;

      ctx.font = `${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const p of particles) {
        const particleTime = elapsed - p.delay;
        if (particleTime < 0) continue;

        const fadeProgress = Math.min(particleTime / 1.5, 1);
        const easedFade = 1 - Math.pow(1 - fadeProgress, 2);
        const isActive = mouse.active || particleTime < 3.0;
        const shimmerVal = isActive ? Math.sin(elapsed * 2 + p.shimmer) * 0.1 : 0;
        p.currentAlpha = Math.max(0, p.baseAlpha * easedFade + shimmerVal);

        const moveProgress = Math.min(particleTime / 2.5, 1);
        const easedMove = 1 - Math.pow(1 - moveProgress, 3);

        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = size * 0.2;
          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * 4;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const pullStrength = 0.01 + easedMove * 0.08;
        p.vx += dx * pullStrength;
        p.vy += dy * pullStrength;

        if (isActive) {
          p.vx += Math.sin(elapsed * 0.5 + p.targetY * 0.1) * 0.15;
          p.vy += Math.cos(elapsed * 0.5 + p.targetX * 0.1) * 0.15;
          p.vx *= 0.92;
          p.vy *= 0.92;
        } else {
          p.vx *= 0.85;
          p.vy *= 0.85;
          if (particleTime > 4.0 && Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
            p.x = p.targetX;
            p.y = p.targetY;
            p.vx = 0;
            p.vy = 0;
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        ctx.fillStyle = `rgba(56, 218, 250, ${p.currentAlpha})`;
        ctx.fillText(p.char, p.x, p.y);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseTargetRef.current.x = e.clientX - rect.left;
      mouseTargetRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      mouseTargetRef.current.x = touch.clientX - rect.left;
      mouseTargetRef.current.y = touch.clientY - rect.top;
      mouseRef.current.active = true;
      if (e.cancelable) e.preventDefault();
    };
    const handleLeave = () => {
      mouseRef.current.active = false;
      mouseTargetRef.current.x = -1000;
      mouseTargetRef.current.y = -1000;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleLeave);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleLeave);

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleLeave);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleLeave);
    };
  }, [size, dataReady]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        cursor: 'crosshair',
        touchAction: 'none',
      }}
    />
  );
}
