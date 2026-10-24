import React, { useState } from 'react';
import { Award, Zap, Flame, Trophy, ChevronRight, Sparkles } from 'lucide-react';
import { StudentProgress, Badge } from '../types';
import { calculateLevel, BADGES } from '../data/badges';

interface GamificationBarProps {
  progress: StudentProgress;
  onOpenBadgesModal: () => void;
  recentXpGained?: { amount: number; title: string; id: number } | null;
}

export const GamificationBar: React.FC<GamificationBarProps> = ({
  progress,
  onOpenBadgesModal,
  recentXpGained,
}) => {
  const levelInfo = calculateLevel(progress.totalXp);
  const unlockedCount = progress.unlockedBadgeIds.length;
  const totalBadges = BADGES.length;

  return (
    <div className="relative border-b border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs transition-colors py-2 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Level Tier, Title & Visual Progress Bar */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-[240px]">
          {/* Level Icon Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xl select-none" role="img" aria-label="Level icon">
              {levelInfo.icon}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Level {levelInfo.level}
                </span>
                <span className="text-slate-400 text-xs">·</span>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {levelInfo.title}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                <span>{progress.totalXp} Total XP</span>
                <span aria-hidden="true">·</span>
                <span>{levelInfo.nextLevelXp - progress.totalXp} XP to Level {levelInfo.level + 1}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="flex-1 max-w-xs hidden sm:block">
            <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-linear-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Gamified Stats & Badges Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Streak Indicator */}
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200/50 dark:border-amber-900/30"
            title={`${progress.streakDays}-Day Learning Streak!`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{progress.streakDays} Day Streak</span>
          </div>

          {/* Badges Collection Button */}
          <button
            type="button"
            onClick={onOpenBadgesModal}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-2xs"
            title="View unlocked achievement badges"
          >
            <Trophy className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>
              {unlockedCount} / {totalBadges} Badges
            </span>
            <ChevronRight className="w-3 h-3 text-indigo-400" />
          </button>
        </div>
      </div>

      {/* Floating XP Gain Celebration Toast */}
      {recentXpGained && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-900 text-white text-xs font-bold shadow-xl border border-indigo-700 animate-in fade-in slide-in-from-top-2 duration-300">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>+{recentXpGained.amount} XP</span>
          <span className="text-indigo-300 font-normal">· {recentXpGained.title}</span>
        </div>
      )}
    </div>
  );
};
