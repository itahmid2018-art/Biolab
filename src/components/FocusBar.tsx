import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  BookMarked,
  User,
  LogOut,
  Users,
  Compass,
} from 'lucide-react';
import { Character, UserProfile } from '../types';

interface FocusBarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  character: Character;
  onOpenCharacterGallery?: () => void;
  userProfile: UserProfile | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
  onReturnToSearch?: () => void;
  onOpenRoadmap?: () => void;
  onOpenReadingList?: () => void;
  savedCount?: number;
}

export const FocusBar: React.FC<FocusBarProps> = ({
  darkMode,
  onToggleDarkMode,
  isFocusMode,
  onToggleFocusMode,
  character,
  onOpenCharacterGallery,
  userProfile,
  onOpenAuthModal,
  onSignOut,
  onReturnToSearch,
  onOpenRoadmap,
  onOpenReadingList,
  savedCount = 0,
}) => {
  // Ambient Focus Timer state (in seconds)
  const [timerDuration, setTimerDuration] = useState<number>(15 * 60); // 15 mins default
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerShowDropdown, setTimerShowDropdown] = useState<boolean>(false);

  useEffect(() => {
    let interval: number | null = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            // Gentle audio chime upon focus completion
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
              osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.3); // A5
              gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
              osc.start();
              osc.stop(audioCtx.currentTime + 1.2);
            } catch {
              // ignore audio failure
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeLeft]);

  const setTimerPreset = (minutes: number) => {
    setIsTimerRunning(false);
    setTimerDuration(minutes * 60);
    setTimeLeft(minutes * 60);
    setTimerShowDropdown(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((timerDuration - timeLeft) / timerDuration) * 100;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between gap-3">
        {/* Minimal Brand Icon */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onReturnToSearch || onToggleFocusMode}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-xs tracking-tight shadow-2xs hover:scale-105 transition-transform cursor-pointer"
            title="BioFocus AI · Return to Search"
          >
            ⚛️
          </button>
          <button
            type="button"
            onClick={onReturnToSearch || onToggleFocusMode}
            className="font-bold text-sm tracking-tight text-slate-900 dark:text-white hidden xs:inline hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
            title="Return to minimal Google search"
          >
            BioFocus
          </button>
        </div>

        {/* Minimal Ambient Focus Timer (Icon with hover time) */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setTimerShowDropdown(!timerShowDropdown)}
                className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 font-mono text-[11px] font-semibold"
                title="Focus Timer · Click to change duration"
              >
                <Timer className="w-3.5 h-3.5 text-indigo-500" />
                <span>{formatTime(timeLeft)}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-400 transition-colors"
                title={isTimerRunning ? 'Pause timer' : 'Start timer'}
              >
                {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimeLeft(timerDuration);
                }}
                className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-400 transition-colors"
                title="Reset timer"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Timer Presets Dropdown */}
            {timerShowDropdown && (
              <div className="absolute top-full mt-1.5 left-0 w-32 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 shadow-xl z-50 text-xs">
                <button
                  type="button"
                  onClick={() => setTimerPreset(5)}
                  className="w-full text-left px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  5 min
                </button>
                <button
                  type="button"
                  onClick={() => setTimerPreset(10)}
                  className="w-full text-left px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  10 min
                </button>
                <button
                  type="button"
                  onClick={() => setTimerPreset(15)}
                  className="w-full text-left px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  15 min
                </button>
                <button
                  type="button"
                  onClick={() => setTimerPreset(25)}
                  className="w-full text-left px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  25 min
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Tools: Icons Only (Minimalist Google-Style Bar) */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Active Tutor Avatar Icon (Choose Character) */}
          <button
            type="button"
            onClick={onOpenCharacterGallery}
            className="relative p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
            title={`Active Tutor: ${character.name} (${character.title}) · Click to choose character`}
          >
            <span className="text-base select-none leading-none inline-block">{character.avatarEmoji}</span>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* User Profile Avatar Icon */}
          {userProfile ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 transition-colors"
                title={`Profile: ${userProfile.name} (Age ${userProfile.age})`}
              >
                <span className="text-base select-none leading-none inline-block">{userProfile.avatar}</span>
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 text-slate-400 dark:text-slate-500 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
              title="Sign In / Create Profile"
            >
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </button>
          )}

          {/* Reading List / Bookmarked Topics Drawer */}
          {onOpenReadingList && (
            <button
              type="button"
              onClick={onOpenReadingList}
              className="relative p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200/60 dark:border-slate-700/60 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              title={`Reading List (${savedCount} saved topics) · Study later`}
              aria-label="Open reading list"
            >
              <BookMarked className="w-4 h-4" />
              {savedCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-amber-500 text-[9px] font-bold text-white flex items-center justify-center leading-none ring-2 ring-white dark:ring-slate-900">
                  {savedCount}
                </span>
              )}
            </button>
          )}

          {/* Study Roadmap Flowchart Icon */}
          {onOpenRoadmap && (
            <button
              type="button"
              onClick={onOpenRoadmap}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-purple-600 dark:text-purple-400 border border-slate-200/60 dark:border-slate-700/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
              title="Bioscience Study Roadmap · Flowchart"
            >
              <Compass className="w-4 h-4" />
            </button>
          )}

          {/* Focus Mode Icon */}
          <button
            type="button"
            onClick={onToggleFocusMode}
            className={`p-1.5 rounded-xl transition-colors border ${
              isFocusMode
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-white'
            }`}
            title={isFocusMode ? 'Exit focus mode' : 'Enter focus mode'}
          >
            {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Theme Switcher Icon */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60 hover:text-slate-900 dark:hover:text-white transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
        </div>
      </div>

      {/* Thin ambient timer progress indicator line */}
      {isTimerRunning && (
        <div className="w-full bg-transparent h-0.5 overflow-hidden">
          <div
            className="bg-indigo-500 h-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </header>
  );
};
