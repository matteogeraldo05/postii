import { useState } from "react";
import calendarImg from "../assets/images/Mail/calendar.png";
import createNoteImg from "../assets/images/Mail/create_note.png";
import selectSfx from "../assets/audio/select.wav?url";

const clickSound = new Audio(selectSfx);
clickSound.load();

function CircleButton({ src, alt, side }: { src: string; alt: string; side: "left" | "right" }) {
  const [flashKey, setFlashKey] = useState(0);

  function handleClick() {
    clickSound.currentTime = 0;
    clickSound.play();
    setFlashKey((k) => k + 1);
  }

  return (
    <div className={`fixed bottom-14 ${side === "left" ? "left-14" : "right-14"} flex items-center justify-center`}>
      <div
        className={`absolute w-80 h-43 rounded-full bg-gray-700/2 border-4 border-gray-400 shadow-[4px_6px_0_rgba(0,0,0,0.1)] ${side === "left" ? "-left-43" : "-right-43"}`}
      />
      <button
        onClick={handleClick}
        className="relative z-10 size-32 rounded-full border-4 border-[#31bdef] overflow-hidden cursor-pointer bg-transparent shadow-[4px_6px_0_rgba(0,0,0,0.1)] transition-transform duration-[170ms] ease-out hover:scale-110 active:scale-99 fast-active"
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
      <CircleButton src={calendarImg} alt="Calendar" side="left" />
      <span
        className="fixed bottom-14 left-1/2 -translate-x-1/2 text-6xl text-zinc-500"
        style={{ fontFamily: "RodinNTLG, sans-serif" }}
      >
        Fri 05/09
      </span>
      <CircleButton src={createNoteImg} alt="Create note" side="right" />
    </div>
  );
}
