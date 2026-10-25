import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Box,
  HelpCircle,
  Trophy,
  ChevronRight,
  Pin,
  Maximize2,
  Minimize2,
  Sparkles,
  Award,
  Flame,
  CheckCircle2,
  Compass,
  Bookmark,
} from 'lucide-react';
import { Character, Topic, ReadingLevel, UserProfile, StudentProgress, TopicMastery } from '../types';
import { MolecularViewer } from './MolecularViewer';
import { InteractiveQuiz } from './InteractiveQuiz';
import { TutorChat } from './TutorChat';
import { StudyRoadmap } from './StudyRoadmap';
import { ReadingListPanel } from './ReadingListPanel';
import { BADGES } from '../data/badges';

export type RightSidebarPanelType = 'tutor' | 'molecular' | 'quiz' | 'passport' | 'roadmap' | 'readingList' | null;

interface RightSidebarDrawerProps {
  activePanel: RightSidebarPanelType;
  onSelectPanel: (panel: RightSidebarPanelType) => void;
  isSideBySide: boolean;
  onToggleSideBySide: () => void;
  topic: Topic;
  topics?: Topic[];
  onSelectTopic?: (topic: Topic) => void;
  character: Character;
  onSelectCharacter: (char: Character) => void;
  readingLevel: ReadingLevel;
  darkMode: boolean;
  currentUser: UserProfile | null;
  progress: StudentProgress;
  externalPrompt: string | null;
  onClearExternalPrompt: () => void;
  onAwardXp: (amount: number, reason: string) => void;
  onUpdateTopicMastery: (topicId: string, mastery: Partial<TopicMastery>) => void;
  onOpenTutorProfile: (char: Character) => void;
  onOpenCharacterGallery: () => void;
  onOpenBadgesModal: () => void;
  savedTopicIds?: string[];
  onToggleSaveTopic?: (topicId: string) => void;
  onAskTutorAboutTopic?: (topic: Topic, query?: string) => void;
}

export const RightSidebarDrawer: React.FC<RightSidebarDrawerProps> = ({
  activePanel,
  onSelectPanel,
  isSideBySide,
  onToggleSideBySide,
  topic,
  topics = [],
  onSelectTopic,
  character,
  onSelectCharacter,
  readingLevel,
  darkMode,
  currentUser,
  progress,
  externalPrompt,
  onClearExternalPrompt,
  onAwardXp,
  onUpdateTopicMastery,
  onOpenTutorProfile,
  onOpenCharacterGallery,
  onOpenBadgesModal,
  savedTopicIds = [],
  onToggleSaveTopic,
  onAskTutorAboutTopic,
}) => {
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Close with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activePanel) {
        onSelectPanel(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePanel, onSelectPanel]);

  const topicMastery = progress.topicMastery[topic.id];
  const quizMastered = topicMastery?.completed;
  const quizScore = topicMastery?.bestScorePercentage;

  const togglePanel = (panel: RightSidebarPanelType) => {
    if (activePanel === panel) {
      onSelectPanel(null);
    } else {
      onSelectPanel(panel);
    }
  };

  return (
    <>
      {/* 1. PINNED FLOATING / DOCKED MENU BUTTONS ON THE RIGHT (Icons Only) */}
      <aside
        aria-label="Exploring Tools"
        className="fixed right-3 bottom-6 sm:bottom-auto sm:top-24 z-40 flex flex-col gap-2 items-center pointer-events-auto"
      >
        {/* Tutor Companion Button (Icon Only) */}
        <button
          type="button"
          onClick={() => togglePanel('tutor')}
          className={`relative p-2.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 ${
            activePanel === 'tutor'
              ? 'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-400/50 shadow-indigo-500/20'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
          }`}
          title={`Virtual Tutor: Ask ${character.name}`}
        >
          <span className="text-xl leading-none select-none inline-block">{character.avatarEmoji}</span>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* 3D Macromolecule Lab Button (Icon Only) */}
        <button
          type="button"
          onClick={() => togglePanel('molecular')}
          className={`relative p-2.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 ${
            activePanel === 'molecular'
              ? 'bg-cyan-600 text-white border-cyan-500 ring-2 ring-cyan-400/50 shadow-cyan-500/20'
              : 'bg-white/95 dark:bg-slate-900/95 text-cyan-600 dark:text-cyan-400 border-slate-200 dark:border-slate-800 hover:border-cyan-300 dark:hover:border-cyan-700'
          }`}
          title="3D Macromolecule Lab"
        >
          <Box className="w-5 h-5" />
        </button>

        {/* Retention Quiz Challenge Button (Icon Only) */}
        <button
          type="button"
          onClick={() => togglePanel('quiz')}
          className={`relative p-2.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 ${
            activePanel === 'quiz'
              ? 'bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-400/50 shadow-emerald-500/20'
              : 'bg-white/95 dark:bg-slate-900/95 text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700'
          }`}
          title={quizScore ? `Retention Quiz (${quizScore}% Mastered)` : 'Retention Quiz Challenge'}
        >
          <HelpCircle className="w-5 h-5" />
          {quizMastered && (
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        {/* Learning Passport & Badges Button (Icon Only) */}
        <button
          type="button"
          onClick={() => togglePanel('passport')}
          className={`relative p-2.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 ${
            activePanel === 'passport'
              ? 'bg-amber-600 text-white border-amber-500 ring-2 ring-amber-400/50 shadow-amber-500/20'
              : 'bg-white/95 dark:bg-slate-900/95 text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700'
          }`}
          title={`Learning Passport: ${progress.totalXp} XP · ${progress.unlockedBadgeIds.length} Badges`}
        >
          <Trophy className="w-5 h-5" />
        </button>

        {/* Bioscience Study Roadmap Flowchart Button (Icon Only) */}
        <button
          type="button"
          onClick={() => togglePanel('roadmap')}
          className={`relative p-2.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 ${
            activePanel === 'roadmap'
              ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white border-indigo-400 ring-2 ring-indigo-400/50 shadow-indigo-500/20'
              : 'bg-white/95 dark:bg-slate-900/95 text-purple-600 dark:text-purple-400 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700'
          }`}
          title="Bioscience Study Roadmap · Flowchart & Next Recommendations"
        >
          <Compass className="w-5 h-5" />
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* Reading List / Save for Later Button (Icon Only) */}
        <button
          type="button"
          onClick={() => togglePanel('readingList')}
          className={`relative p-2.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-105 ${
            activePanel === 'readingList'
              ? 'bg-amber-600 text-white border-amber-500 ring-2 ring-amber-400/50 shadow-amber-500/20'
              : 'bg-white/95 dark:bg-slate-900/95 text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700'
          }`}
          title={`Reading List: ${savedTopicIds.length} Saved Topic${savedTopicIds.length === 1 ? '' : 's'}`}
        >
          <Bookmark className={`w-5 h-5 ${savedTopicIds.length > 0 ? 'fill-current' : ''}`} />
          {savedTopicIds.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
              {savedTopicIds.length}
            </span>
          )}
        </button>
      </aside>

      {/* 2. SLIDE-OVER DRAWER / SIDEBAR PANEL */}
      {activePanel && (
        <>
          {/* Backdrop when floating on smaller screens or when not side-by-side */}
          {!isSideBySide && (
            <div
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-2xs z-40 transition-opacity"
              onClick={() => onSelectPanel(null)}
              aria-hidden="true"
            />
          )}

          <div
            className={`fixed top-0 right-0 bottom-0 z-50 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-all duration-300 ${
              isMaximized
                ? 'w-full max-w-4xl'
                : 'w-full sm:w-[500px] md:w-[580px] lg:w-[620px]'
            }`}
          >
            {/* Drawer Top Navigation Header */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {activePanel === 'tutor' && (
                  <>
                    <span className="text-xl">{character.avatarEmoji}</span>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {character.name}
                        </h2>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold">
                          Virtual Tutor
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {character.title} • {character.personality}
                      </p>
                    </div>
                  </>
                )}

                {activePanel === 'molecular' && (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                      <Box className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          3D Macromolecule Lab
                        </h2>
                        {topic.pdbId && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
                            PDB: {topic.pdbId}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Interactive atomic coordinate explorer & residue inspector
                      </p>
                    </div>
                  </>
                )}

                {activePanel === 'quiz' && (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          Retention Challenge
                        </h2>
                        {quizScore !== undefined && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            {quizScore}% Score
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Dynamic questions & short answer AI evaluations
                      </p>
                    </div>
                  </>
                )}

                {activePanel === 'passport' && (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        Learning Passport
                      </h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        XP, streak milestones, and unlocked badges
                      </p>
                    </div>
                  </>
                )}

                {activePanel === 'roadmap' && (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/80 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          Study Roadmap
                        </h2>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          Flowchart
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Prerequisite progression & next-topic recommendations
                      </p>
                    </div>
                  </>
                )}

                {activePanel === 'readingList' && (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Bookmark className="w-4 h-4 fill-amber-500" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          Reading List
                        </h2>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          {savedTopicIds.length} Saved
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Bookmarked topics for focused revision & Socratic review
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Switch between tools tabs inside the drawer */}
                <div className="hidden sm:flex items-center bg-slate-200/60 dark:bg-slate-800 p-0.5 rounded-lg mr-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => onSelectPanel('tutor')}
                    className={`px-2 py-1 rounded-md transition-colors ${activePanel === 'tutor' ? 'bg-white dark:bg-slate-700 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    💬 Tutor
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectPanel('molecular')}
                    className={`px-2 py-1 rounded-md transition-colors ${activePanel === 'molecular' ? 'bg-white dark:bg-slate-700 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    🧬 3D
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectPanel('quiz')}
                    className={`px-2 py-1 rounded-md transition-colors ${activePanel === 'quiz' ? 'bg-white dark:bg-slate-700 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    📝 Quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectPanel('passport')}
                    className={`px-2 py-1 rounded-md transition-colors ${activePanel === 'passport' ? 'bg-white dark:bg-slate-700 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    🏆 Passport
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectPanel('roadmap')}
                    className={`px-2 py-1 rounded-md transition-colors ${activePanel === 'roadmap' ? 'bg-white dark:bg-slate-700 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    🗺️ Roadmap
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectPanel('readingList')}
                    className={`px-2 py-1 rounded-md transition-colors ${activePanel === 'readingList' ? 'bg-white dark:bg-slate-700 font-semibold shadow-2xs' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    📑 Saved ({savedTopicIds.length})
                  </button>
                </div>

                {/* Maximize Toggle */}
                <button
                  type="button"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  title={isMaximized ? 'Restore standard width' : 'Maximize panel'}
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                {/* Pin Side-by-Side Toggle (desktop only) */}
                <button
                  type="button"
                  onClick={onToggleSideBySide}
                  className={`hidden lg:flex p-1.5 rounded-lg transition-colors ${
                    isSideBySide
                      ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500'
                  }`}
                  title={isSideBySide ? 'Unpin (Float Drawer)' : 'Pin side-by-side with study guide'}
                >
                  <Pin className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => onSelectPanel(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  title="Close panel (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Body Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {activePanel === 'tutor' && (
                <TutorChat
                  topic={topic}
                  character={character}
                  onSelectCharacter={onSelectCharacter}
                  readingLevel={readingLevel}
                  userProfile={currentUser}
                  externalQueryPrompt={externalPrompt}
                  onClearExternalQuery={onClearExternalPrompt}
                  onAwardXp={onAwardXp}
                  onOpenTutorProfile={onOpenTutorProfile}
                  onOpenCharacterGallery={onOpenCharacterGallery}
                />
              )}

              {activePanel === 'molecular' && (
                <div className="space-y-4">
                  <MolecularViewer
                    topic={topic}
                    darkMode={darkMode}
                    onResidueSelect={(res) => {
                      onAwardXp(10, `Inspected Residue ${res.name} #${res.resi}`);
                      // Auto populate question in tutor
                      togglePanel('tutor');
                    }}
                  />
                  <div className="p-3 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-800/40 text-xs text-cyan-800 dark:text-cyan-300 flex items-center justify-between">
                    <span>Curious about a specific amino acid fold?</span>
                    <button
                      type="button"
                      onClick={() => onSelectPanel('tutor')}
                      className="font-semibold underline hover:text-cyan-900 dark:hover:text-cyan-200"
                    >
                      Ask {character.name} →
                    </button>
                  </div>
                </div>
              )}

              {activePanel === 'quiz' && (
                <InteractiveQuiz
                  topic={topic}
                  character={character}
                  readingLevel={readingLevel}
                  onAskTutor={(q) => {
                    togglePanel('tutor');
                  }}
                  onAwardXp={onAwardXp}
                  topicMastery={topicMastery}
                  onUpdateTopicMastery={onUpdateTopicMastery}
                />
              )}

              {activePanel === 'passport' && (
                <div className="space-y-5 text-xs">
                  {/* Passport Overview Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-amber-500/10 to-emerald-500/10 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{currentUser?.avatar || '🎓'}</span>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            {currentUser?.name || 'Explorer'}’s Passport
                          </h3>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            BioFocus Science Academy
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-base text-indigo-600 dark:text-indigo-400">
                          {progress.totalXp} XP
                        </span>
                        <span className="block text-[10px] text-slate-400">Total Points</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-center">
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-2xs">
                        <span className="font-bold text-slate-900 dark:text-white block text-sm">
                          {progress.completedTopicIds.length}
                        </span>
                        <span className="text-[10px] text-slate-500">Topics Mastered</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-2xs">
                        <span className="font-bold text-amber-600 dark:text-amber-400 block text-sm">
                          {progress.unlockedBadgeIds.length}
                        </span>
                        <span className="text-[10px] text-slate-500">Badges Won</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-2xs">
                        <span className="font-bold text-orange-500 block text-sm">
                          {progress.streakDays}🔥
                        </span>
                        <span className="text-[10px] text-slate-500">Day Streak</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges Quick Shelf */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        Unlocked Badges ({progress.unlockedBadgeIds.length}/{BADGES.length})
                      </span>
                      <button
                        type="button"
                        onClick={onOpenBadgesModal}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        View All Badges →
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {BADGES.map((b) => {
                        const isUnlocked = progress.unlockedBadgeIds.includes(b.id);
                        return (
                          <div
                            key={b.id}
                            className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                              isUnlocked
                                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
                                : 'opacity-40 bg-slate-50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800/50'
                            }`}
                          >
                            <span className="text-2xl">{b.icon}</span>
                            <div className="min-w-0 flex-1">
                              <span className="font-semibold text-slate-900 dark:text-white block truncate text-[11px]">
                                {b.title}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                                {isUnlocked ? '+XP Awarded' : 'Locked'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activePanel === 'roadmap' && (
                <div className="p-1">
                  <StudyRoadmap
                    topics={topics.length > 0 ? topics : [topic]}
                    activeTopic={topic}
                    onSelectTopic={(selected) => {
                      if (onSelectTopic) onSelectTopic(selected);
                      onSelectPanel(null);
                    }}
                    progress={progress}
                    currentUser={currentUser}
                    activeCharacter={character}
                    onAwardXp={onAwardXp}
                    onClose={() => onSelectPanel(null)}
                  />
                </div>
              )}

              {activePanel === 'readingList' && (
                <div className="p-1">
                  <ReadingListPanel
                    savedTopicIds={savedTopicIds}
                    topics={topics.length > 0 ? topics : [topic]}
                    activeTopic={topic}
                    onSelectTopic={(selected) => {
                      if (onSelectTopic) onSelectTopic(selected);
                    }}
                    onToggleSaveTopic={(topicId) => {
                      if (onToggleSaveTopic) onToggleSaveTopic(topicId);
                    }}
                    onAskTutorAboutTopic={(selected, initialQuery) => {
                      if (onAskTutorAboutTopic) {
                        onAskTutorAboutTopic(selected, initialQuery);
                      } else {
                        onSelectPanel('tutor');
                      }
                    }}
                    character={character}
                    darkMode={darkMode}
                    onAwardXp={onAwardXp}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};
