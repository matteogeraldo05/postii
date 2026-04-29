import { useState } from "react";
import calendarImg from "../assets/images/Mail/calendar.png";
import createNoteImg from "../assets/images/Mail/create_note.png";
import selectSfx from "../assets/audio/select.wav?url";
import hoverSfx from "../assets/audio/hover.wav?url";

const clickSound = new Audio(selectSfx);
clickSound.load();

const hoverSound = new Audio(hoverSfx);
hoverSound.load();

function CircleButton({ src, alt, side, label }: { src: string; alt: string; side: "left" | "right"; label: string }) {
  const [flashKey, setFlashKey] = useState(0);
  const [hovered, setHovered] = useState(false);

  function handleClick() {
    clickSound.currentTime = 0;
    clickSound.play();
    setFlashKey((k) => k + 1);
  }

  return (
    <div className={`fixed bottom-14 ${side === "left" ? "left-14" : "right-14"} flex items-center justify-center`}>
      {/* button descritpion pill */}
      <div
        className="absolute bottom-full mb-10 whitespace-nowrap bg-white rounded-full text-zinc-500 text-3xl shadow-[4px_6px_8px_rgba(0,0,0,0.1)] border-3 border-gray-400/80 pointer-events-none z-11"
        style={{
          fontFamily: "RodinNTLG, sans-serif",
          padding: "13px 24px",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "scale(1)" : "scale(0.95)",
          transition: hovered ? "opacity 0.3s ease 0.2s, transform 0.3s ease 0.2s" : "opacity 0.2s ease 0s, transform 0.2s ease 0s",
        }}
      >
        {label}
      </div>

      {/* background pill */}
      <div
        className={`absolute w-85 h-48 rounded-full bg-gray-700/2 border-4 border-gray-400 shadow-[4px_6px_0_rgba(0,0,0,0.2)] z-0 ${side === "left" ? "-left-43" : "-right-43"}`}
      />

      <button
        onClick={handleClick}
        onMouseEnter={() => { setHovered(true); hoverSound.currentTime = 0; hoverSound.play(); }}
        onMouseLeave={() => setHovered(false)}
        className="relative z-10 size-36 rounded-full border-4 border-[#31bdef] overflow-hidden cursor-pointer bg-transparent shadow-[4px_6px_0_rgba(0,0,0,0.2)] transition-transform duration-[170ms] ease-out hover:scale-110 active:scale-99 fast-active"
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        {flashKey > 0 && (
          <div
            key={flashKey}
            className="absolute inset-0 bg-white pointer-events-none animate-[camera-flash_0.9s_ease-out_forwards]"
            onAnimationEnd={() => setFlashKey(0)}
          />
        )}
      </button>
    </div>
  );
}

export default function MessageBoard() {
  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-[#cdcfd8] via-[#f1f1f1] to-[#cdcfd8]">
      <span
        className="fixed top-6 left-1/2 -translate-x-1/2 text-8xl text-zinc-700"
        style={{ fontFamily: "contb, sans-serif" }}
      >
        Postii
      </span>
      <CircleButton src={calendarImg} alt="Calendar" side="left" label="Calendar" />
      <span
        className="fixed bottom-14 left-1/2 -translate-x-1/2 text-6xl text-zinc-500"
        style={{ fontFamily: "RodinNTLG, sans-serif" }}
      >
        Fri 05/09
      </span>
      <CircleButton src={createNoteImg} alt="Create note" side="right" label="Create Post" />
    </div>
  );
}
