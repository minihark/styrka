import React, { useState, useEffect } from 'react';
import { playRestTimerComplete, playClick } from '../utils/audio';
import { Play, Pause, Plus, Minus, X, Bell } from 'lucide-react';
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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-md animate-in slide-in-from-bottom-5 duration-200">
      <div className="bg-iron-900/95 backdrop-blur-md border-2 border-amber-500/50 rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 text-white">
        {/* Progress Circle & Time */}
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
            {/* SVG circular track */}
            <svg className="w-12 h-12 transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="3.5"
                className="text-iron-800"
                fill="transparent"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="3.5"
                className={secondsLeft === 0 ? 'text-emerald-400' : 'text-amber-500 transition-all duration-1000'}
                fill="transparent"
                strokeDasharray={125.6}
                strokeDashoffset={125.6 - (125.6 * percent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {secondsLeft === 0 ? (
                <Bell className="w-5 h-5 text-emerald-400 animate-bounce" />
              ) : (
                <span className="font-mono text-xs font-bold">{formatTime(secondsLeft)}</span>
              )}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-iron-400">
              {secondsLeft === 0
                ? (lang === 'sv' ? 'Vilan klar! Kör nästa!' : 'Rest Complete! Lift!')
                : (lang === 'sv' ? 'Setvila' : 'Resting')}
            </div>
            <div className="text-sm font-black font-mono text-white">
              {formatTime(secondsLeft)}
            </div>
          </div>
        </div>

        {/* Adjusters & Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => addTime(30)}
            className="px-2 py-1 rounded-lg bg-iron-800 hover:bg-iron-700 text-[11px] font-mono font-bold text-iron-300 transition"
            title="+30 sekunder"
          >
            +30s
          </button>

          <button
            onClick={() => {
              playClick();
              setIsRunning(!isRunning);
            }}
            className="p-2 rounded-xl bg-iron-800 hover:bg-iron-700 text-iron-200 transition"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              playClick();
              onDismiss();
            }}
            className="p-2 rounded-xl bg-iron-800 hover:bg-iron-700 text-iron-400 hover:text-white transition"
            title="Avsluta vila"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
