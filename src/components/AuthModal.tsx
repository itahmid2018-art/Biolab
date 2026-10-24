import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  Sparkles,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Shield,
  Layers,
  Heart,
  Save,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { UserProfile, ReadingLevel } from '../types';
import { TUTOR_CHARACTERS } from '../data/tutors';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (profile: UserProfile) => void;
  currentUser?: UserProfile | null;
  onSignOut?: () => void;
  initialMode?: 'signup' | 'signin' | 'profile';
}

const AVATAR_OPTIONS = ['👩‍🔬', '🧬', '🚀', '🐬', '🌿', '🌟', '🔬', '🦉', '🐝', '🤖', '🪸'];

export const SCIENCE_INTERESTS = [
  {
    id: 'Marine Biology & Optics',
    label: 'Marine Biology & Glowing Jellyfish (GFP)',
    icon: '🐬',
    topicTitle: 'The Glowing Lantern: GFP (1EMA)',
  },
  {
    id: 'Genetics & Molecular Biology',
    label: 'Genetics & The DNA Double Helix',
    icon: '🧬',
    topicTitle: 'The Spiral Recipe Book: DNA (1BNA)',
  },
  {
    id: 'Human Physiology',
    label: 'Human Body & Oxygen Submarines (Hemoglobin)',
    icon: '🫀',
    topicTitle: 'The Oxygen Nano-Submarine: Hemoglobin (1A3N)',
  },
  {
    id: 'Metabolism & Endocrinology',
    label: 'Metabolism & Cellular Energy (Insulin)',
    icon: '⚡',
    topicTitle: 'The Master Key of Energy: Insulin (1TRZ)',
  },
  {
    id: 'Immunology & Health',
    label: 'Immunology & Viral Defenders (Antibodies)',
    icon: '🛡️',
    topicTitle: 'The Y-Shaped Shield: Antibody (1IGT)',
  },
];

export const DEMO_PROFILES: UserProfile[] = [
  {
    id: 'demo-maya-11',
    name: 'Maya Carter',
    email: 'maya.carter@school.org',
    age: 11,
    gradeLevel: 'grades-5-7',
    avatar: '👩‍🔬',
    selectedTutorId: 'sofia',
    interests: ['Marine Biology & Optics', 'Genetics & Molecular Biology'],
    learningGoals: ['Explore DNA blueprints', 'Understand GFP glowing jellyfish with Sofia'],
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'demo-leo-12',
    name: 'Leo Sterling',
    email: 'leo.sterling@academy.edu',
    age: 12,
    gradeLevel: 'grades-5-7',
    avatar: '🚀',
    selectedTutorId: 'nova',
    interests: ['Human Physiology', 'Metabolism & Endocrinology'],
    learningGoals: ['Explore molecular motors at 9,000 RPM', 'Understand oxygen transport'],
    createdAt: Date.now() - 43200000,
  },
  {
    id: 'demo-elena-14',
    name: 'Elena Frost',
    email: 'elena.frost@stem.net',
    age: 14,
    gradeLevel: 'grades-8-plus',
    avatar: '🛡️',
    selectedTutorId: 'dr-b',
    interests: ['Immunology & Health'],
    learningGoals: ['Study antibody Y-structures and immune defenses'],
    createdAt: Date.now() - 21600000,
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  currentUser,
  onSignOut,
  initialMode = 'signup',
}) => {
  const [mode, setMode] = useState<'signup' | 'signin' | 'profile'>('signup');

  // Form State
  const [name, setName] = useState<string>('Sofia Explorer');
  const [email, setEmail] = useState<string>('student@biofocus.org');
  const [password, setPassword] = useState<string>('curious123');
  const [age, setAge] = useState<number>(11);
  const [gradeLevel, setGradeLevel] = useState<ReadingLevel>('grades-5-7');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('👩‍🔬');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Marine Biology & Optics',
    'Genetics & Molecular Biology',
  ]);
  const [selectedTutorId, setSelectedTutorId] = useState<string>('sofia');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      if (currentUser && (initialMode === 'profile' || !initialMode)) {
        setMode('profile');
        setName(currentUser.name);
        setEmail(currentUser.email);
        setAge(currentUser.age);
        setGradeLevel(currentUser.gradeLevel);
        setSelectedAvatar(currentUser.avatar);
        setSelectedInterests(currentUser.interests);
        setSelectedTutorId(currentUser.selectedTutorId);
      } else {
        setMode(initialMode || (currentUser ? 'profile' : 'signup'));
        if (currentUser) {
          setName(currentUser.name);
          setEmail(currentUser.email);
          setAge(currentUser.age);
          setGradeLevel(currentUser.gradeLevel);
          setSelectedAvatar(currentUser.avatar);
          setSelectedInterests(currentUser.interests);
          setSelectedTutorId(currentUser.selectedTutorId);
        }
      }
      setStatusNotification(null);
    }
  }, [isOpen, initialMode, currentUser]);

  if (!isOpen) return null;

  const toggleInterest = (interestId: string) => {
    setSelectedInterests((prev) => {
      const next = prev.includes(interestId)
        ? prev.filter((i) => i !== interestId)
        : [...prev, interestId];
      // Keep at least one interest so student always has matching content
      return next.length > 0 ? next : [interestId];
    });
  };

  const handleAgeChange = (newAge: number) => {
    setAge(newAge);
    if (newAge <= 9) {
      setGradeLevel('grades-2-4');
    } else if (newAge <= 12) {
      setGradeLevel('grades-5-7');
    } else {
      setGradeLevel('grades-8-plus');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'profile') {
      // Update existing profile
      const updatedProfile: UserProfile = {
        id: currentUser?.id || `user-${Date.now()}`,
        name: name.trim() || 'Curious Student',
        email: email.trim() || 'student@biofocus.org',
        age,
        gradeLevel,
        avatar: selectedAvatar,
        selectedTutorId,
        interests: selectedInterests.length > 0 ? selectedInterests : ['Marine Biology & Optics'],
        createdAt: currentUser?.createdAt || Date.now(),
      };

      localStorage.setItem(`biofocus_user_${email.trim().toLowerCase()}`, JSON.stringify(updatedProfile));
      onLogin(updatedProfile);
      onClose();
      return;
    }

    if (mode === 'signin') {
      // Find matching stored user or demo profile
      const stored = localStorage.getItem(`biofocus_user_${email.trim().toLowerCase()}`);
      if (stored) {
        try {
          const profile = JSON.parse(stored);
          onLogin(profile);
          onClose();
          return;
        } catch {
          // fallback
        }
      }
      // Demo match or instant login
      const demoMatch = DEMO_PROFILES.find((p) => p.email.toLowerCase() === email.toLowerCase());
      if (demoMatch) {
        onLogin(demoMatch);
        onClose();
        return;
      }

      // Create instant user from email with default profile
      const newProfile: UserProfile = {
        id: `user-${Date.now()}`,
        name: email.split('@')[0],
        email: email.trim(),
        age: 11,
        gradeLevel: 'grades-5-7',
        avatar: '👩‍🔬',
        selectedTutorId: 'sofia',
        interests: ['Marine Biology & Optics', 'Genetics & Molecular Biology'],
        createdAt: Date.now(),
      };
      localStorage.setItem(`biofocus_user_${email.trim().toLowerCase()}`, JSON.stringify(newProfile));
      onLogin(newProfile);
      onClose();
      return;
    }

    // Sign Up Mode: Create full default profile
    const newProfile: UserProfile = {
      id: `user-${Date.now()}`,
      name: name.trim() || 'Curious Student',
      email: email.trim() || 'student@biofocus.org',
      age,
      gradeLevel,
      avatar: selectedAvatar,
      selectedTutorId,
      interests: selectedInterests.length > 0 ? selectedInterests : ['Marine Biology & Optics'],
      createdAt: Date.now(),
    };

    localStorage.setItem(`biofocus_user_${email.trim().toLowerCase()}`, JSON.stringify(newProfile));
    onLogin(newProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center shadow-xs">
              BF
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {mode === 'signup'
                  ? 'Student Sign Up & Profile Setup'
                  : mode === 'profile'
                  ? 'Your Student Profile & Content Settings'
                  : 'Sign In to BioFocus'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'signup'
                  ? 'Create your default profile: only specific content matching your passions will be shown'
                  : mode === 'profile'
                  ? 'Manage your default profile and adjust which topics and tutors are visible to you'
                  : 'Welcome back! Sign in to load your personalized curriculum and progress'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              mode === 'signup'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            1. Create Profile (Sign Up)
          </button>
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
              mode === 'signin'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            2. Existing Sign In
          </button>
          {currentUser && (
            <button
              type="button"
              onClick={() => setMode('profile')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all ${
                mode === 'profile'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              3. My Profile ({currentUser.name})
            </button>
          )}
        </div>

        {/* 1-Click Demo Profiles Ribbon */}
        {mode !== 'profile' && (
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/30 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Fast Demo Profiles:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {DEMO_PROFILES.map((dp) => (
                <button
                  key={dp.id}
                  type="button"
                  onClick={() => {
                    onLogin(dp);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-medium transition-colors text-[11px] shadow-2xs"
                >
                  <span>{dp.avatar}</span> {dp.name} (Age {dp.age} · {dp.interests.length} Topics)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {mode === 'signup' || mode === 'profile' ? (
            <>
              {/* Profile Specific Content Banner */}
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-start gap-2.5">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-indigo-950 dark:text-indigo-200">
                  <span className="font-bold">Content Personalization Guarantee:</span> Once you sign in,
                  only lessons, quizzes, 3D molecular structures, and flashcards that match your selected
                  passions will be shown to you.
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Full Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maya Carter"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Email Address:
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@school.org"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Password (for signup mode) */}
              {mode === 'signup' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Create Student Passcode:
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a memorable passcode"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Age & Grade Level (Highlighting 11+ for Sofia Carter) */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800 dark:text-slate-200">
                    Student Age: <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">{age} years old</span>
                  </label>
                  {age >= 11 && (
                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                      ✨ Optimal age for Sofia Carter&apos;s curriculum (Ages 11+)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">8</span>
                  <input
                    type="range"
                    min="8"
                    max="16"
                    value={age}
                    onChange={(e) => handleAgeChange(parseInt(e.target.value, 10))}
                    className="flex-1 accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400">16+</span>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
                  <span>Targeted Curriculum Level:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {gradeLevel === 'grades-2-4'
                      ? 'Grades 2–4 (Ages 7–9)'
                      : gradeLevel === 'grades-5-7'
                      ? 'Grades 5–7 (Ages 10–12, Middle School Prep)'
                      : 'Grades 8+ (Teen High School Level)'}
                  </span>
                </div>
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Choose Your Student Avatar:
                </label>
                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                        selectedAvatar === av
                          ? 'bg-indigo-100 dark:bg-indigo-950 ring-2 ring-indigo-500 scale-105 shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Science Interests Selection (Used to filter specific content) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                      Specific Content Shown to You ({selectedInterests.length} of {SCIENCE_INTERESTS.length} active):
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Check each topic you want included in your curriculum:
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60">
                    {selectedInterests.length} Topics Visible
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SCIENCE_INTERESTS.map((interest) => {
                    const isChecked = selectedInterests.includes(interest.id);
                    return (
                      <div
                        key={interest.id}
                        onClick={() => toggleInterest(interest.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                          isChecked
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 text-slate-900 dark:text-white font-medium shadow-2xs'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 opacity-60'
                        }`}
                      >
                        <span className="text-xl mt-0.5">{interest.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold flex items-center justify-between">
                            <span>{interest.label}</span>
                            {isChecked && (
                              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                            {interest.topicTitle}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Default AI Tutor Selection */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Default Personal AI Tutor:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TUTOR_CHARACTERS.map((char) => {
                    const isSelected = selectedTutorId === char.id;
                    const isSofia = char.id === 'sofia';
                    return (
                      <div
                        key={char.id}
                        onClick={() => setSelectedTutorId(char.id)}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 select-none ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-2xs'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-2xl mt-0.5">{char.avatarEmoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {char.name}
                            </span>
                            {isSofia && (
                              <span className="text-[9px] font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-sm">
                                Ready for Ages 11+
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 block truncate">
                            {char.title}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {char.conversationalStyle}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Sign In Mode */
            <div className="space-y-4 py-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Registered Student Email Address:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maya.carter@school.org"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Passcode / Password:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-500 text-[11px] leading-relaxed">
                🔐 Once you sign in, only your customized science notebooks, specific lesson topics, personal tutor, and progress will be shown.
              </div>
            </div>
          )}

          {/* Footer Submit Button */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            {mode === 'profile' && onSignOut ? (
              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-medium text-xs transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">
                {mode === 'signup'
                  ? 'Only your selected topics will be shown'
                  : 'Need a new account? Switch to Sign Up above'}
              </span>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-colors"
            >
              {mode === 'profile' ? (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile & Update Shown Content</span>
                </>
              ) : mode === 'signup' ? (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Create Profile & Enter Studio</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
