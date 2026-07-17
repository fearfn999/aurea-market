import { useEffect, useRef } from "react";

export const NavbarLogo3D = () => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let time = 0;

    const initParticles = () => {
      particlesRef.current = Array.from({ length: 8 }, () => ({
        x: Math.random() * 36,
        y: Math.random() * 36,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 - 0.15,
        life: Math.random() * 100 + 50,
        maxLife: Math.random() * 100 + 50,
        size: Math.random() * 1.5 + 0.5,
      }));
    };
    initParticles();

    const draw = () => {
      time += 0.02;
      ctx.clearRect(0, 0, 36, 42);

      // Glow layers
      for (let i = 4; i >= 0; i--) {
        const pulse = Math.sin(time * 2 + i) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(18, 20, 14 + i * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96, 165, 250, ${0.04 * pulse})`;
        ctx.fill();
      }

      // Particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.5;
        if (p.life <= 0) {
          p.x = 18 + (Math.random() - 0.5) * 20;
          p.y = 20 + (Math.random() - 0.5) * 16;
          p.life = p.maxLife;
        }
        const alpha = Math.max(0, p.life / p.maxLife) * 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${alpha})`;
        ctx.fill();
      });

      // Card bg with border glow
      const grad = ctx.createLinearGradient(0, 0, 36, 42);
      grad.addColorStop(0, "#1E3A5F");
      grad.addColorStop(0.5, "#1E40AF");
      grad.addColorStop(1, "#1E3A5F");
      ctx.beginPath();
      ctx.roundRect(0, 4, 36, 36, 8);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.shadowColor = "rgba(59,130,246,0.6)";
      ctx.shadowBlur = 12;

      // Neon border
      ctx.beginPath();
      ctx.roundRect(0.5, 4.5, 35, 35, 8);
      ctx.strokeStyle = `rgba(96, 165, 250, ${Math.sin(time * 1.5) * 0.2 + 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Scan line
      const scanY = ((time * 30) % 36) + 4;
      ctx.beginPath();
      ctx.moveTo(2, scanY);
      ctx.lineTo(34, scanY);
      ctx.strokeStyle = `rgba(147, 197, 253, ${Math.sin(time * 3) * 0.08 + 0.12})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // "A" letter with glow
      ctx.shadowColor = "rgba(59,130,246,0.8)";
      ctx.shadowBlur = 18;
      ctx.font = "bold 22px 'Inter', 'Segoe UI', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const letterGrad = ctx.createLinearGradient(0, 8, 0, 38);
      letterGrad.addColorStop(0, "#93C5FD");
      letterGrad.addColorStop(0.5, "#FFFFFF");
      letterGrad.addColorStop(1, "#60A5FA");
      ctx.fillStyle = letterGrad;
      ctx.fillText("A", 18, 22);

      ctx.shadowBlur = 0;

      // Top accent line
      const accentAlpha = Math.sin(time * 2) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.moveTo(8, 6);
      ctx.lineTo(28, 6);
      ctx.strokeStyle = `rgba(96, 165, 250, ${accentAlpha * 0.5})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={36}
      height={42}
      style={{ width: 36, height: 42, display: "block" }}
    />
  );
};