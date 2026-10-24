import React from 'react';
import { X, MessageSquare, Sparkles, BookOpen, Heart, Volume2, Award } from 'lucide-react';
import { Character } from '../types';

interface TutorProfileModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTutor: (char: Character) => void;
  isActive: boolean;
}

export const TutorProfileModal: React.FC<TutorProfileModalProps> = ({
  character,
  isOpen,
  onClose,
  onSelectTutor,
  isActive,
}) => {
  if (!isOpen || !character) return null;

  const handleSpeakSample = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(character.greeting);
    utter.pitch = character.voicePitch;
    utter.rate = character.voiceRate;
    window.speechSynthesis.speak(utter);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl shadow-xs">
              {character.avatarEmoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {character.name}
                </h3>
                {isActive && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    Active Guide
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                {character.title} · {character.species}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Style: {character.conversationalStyle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Backstory */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Tutor Backstory</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
            {character.backstory}
          </p>
        </div>

        {/* Catchphrase & Favorite Discovery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
            <span className="font-semibold text-amber-900 dark:text-amber-200 block mb-1">
              Signature Motto
            </span>
            <p className="text-[11px] italic text-amber-950/80 dark:text-amber-300/80">
              &ldquo;{character.catchphrase}&rdquo;
            </p>
          </div>

          <div className="p-3 rounded-xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/50 dark:border-cyan-900/30">
            <span className="font-semibold text-cyan-900 dark:text-cyan-200 block mb-1">
              Favorite Discovery
            </span>
            <p className="text-[11px] text-cyan-950/80 dark:text-cyan-300/80">
              {character.favoriteDiscovery}
            </p>
          </div>
        </div>

        {/* Voice Sample button */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Volume2 className="w-4 h-4 text-indigo-500" />
            <span>Hear Sample Greeting</span>
          </div>
          <button
            type="button"
            onClick={handleSpeakSample}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100"
          >
            Play Voice
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-colors"
          >
            Close
          </button>
          {!isActive && (
            <button
              type="button"
              onClick={() => {
                onSelectTutor(character);
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-2xs"
            >
              Choose As My Personal Tutor
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
