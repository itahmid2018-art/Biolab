import React, { useState } from 'react';
import { Search, Sparkles, ArrowRight, X, Atom } from 'lucide-react';
import { Topic, Character } from '../types';

interface GoogleSearchLandingProps {
  onSearch: (query: string) => void;
  activeCharacter: Character;
  onOpenCharacterGallery: () => void;
}

export const GoogleSearchLanding: React.FC<GoogleSearchLandingProps> = ({
  onSearch,
  activeCharacter,
  onOpenCharacterGallery,
}) => {
  const [query, setQuery] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const sampleSearches = [
    { label: 'Cellular Structure (Animal Cell)', icon: '🔬', query: 'Explain the 3D diagram of the cellular structure, animal cell organelles and compartments' },
    { label: 'Neuron (Action Potential)', icon: '🧠', query: 'Explain the 3D structure of a Neuron cell, its action potential and cellular compartments' },
    { label: 'Mitochondria (ATP Engine)', icon: '⚡', query: 'Explain the structure of Mitochondria, cristae folds, and ATP synthase rotary engine' },
    { label: 'Sugar (Glucose)', icon: '🍬', query: 'Explain the structure of Sugar and its chemical compounds along with labels' },
    { label: 'Methane (CH₄)', icon: '📐', query: 'Explain the structure of Methane and its chemical compounds along with labels' },
    { label: 'Human DNA Helix', icon: '🧬', query: 'Explain the structure of Human DNA molecule and its chemical compounds along with labels' },
    { label: 'GFP Lantern', icon: '💡', query: 'Explain the structure of Green Fluorescent Protein (GFP)' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20 max-w-4xl mx-auto w-full text-center select-none animate-in fade-in duration-300">
      {/* Minimal Logo / Brand Icon & Title (Like Google Homepage) */}
      <div className="mb-6 flex flex-col items-center">
        <div className="relative mb-3 group cursor-pointer" onClick={onOpenCharacterGallery} title={`Active Tutor: ${activeCharacter.name}`}>
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl sm:text-4xl shadow-xl shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            ⚛️
          </div>
          <span className="absolute -bottom-1 -right-1 text-xl filter drop-shadow-md">
            {activeCharacter.avatarEmoji}
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          BioFocus <span className="text-indigo-600 dark:text-indigo-400">AI</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">
          Explore 2D &amp; 3D molecules, cellular organelles, and tissues with {activeCharacter.name}
        </p>
      </div>

      {/* Centered Minimal Google-style Search Box */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl relative mb-6">
        <div className="relative flex items-center shadow-lg hover:shadow-xl dark:shadow-indigo-950/20 transition-all rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30">
          <div className="pl-4 sm:pl-5 text-slate-400">
            <Search className="w-5 h-5 text-indigo-500" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cells, organelles & molecules: Neuron, Mitochondria, Sugar, DNA, Methane..."
            className="w-full px-3.5 sm:px-4 py-3.5 sm:py-4 text-xs sm:text-base rounded-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden"
            autoFocus
          />


          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            type="submit"
            disabled={!query.trim()}
            className="mr-2 sm:mr-2.5 p-2.5 sm:p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-all shadow-md shrink-0"
            title="Search structure"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Clean Quick Sample Pills (Minimal icons + names) */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
        {sampleSearches.map((sample, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSearch(sample.query)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-all hover:scale-105"
          >
            <span className="text-sm">{sample.icon}</span>
            <span>{sample.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
