import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Layers,
  BookOpen,
  MessageSquare,
  Award,
  Sparkles,
  Plus,
  HelpCircle,
  ExternalLink,
  Brain,
  CheckCircle2,
  Trophy,
  User,
  Filter,
  Users,
  Bookmark,
  BookMarked,
} from 'lucide-react';
import { Topic, Character, ReadingLevel, StudentProgress, TopicMastery, UserProfile } from './types';
import { CURATED_TOPICS, searchCuratedTopics } from './data/curatedTopics';
import { TUTOR_CHARACTERS } from './data/tutors';
import { BADGES, calculateLevel } from './data/badges';
import { FocusBar } from './components/FocusBar';
import { GamificationBar } from './components/GamificationBar';
import { BadgesModal } from './components/BadgesModal';
import { TutorProfileModal } from './components/TutorProfileModal';
import { CharacterGalleryModal } from './components/CharacterGalleryModal';
import { AuthModal, DEMO_PROFILES } from './components/AuthModal';
import { MolecularViewer } from './components/MolecularViewer';
import { NotebookOverview } from './components/NotebookOverview';
import { InteractiveQuiz } from './components/InteractiveQuiz';
import { TutorChat } from './components/TutorChat';
import { AddTopicModal } from './components/AddTopicModal';
import { TopAskTutorBar } from './components/TopAskTutorBar';
import { TopicSelectorBar } from './components/TopicSelectorBar';
import { RightSidebarDrawer, RightSidebarPanelType } from './components/RightSidebarDrawer';
import { MolecularStructureHero } from './components/MolecularStructureHero';
import { GoogleSearchLanding } from './components/GoogleSearchLanding';

const DEFAULT_PROGRESS: StudentProgress = {
  totalXp: 45,
  level: 1,
  levelTitle: 'Curious Sprout',
  streakDays: 3,
  completedTopicIds: [],
  topicMastery: {},
  unlockedBadgeIds: ['first-inquiry'],
  recentActivities: [
    {
      id: 'init-1',
      type: 'lesson_read',
      title: 'Joined BioFocus Learning Studio',
      xpEarned: 25,
      timestamp: Date.now() - 3600000,
    },
    {
      id: 'init-2',
      type: 'question_asked',
      title: 'First Curiosity Inquiry',
      xpEarned: 20,
      timestamp: Date.now() - 1800000,
    },
  ],
};

export default function App() {
  // Dark mode state: default to dark for children focus
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('biofocus_dark_mode');
      if (saved !== null) return saved === 'true';
      return true;
    }
    return true;
  });

  // Focus / Zen mode state
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // User Profile state (persisted in localStorage)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('biofocus_active_user');
        if (saved) return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return null;
  });

  // Gamification progress state (persisted per user)
  const [progress, setProgress] = useState<StudentProgress>(() => {
    if (typeof window !== 'undefined') {
      try {
        const key = currentUser ? `biofocus_progress_${currentUser.id}` : 'biofocus_student_progress';
        const saved = localStorage.getItem(key);
        if (saved) return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_PROGRESS;
  });

  // Floating XP toast state
  const [recentXpGained, setRecentXpGained] = useState<{
    amount: number;
    title: string;
    id: number;
  } | null>(null);

  // Modals state
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState<boolean>(false);
  const [isCharacterGalleryOpen, setIsCharacterGalleryOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signup' | 'signin' | 'profile'>('signup');
  const [tutorProfileCharacter, setTutorProfileCharacter] = useState<Character | null>(null);
  const [isAddTopicOpen, setIsAddTopicOpen] = useState<boolean>(false);
  const [activeRightPanel, setActiveRightPanel] = useState<RightSidebarPanelType>(null);
  const [isSideBySide, setIsSideBySide] = useState<boolean>(false);

  // Saved Topics for Reading List (persisted per user or guest)
  const [savedTopicIds, setSavedTopicIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const key = currentUser ? `biofocus_saved_topics_${currentUser.id}` : 'biofocus_saved_topics_guest';
        const saved = localStorage.getItem(key);
        if (saved) return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return ['cellular-structure', 'dna-double-helix'];
  });

  const handleOpenAuth = (mode: 'signup' | 'signin' | 'profile' = 'signup') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  // Filter override: if user wants to view all topics even when signed in
  const [showAllTopicsOverride, setShowAllTopicsOverride] = useState<boolean>(false);

  // Track consulted tutors for badge unlocking
  const consultedTutorsRef = useRef<Set<string>>(new Set(['sofia']));

  // Topics state
  const [topics, setTopics] = useState<Topic[]>(CURATED_TOPICS);
  const [activeTopic, setActiveTopic] = useState<Topic>(CURATED_TOPICS[0]);

  // Active virtual AI tutor character: default to Sofia Carter
  const [activeCharacter, setActiveCharacter] = useState<Character>(() => {
    if (currentUser?.selectedTutorId) {
      const found = TUTOR_CHARACTERS.find((c) => c.id === currentUser.selectedTutorId);
      if (found) return found;
    }
    return TUTOR_CHARACTERS[0]; // Sofia Carter
  });

  // Reading Level preference
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>(() => {
    return currentUser?.gradeLevel || 'grades-5-7';
  });

  // External query prompt passed to tutor chat
  const [externalPrompt, setExternalPrompt] = useState<string | null>(null);

  // Active section tab in Focus Mode
  const [focusTab, setFocusTab] = useState<'study' | 'molecular' | 'quiz' | 'tutor'>('study');

  // Filter topics based on signed-in user's profile interests
  const filteredTopics = React.useMemo(() => {
    if (!currentUser || showAllTopicsOverride) return topics;

    const matched = topics.filter((t) => {
      // Check if category matches user's interests
      const categoryMatch = currentUser.interests.some(
        (interest) => t.category.toLowerCase().includes(interest.toLowerCase()) || interest.toLowerCase().includes(t.category.toLowerCase())
      );
      // Or if it's a custom user-created topic
      const customMatch = t.id.startsWith('custom-');
      return categoryMatch || customMatch;
    });

    return matched.length > 0 ? matched : topics;
  }, [topics, currentUser, showAllTopicsOverride]);

  // Ensure active topic is always within visible topics
  useEffect(() => {
    if (filteredTopics.length > 0 && !filteredTopics.some((t) => t.id === activeTopic.id)) {
      setActiveTopic(filteredTopics[0]);
    }
  }, [filteredTopics]);

  // Persist progress to localStorage whenever it changes
  useEffect(() => {
    const key = currentUser ? `biofocus_progress_${currentUser.id}` : 'biofocus_student_progress';
    localStorage.setItem(key, JSON.stringify(progress));
  }, [progress, currentUser]);

  // Persist saved reading list topics
  useEffect(() => {
    const key = currentUser ? `biofocus_saved_topics_${currentUser.id}` : 'biofocus_saved_topics_guest';
    localStorage.setItem(key, JSON.stringify(savedTopicIds));
  }, [savedTopicIds, currentUser]);

  // Apply dark mode class to html element
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      document.body.style.backgroundColor = '#0B0F19';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#FBFBF9';
    }
    localStorage.setItem('biofocus_dark_mode', darkMode.toString());
  }, [darkMode]);

  // User Login / Signup Handler
  const handleLogin = (profile: UserProfile) => {
    setCurrentUser(profile);
    localStorage.setItem('biofocus_active_user', JSON.stringify(profile));

    // Adapt reading level and tutor
    setReadingLevel(profile.gradeLevel);
    const assignedTutor = TUTOR_CHARACTERS.find((c) => c.id === profile.selectedTutorId) || TUTOR_CHARACTERS[0];
    setActiveCharacter(assignedTutor);

    // Load user's saved progress if exists
    const savedProgress = localStorage.getItem(`biofocus_progress_${profile.id}`);
    if (savedProgress) {
      try {
        setProgress(JSON.parse(savedProgress));
      } catch {
        // keep current
      }
    } else {
      // New profile bonus
      handleAwardXp(30, 'Profile Created & Personalized');
    }

    // Load user's saved topics if exists
    const userSaved = localStorage.getItem(`biofocus_saved_topics_${profile.id}`);
    if (userSaved) {
      try {
        setSavedTopicIds(JSON.parse(userSaved));
      } catch {
        // keep
      }
    }

    setShowAllTopicsOverride(false);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('biofocus_active_user');
    setShowAllTopicsOverride(false);
  };

  // Award XP and check milestone badges
  const handleAwardXp = (amount: number, title: string) => {
    const newXp = progress.totalXp + amount;
    const levelData = calculateLevel(newXp);

    // Show celebratory floating toast
    setRecentXpGained({ amount, title, id: Date.now() });
    setTimeout(() => setRecentXpGained(null), 2500);

    // Check newly unlocked badges
    const newUnlocked = [...progress.unlockedBadgeIds];
    const maybeUnlock = (badgeId: string) => {
      if (!newUnlocked.includes(badgeId)) {
        newUnlocked.push(badgeId);
        try {
          confetti({
            particleCount: 50,
            spread: 50,
            origin: { y: 0.2 },
            colors: ['#f59e0b', '#4f46e5', '#10b981'],
          });
        } catch {
          // ignore
        }
      }
    };

    if (newXp >= 150) maybeUnlock('cellular-detective');
    if (progress.completedTopicIds.length >= 4) maybeUnlock('bioscience-master');

    if (title.toLowerCase().includes('quiz') && amount >= 50) maybeUnlock('quiz-whiz');
    if (title.toLowerCase().includes('audio')) maybeUnlock('podcast-scholar');
    if (title.toLowerCase().includes('inquiry')) maybeUnlock('first-inquiry');
    if (title.toLowerCase().includes('molecule')) maybeUnlock('molecular-architect');

    setProgress((prev) => ({
      ...prev,
      totalXp: newXp,
      level: levelData.level,
      levelTitle: levelData.title,
      unlockedBadgeIds: newUnlocked,
      recentActivities: [
        {
          id: `act-${Date.now()}`,
          type: 'question_asked',
          title,
          xpEarned: amount,
          timestamp: Date.now(),
        },
        ...prev.recentActivities.slice(0, 15),
      ],
    }));
  };

  // Update Topic Mastery
  const handleUpdateTopicMastery = (topicId: string, masteryUpdate: Partial<TopicMastery>) => {
    setProgress((prev) => {
      const existing = prev.topicMastery[topicId] || {
        completed: false,
        quizScore: 0,
        quizTotal: 0,
        bestScorePercentage: 0,
        quizzesTaken: 0,
        questionsAsked: 0,
        lastStudiedAt: Date.now(),
      };

      const updatedMastery: TopicMastery = {
        ...existing,
        ...masteryUpdate,
      };

      const completedIds = prev.completedTopicIds.includes(topicId)
        ? prev.completedTopicIds
        : [...prev.completedTopicIds, topicId];

      return {
        ...prev,
        completedTopicIds: completedIds,
        topicMastery: {
          ...prev.topicMastery,
          [topicId]: updatedMastery,
        },
      };
    });
  };

  const handleSelectCharacter = (char: Character) => {
    setActiveCharacter(char);
    consultedTutorsRef.current.add(char.id);
    if (consultedTutorsRef.current.size >= 3) {
      if (!progress.unlockedBadgeIds.includes('tutor-trio')) {
        handleAwardXp(40, 'Hive of Minds Badge Unlocked!');
      }
    }
  };

  const handleToggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const handleToggleFocusMode = () => {
    setIsFocusMode((prev) => !prev);
    if (!isFocusMode) {
      handleAwardXp(15, 'Zen Focus Session Started');
      if (!progress.unlockedBadgeIds.includes('deep-focus-zen')) {
        handleAwardXp(30, 'Zen Concentration Badge Unlocked!');
      }
    }
  };

  const handleAddTopic = (newTopic: Topic) => {
    setTopics((prev) => [newTopic, ...prev]);
    setActiveTopic(newTopic);
    handleAwardXp(30, 'Created Custom Topic Notebook');
  };

  const handleToggleSaveTopic = (topicId: string) => {
    setSavedTopicIds((prev) => {
      const isAlreadySaved = prev.includes(topicId);
      if (isAlreadySaved) {
        return prev.filter((id) => id !== topicId);
      } else {
        const found = topics.find((t) => t.id === topicId);
        handleAwardXp(15, `Saved "${found ? found.title.split(':')[0] : 'Topic'}" to Reading List`);
        return [...prev, topicId];
      }
    });
  };

  const handleAskTutorAboutTerm = (term: string) => {
    setExternalPrompt(term);
    if (isFocusMode) {
      setFocusTab('tutor');
    } else if (!isSideBySide) {
      setActiveRightPanel('tutor');
    }
  };

  // Google Minimalist Search Landing State: false = minimal Google page, true = search results
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const handleSearchQuery = async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    // 1. Direct keyword match in curated topics (supports Sugar, Methane, Human DNA, GFP, etc.)
    const matchedCurated = searchCuratedTopics(q);
    if (matchedCurated) {
      setActiveTopic(matchedCurated);
      setHasSearched(true);
      handleAwardXp(15, `Searched: ${matchedCurated.title.split(':')[0]}`);
      return;
    }

    // 2. Query AI topic explorer
    try {
      const res = await fetch('/api/topics/ai-explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          userProfile: currentUser,
          readingLevel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.topic) {
          setTopics((prev) => [data.topic, ...prev]);
          setActiveTopic(data.topic);
          setHasSearched(true);
          handleAwardXp(20, `Discovered: ${data.topic.title.split(':')[0]}`);
          return;
        }
      }
    } catch (err) {
      console.warn('AI search error, falling back:', err);
    }

    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-[#FBFBF9] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col">
      {/* Top Navigation Bar: Minimal Icons Only (Google Style) */}
      <FocusBar
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        isFocusMode={isFocusMode}
        onToggleFocusMode={handleToggleFocusMode}
        character={activeCharacter}
        onOpenCharacterGallery={() => setIsCharacterGalleryOpen(true)}
        userProfile={currentUser}
        onOpenAuthModal={() => handleOpenAuth(currentUser ? 'profile' : 'signup')}
        onSignOut={handleSignOut}
        onReturnToSearch={() => setHasSearched(false)}
        onOpenRoadmap={() => setActiveRightPanel('roadmap')}
        onOpenReadingList={() => setActiveRightPanel('readingList')}
        savedCount={savedTopicIds.length}
      />

      {/* 1. MINIMAL GOOGLE SEARCH LANDING (Before search results appear) */}
      {!hasSearched ? (
        <GoogleSearchLanding
          onSearch={handleSearchQuery}
          activeCharacter={activeCharacter}
          onOpenCharacterGallery={() => setIsCharacterGalleryOpen(true)}
        />
      ) : (
        <>
          {/* 2. THE COMPLETE ASK FEATURE: Placed directly at the top under navigation bar */}
          <TopAskTutorBar
            topic={activeTopic}
            character={activeCharacter}
            onSelectCharacter={handleSelectCharacter}
            readingLevel={readingLevel}
            userProfile={currentUser}
            externalQueryPrompt={externalPrompt}
            onClearExternalQuery={() => setExternalPrompt(null)}
            onAwardXp={handleAwardXp}
            onOpenTutorProfile={setTutorProfileCharacter}
            onOpenCharacterGallery={() => setIsCharacterGalleryOpen(true)}
          />

          {/* 3. Topics Dropdown Menu & Search Field */}
          <TopicSelectorBar
            topics={topics}
            activeTopic={activeTopic}
            onSelectTopic={setActiveTopic}
            filteredTopics={filteredTopics}
            currentUser={currentUser}
            readingLevel={readingLevel}
            showAllTopicsOverride={showAllTopicsOverride}
            onToggleShowAllTopics={() => setShowAllTopicsOverride(!showAllTopicsOverride)}
            onOpenAddTopic={() => setIsAddTopicOpen(true)}
            onOpenProfile={() => handleOpenAuth('profile')}
            onAwardXp={handleAwardXp}
            topicMasteryMap={progress.topicMastery}
            onAiTopicDiscovered={(newTopic) => {
              setTopics((prev) => [newTopic, ...prev]);
              setActiveTopic(newTopic);
              setHasSearched(true);
            }}
            isSaved={savedTopicIds.includes(activeTopic.id)}
            onToggleSave={() => handleToggleSaveTopic(activeTopic.id)}
            onOpenReadingList={() => setActiveRightPanel('readingList')}
            savedCount={savedTopicIds.length}
          />

          {/* Main Learning Canvas */}
          <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
            {/* Active Topic Header */}
            <div className="mb-5 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">{activeTopic.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeTopic.difficulty}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeTopic.readTime}</span>
                  {activeTopic.chemicalFormula && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-md text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                        {activeTopic.chemicalFormula}
                      </span>
                    </>
                  )}
                  {activeTopic.pdbId && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm text-slate-700 dark:text-slate-300 text-[11px]">
                        PDB: {activeTopic.pdbId}
                      </span>
                    </>
                  )}
                </div>

                {/* Minimal Quick Action Badges */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleSaveTopic(activeTopic.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                      savedTopicIds.includes(activeTopic.id)
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                    }`}
                    title={savedTopicIds.includes(activeTopic.id) ? 'Remove from Reading List' : 'Save for Later in Reading List'}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${savedTopicIds.includes(activeTopic.id) ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                    <span>{savedTopicIds.includes(activeTopic.id) ? 'Saved' : 'Save for Later'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRightPanel('readingList')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
                    title="Open Reading List Drawer"
                  >
                    <span>📑 List ({savedTopicIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRightPanel('molecular')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 transition-colors"
                  >
                    <span>🧬 3D Lab</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRightPanel('quiz')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    <span>📝 Quiz</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRightPanel('passport')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition-colors"
                  >
                    <span>🏆 {progress.totalXp} XP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRightPanel('roadmap')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors"
                    title="Visual Bioscience Study Roadmap Flowchart"
                  >
                    <span>🗺️ Roadmap</span>
                  </button>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {activeTopic.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                {activeTopic.subtitle}
              </p>
            </div>

            {/* Focus Mode Navigation tabs if enabled */}
            {isFocusMode && (
              <div className="mb-4 flex items-center justify-center">
                <div className="inline-flex rounded-xl bg-slate-200/70 dark:bg-slate-800 p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setFocusTab('study')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      focusTab === 'study'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    1. Notebook Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => setFocusTab('molecular')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      focusTab === 'molecular'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    2. 3D Macromolecule
                  </button>
                  <button
                    type="button"
                    onClick={() => setFocusTab('quiz')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      focusTab === 'quiz'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    3. Retention Quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => setFocusTab('tutor')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      focusTab === 'tutor'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    4. Ask {activeCharacter.name}
                  </button>
                </div>
              </div>
            )}

            {/* WORKSPACE LAYOUT: Molecular Structure Hero DISPLAYED BY DEFAULT */}
            {isFocusMode ? (
              /* FOCUS MODE VIEW: Centered container */
              <div className="max-w-4xl mx-auto space-y-6">
                {focusTab === 'study' && (
                  <>
                    <MolecularStructureHero
                      topic={activeTopic}
                      darkMode={darkMode}
                      activeCharacter={activeCharacter}
                      onAskQuestionAboutGroup={(term) => handleAskTutorAboutTerm(term)}
                      isSaved={savedTopicIds.includes(activeTopic.id)}
                      onToggleSave={() => handleToggleSaveTopic(activeTopic.id)}
                    />
                    <NotebookOverview
                      topic={activeTopic}
                      readingLevel={readingLevel}
                      onReadingLevelChange={setReadingLevel}
                      userProfile={currentUser}
                      onAskTutorAboutTerm={handleAskTutorAboutTerm}
                      characterVoiceRate={activeCharacter.voiceRate}
                      onAwardXp={handleAwardXp}
                    />
                  </>
                )}

                {focusTab === 'molecular' && (
                  <MolecularStructureHero
                    topic={activeTopic}
                    darkMode={darkMode}
                    activeCharacter={activeCharacter}
                    onAskQuestionAboutGroup={(term) => handleAskTutorAboutTerm(term)}
                    isSaved={savedTopicIds.includes(activeTopic.id)}
                    onToggleSave={() => handleToggleSaveTopic(activeTopic.id)}
                  />
                )}

                {focusTab === 'quiz' && (
                  <InteractiveQuiz
                    topic={activeTopic}
                    character={activeCharacter}
                    readingLevel={readingLevel}
                    onAskTutor={handleAskTutorAboutTerm}
                    onAwardXp={handleAwardXp}
                    topicMastery={progress.topicMastery[activeTopic.id]}
                    onUpdateTopicMastery={handleUpdateTopicMastery}
                  />
                )}

                {focusTab === 'tutor' && (
                  <TutorChat
                    topic={activeTopic}
                    character={activeCharacter}
                    onSelectCharacter={handleSelectCharacter}
                    readingLevel={readingLevel}
                    userProfile={currentUser}
                    externalQueryPrompt={externalPrompt}
                    onClearExternalQuery={() => setExternalPrompt(null)}
                    onAwardXp={handleAwardXp}
                    onOpenTutorProfile={setTutorProfileCharacter}
                    onOpenCharacterGallery={() => setIsCharacterGalleryOpen(true)}
                  />
                )}
              </div>
            ) : isSideBySide && activeRightPanel ? (
              /* DOCKED SIDE-BY-SIDE VIEW */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-6">
                  {/* Molecular Structure Hero Displayed by Default */}
                  <MolecularStructureHero
                    topic={activeTopic}
                    darkMode={darkMode}
                    activeCharacter={activeCharacter}
                    onAskQuestionAboutGroup={(term) => handleAskTutorAboutTerm(term)}
                    isSaved={savedTopicIds.includes(activeTopic.id)}
                    onToggleSave={() => handleToggleSaveTopic(activeTopic.id)}
                  />

                  <NotebookOverview
                    topic={activeTopic}
                    readingLevel={readingLevel}
                    onReadingLevelChange={setReadingLevel}
                    userProfile={currentUser}
                    onAskTutorAboutTerm={handleAskTutorAboutTerm}
                    characterVoiceRate={activeCharacter.voiceRate}
                    onAwardXp={handleAwardXp}
                  />
                </div>

                <div className="lg:col-span-5 sticky top-20">
                  {activeRightPanel === 'molecular' && (
                    <MolecularViewer
                      topic={activeTopic}
                      darkMode={darkMode}
                      onResidueSelect={(res) => {
                        handleAwardXp(10, `Inspected Residue ${res.name} #${res.resi}`);
                        handleAskTutorAboutTerm(
                          `What does residue ${res.name} #${res.resi} (Chain ${res.chain}) do in ${activeTopic.title.split(':')[0]}?`
                        );
                      }}
                    />
                  )}
                  {activeRightPanel === 'quiz' && (
                    <InteractiveQuiz
                      topic={activeTopic}
                      character={activeCharacter}
                      readingLevel={readingLevel}
                      onAskTutor={handleAskTutorAboutTerm}
                      onAwardXp={handleAwardXp}
                      topicMastery={progress.topicMastery[activeTopic.id]}
                      onUpdateTopicMastery={handleUpdateTopicMastery}
                    />
                  )}
                  {activeRightPanel === 'tutor' && (
                    <TutorChat
                      topic={activeTopic}
                      character={activeCharacter}
                      onSelectCharacter={handleSelectCharacter}
                      readingLevel={readingLevel}
                      userProfile={currentUser}
                      externalQueryPrompt={externalPrompt}
                      onClearExternalQuery={() => setExternalPrompt(null)}
                      onAwardXp={handleAwardXp}
                      onOpenTutorProfile={setTutorProfileCharacter}
                      onOpenCharacterGallery={() => setIsCharacterGalleryOpen(true)}
                    />
                  )}
                </div>
              </div>
            ) : (
              /* STANDARD VIEW: 2D/3D MOLECULAR STRUCTURE DISPLAYED BY DEFAULT */
              <div className="space-y-6">
                {/* 1. Molecular Structure Hero with 2D/3D viewer, Chemical Compounds, and Labels */}
                <MolecularStructureHero
                  topic={activeTopic}
                  darkMode={darkMode}
                  activeCharacter={activeCharacter}
                  onAskQuestionAboutGroup={(term) => handleAskTutorAboutTerm(term)}
                  isSaved={savedTopicIds.includes(activeTopic.id)}
                  onToggleSave={() => handleToggleSaveTopic(activeTopic.id)}
                />

                {/* 2. Notebook Study Notes */}
                <NotebookOverview
                  topic={activeTopic}
                  readingLevel={readingLevel}
                  onReadingLevelChange={setReadingLevel}
                  userProfile={currentUser}
                  onAskTutorAboutTerm={handleAskTutorAboutTerm}
                  characterVoiceRate={activeCharacter.voiceRate}
                  onAwardXp={handleAwardXp}
                />
              </div>
            )}
          </main>
        </>
      )}

      {/* Pinned Action Menu Buttons & Slide-Over Drawer on the Right */}
      <RightSidebarDrawer
        activePanel={activeRightPanel}
        onSelectPanel={setActiveRightPanel}
        isSideBySide={isSideBySide}
        onToggleSideBySide={() => setIsSideBySide(!isSideBySide)}
        topic={activeTopic}
        topics={topics}
        onSelectTopic={setActiveTopic}
        character={activeCharacter}
        onSelectCharacter={handleSelectCharacter}
        readingLevel={readingLevel}
        darkMode={darkMode}
        currentUser={currentUser}
        progress={progress}
        externalPrompt={externalPrompt}
        onClearExternalPrompt={() => setExternalPrompt(null)}
        onAwardXp={handleAwardXp}
        onUpdateTopicMastery={handleUpdateTopicMastery}
        onOpenTutorProfile={setTutorProfileCharacter}
        onOpenCharacterGallery={() => setIsCharacterGalleryOpen(true)}
        onOpenBadgesModal={() => setIsBadgesModalOpen(true)}
        savedTopicIds={savedTopicIds}
        onToggleSaveTopic={handleToggleSaveTopic}
        onAskTutorAboutTopic={(topicObj, query) => {
          setActiveTopic(topicObj);
          handleAskTutorAboutTerm(query || `Can you give me an overview and study plan for ${topicObj.title}?`);
        }}
      />

      {/* Minimal Distraction-Free Footer */}
      <footer className="mt-auto border-t border-slate-200/60 dark:border-slate-800/60 py-4 px-6 text-center text-xs text-slate-400 dark:text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>BioFocus Studio · Personalized Bioscience Teaching with Sofia Carter</span>
          <div className="flex items-center gap-3 text-[11px]">
            <a
              href="https://www.rcsb.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-600 dark:hover:text-slate-400"
            >
              RCSB Protein Data Bank
            </a>
            <span>·</span>
            <a
              href="https://alphafold.ebi.ac.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-600 dark:hover:text-slate-400"
            >
              AlphaFold DB
            </a>
          </div>
        </div>
      </footer>

      {/* Add Custom Topic Modal */}
      <AddTopicModal
        isOpen={isAddTopicOpen}
        onClose={() => setIsAddTopicOpen(false)}
        onAddTopic={handleAddTopic}
      />

      {/* Badges & Achievements Modal */}
      <BadgesModal
        isOpen={isBadgesModalOpen}
        onClose={() => setIsBadgesModalOpen(false)}
        progress={progress}
      />

      {/* Visual Character Gallery & Selector Modal */}
      <CharacterGalleryModal
        isOpen={isCharacterGalleryOpen}
        onClose={() => setIsCharacterGalleryOpen(false)}
        activeCharacter={activeCharacter}
        onSelectCharacter={handleSelectCharacter}
      />

      {/* Tutor Profile & Backstory Modal */}
      <TutorProfileModal
        character={tutorProfileCharacter}
        isOpen={!!tutorProfileCharacter}
        onClose={() => setTutorProfileCharacter(null)}
        onSelectTutor={handleSelectCharacter}
        isActive={tutorProfileCharacter?.id === activeCharacter.id}
      />

      {/* User Signup & Profile Creation Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        initialMode={authModalMode}
      />
    </div>
  );
}
