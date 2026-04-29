import { useEffect, useRef } from "react";
import pointerImg from "../assets/images/Pointer/pointer.png";

const HOTSPOT_X = 47;
const HOTSPOT_Y = 10;
const LERP = 0.3;

export default function CustomCursor() {
  const imgRef = useRef<HTMLImageElement>(null);
  const target = useRef({ x: -200, y: -200 });
  const current = useRef({ x: -200, y: -200 });
  const rafId = useRef(0);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      target.current = { x: e.clientX, y: e.clientY };
    }

    function tick() {
      const t = target.current;
      const c = current.current;

      c.x += (t.x - c.x) * LERP;
      c.y += (t.y - c.y) * LERP;

      const el = imgRef.current;
      if (el) {
        const w = el.naturalWidth || 0;
        const h = el.naturalHeight || 0;
        const x = Math.max(0, Math.min(c.x - HOTSPOT_X, window.innerWidth - w));
        const y = Math.max(0, Math.min(c.y - HOTSPOT_Y, window.innerHeight - h));
        el.style.transform = `translate(${x}px, ${y}px)`;
      }

      rafId.current = requestAnimationFrame(tick);
    }

    window.addEventListener("mousemove", onMouseMove);
    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <img
      ref={imgRef}
      src={pointerImg}
      alt=""
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 9999,
        willChange: "transform",
        userSelect: "none",
      }}
    />
  );
}
