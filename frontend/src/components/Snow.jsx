import { useEffect, useRef } from "react";

// Global falling snow overlay with soft glowing flakes + depth parallax.
export const Snow = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let w, h;
    const COUNT = 130;
    const flakes = [];

    // Pre-render soft radial flake sprites (white + purple) for cheap rendering.
    const makeSprite = (rgb) => {
      const s = document.createElement("canvas");
      s.width = s.height = 32;
      const c = s.getContext("2d");
      const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, `rgba(${rgb},1)`);
      g.addColorStop(0.35, `rgba(${rgb},0.85)`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      c.fillStyle = g;
      c.beginPath();
      c.arc(16, 16, 16, 0, Math.PI * 2);
      c.fill();
      return s;
    };
    const whiteSprite = makeSprite("255,255,255");
    const purpleSprite = makeSprite("168,85,247");

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      const depth = Math.random(); // 0 far … 1 near
      flakes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        depth,
        size: 2 + depth * 8,
        speed: 0.3 + depth * 1.4,
        drift: (Math.random() - 0.5) * 0.5,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.005 + Math.random() * 0.015,
        swayAmp: 0.3 + depth * 0.9,
        baseAlpha: 0.12 + depth * 0.3,
        twinkle: Math.random() * Math.PI * 2,
        sprite: Math.random() < 0.5 ? purpleSprite : whiteSprite,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.sway += f.swaySpeed;
        f.twinkle += 0.03;
        f.y += f.speed;
        f.x += f.drift + Math.sin(f.sway) * f.swayAmp;
        if (f.y > h + 12) {
          f.y = -12;
          f.x = Math.random() * w;
        }
        if (f.x > w + 12) f.x = -12;
        if (f.x < -12) f.x = w + 12;
        const alpha = f.baseAlpha * (0.75 + 0.25 * Math.sin(f.twinkle));
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.drawImage(f.sprite, f.x - f.size / 2, f.y - f.size / 2, f.size, f.size);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[60] pointer-events-none"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
};
