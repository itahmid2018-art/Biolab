import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Search,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Plus,
  Compass,
  ArrowRight,
  Loader2,
  X,
  ExternalLink,
  Tag,
  Clock,
  Award,
} from 'lucide-react';
import { Topic, UserProfile, ReadingLevel } from '../types';

interface TopicSelectorBarProps {
  topics: Topic[];
  activeTopic: Topic;
  onSelectTopic: (topic: Topic) => void;
  filteredTopics: Topic[];
  currentUser: UserProfile | null;
  readingLevel: ReadingLevel;
  showAllTopicsOverride: boolean;
  onToggleShowAllTopics: () => void;
  onOpenAddTopic: () => void;
  onOpenProfile: () => void;
  onAwardXp: (amount: number, reason: string) => void;
  topicMasteryMap: Record<string, { completed?: boolean; bestScorePercentage?: number }>;
  onAiTopicDiscovered: (topic: Topic) => void;
}

export const TopicSelectorBar: React.FC<TopicSelectorBarProps> = ({
  topics,
  activeTopic,
  onSelectTopic,
  filteredTopics,
  currentUser,
  readingLevel,
  showAllTopicsOverride,
  onToggleShowAllTopics,
  onOpenAddTopic,
  onOpenProfile,
  onAwardXp,
  topicMasteryMap,
  onAiTopicDiscovered,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchingAi, setIsSearchingAi] = useState<boolean>(false);
  const [aiSearchResult, setAiSearchResult] = useState<{
    topic: Topic;
    relevanceExplanation: string;
    relatedTopicSuggestions: string[];
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter topics for the search preview dropdown
  const matchedLoadedTopics = topics.filter((t) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.subtitle.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.pdbId && t.pdbId.toLowerCase().includes(q))
    );
  });

  const handleAiSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearchingAi(true);
    setSearchError(null);
    setAiSearchResult(null);

    try {
      const res = await fetch('/api/topics/ai-explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.trim(),
          userProfile: currentUser,
          readingLevel,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.topic) {
        setAiSearchResult(data);
        onAwardXp(15, `Searched topic: ${searchQuery.slice(0, 20)}`);
      } else {
        throw new Error('No topic generated');
      }
    } catch (err: any) {
      console.error('Error searching topic with AI:', err);
      setSearchError('Could not discover topic right now. Please try again or pick from curated topics.');
    } finally {
      setIsSearchingAi(false);
    }
  };

  const handleAcceptAiTopic = (topic: Topic) => {
    onAiTopicDiscovered(topic);
    onSelectTopic(topic);
    setAiSearchResult(null);
    setSearchQuery('');
    setIsDropdownOpen(false);
    onAwardXp(30, `Explored new topic: ${topic.title.split(':')[0]}`);
  };

  const isPersonalized = currentUser && !showAllTopicsOverride;

  return (
    <section className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md px-4 sm:px-6 py-2.5 z-30 relative">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Personalized Topic Dropdown Menu */}
        <div className="flex items-center gap-2.5" ref={dropdownRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-2xs transition-all"
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500 dark:text-slate-400 font-normal">
                {isPersonalized ? 'Your Topics:' : 'Topic:'}
              </span>
              <span className="max-w-[200px] sm:max-w-[260px] truncate text-slate-800 dark:text-slate-200">
                {activeTopic.title.split(':')[0]}
              </span>
              {activeTopic.pdbId && (
                <span className="px-1.5 py-0.5 rounded-sm bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-mono text-[10px]">
                  {activeTopic.pdbId}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Popover */}
            {isDropdownOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {isPersonalized ? 'Your Learning Track' : 'Curated Topics Library'}
                    </span>
                  </div>
                  {currentUser && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenProfile();
                      }}
                      className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Filter by Interests →
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
                  {/* If user is signed in with specific topics */}
                  {currentUser && !showAllTopicsOverride && (
                    <div className="px-2 pt-1 pb-1 text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                      <span>Matched to Your Profile ({filteredTopics.length})</span>
                      <button
                        type="button"
                        onClick={onToggleShowAllTopics}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 normal-case font-medium"
                      >
                        Show All
                      </button>
                    </div>
                  )}

                  {filteredTopics.map((t) => {
                    const isSelected = t.id === activeTopic.id;
                    const isMastered = topicMasteryMap[t.id]?.completed;
                    const score = topicMasteryMap[t.id]?.bestScorePercentage;

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onSelectTopic(t);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent'
                        }`}
                      >
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>
                              {t.title.split(':')[0]}
                            </span>
                            {t.pdbId && (
                              <span className="font-mono text-[9px] px-1 py-0.2 rounded-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {t.pdbId}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {t.subtitle}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                            <span>{t.category}</span>
                            <span>•</span>
                            <span>{t.readTime}</span>
                            {score !== undefined && (
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                • {score}% Score
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center pt-1">
                          {isMastered ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : isSelected ? (
                            <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer of dropdown */}
                <div className="p-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenAddTopic();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Topic Notes</span>
                  </button>

                  {currentUser && (
                    <button
                      type="button"
                      onClick={onToggleShowAllTopics}
                      className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      {showAllTopicsOverride ? 'Enforce Profile' : 'View All Topics'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick category pill */}
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400">
            <Tag className="w-3 h-3 text-slate-400" />
            <span>{activeTopic.category}</span>
          </span>
        </div>

        {/* Center / Right: Intelligent Topic Search Field */}
        <div className="flex-1 max-w-xl relative">
          <form onSubmit={handleAiSearch} className="relative flex items-center">
            <div className="absolute left-3 pointer-events-none text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topic or enter interest to explore with AI (e.g. CRISPR, Photosynthesis, Vaccines)..."
              className="w-full pl-9 pr-24 py-1.5 text-xs rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-2xs"
            />

            {/* Clear Button */}
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-20 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* AI Explore Button */}
            <button
              type="submit"
              disabled={isSearchingAi || !searchQuery.trim()}
              className="absolute right-1 top-1 bottom-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-medium flex items-center gap-1 transition-colors shadow-2xs"
              title="Find or generate comprehensive topic matching your profile"
            >
              {isSearchingAi ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3 text-amber-300" />
              )}
              <span>AI Explore</span>
            </button>
          </form>

          {/* Quick matching dropdown suggestions while typing */}
          {searchQuery.trim().length > 1 && !aiSearchResult && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-2 z-40 text-xs">
              {matchedLoadedTopics.length > 0 ? (
                <div className="space-y-1 mb-2">
                  <div className="px-2 py-0.5 text-[10px] uppercase font-bold text-slate-400">
                    Existing Curated Topics
                  </div>
                  {matchedLoadedTopics.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onSelectTopic(t);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {t.title}
                      </span>
                      <span className="text-[10px] text-slate-400">{t.category}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => handleAiSearch()}
                disabled={isSearchingAi}
                className="w-full text-left px-2.5 py-2 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-indigo-900 dark:text-indigo-200 block text-xs">
                      Ask AI to explore &quot;{searchQuery}&quot;
                    </span>
                    <span className="text-[10px] text-indigo-600/80 dark:text-indigo-300/80">
                      Finds or creates a complete age-adapted study notebook with 3D structure
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              </button>
            </div>
          )}

          {searchError && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-xl p-2 z-40 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
              <span>{searchError}</span>
              <button type="button" onClick={() => setSearchError(null)} className="p-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Topic Discovered Preview Card Modal */}
      {aiSearchResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-5 h-5 text-amber-400 animate-spin-slow" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  AI Educational Topic Discovered
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAiSearchResult(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                  {aiSearchResult.topic.category}
                </span>
                <span>•</span>
                <span>{aiSearchResult.topic.difficulty}</span>
                <span>•</span>
                <span>{aiSearchResult.topic.readTime}</span>
                {aiSearchResult.topic.pdbId && (
                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-sm text-slate-700 dark:text-slate-300">
                    PDB: {aiSearchResult.topic.pdbId}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {aiSearchResult.topic.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {aiSearchResult.topic.subtitle}
              </p>
            </div>

            {/* Sofia's recommendation note */}
            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
              <span className="text-base shrink-0">👩‍🏫</span>
              <div>
                <strong className="font-semibold block">Sofia Carter’s Curated Match:</strong>
                <p className="text-[11px] mt-0.5">{aiSearchResult.relevanceExplanation}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <span className="font-semibold text-slate-900 dark:text-white text-[11px] block">
                Lesson Summary Preview:
              </span>
              <p className="text-[11px] leading-relaxed line-clamp-3">
                {aiSearchResult.topic.summary}
              </p>

              {aiSearchResult.topic.vocabulary && aiSearchResult.topic.vocabulary.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {aiSearchResult.topic.vocabulary.slice(0, 3).map((v) => (
                    <span
                      key={v.term}
                      className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-600 dark:text-slate-300 font-medium"
                    >
                      {v.term}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setAiSearchResult(null)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium"
              >
                Keep Current Topic
              </button>

              <button
                type="button"
                onClick={() => handleAcceptAiTopic(aiSearchResult.topic)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-md"
              >
                <span>Start Exploring This Topic</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
