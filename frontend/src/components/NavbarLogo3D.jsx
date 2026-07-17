import { useEffect, useRef } from "react";

export const NavbarLogo3D = () => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame;
    const loop = () => {
      const t = Date.now() / 1000;
      const pulse = 1 + Math.sin(t * 2) * 0.04;
      el.style.transform = `scale(${pulse})`;
      el.style.boxShadow = `0 0 ${12 + Math.sin(t * 1.5) * 6}px rgba(75,123,236,${0.2 + Math.sin(t * 1.5) * 0.1})`;
      frame = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div ref={ref} className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center transition-shadow">
      <span className="text-white font-extrabold text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">A</span>
    </div>
  );
};
