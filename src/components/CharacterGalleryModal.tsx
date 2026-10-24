import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
  Heart,
  Lightbulb,
  Search,
  Filter,
  Check,
} from 'lucide-react';
import { Character } from '../types';
import { TUTOR_CHARACTERS } from '../data/tutors';

interface CharacterGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCharacter: Character;
  onSelectCharacter: (char: Character) => void;
}

export const CharacterGalleryModal: React.FC<CharacterGalleryModalProps> = ({
  isOpen,
  onClose,
  activeCharacter,
  onSelectCharacter,
}) => {
  const [filterTrait, setFilterTrait] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewSpeakingId, setPreviewSpeakingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSpeakGreeting = (char: Character) => {
    if (!('speechSynthesis' in window)) return;

    if (previewSpeakingId === char.id) {
      window.speechSynthesis.cancel();
      setPreviewSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(char.greeting);
    utterance.pitch = char.voicePitch;
    utterance.rate = char.voiceRate;

    utterance.onend = () => setPreviewSpeakingId(null);
    utterance.onerror = () => setPreviewSpeakingId(null);

    setPreviewSpeakingId(char.id);
    window.speechSynthesis.speak(utterance);
  };

  const filteredCharacters = TUTOR_CHARACTERS.filter((char) => {
    const matchesSearch =
      char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      char.personality.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (char.traits && char.traits.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchesSearch) return false;

    if (filterTrait === 'all') return true;
    if (filterTrait === 'empathetic' && char.traits?.some((t) => t.toLowerCase().includes('empath'))) return true;
    if (filterTrait === 'hands-on' && char.traits?.some((t) => t.toLowerCase().includes('hands-on') || t.toLowerCase().includes('explain'))) return true;
    if (filterTrait === 'patient' && char.traits?.some((t) => t.toLowerCase().includes('patient'))) return true;
    if (filterTrait === 'energetic' && char.traits?.some((t) => t.toLowerCase().includes('enthusiastic') || t.toLowerCase().includes('energy') || t.toLowerCase().includes('bubbly'))) return true;

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Choose Your Personal AI Tutor
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                {TUTOR_CHARACTERS.length} Visually Available Guides
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select an empathetic, patient, or high-energy mentor tailored to your learning style and curiosity pace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Trait Filter Bar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Quick Trait Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">
              Filter:
            </span>
            {[
              { id: 'all', label: 'All Characters' },
              { id: 'empathetic', label: 'Empathetic & Inclusive' },
              { id: 'hands-on', label: 'Hands-On & ELI5' },
              { id: 'patient', label: 'Patient & Gentle' },
              { id: 'energetic', label: 'High-Energy & Space' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTrait(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  filterTrait === tab.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or trait..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Character Visual Cards Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCharacters.map((char) => {
            const isSelected = char.id === activeCharacter.id;
            const isSpeaking = previewSpeakingId === char.id;

            return (
              <div
                key={char.id}
                className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                    : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                }`}
              >
                {/* Top: Avatar, Name, Title, and Status Tag */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Stylized Visual Portrait Avatar */}
                      <div
                        className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xs transition-transform hover:scale-105 shrink-0"
                        style={{
                          backgroundColor: `${char.avatarColor}18`,
                          border: `1.5px solid ${char.avatarColor}40`,
                        }}
                      >
                        <span>{char.avatarEmoji}</span>
                        {isSelected && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                            {char.name}
                          </h3>
                        </div>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                          {char.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>{char.species}</span>
                          {char.targetAge && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">{char.targetAge}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill Indicator */}
                    <div className="flex flex-col items-end shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{char.statusTag || `${char.name} is ready`}</span>
                      </span>
                    </div>
                  </div>

                  {/* Character Personality Narrative */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {char.personality}
                  </p>

                  {/* Default Capabilities & Trait Badges */}
                  {char.traits && char.traits.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {char.traits.map((trait, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Signature Motto / Catchphrase */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 italic">
                    &ldquo;{char.catchphrase}&rdquo;
                  </div>
                </div>

                {/* Bottom Actions: Voice Sample & Select Button */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleSpeakGreeting(char)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
                      isSpeaking
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border-indigo-300 dark:border-indigo-700'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                    title={isSpeaking ? 'Stop voice sample' : 'Hear voice greeting'}
                  >
                    {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isSpeaking ? 'Playing...' : 'Voice Sample'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                      onSelectCharacter(char);
                      onClose();
                    }}
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active Tutor</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Choose {char.name.split(' ')[0]}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
          <span>You can switch your AI tutor at any time without losing your lesson progress.</span>
          <button
            type="button"
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              onClose();
            }}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
