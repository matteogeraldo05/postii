import { useRef, useState, useEffect } from "react";
import calendarImg from "../assets/images/Mail/calendar.png";
import createNoteImg from "../assets/images/Mail/create_note.png";
import pillImg from "../assets/images/Wii Menu/pill.png";
import selectSfx from "../assets/audio/select.wav?url";
import hoverSfx from "../assets/audio/hover.wav?url";
import postSelectSfx from "../assets/audio/message_select.wav?url";
import postGrabSfx from "../assets/audio/grab.wav?url";
import CalendarView from "./CalendarView";
import { supabase } from "../lib/supabase";

const clickSound = new Audio(selectSfx);
clickSound.volume = 0.1;
clickSound.load();

const hoverSound = new Audio(hoverSfx);
hoverSound.load();

const postSelectSound = new Audio(postSelectSfx);
postSelectSound.volume = 0.3;
postSelectSound.load();

const postGrabSound = new Audio(postGrabSfx);
postGrabSound.volume = 0.1;
postGrabSound.load();

type Note = {
  id: string;
  content: string;
  x: number;
  y: number;
};

type BoardPhase = "board" | "flash" | "transitioning" | "calendar" | "composing" | "reading";

type ModalAnim = "enter" | "idle" | "exit-up" | "shrink";

function PillButton({ label, onClick }: { label: string; onClick: () => void }) {
  const [flashKey, setFlashKey] = useState(0);

  return (
    <button
      onClick={() => {
        clickSound.currentTime = 0;
        clickSound.play();
        setFlashKey((k) => k + 1);
        onClick();
      }}
      onMouseEnter={() => {
        hoverSound.currentTime = 0;
        hoverSound.play();
      }}
      className="relative z-11 h-36 w-[362px] rounded-full shadow-[4px_6px_0_rgba(0,0,0,0.2)] transition-transform duration-[170ms] ease-out hover:scale-105 active:scale-99 fast-active"
    >
      <img src={pillImg} alt="" className="absolute inset-0 w-full h-full object-fill" />
      <div className="absolute inset-0 rounded-full border-4 border-[#31bdef]" />
      <span className="absolute inset-0 flex items-center justify-center text-5xl [font-family:RodinNTLG,sans-serif] text-[#3d3d3d]">
        {label}
      </span>
      {flashKey > 0 && (
        <div
          key={flashKey}
          className="absolute inset-0 bg-white rounded-full pointer-events-none animate-[camera-flash_0.9s_ease-out_forwards]"
          onAnimationEnd={() => setFlashKey(0)}
        />
      )}
    </button>
  );
}

function CircleButton({
  src, alt, side, label, onClick, onFlashEnd, exiting, entering, blocked,
}: {
  src: string; alt: string; side: "left" | "right"; label: string;
  onClick?: () => void; onFlashEnd?: () => void;
  exiting?: boolean; entering?: boolean; blocked?: boolean;
}) {
  const [flashKey, setFlashKey] = useState(0);
  const [hovered, setHovered] = useState(false);

  function handleClick() {
    if (blocked) return;
    clickSound.currentTime = 0;
    clickSound.play();
    setFlashKey((k) => k + 1);
    onClick?.();
  }

  const anim = exiting
    ? side === "left"
      ? "animate-[button-exit-left_0.5s_ease-in_forwards]"
      : "animate-[button-exit-right_0.5s_ease-in_forwards]"
    : entering
    ? side === "left"
      ? "animate-[back-button-enter_0.5s_ease-out_forwards]"
      : "animate-[pill-button-enter-right_0.5s_ease-out_forwards]"
    : "";

  return (
    <div className={`fixed bottom-14 ${side === "left" ? "left-14" : "right-14"} flex items-center justify-center ${anim}`}>
      {/* button description pill */}
      <div
        className="absolute bottom-full mb-10 whitespace-nowrap bg-white rounded-full text-zinc-500 text-3xl shadow-[4px_6px_8px_rgba(0,0,0,0.1)] border-3 border-gray-400/80 pointer-events-none z-11"
        style={{
          fontFamily: "RodinNTLG, sans-serif",
          padding: "13px 24px",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "scale(1)" : "scale(0.95)",
          transition: hovered
            ? "opacity 0.3s ease 0.2s, transform 0.3s ease 0.2s"
            : "opacity 0.2s ease 0s, transform 0.2s ease 0s",
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
        onMouseEnter={() => {
          if (blocked) return;
          setHovered(true);
          hoverSound.currentTime = 0;
          hoverSound.play();
        }}
        onMouseLeave={() => setHovered(false)}
        className="relative z-10 size-36 rounded-full border-4 border-[#31bdef] overflow-hidden cursor-pointer bg-transparent shadow-[4px_6px_0_rgba(0,0,0,0.2)] transition-transform duration-[170ms] ease-out hover:scale-110 active:scale-99 fast-active"
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        {flashKey > 0 && (
          <div
            key={flashKey}
            className="absolute inset-0 bg-white pointer-events-none animate-[camera-flash_0.9s_ease-out_forwards]"
            onAnimationEnd={() => {
              setFlashKey(0);
              onFlashEnd?.();
            }}
          />
        )}
      </button>
    </div>
  );
}

export default function MessageBoard() {
  const today = new Date();
  const dateStr = today
    .toLocaleDateString("en-US", { weekday: "short", month: "2-digit", day: "2-digit" })
    .replace(",", "");

  const [phase, setPhase] = useState<BoardPhase>("board");
  const [calendarEntered, setCalendarEntered] = useState(false);
  const transitionDest = useRef<"calendar" | "composing">("calendar");
  const [notes, setNotes] = useState<Note[]>([]);
  const [composeText, setComposeText] = useState("");
  const [modalAnim, setModalAnim] = useState<ModalAnim>("enter");
  const [readingNote, setReadingNote] = useState<Note | null>(null);
  const [pillsExiting, setPillsExiting] = useState(false);
  const [boardEntering, setBoardEntering] = useState(false);
  const [shaking, setShaking] = useState(false);

  // Drag + focus state
  const [topNoteId, setTopNoteId] = useState<string | null>(null);
  const [capShaking, setCapShaking] = useState(false);
  const noteEls = useRef<Map<string, HTMLDivElement>>(new Map());
  const notesRef = useRef<Note[]>([]);
  const dragState = useRef<{
    noteId: string;
    noteContent: string;
    startMouseX: number;
    startMouseY: number;
    startNoteX: number;
    startNoteY: number;
    latestMouseX: number;
    latestMouseY: number;
    committed: boolean;
    lastX: number;
    lastY: number;
  } | null>(null);
  const dragRafId = useRef(0);
  const topNoteIdRef = useRef<string | null>(null);

  // Keep notesRef / phaseRef current so the drag useEffect avoids stale closures
  useEffect(() => { notesRef.current = notes; }, [notes]);
  const phaseRef = useRef<BoardPhase>(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Load notes from Supabase on mount
  useEffect(() => {
    supabase.from("notes").select("*").then(({ data }) => {
      if (data) setNotes(data as Note[]);
    });
  }, []);

  // Drag system — all window listeners + RAF loop
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (phaseRef.current !== "board") return;
      
      for (const [id, el] of noteEls.current) {
        if (el.contains(e.target as Node)) {
          e.preventDefault();

          postGrabSound.currentTime = 0;
          postGrabSound.play();

          if (topNoteIdRef.current !== id) {
            topNoteIdRef.current = id;
            setTopNoteId(id);
          }
          const note = notesRef.current.find((n) => n.id === id);
          if (!note) return;
          dragState.current = {
            noteId: id,
            noteContent: note.content,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startNoteX: note.x,
            startNoteY: note.y,
            latestMouseX: e.clientX,
            latestMouseY: e.clientY,
            committed: false,
            lastX: note.x,
            lastY: note.y,
          };
          window.dispatchEvent(new CustomEvent("cursor-grab-start"));
          dragRafId.current = requestAnimationFrame(tick);
          return;
        }
      }
    }

    function onMouseMove(e: MouseEvent) {
      const ds = dragState.current;
      if (!ds) return;
      ds.latestMouseX = e.clientX;
      ds.latestMouseY = e.clientY;
    }

    function tick() {
      const ds = dragState.current;
      if (!ds) return;

      if (!ds.committed) {
        const dx = ds.latestMouseX - ds.startMouseX;
        const dy = ds.latestMouseY - ds.startMouseY;
        if (Math.sqrt(dx * dx + dy * dy) < 5) {
          dragRafId.current = requestAnimationFrame(tick);
          return;
        }
        ds.committed = true;
      }

      const dx = ds.latestMouseX - ds.startMouseX;
      const dy = ds.latestMouseY - ds.startMouseY;
      const boardW = window.innerWidth;
      const boardH = window.innerHeight;
      const CARD_W = 300;
      const CARD_H = 200;

      let newX = ds.startNoteX + (dx / boardW) * 100;
      let newY = ds.startNoteY + (dy / boardH) * 100;

      // Clamp so the card edge hits the boundary
      const maxX = 90 - (CARD_W / boardW) * 100;
      const maxY = 75 - (CARD_H / boardH) * 100;
      newX = Math.max(2, Math.min(maxX, newX));
      newY = Math.max(15, Math.min(maxY, newY));

      ds.lastX = newX;
      ds.lastY = newY;

      setNotes((prev) =>
        prev.map((n) => (n.id === ds.noteId ? { ...n, x: newX, y: newY } : n))
      );

      dragRafId.current = requestAnimationFrame(tick);
    }

    function commitDrag(ds: NonNullable<typeof dragState.current>) {
      supabase.from("notes").update({ x: ds.lastX, y: ds.lastY }).eq("id", ds.noteId);
    }

    function onMouseUp() {
      const ds = dragState.current;
      if (!ds) return;
      cancelAnimationFrame(dragRafId.current);
      dragState.current = null;
      window.dispatchEvent(new CustomEvent("cursor-grab-end"));

      if (!ds.committed) {
        // Treat as click → open reading modal
        postSelectSound.currentTime = 0;
        postSelectSound.play();
        openReading({ id: ds.noteId, content: ds.noteContent, x: ds.startNoteX, y: ds.startNoteY });
      } else {
        commitDrag(ds);
      }
    }

    function onMouseLeave() {
      const ds = dragState.current;
      if (!ds) return;
      cancelAnimationFrame(dragRafId.current);
      dragState.current = null;
      window.dispatchEvent(new CustomEvent("cursor-grab-end"));
      if (ds.committed) commitDrag(ds);
    }

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(dragRafId.current);
    };
  }, []);

  const showBoard = phase !== "calendar";
  const showCalendar = (phase === "transitioning" && transitionDest.current === "calendar") || phase === "calendar";
  const boardFadingOut = phase === "transitioning" && transitionDest.current === "calendar";
  const showCircleButtons = phase === "board" || phase === "flash" || phase === "transitioning";
  const blocked = phase !== "board";
  const buttonsExiting = phase === "transitioning";

  function handleCalendarEntered() {
    setCalendarEntered(true);
    setPhase("calendar");
  }

  function handleBack() {
    setBoardEntering(true);
    setPhase("board");
    setCalendarEntered(false);
    setTimeout(() => setBoardEntering(false), 600);
  }

  function openCompose() {
    setTopNoteId(null);
    topNoteIdRef.current = null;
    setComposeText("");
    setModalAnim("enter");
    setPillsExiting(false);
    setPhase("composing");
  }

  function openReading(note: Note) {
    setTopNoteId(null);
    topNoteIdRef.current = null;
    setReadingNote(note);
    setModalAnim("enter");
    setPillsExiting(false);
    setPhase("reading");
  }

  function handleComposeBack() {
    setPillsExiting(true);
    setModalAnim("exit-up");
  }

  function handlePost() {
    if (!composeText.trim()) { setShaking(true); return; }
    const x = 5 + Math.random() * 75;
    const y = 15 + Math.random() * 50;
    const id = crypto.randomUUID();
    const content = composeText.trim();
    setNotes((prev) => [...prev, { id, content, x, y }]);
    supabase.from("notes").insert({ id, content, x, y });
    setComposeText("");
    setPillsExiting(true);
    setModalAnim("shrink");
  }

  function handleReadClose() {
    setPillsExiting(true);
    setModalAnim("exit-up");
  }

  function onModalAnimEnd() {
    if (modalAnim === "enter") {
      setModalAnim("idle");
    } else if (modalAnim === "exit-up") {
      setBoardEntering(true);
      setPhase("board");
      setReadingNote(null);
      setTimeout(() => setBoardEntering(false), 600);
    } else if (modalAnim === "shrink") {
      setBoardEntering(true);
      setPhase("board");
      setTimeout(() => setBoardEntering(false), 600);
    }
  }

  // Check 10/day cap, then open compose if under limit
  async function handleCreateNote() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const { count } = await supabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString())
      .lt("created_at", endOfDay.toISOString());

    if ((count ?? 0) >= 10) {
      setCapShaking(true);
      return;
    }

    transitionDest.current = "composing";
    setPhase("flash");
    setTimeout(() => {
      setPhase("transitioning");
      setTimeout(() => openCompose(), 500);
    }, 200);
  }

  const modalAnimClass =
    modalAnim === "enter" ? "animate-[memo-enter_0.85s_ease-out_forwards]"
    : modalAnim === "exit-up" ? "animate-[memo-exit-up_0.4s_ease-in_forwards]"
    : modalAnim === "shrink" ? "animate-[memo-shrink_0.4s_ease-in_forwards]"
    : "";

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Board background */}
      {showBoard && (
        <div
          className={`absolute inset-0 bg-gradient-to-b from-[#cdcfd8] via-[#f1f1f1] to-[#cdcfd8] ${boardFadingOut ? "animate-[board-fade-out_0.5s_ease-out_forwards]" : ""}`}
        >
          <span className="fixed top-6 left-1/2 -translate-x-1/2 text-8xl text-zinc-700 [font-family:contb,sans-serif]">
            Postii
          </span>
          <span className="fixed bottom-14 left-1/2 -translate-x-1/2 text-6xl text-zinc-500 [font-family:RodinNTLG,sans-serif]">
            {dateStr}
          </span>
        </div>
      )}

      {/* Note cards on board */}
      {showBoard &&
        notes.map((note) => (
          <div
            key={note.id}
            ref={(el) => {
              if (el) noteEls.current.set(note.id, el);
              else noteEls.current.delete(note.id);
            }}
            onMouseEnter={() => {
              hoverSound.currentTime = 0;
              hoverSound.play();
              if (topNoteIdRef.current !== note.id) {
                topNoteIdRef.current = note.id;
                setTopNoteId(note.id);
              }
            }}
            className={`absolute w-[300px] h-[200px] transition-transform duration-150 ease-out hover:scale-110 ${boardFadingOut ? "animate-[board-fade-out_0.5s_ease-out_forwards]" : ""} ${phase !== "board" ? "pointer-events-none" : ""}`}
            style={{ left: `${note.x}%`, top: `${note.y}%`, zIndex: topNoteId === note.id ? 100 : 5 }}
          >
            {/* pushpin */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-[9px] w-[40px] h-[40px] rounded-full bg-[linear-gradient(350deg,#d4212b,#d4212b,#fca5a5)] border-[#d4212b] border-2 shadow-[4px_4px_1px_rgba(0,0,0,0.2)] z-10">
              {/* shine */}
              <div className="absolute top-1 left-1/4 w-3.5 h-2.5 rounded-[50%] bg-white z-20" />
            </div>
            {/* card */}
            <div className="bg-white rounded-[14px] border-2 border-[#A3A3A3] shadow-[8px_8px_2px_rgba(0,0,0,0.2)] overflow-hidden ring-4 ring-white h-full flex flex-col">
              <div className="bg-[#A3A3A3] h-[28px]" />
              <div className="px-[14px] py-[12px] text-center break-words whitespace-pre-wrap leading-tight [font-family:GrecoStd,sans-serif] text-3xl text-[#3d3d3d] flex flex-col justify-end h-full" style={{ paddingBottom: "30px" }}>
                {note.content.length > 20
                  ? `${note.content.slice(0, 20)}...`
                  : note.content}
                  <hr style={{ marginLeft: "18px", marginRight: "18px", border: "none", borderTop: "1px solid #BEBEBE" }} />
              </div>
            </div>
          </div>
        ))}

      {/* Scanline overlay */}
      {(phase === "composing" || phase === "reading") && (
        <div className="absolute inset-0 pointer-events-none z-20 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_2px,rgba(0,0,0,0.1)_2px,rgba(0,0,0,0.1)_4px)]" />
      )}

      {/* Compose modal */}
      {phase === "composing" && (
        <>
          <div className="absolute inset-0 z-30 flex items-center justify-center">
            <div className={modalAnimClass} onAnimationEnd={onModalAnimEnd}>
              <div
                className={`w-[720px] bg-white rounded-[28px] border-[3px] border-[#A3A3A3] shadow-[14px_14px_8px_rgba(0,0,0,0.2)] overflow-hidden ring-white ring-6${shaking ? " animate-[textarea-shake_0.4s_ease-in-out]" : ""}`}
                onAnimationEnd={() => { if (shaking) setShaking(false); }}
              >
                <div className="bg-[#A3A3A3] h-[60px] flex items-center justify-center text-white text-3xl [font-family:RodinNTLG,sans-serif]">Post</div>
                <div className="bg-white p-8">
                  <textarea
                    value={composeText}
                    onChange={(e) => setComposeText(e.target.value)}
                    maxLength={1000}
                    placeholder="Write a post..."
                    className="w-full bg-transparent border-none outline-none text-left placeholder:text-center [font-family:GrecoStd,sans-serif] text-4xl text-[#3d3d3d] resize-none min-h-[420px] leading-14 bg-[linear-gradient(to_bottom,transparent_55px,#d6d6d6_55px,#d6d6d6_56px)] [background-attachment:local] [background-repeat:repeat-y]"
                    style={{
                      padding: "0 44px",
                      backgroundSize: "calc(100% - 56px) 56px",
                      backgroundPosition: "18px 0"
                    }}
                  />
                  <hr style={{ marginLeft: "18px", marginRight: "18px", marginTop: "16px", marginBottom: "12px", border: "none", borderTop: "6px solid #BEBEBE" }} />
                  <div
                    className="relative flex items-center justify-center [font-family:RodinNTLG,sans-serif] text-[#b0b0b0] text-2xl"
                    style={{ padding: "20px 0 16px" }}
                  >
                    Postii
                    {(1000 - composeText.length) <= 50 && (
                      <span className="absolute right-20 top-3 [font-family:RodinNTLG,sans-serif] text-2xl text-red-500">
                        {1000 - composeText.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back pill */}
          <div
            className={`fixed bottom-14 left-14 z-50 ${pillsExiting ? "animate-[button-exit-left_0.5s_ease-in_forwards]" : "animate-[back-button-enter_0.5s_ease-out_forwards]"}`}
          >
            <div className="flex items-center justify-center scale-[0.85] origin-bottom-left">
              <div className="absolute w-140 h-48 rounded-full bg-gray-700/2 border-4 border-gray-400 shadow-[4px_6px_0_rgba(0,0,0,0.2)] z-0 -left-43" />
              <PillButton label="Back" onClick={handleComposeBack} />
            </div>
          </div>

          {/* Post pill */}
          <div
            className={`fixed bottom-14 right-14 z-50 ${pillsExiting ? "animate-[button-exit-right_0.5s_ease-in_forwards]" : "animate-[pill-button-enter-right_0.5s_ease-out_forwards]"}`}
          >
            <div className="flex items-center justify-center scale-[0.85] origin-bottom-right">
              <div className="absolute w-140 h-48 rounded-full bg-gray-700/2 border-4 border-gray-400 shadow-[4px_6px_0_rgba(0,0,0,0.2)] z-0 -right-43" />
              <PillButton label="Post" onClick={handlePost} />
            </div>
          </div>
        </>
      )}

      {/* Read modal */}
      {phase === "reading" && readingNote && (
        <>
          <div className="absolute inset-0 z-30 flex items-center justify-center">
            <div className={modalAnimClass} onAnimationEnd={onModalAnimEnd}>
              <div className="w-[720px] bg-white rounded-[28px] border-[3px] border-[#A3A3A3] shadow-[14px_14px_8px_rgba(0,0,0,0.2)] overflow-hidden ring-white ring-6">
                <div className="bg-[#A3A3A3] h-[60px] flex items-center justify-center text-white text-3xl [font-family:RodinNTLG,sans-serif]">Post</div>
                <div className="bg-white p-8">
                  <p
                    className="w-full [font-family:GrecoStd,sans-serif] text-4xl text-[#3d3d3d] min-h-[420px] whitespace-pre-wrap break-words leading-14 bg-[linear-gradient(to_bottom,transparent_55px,#d6d6d6_55px,#d6d6d6_56px)] [background-attachment:local] [background-repeat:repeat-y]"
                    style={{
                      padding: "0 44px",
                      backgroundSize: "calc(100% - 56px) 56px",
                      backgroundPosition: "18px 0"
                    }}
                  >
                    {readingNote.content}
                  </p>
                  <hr style={{ marginLeft: "18px", marginRight: "18px", marginTop: "16px", marginBottom: "12px", border: "none", borderTop: "6px solid #BEBEBE" }} />
                  <div
                    className="relative flex items-center justify-center [font-family:RodinNTLG,sans-serif] text-[#b0b0b0] text-2xl"
                    style={{ padding: "20px 0 16px" }}
                  >
                    Postii
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Close pill */}
          <div
            className={`fixed bottom-14 left-14 z-50 ${pillsExiting ? "animate-[button-exit-left_0.5s_ease-in_forwards]" : "animate-[back-button-enter_0.5s_ease-out_forwards]"}`}
          >
            <div className="flex items-center justify-center scale-[0.85] origin-bottom-left">
              <div className="absolute w-140 h-48 rounded-full bg-gray-700/2 border-4 border-gray-400 shadow-[4px_6px_0_rgba(0,0,0,0.2)] z-0 -left-43" />
              <PillButton label="Close" onClick={handleReadClose} />
            </div>
          </div>
        </>
      )}

      {/* Circle buttons */}
      {showCircleButtons && (
        <>
          <CircleButton
            src={calendarImg}
            alt="Calendar"
            side="left"
            label="Calendar"
            blocked={blocked}
            exiting={buttonsExiting}
            entering={boardEntering}
            onClick={() => {
              transitionDest.current = "calendar";
              setPhase("flash");
              setTimeout(() => setPhase("transitioning"), 200);
            }}
          />
          <CircleButton
            src={createNoteImg}
            alt="Create note"
            side="right"
            label="Create Post"
            blocked={blocked}
            exiting={buttonsExiting}
            entering={boardEntering}
            onClick={handleCreateNote}
          />
        </>
      )}

      {/* Cap-hit shake indicator — fixed ring that shakes over the create-note button */}
      {capShaking && (
        <div
          className="fixed bottom-14 right-14 pointer-events-none animate-[textarea-shake_0.4s_ease-in-out]"
          style={{ zIndex: 150 }}
          onAnimationEnd={() => setCapShaking(false)}
        >
          <div className="size-36 rounded-full border-4 border-red-400 opacity-80" />
        </div>
      )}

      {/* CalendarView */}
      {showCalendar && (
        <div className="absolute inset-0">
          <CalendarView
            onSelectDate={() => {}}
            onBack={handleBack}
            entering={!calendarEntered}
            onEnterEnd={handleCalendarEntered}
          />
        </div>
      )}
    </div>
  );
}
