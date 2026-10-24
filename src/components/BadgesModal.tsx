import React, { useState } from 'react';
import { X, Trophy, CheckCircle2, Lock, Sparkles, Zap, Award } from 'lucide-react';
import { StudentProgress, Badge } from '../types';
import { BADGES, LEVEL_TIERS, calculateLevel } from '../data/badges';

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  progress: StudentProgress;
}

export const BadgesModal: React.FC<BadgesModalProps> = ({
  isOpen,
  onClose,
  progress,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const levelInfo = calculateLevel(progress.totalXp);
  const filteredBadges =
    selectedCategory === 'all'
      ? BADGES
      : BADGES.filter((b) => b.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Learning Milestones & Badges
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You have earned {progress.unlockedBadgeIds.length} of {BADGES.length} milestone badges!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level Progression Roadmap Banner */}
        <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/30">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-semibold text-indigo-950 dark:text-indigo-200">
              Current Rank: Level {levelInfo.level} · {levelInfo.title} {levelInfo.icon}
            </span>
            <span className="font-mono text-indigo-700 dark:text-indigo-400 font-bold">
              {progress.totalXp} XP
            </span>
          </div>

          <div className="w-full bg-indigo-200/60 dark:bg-indigo-900/60 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>

          {/* Level Tiers Roadmap List */}
          <div className="mt-3 flex items-center justify-between gap-1 overflow-x-auto text-[10px] text-slate-500 dark:text-slate-400 pt-1">
            {LEVEL_TIERS.map((tier) => {
              const isAchieved = progress.totalXp >= tier.minXp;
              const isCurrent = levelInfo.level === tier.level;
              return (
                <div
                  key={tier.level}
                  className={`flex flex-col items-center shrink-0 px-2 py-1 rounded-md text-center transition-colors ${
                    isCurrent
                      ? 'bg-indigo-100 dark:bg-indigo-900/60 font-bold text-indigo-900 dark:text-indigo-200'
                      : isAchieved
                      ? 'text-slate-700 dark:text-slate-300'
                      : 'opacity-40'
                  }`}
                >
                  <span className="text-sm">{tier.icon}</span>
                  <span className="truncate max-w-[80px]">Lv {tier.level}: {tier.title.split(' ')[0]}</span>
                  <span className="font-mono text-[9px]">{tier.minXp} XP</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="px-5 pt-3 pb-1 flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            All Badges ({BADGES.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('mastery')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedCategory === 'mastery'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Mastery & Quizzes
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('curiosity')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedCategory === 'curiosity'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Curiosity & Tutors
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('exploration')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedCategory === 'exploration'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            3D Molecular
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('focus')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              selectedCategory === 'focus'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Zen Focus
          </button>
        </div>

        {/* Badges Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredBadges.map((badge) => {
            const isUnlocked = progress.unlockedBadgeIds.includes(badge.id);

            return (
              <div
                key={badge.id}
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                  isUnlocked
                    ? 'bg-white dark:bg-slate-800/90 border-indigo-200 dark:border-indigo-800 shadow-xs'
                    : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                    isUnlocked
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 ring-1 ring-indigo-300 dark:ring-indigo-700'
                      : 'bg-slate-200/80 dark:bg-slate-800 grayscale'
                  }`}
                >
                  {badge.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {badge.title}
                    </h4>
                    {isUnlocked ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Unlocked</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-0.5 text-[10px] text-slate-400 shrink-0">
                        <Lock className="w-3 h-3" />
                        <span>+{badge.xpReward} XP</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                    {badge.description}
                  </p>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="capitalize">{badge.category} Category</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      +{badge.xpReward} XP
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500">
          <span>Keep exploring topics, quizzes, and tutors to unlock all badges!</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
