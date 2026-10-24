import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Radio,
  Share2,
  Check,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import { Topic, NotebookSummary, ReadingLevel, UserProfile } from '../types';

interface NotebookOverviewProps {
  topic: Topic;
  readingLevel: ReadingLevel;
  onReadingLevelChange: (level: ReadingLevel) => void;
  userProfile?: UserProfile | null;
  onAskTutorAboutTerm?: (term: string) => void;
  characterVoiceRate?: number;
  onAwardXp?: (amount: number, title: string) => void;
}

export const NotebookOverview: React.FC<NotebookOverviewProps> = ({
  topic,
  readingLevel,
  onReadingLevelChange,
  userProfile,
  onAskTutorAboutTerm,
  onAwardXp,
}) => {
  const [summary, setSummary] = useState<NotebookSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'podcast' | 'mindmap' | 'vocab'>('summary');

  // Flashcards state
  const [flippedCardIndex, setFlippedCardIndex] = useState<number | null>(null);

  // Audio Podcast Player state
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [currentDialogueIndex, setCurrentDialogueIndex] = useState<number>(0);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Active selected mind map node
  const [selectedMindMapNode, setSelectedMindMapNode] = useState<string | null>(null);

  // Fetch or regenerate NotebookLM summary
  const fetchSummary = async (level: ReadingLevel) => {
    setLoading(true);
    setError(null);

    const fallbackSummary = {
      overview: topic.summary,
      keyTakeaways: [
        'Biological structures are shaped for their exact microscopic jobs.',
        'Small chemical changes lead to remarkable transformations in living organisms.',
        'Scientists study these shapes to invent life-saving treatments and understand nature.',
      ],
      whyItMatters:
        'Every cell in your body depends on precision nanoscale machinery to keep you thinking, moving, and growing every single second.',
      vocabulary: topic.vocabulary,
      mindMapNodes: [
        { id: 'core', label: topic.title.split(':')[0] },
        { id: 'func', label: 'Biological Purpose', parentId: 'core' },
        { id: 'shape', label: '3D Architecture', parentId: 'core' },
        { id: 'real', label: 'Real Life Connection', parentId: 'func' },
      ],
      audioDialogue: [
        {
          speaker: 'Alex (Curious Student)',
          text: `Welcome to our science briefing! Today we are exploring ${topic.title.split(':')[0]}. What makes it so amazing?`,
        },
        {
          speaker: 'Dr. Sam (Friendly Biologist)',
          text: `Imagine a machine thousands of times smaller than a speck of dust, yet folded so perfectly that it never makes a mistake!`,
        },
        {
          speaker: 'Alex (Curious Student)',
          text: `And our bodies have trillions of these working right now? That is truly incredible!`,
        },
        {
          speaker: 'Dr. Sam (Friendly Biologist)',
          text: `Exactly! Nature is the ultimate nano-engineer. Let us look closely at how it works.`,
        },
      ],
    };

    try {
      const res = await fetch('/api/notebook/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: topic.fullContent,
          topicTitle: topic.title,
          readingLevel: level,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.overview) {
          setSummary(data);
          return;
        }
      }

      setSummary(fallbackSummary);
    } catch {
      setSummary(fallbackSummary);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(readingLevel);
    // Stop any ongoing speech when topic changes
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setCurrentDialogueIndex(0);
    }
  }, [topic.id, readingLevel]);

  // Audio Podcast Playback loop using Web Speech API
  useEffect(() => {
    if (!isPlayingAudio || !summary?.audioDialogue || summary.audioDialogue.length === 0) {
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported by your browser.');
      setIsPlayingAudio(false);
      return;
    }

    const turns = summary.audioDialogue;
    if (currentDialogueIndex >= turns.length) {
      setIsPlayingAudio(false);
      setCurrentDialogueIndex(0);
      return;
    }

    const turn = turns[currentDialogueIndex];
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(turn.text);
    // Distinct pitch & rate for each host to simulate a real NotebookLM 2-host show!
    const isAlex = turn.speaker.toLowerCase().includes('alex');
    utter.pitch = isAlex ? 1.2 : 0.95;
    utter.rate = isAlex ? 1.05 : 0.95;

    utter.onend = () => {
      if (currentDialogueIndex + 1 < turns.length) {
        setCurrentDialogueIndex((prev) => prev + 1);
      } else {
        setIsPlayingAudio(false);
        setCurrentDialogueIndex(0);
      }
    };

    utter.onerror = () => {
      setIsPlayingAudio(false);
    };

    speechRef.current = utter;
    window.speechSynthesis.speak(utter);

    return () => {
      // do not cancel immediately unless unmounting
    };
  }, [isPlayingAudio, currentDialogueIndex, summary]);

  const toggleAudioPlay = () => {
    if (isPlayingAudio) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      if (onAwardXp) {
        onAwardXp(20, 'Audio Overview Listened');
      }
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* NotebookLM Header & Grade Level Adaptation Control */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                NotebookLM Study Studio
              </h2>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Personalized Insights</span>
              {userProfile && (
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  {userProfile.avatar} {userProfile.name}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {userProfile
                ? `Specific curriculum matched to your interests in ${topic.category}`
                : 'Personalized summaries, 2-host audio briefings, and active-recall flashcards'}
            </p>
          </div>
        </div>

        {/* Grade-Level Selector Controls (functional segmented buttons) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Learning Level:</span>
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => onReadingLevelChange('grades-2-4')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                readingLevel === 'grades-2-4'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Grades 2–4 (Ages 7–9)
            </button>
            <button
              type="button"
              onClick={() => onReadingLevelChange('grades-5-7')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                readingLevel === 'grades-5-7'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Grades 5–7 (Ages 10–12)
            </button>
            <button
              type="button"
              onClick={() => onReadingLevelChange('grades-8-plus')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                readingLevel === 'grades-8-plus'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Grades 8+ (Teen)
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchSummary(readingLevel)}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Refresh summary"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Studio Navigation Tabs (Interactive Segmented buttons, no pills) */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'summary'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          <span>Core Summary</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('podcast')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'podcast'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-rose-500" />
          <span>Audio Overview (2-Host Show)</span>
          {isPlayingAudio && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vocab')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'vocab'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Vocabulary Flashcards</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mindmap')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
            activeTab === 'mindmap'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-emerald-500" />
          <span>Concept Mind Map</span>
        </button>
      </div>

      {/* TAB 1: CORE SUMMARY */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main 2-column Content */}
          <div className="md:col-span-2 space-y-4">
            {/* Overview Card */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Big Picture Explanation
                </h3>
                <span className="text-xs text-slate-400">
                  {readingLevel === 'grades-2-4'
                    ? 'Simple & Visual'
                    : readingLevel === 'grades-5-7'
                    ? 'In-Depth Exploration'
                    : 'Advanced STEM'}
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {summary ? summary.overview : topic.summary}
              </p>
            </div>

            {/* Key Takeaways */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Key Insights & Mind-Expanding Takeaways
              </h3>
              <div className="space-y-2.5">
                {(summary?.keyTakeaways || []).map((takeaway, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="leading-snug">{takeaway}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Why it matters + Quick questions */}
          <div className="space-y-4">
            {/* Why It Matters In Your Life */}
            <div className="p-5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold text-xs mb-2">
                <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Why It Matters To You Right Now</span>
              </div>
              <p className="text-xs text-amber-950/80 dark:text-amber-300/90 leading-relaxed">
                {summary?.whyItMatters ||
                  'Every movement, breath, and heartbeat you have right now is enabled by these microscopic biological machines!'}
              </p>
            </div>

            {/* Fun Fact Callout */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Astonishing Fact</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                &ldquo;{topic.funFact}&rdquo;
              </p>
            </div>

            {/* Curiosity Prompts to Ask Tutor */}
            <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-2.5 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                <span>Questions To Wonder About</span>
              </h4>
              <div className="space-y-2">
                {topic.keyQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onAskTutorAboutTerm && onAskTutorAboutTerm(q)}
                    className="w-full text-left p-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                  >
                    👉 {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NOTEBOOKLM AUDIO OVERVIEW (2-Host Podcast Experience) */}
      {activeTab === 'podcast' && (
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  NotebookLM Audio Overview
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Dynamic 2-host conversational science dialogue between Alex & Dr. Sam
                </p>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleAudioPlay}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-sm ${
                  isPlayingAudio
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause Episode</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Play Audio Episode</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                  setCurrentDialogueIndex(0);
                  setIsPlayingAudio(false);
                }}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Restart from beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Transcript / Dialogue Turns */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {(summary?.audioDialogue || []).map((turn, idx) => {
              const isAlex = turn.speaker.toLowerCase().includes('alex');
              const isCurrentTurn = isPlayingAudio && currentDialogueIndex === idx;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentDialogueIndex(idx);
                    setIsPlayingAudio(true);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrentTurn
                      ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                      : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isAlex
                            ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                        }`}
                      >
                        {isAlex ? 'A' : 'S'}
                      </span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {turn.speaker}
                      </span>
                    </div>
                    {isCurrentTurn && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 animate-pulse">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Speaking now...</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-8">
                    {turn.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: VOCABULARY FLASHCARDS */}
      {activeTab === 'vocab' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Active Recall Flashcards
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any card to flip between the scientific term and its kid-friendly explanation!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {((summary?.vocabulary?.length ? summary.vocabulary : topic.vocabulary) || []).map((v, idx) => {
              const isFlipped = flippedCardIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    const willFlip = !isFlipped;
                    setFlippedCardIndex(willFlip ? idx : null);
                    if (willFlip && onAwardXp) {
                      onAwardXp(5, `Mastered ${v.term}`);
                    }
                  }}
                  className={`relative min-h-[160px] p-5 rounded-xl border cursor-pointer select-none transition-all flex flex-col justify-between ${
                    isFlipped
                      ? 'bg-indigo-900 text-white border-indigo-700 shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-indigo-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                    <span>Card #{idx + 1}</span>
                    <span className="text-[11px]">{isFlipped ? 'Definition' : 'Term'}</span>
                  </div>

                  <div className="my-auto py-2">
                    {isFlipped ? (
                      <p className="text-xs text-slate-100 leading-relaxed">{v.definition}</p>
                    ) : (
                      <h4 className="text-base font-bold text-slate-900 dark:text-white text-center">
                        {v.term}
                      </h4>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span>{isFlipped ? 'Tap to see term' : 'Tap to reveal meaning'}</span>
                    {onAskTutorAboutTerm && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAskTutorAboutTerm(`Can you explain what "${v.term}" means with a fun analogy?`);
                        }}
                        className="text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Ask Tutor
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: CONCEPT MIND MAP */}
      {activeTab === 'mindmap' && (
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Interactive Biological Concept Graph
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Click a node to discover how each idea connects to the bigger scientific picture
              </p>
            </div>
          </div>

          {/* SVG Concept Map Canvas */}
          <div className="relative w-full h-64 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-4 overflow-hidden">
            <svg className="w-full h-full max-w-lg" viewBox="0 0 500 240">
              {/* Connection Lines */}
              <line x1="250" y1="120" x2="100" y2="60" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4" />
              <line x1="250" y1="120" x2="400" y2="60" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4" />
              <line x1="250" y1="120" x2="100" y2="180" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4" />
              <line x1="250" y1="120" x2="400" y2="180" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4" />

              {/* Center Root Node */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedMindMapNode('root')}
              >
                <circle cx="250" cy="120" r="46" fill="#4f46e5" opacity="0.9" />
                <text x="250" y="118" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
                  {topic.title.split(':')[0].slice(0, 14)}
                </text>
                <text x="250" y="132" textAnchor="middle" fill="#e0e7ff" fontSize="9">
                  Core Concept
                </text>
              </g>

              {/* Node 1: Top Left */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedMindMapNode('func')}
              >
                <circle cx="100" cy="60" r="34" fill="#0284c7" opacity="0.85" />
                <text x="100" y="58" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="600">
                  Biological Job
                </text>
                <text x="100" y="70" textAnchor="middle" fill="#e0f2fe" fontSize="8">
                  Function
                </text>
              </g>

              {/* Node 2: Top Right */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedMindMapNode('struct')}
              >
                <circle cx="400" cy="60" r="34" fill="#10b981" opacity="0.85" />
                <text x="400" y="58" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="600">
                  3D Shape
                </text>
                <text x="400" y="70" textAnchor="middle" fill="#d1fae5" fontSize="8">
                  Structure
                </text>
              </g>

              {/* Node 3: Bottom Left */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedMindMapNode('env')}
              >
                <circle cx="100" cy="180" r="34" fill="#f59e0b" opacity="0.85" />
                <text x="100" y="178" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="600">
                  Evolution
                </text>
                <text x="100" y="190" textAnchor="middle" fill="#fef3c7" fontSize="8">
                  Natural Origin
                </text>
              </g>

              {/* Node 4: Bottom Right */}
              <g
                className="cursor-pointer"
                onClick={() => setSelectedMindMapNode('app')}
              >
                <circle cx="400" cy="180" r="34" fill="#ec4899" opacity="0.85" />
                <text x="400" y="178" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="600">
                  Human Health
                </text>
                <text x="400" y="190" textAnchor="middle" fill="#fce7f3" fontSize="8">
                  Impact
                </text>
              </g>
            </svg>
          </div>

          {/* Node explanation details */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white">Conceptual Connection: </span>
            {selectedMindMapNode === 'func' &&
              'Every biological entity has a specific function. In living cells, the function is dictated directly by atomic shape!'}
            {selectedMindMapNode === 'struct' &&
              'The 3D folding pattern creates exact pockets, active sites, and catalytic cores that bind target molecules with atomic precision.'}
            {selectedMindMapNode === 'env' &&
              'Natural selection fine-tuned these proteins over millions of years so organisms could thrive in cold oceans, deep soil, or inside warm bodies.'}
            {selectedMindMapNode === 'app' &&
              'By understanding these mechanisms, medical scientists invent novel therapeutics, engineer vaccines, and protect the biosphere.'}
            {(!selectedMindMapNode || selectedMindMapNode === 'root') &&
              'Click any node in the graph above to explore how structure, function, and real-world health interlock!'}
          </div>
        </div>
      )}
    </div>
  );
};
