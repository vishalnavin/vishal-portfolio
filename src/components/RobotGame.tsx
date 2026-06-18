import { useRef, useEffect, useState, useCallback } from 'react';
import '@/styles/RobotGame.css';

const SCALE = 2;
const PX_W = 16;
const PX_H = 18;
const BLOB_W = PX_W * SCALE;
const BLOB_H = PX_H * SCALE;

// Physics — tuned so a full jump clears the course's gaps comfortably.
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MAX_SPEED = 3.4;
const ACCEL = 0.7;
const FRICTION = 0.8;
const MAX_FALL = 14;
const BLOCK_H = 12;
const CELL_COUNT = 5;

// Theme accent (site cyan)
const ACCENT = '#38dafa';
const ACCENT_RGB = '56, 218, 250';

interface Platform {
  x: number;
  y: number;
  w: number;
}

interface Cell {
  x: number;
  y: number;
  collected: boolean;
}

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  frame: number;
  status: 'spawning' | 'playing' | 'dead' | 'won';
  bounces: number;
}

type Ctx = CanvasRenderingContext2D;

function drawBlob(ctx: Ctx, x: number, y: number, frame: number, onGround: boolean, isIdle: boolean) {
  const B = '#ccd6f6';
  const D = '#8892b0';
  const EY = '#0a192f';
  const SH = ACCENT;
  const CK = ACCENT;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(SCALE, SCALE);

  const wf = !isIdle && onGround ? Math.floor(frame / 10) % 2 : 0;
  const bob = isIdle ? (Math.sin(frame * 0.06) > 0.3 ? 1 : 0) : 0;

  ctx.fillStyle = B;
  ctx.fillRect(4, 0 + bob, 8, 2);
  ctx.fillRect(2, 2 + bob, 12, 2);
  ctx.fillRect(1, 4 + bob, 14, 7);
  ctx.fillRect(0, 6 + bob, 1, 3);
  ctx.fillRect(15, 6 + bob, 1, 3);
  ctx.fillRect(2, 11 + bob, 12, 2);
  ctx.fillRect(4, 13 + bob, 8, 1);

  ctx.fillStyle = D;
  ctx.fillRect(3, 12 + bob, 10, 1);

  ctx.fillStyle = B;
  const lA = wf;
  const lB = 1 - wf;
  ctx.fillRect(3, 14, 3, 2 + lA);
  ctx.fillRect(10, 14, 3, 2 + lB);
  ctx.fillRect(2, 15 + lA, 5, 2);
  ctx.fillRect(9, 15 + lB, 5, 2);

  ctx.fillStyle = EY;
  ctx.fillRect(2, 4 + bob, 4, 4);
  ctx.fillRect(10, 4 + bob, 4, 4);

  ctx.fillStyle = SH;
  ctx.fillRect(2, 4 + bob, 2, 2);
  ctx.fillRect(10, 4 + bob, 2, 2);

  ctx.fillStyle = CK;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(1, 8 + bob, 2, 1);
  ctx.fillRect(13, 8 + bob, 2, 1);
  ctx.globalAlpha = 1;

  ctx.fillStyle = EY;
  ctx.fillRect(5, 9 + bob, 1, 1);
  ctx.fillRect(6, 10 + bob, 4, 1);
  ctx.fillRect(10, 9 + bob, 1, 1);

  ctx.restore();
}

function drawPlatform(ctx: Ctx, bx: number, by: number, bw: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(bx + 3, by + BLOCK_H, bw - 3, 4);
  ctx.fillStyle = '#112240';
  ctx.fillRect(bx, by, bw, BLOCK_H);
  ctx.fillStyle = `rgba(${ACCENT_RGB},0.7)`;
  ctx.fillRect(bx, by, bw, 2);
  ctx.fillStyle = `rgba(${ACCENT_RGB},0.12)`;
  for (let px = bx + 7; px < bx + bw - 4; px += 11) ctx.fillRect(px, by + 4, 2, 2);
  ctx.restore();
}

function drawBrainCell(ctx: Ctx, ex: number, ey: number, idx: number, t: number) {
  const bob = Math.sin(t * 0.002 + idx * 1.4) * 3;
  const cx = Math.round(ex);
  const cy = Math.round(ey + bob);

  ctx.save();
  ctx.globalAlpha = 0.14 + 0.06 * Math.sin(t * 0.003 + idx);
  ctx.fillStyle = '#9060c0';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 16, 19, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#bf9fd4';
  const DN: [number, number, number, number][] = [
    [0, -9, 2.2, 3.8],
    [-6, -6.5, 2.7, 2.2],
    [6, -6.5, 2.7, 2.2],
    [-8.5, 0, 3.2, 2.2],
    [8.5, 0, 3.2, 2.2],
    [-5, 7.5, 2.7, 3.2],
    [5, 7.5, 2.7, 3.2],
  ];
  DN.forEach(([dx, dy, rx, ry]) => {
    ctx.beginPath();
    ctx.ellipse(cx + dx, cy + dy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = '#bf9fd4';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 6, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#edddf8';
  ctx.beginPath();
  ctx.ellipse(cx - 1.6, cy - 2.2, 2.2, 2.8, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Build a self-contained, reachable zig-zag course down a tall world.
function buildLevel(vw: number) {
  const pw = Math.min(170, Math.max(120, vw * 0.16));
  const margin = 50;
  const dropPerStep = 120; // vertical gap between platforms
  const STEPS = 12;

  const platforms: Platform[] = [];
  const cells: Cell[] = [];

  // Wide starting platform near the top
  const startX = vw / 2 - pw / 2;
  let py = 220;
  platforms.push({ x: startX, y: py, w: pw + 40 });

  // Zig-zag descent; horizontal offset stays within a single jump's reach
  let px = startX;
  let dir = 1;
  for (let i = 1; i <= STEPS; i++) {
    py += dropPerStep;
    px += dir * (pw * 0.95);
    if (px < margin) {
      px = margin;
      dir = 1;
    } else if (px > vw - pw - margin) {
      px = vw - pw - margin;
      dir = -1;
    } else {
      dir *= -1;
    }
    platforms.push({ x: px, y: py, w: pw });
  }

  // Place 5 cells floating just above evenly-spread platforms
  const cellSteps = [2, 4, 6, 8, 10];
  cellSteps.forEach((idx) => {
    const p = platforms[idx];
    cells.push({ x: p.x + p.w / 2, y: p.y - 34, collected: false });
  });

  const worldBottom = py + 500;
  return { platforms, cells, worldBottom };
}

const RobotGame = ({ active }: { active: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const blobRef = useRef<Blob | null>(null);
  const platformsRef = useRef<Platform[]>([]);
  const cellsRef = useRef<Cell[]>([]);
  const cameraRef = useRef(0);
  const worldBottomRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const jumpLatchRef = useRef(false);

  const [gameStatus, setGameStatus] = useState<'playing' | 'dead' | 'won'>('playing');
  const [restartKey, setRestartKey] = useState(0);
  const [cellsCollected, setCellsCollected] = useState(0);

  const restart = useCallback(() => setRestartKey((k) => k + 1), []);

  useEffect(() => {
    if (!active) {
      cancelAnimationFrame(animRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Lock page scroll while the overlay game is active
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const { platforms, cells, worldBottom } = buildLevel(canvas.width);
    platformsRef.current = platforms;
    cellsRef.current = cells;
    worldBottomRef.current = worldBottom;
    setCellsCollected(0);
    setGameStatus('playing');

    const start = platforms[0];
    blobRef.current = {
      x: Math.round(start.x + start.w / 2 - BLOB_W / 2),
      y: start.y - BLOB_H - 220,
      vx: 0,
      vy: 0,
      onGround: false,
      frame: 0,
      status: 'spawning',
      bounces: 0,
    };
    cameraRef.current = blobRef.current.y - canvas.height * 0.4;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && blobRef.current?.status === 'dead') {
        restart();
        return;
      }
      keysRef.current.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown'].includes(e.code))
        e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const loop = () => {
      const a = blobRef.current;
      if (!a || a.status === 'dead' || a.status === 'won') return;

      if (canvas.width !== window.innerWidth) canvas.width = window.innerWidth;
      if (canvas.height !== window.innerHeight) canvas.height = window.innerHeight;

      a.frame++;

      // --- input + horizontal movement ---
      if (a.status === 'playing') {
        const keys = keysRef.current;
        const left = keys.has('ArrowLeft') || keys.has('KeyA');
        const right = keys.has('ArrowRight') || keys.has('KeyD');
        const jump = keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW');

        if (left) a.vx = Math.max(a.vx - ACCEL, -MAX_SPEED);
        else if (right) a.vx = Math.min(a.vx + ACCEL, MAX_SPEED);
        else a.vx *= FRICTION;

        if (jump && a.onGround && !jumpLatchRef.current) {
          a.vy = JUMP_FORCE;
          a.onGround = false;
          jumpLatchRef.current = true;
        }
        if (!jump) jumpLatchRef.current = false;

        a.x += a.vx;
        if (a.x < 0) {
          a.x = 0;
          a.vx = 0;
        }
        if (a.x + BLOB_W > canvas.width) {
          a.x = canvas.width - BLOB_W;
          a.vx = 0;
        }
      }

      // --- gravity ---
      a.vy = Math.min(a.vy + GRAVITY, MAX_FALL);
      a.y += a.vy;

      // --- platform collision (landing only, when falling) ---
      a.onGround = false;
      if (a.vy >= 0) {
        for (const p of platformsRef.current) {
          const rBot = a.y + BLOB_H;
          const prev = rBot - a.vy;
          if (
            a.x + BLOB_W > p.x + 2 &&
            a.x < p.x + p.w - 2 &&
            prev <= p.y + 6 &&
            rBot >= p.y - 1
          ) {
            a.y = p.y - BLOB_H;
            a.vy = 0;
            a.onGround = true;
            if (a.status === 'spawning') {
              a.bounces++;
              if (a.bounces === 1) a.vy = -7;
              else if (a.bounces === 2) a.vy = -3;
              else a.status = 'playing';
            }
            break;
          }
        }
      }

      // --- camera follows the blob vertically ---
      const targetCam = a.y - canvas.height * 0.42;
      cameraRef.current += (targetCam - cameraRef.current) * 0.12;
      const cam = cameraRef.current;

      // --- death by falling ---
      if (a.y > worldBottomRef.current) {
        a.status = 'dead';
        setGameStatus('dead');
        return;
      }

      // --- collect cells ---
      if (a.status === 'playing') {
        const aCx = a.x + BLOB_W / 2;
        const aCy = a.y + BLOB_H / 2;
        cellsRef.current.forEach((cell) => {
          if (cell.collected) return;
          if (Math.abs(aCx - cell.x) < 26 && Math.abs(aCy - cell.y) < 30) {
            cell.collected = true;
            setCellsCollected((c) => c + 1);
          }
        });
        if (cellsRef.current.every((c) => c.collected)) {
          a.status = 'won';
          setGameStatus('won');
          return;
        }
      }

      // --- render ---
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      platformsRef.current.forEach((p) => {
        const sy = p.y - cam;
        if (sy > -BLOCK_H - 8 && sy < canvas.height + 8) drawPlatform(ctx, p.x, sy, p.w);
      });

      const t = a.frame * 16;
      cellsRef.current.forEach((cell, idx) => {
        if (cell.collected) return;
        const sy = cell.y - cam;
        if (sy > -30 && sy < canvas.height + 30) drawBrainCell(ctx, cell.x, sy, idx, t);
      });

      const sy = a.y - cam;
      const isIdle = a.onGround && Math.abs(a.vx) < 0.25 && a.status === 'playing';
      if (sy > -BLOB_H && sy < canvas.height + 40)
        drawBlob(ctx, a.x, sy, a.frame, a.onGround, isIdle);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      document.body.style.overflow = prevOverflow;
      keysRef.current.clear();
      jumpLatchRef.current = false;
    };
  }, [active, restartKey, restart]);

  if (!active) return null;

  return (
    <>
      <canvas ref={canvasRef} className="robot-game-canvas" />

      {gameStatus === 'playing' && (
        <>
          <div className="game-hint">
            <span className="game-key">← →</span>
            move
            <span className="game-key">space</span>
            jump
          </div>
          <div className="cell-counter">
            <span className="cell-counter-pip" />
            <span className="cell-counter-text">
              {cellsCollected} / {CELL_COUNT}
            </span>
          </div>
        </>
      )}

      {gameStatus === 'dead' && (
        <div className="robot-game-status robot-game-status--dead">
          <div className="robot-game-status-title">you fell</div>
          <div className="robot-game-status-sub">the brain cells await</div>
          <button className="robot-game-status-btn" onClick={restart}>
            try again
          </button>
          <div className="robot-game-status-hint">or press space</div>
        </div>
      )}

      {gameStatus === 'won' && (
        <div className="robot-game-status robot-game-status--won">
          <div className="robot-game-status-title">neurons restored</div>
          <div className="robot-game-status-sub">all {CELL_COUNT} brain cells recovered</div>
          <button className="robot-game-status-btn" onClick={restart}>
            play again
          </button>
        </div>
      )}
    </>
  );
};

export default RobotGame;
