import React, { useState, useEffect } from 'react';
import { playRestTimerComplete, playClick } from '../utils/audio';
import { Play, Pause, X, Bell } from 'lucide-react';
import { Language } from '../types';

interface RestTimerFloatingProps {
  initialSeconds: number;
  onDismiss: () => void;
  lang: Language;
}

export const RestTimerFloating: React.FC<RestTimerFloatingProps> = ({
  initialSeconds,
  onDismiss,
  lang,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    setSecondsLeft(initialSeconds);
    setIsRunning(true);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      playRestTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft]);

  const addTime = (delta: number) => {
    playClick();
    setSecondsLeft((prev) => Math.max(0, prev + delta));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const percent = Math.min(100, Math.max(0, (secondsLeft / Math.max(initialSeconds, 1)) * 100));

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-md select-none">
      <div className="relative overflow-hidden bg-[#181818] border-2 border-[#FF5500] rounded shadow-2xl p-3.5 flex items-center justify-between gap-3 text-[#F5F3EF]">
        {/* Top linear progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#282828]">
          <div
            className="h-full bg-[#FF5500] transition-all duration-1000"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Left: Timer Readout */}
        <div className="flex items-center gap-3 pt-0.5">
          <div className="w-10 h-10 rounded-sm bg-[#111111] border border-[#282828] flex items-center justify-center text-[#FF5500]">
            {secondsLeft === 0 ? (
              <Bell className="w-5 h-5 animate-bounce" />
            ) : (
              <span className="font-mono text-xs font-extrabold">REST</span>
            )}
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#9A978E]">
              {secondsLeft === 0
                ? lang === 'sv'
                  ? 'VILA KLAR — NÄSTA SET!'
                  : 'REST COMPLETE — LIFT!'
                : lang === 'sv'
                ? 'SETVILA PÅGÅR'
                : 'REST TIMER'}
            </div>
            <div className="font-display font-black text-3xl leading-none tracking-wide text-[#F5F3EF]">
              {formatTime(secondsLeft)}
            </div>
          </div>
        </div>

        {/* Right: Tactile Controls */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            onClick={() => addTime(-15)}
            className="px-2 py-1.5 rounded-sm bg-[#111111] border border-[#282828] hover:border-[#6E6C65] text-[11px] font-mono font-bold text-[#9A978E] hover:text-[#F5F3EF] transition cursor-pointer"
          >
            -15s
          </button>
          <button
            onClick={() => addTime(30)}
            className="px-2 py-1.5 rounded-sm bg-[#111111] border border-[#282828] hover:border-[#FF5500] text-[11px] font-mono font-bold text-[#F5F3EF] transition cursor-pointer"
          >
            +30s
          </button>

          <button
            onClick={() => {
              playClick();
              setIsRunning(!isRunning);
            }}
            className="p-2 rounded-sm bg-[#111111] border border-[#282828] hover:border-[#FF5500] text-[#F5F3EF] transition cursor-pointer"
            title={isRunning ? 'Pausa' : 'Starta'}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              playClick();
              onDismiss();
            }}
            className="p-2 rounded-sm bg-[#111111] border border-[#282828] hover:border-[#FF5500] text-[#9A978E] hover:text-[#FF5500] transition cursor-pointer"
            title={lang === 'sv' ? 'Stäng viloklocka' : 'Dismiss timer'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
