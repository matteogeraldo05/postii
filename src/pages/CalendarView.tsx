import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import envelopeImg from "../assets/images/Mail/envelope_notif.png";
import leftArrowImg from "../assets/images/Wii Menu/arrow_left.png";
import rightArrowImg from "../assets/images/Wii Menu/arrow_right.png";
import pillImg from "../assets/images/Wii Menu/pill.png";
import selectSfx from "../assets/audio/select.wav?url";
import splashSelectSfx from "../assets/audio/splash_select.wav?url";
import hoverSfx from "../assets/audio/hover.wav?url";

const clickSound = new Audio(selectSfx);
clickSound.volume = 0.1;
clickSound.load();

const hoverSound = new Audio(hoverSfx);
hoverSound.load();

const arrowClickSound = new Audio(splashSelectSfx);
arrowClickSound.volume = 0.4;
arrowClickSound.load();

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function dayColor(dow: number, isFuture: boolean): string {
  if (isFuture) return "#b0b0b0";
  if (dow === 0) return "#e8534a";
  if (dow === 6) return "#4a90d9";
  return "#3d3d3d";
}

interface CalendarViewProps {
  onSelectDate: (date: Date) => void;
  onBack: () => void;
  entering?: boolean;
  onEnterEnd?: () => void;
}

export default function CalendarView({ onSelectDate, onBack, entering, onEnterEnd }: CalendarViewProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [postedDates, setPostedDates] = useState<Set<string>>(new Set());
  const [leftFlashKey, setLeftFlashKey] = useState(0);
  const [rightFlashKey, setRightFlashKey] = useState(0);
  const [backExiting, setBackExiting] = useState(false);

  useEffect(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    // Widen by 1 day each side so local-timezone dates at month boundaries are never missed
    const start = new Date(year, month, 0); // last day of prev month (so we start 1 day before)
    const end = new Date(year, month + 1, 2); // 2 days into next month
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("created_at")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());
      if (cancelled || error || !data) return;
      const set = new Set<string>();
      for (const row of data) {
        const d = new Date(row.created_at);
        // Only keep dates whose LOCAL month matches the viewed month
        if (d.getFullYear() === year && d.getMonth() === month) {
          set.add(`${year}-${month}-${d.getDate()}`);
        }
      }
      setPostedDates(set);
    })();
    return () => { cancelled = true; };
  }, [viewMonth]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells = Array.from({ length: 42 });

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const monthLabel = viewMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function playHover() {
    hoverSound.currentTime = 0;
    hoverSound.play().catch(() => {});
  }

  function playClick() {
    clickSound.currentTime = 0;
    clickSound.play().catch(() => {});
  }

  function goPrevMonth() {
    arrowClickSound.currentTime = 0;
    arrowClickSound.play().catch(() => {});
    setLeftFlashKey((k) => k + 1);
    setViewMonth(new Date(year, month - 1, 1));
  }

  function goNextMonth() {
    arrowClickSound.currentTime = 0;
    arrowClickSound.play().catch(() => {});
    setRightFlashKey((k) => k + 1);
    setViewMonth(new Date(year, month + 1, 1));
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* background */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#cdcfd8] via-[#f1f1f1] to-[#cdcfd8]"
        style={entering ? { animation: "calendar-bg-enter 0.6s ease-out 0.5s both" } : undefined}
      />
      {/* scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background:
            "repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)",
        }}
      />
      {/* content */}
      <div
        className="absolute inset-0"
        style={entering ? { animation: "calendar-enter 0.85s ease-out forwards" } : undefined}
        onAnimationEnd={entering ? onEnterEnd : undefined}
      >

      {/* calendar centered */}
      <div
        className="absolute inset-0 flex items-center justify-center z-10"
        style={backExiting ? { animation: "calendar-exit-up 0.5s ease-in forwards" } : undefined}
      >
        <div className="flex flex-col items-center bg-[#F0F0F0] border-3 border-[#979797] ring-4 ring-[#F0F0F0] shadow-[14px_14px_8px_rgba(0,0,0,0.2)]">
          {/* 7-col grid */}
          <div className="grid grid-cols-7 gap-0">
            {DAY_HEADERS.map((label, idx) => (
              <div
                key={`hdr-${label}`}
                className="w-24 h-10 flex items-center justify-center text-xl font-semibold border-2 border-[#979797]"
                style={{
                  fontFamily: "RodinNTLG, sans-serif",
                  color: dayColor(idx, false),
                }}
              >
                {label}
              </div>
            ))}

            {cells.map((_, i) => {
              const isLeading = i < firstDow;
              const isTrailing = i >= firstDow + daysInMonth;
              const isAdjacent = isLeading || isTrailing;

              if (isAdjacent) {
                const adjDay = isLeading
                  ? daysInPrevMonth - (firstDow - 1 - i)
                  : i - firstDow - daysInMonth + 1;
                const adjDow = isLeading
                  ? new Date(year, month - 1, adjDay).getDay()
                  : new Date(year, month + 1, adjDay).getDay();
                return (
                  <div
                    key={`adj-${i}`}
                    className="relative w-24 h-16 border-2 border-[#979797] bg-[#DCDCDC] overflow-hidden flex items-center justify-center"
                  >
                    <span
                      className="text-3xl"
                      style={{ fontFamily: "RodinNTLG, sans-serif", color: dayColor(adjDow, true) }}
                    >
                      {adjDay}
                    </span>
                  </div>
                );
              }

              const dayNum = i - firstDow + 1;
              const cellDate = new Date(year, month, dayNum);
              const dow = cellDate.getDay();
              const isFuture = cellDate > today;
              const isToday = cellDate.getTime() === today.getTime();
              const isClickable = !isFuture;
              const hasPost = postedDates.has(`${year}-${month}-${dayNum}`);

              const bg = isToday ? "#f9f29d" : "#F0F0F0";
              const numberColor = dayColor(dow, isFuture);

              const interactiveClasses = isClickable
                ? "cursor-pointer hover:scale-120 hover:z-10 transition-transform duration-150 ease-out hover:border-3"
                : "";

              return (
                <div
                  key={`cell-${i}`}
                  className={`relative z-0 w-24 h-16 border-2 border-[#979797] flex items-center justify-center ${interactiveClasses}`}
                  style={{ backgroundColor: bg }}
                  onMouseEnter={isClickable ? playHover : undefined}
                  onClick={
                    isClickable
                      ? () => {
                          playClick();
                          setBackExiting(true);
                          setTimeout(() => onSelectDate(cellDate), 500);
                        }
                      : undefined
                  }
                >
                  <span
                    className="text-3xl"
                    style={{
                      fontFamily: "RodinNTLG, sans-serif",
                      color: numberColor,
                    }}
                  >
                    {dayNum}
                  </span>
                  {hasPost && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <img
                        src={envelopeImg}
                        alt=""
                        className="absolute bottom-1 right-1 w-6 h-6 object-contain"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* month label */}
          <div className="w-full flex items-center justify-end border-t-2 border-[#979797]" style={{ padding: "20px 24px" }}>
            <span
              className="text-5xl"
              style={{ fontFamily: "RodinNTLG, sans-serif", color: "#8C8C8C" }}
            >
              {monthLabel}
            </span>
          </div>
        </div>
      </div>

      {/* left arrow */}
      {entering !== true && (
      <div className="fixed left-6 top-2/5 z-20" style={{ animation: backExiting ? "arrow-exit-left 0.5s ease-in forwards" : "arrow-enter-left 0.5s ease-out forwards" }}>
      <button
        onClick={goPrevMonth}
        onMouseEnter={playHover}
        className="bg-transparent border-0 p-0 cursor-pointer hover:scale-130 transition-transform duration-[170ms] ease-out active:scale-99 fast-active"
      >
        <div className="relative inline-block animate-[nudge-left_1.8s_ease-in-out_infinite]">
          <img src={leftArrowImg} alt="Previous month" className="h-28 w-auto" />
          {leftFlashKey > 0 && (
            <div
              key={leftFlashKey}
              className="absolute inset-0 bg-white pointer-events-none animate-[camera-flash_0.9s_ease-out_forwards]"
              style={{
                WebkitMaskImage: `url(${leftArrowImg})`,
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "center",
                maskImage: `url(${leftArrowImg})`,
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
              onAnimationEnd={() => setLeftFlashKey(0)}
            />
          )}
        </div>
      </button>
      </div>
      )}

      {/* right arrow */}
      {entering !== true && (
      <div className="fixed right-6 top-2/5 z-20" style={{ animation: backExiting ? "arrow-exit-right 0.5s ease-in forwards" : "arrow-enter-right 0.5s ease-out forwards" }}>
      {isCurrentMonth ? (
        <img
          src={rightArrowImg}
          alt=""
          className="h-28 w-auto opacity-30"
        />
      ) : (
        <button
          onClick={goNextMonth}
          onMouseEnter={playHover}
          className="bg-transparent border-0 p-0 cursor-pointer hover:scale-130 transition-transform duration-[170ms] ease-out active:scale-99 fast-active"
        >
          <div className="relative inline-block animate-[nudge-right_1.8s_ease-in-out_infinite]">
            <img src={rightArrowImg} alt="Next month" className="h-28 w-auto" />
            {rightFlashKey > 0 && (
              <div
                key={rightFlashKey}
                className="absolute inset-0 bg-white pointer-events-none animate-[camera-flash_0.9s_ease-out_forwards]"
                style={{
                  WebkitMaskImage: `url(${rightArrowImg})`,
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskImage: `url(${rightArrowImg})`,
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                }}
                onAnimationEnd={() => setRightFlashKey(0)}
              />
            )}
          </div>
        </button>
      )}
      </div>
      )}

      {/* back pill */}
      {entering !== true && (
        <div
          className="fixed bottom-14 left-14 z-20"
          style={{
            animation: backExiting
              ? "button-exit-left 0.5s ease-in forwards"
              : "back-button-enter 0.5s ease-out forwards",
          }}
        >
          <div className="flex items-center justify-center scale-[0.85] origin-bottom-left">
            {/* background pill */}
            <div
              className="absolute w-140 h-48 rounded-full bg-gray-700/8 border-4 border-gray-400 shadow-[4px_6px_0_rgba(0,0,0,0.2)] z-0 -left-43"
            />
            <button
              onClick={() => {
                playClick();
                setBackExiting(true);
                setTimeout(onBack, 500);
              }}
              onMouseEnter={playHover}
              className="relative z-11 h-36 w-[362px] shadow-[4px_6px_0_rgba(0,0,0,0.2)] transition-transform duration-[170ms] ease-out hover:scale-105 active:scale-99 fast-active"
              style={{ borderRadius: "9999px" }}
            >
              <img
                src={pillImg}
                alt=""
                className="absolute inset-0 w-full h-full object-fill"
              />
              <div className="absolute inset-0 rounded-full border-4 border-[#31bdef]" />
              <span
                className="absolute inset-0 flex items-center justify-center text-5xl"
                style={{ fontFamily: "RodinNTLG, sans-serif", color: "#3d3d3d" }}
              >
                Back
              </span>
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
