import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Quote,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
  Users,
  CheckCircle2,
  Loader2,
  Lightbulb,
} from 'lucide-react';
import { Character, Topic, ChatMessage, ReadingLevel, UserProfile } from '../types';
import { TUTOR_CHARACTERS } from '../data/tutors';

interface TopAskTutorBarProps {
  topic: Topic;
  character: Character;
  onSelectCharacter: (char: Character) => void;
  readingLevel: ReadingLevel;
  userProfile?: UserProfile | null;
  externalQueryPrompt?: string | null;
  onClearExternalQuery?: () => void;
  onAwardXp?: (amount: number, title: string) => void;
  onOpenTutorProfile?: (char: Character) => void;
  onOpenCharacterGallery?: () => void;
}

export const TopAskTutorBar: React.FC<TopAskTutorBarProps> = ({
  topic,
  character,
  onSelectCharacter,
  readingLevel,
  userProfile,
  externalQueryPrompt,
  onClearExternalQuery,
  onAwardXp,
  onOpenTutorProfile,
  onOpenCharacterGallery,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(false);
  const [isTutorBarCollapsed, setIsTutorBarCollapsed] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize with character greeting tailored to user
  useEffect(() => {
    const studentName = userProfile?.name;
    const greetingText = studentName
      ? character.id === 'sofia'
        ? `Hi ${studentName}! I'm Sofia Carter. In our learning circle, there are no silly questions! What are you curious about in ${topic.title.split(':')[0]}? Let's explore together step-by-step!`
        : `Hello ${studentName}! I am ${character.name}. Ask me any question about ${topic.title.split(':')[0]}!`
      : character.greeting;

    setMessages([
      {
        id: `init-${character.id}-${Date.now()}`,
        role: 'model',
        characterId: character.id,
        text: greetingText,
        timestamp: Date.now(),
        followUpQuestions: topic.keyQuestions.slice(0, 3),
      },
    ]);
  }, [character.id, topic.id, userProfile?.name]);

  // Handle external query prompt (e.g. from clicking terms in the study notes)
  useEffect(() => {
    if (externalQueryPrompt) {
      sendMessage(externalQueryPrompt);
      if (onClearExternalQuery) {
        onClearExternalQuery();
      }
      setIsTutorBarCollapsed(false);
    }
  }, [externalQueryPrompt]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isHistoryExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isHistoryExpanded]);

  const sendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      characterId: character.id,
      text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    if (onAwardXp) {
      onAwardXp(5, 'Curious Question Asked');
    }

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: {
            id: character.id,
            name: character.name,
            title: character.title,
            species: character.species,
            personality: character.personality,
            backstory: character.backstory,
            conversationalStyle: character.conversationalStyle,
            catchphrase: character.catchphrase,
            speechStyle: character.speechStyle,
          },
          studentGrade:
            readingLevel === 'grades-2-4'
              ? 'Grade 2-4 (Ages 7-9)'
              : readingLevel === 'grades-5-7'
              ? 'Grade 5-7 (Ages 10-12)'
              : 'Teen Explorer (Ages 13+)',
          studentName: userProfile?.name,
          studentInterests: userProfile?.interests,
          topic: topic.title,
          sourceText: topic.fullContent,
          messages: messages.map((m) => ({ role: m.role, text: m.text })),
          question: text,
        }),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      const modelMsg: ChatMessage = {
        id: `tutor-${Date.now()}`,
        role: 'model',
        characterId: character.id,
        text: data.reply || "That's a wonderful curiosity! Let's explore that together in our notebook.",
        citationQuotes: data.citationQuotes || [],
        followUpQuestions: data.followUpQuestions || [],
        audioScript: data.audioScript,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('Error sending message to tutor:', err);
      const fallbackMsg: ChatMessage = {
        id: `fallback-${Date.now()}`,
        role: 'model',
        characterId: character.id,
        text: `That is such a thoughtful question about ${topic.title.split(':')[0]}! In biological systems, shapes lead directly to function. Every piece fits like a nanoscale lock and key.`,
        followUpQuestions: ['Why does this shape matter?', 'How can we see it with microscopes?'],
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (msg: ChatMessage) => {
    if (!('speechSynthesis' in window)) return;

    if (currentlySpeakingId === msg.id) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const spokenText = msg.audioScript || msg.text;
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.pitch = character.voicePitch;
    utterance.rate = character.voiceRate;

    utterance.onend = () => {
      setCurrentlySpeakingId(null);
    };
    utterance.onerror = () => {
      setCurrentlySpeakingId(null);
    };

    speechRef.current = utterance;
    setCurrentlySpeakingId(msg.id);
    window.speechSynthesis.speak(utterance);
  };

  const latestModelMessage = [...messages].reverse().find((m) => m.role === 'model');
  const latestUserMessage = [...messages].reverse().find((m) => m.role === 'user');

  return (
    <section
      aria-label="Ask Virtual AI Tutor"
      className="border-b border-indigo-100 dark:border-indigo-950/80 bg-gradient-to-b from-indigo-50/90 via-white to-slate-50/80 dark:from-indigo-950/40 dark:via-slate-900/90 dark:to-slate-900/90 px-4 sm:px-6 py-3 transition-all z-20 shadow-2xs"
    >
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Top Line: Tutor Persona Bar & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Tutor Avatar with Status indicator */}
            <div className="relative cursor-pointer select-none" onClick={() => onOpenTutorProfile?.(character)}>
              <span className="text-3xl filter drop-shadow-xs hover:scale-105 transition-transform inline-block">
                {character.avatarEmoji}
              </span>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" title="Online & ready" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Ask {character.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                  {character.title}
                </span>
                {character.statusTag && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                    <span>{character.statusTag}</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {character.conversationalStyle} · &ldquo;{character.catchphrase}&rdquo;
              </p>
            </div>
          </div>

          {/* Quick Tutor Switcher Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 hidden md:inline">Tutors:</span>
            <div className="inline-flex rounded-xl bg-slate-200/60 dark:bg-slate-800/80 p-0.5">
              {TUTOR_CHARACTERS.map((char) => {
                const isSelected = char.id === character.id;
                return (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => onSelectCharacter(char)}
                    className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    title={`${char.name} (${char.title})`}
                  >
                    <span>{char.avatarEmoji}</span>
                    <span className="hidden lg:inline text-[11px]">{char.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {onOpenCharacterGallery && (
              <button
                type="button"
                onClick={onOpenCharacterGallery}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Open Character Visual Gallery"
              >
                <Users className="w-4 h-4" />
              </button>
            )}

            {/* Minimize / Collapse Top Ask Bar toggle */}
            <button
              type="button"
              onClick={() => setIsTutorBarCollapsed(!isTutorBarCollapsed)}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
              title={isTutorBarCollapsed ? 'Expand Ask Feature' : 'Compact Ask Feature'}
            >
              {isTutorBarCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* If not collapsed: Full Interactive Input & Response Area */}
        {!isTutorBarCollapsed && (
          <div className="space-y-3">
            {/* The Main Question Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(inputText);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Ask ${character.name} anything about ${topic.title.split(':')[0]} (e.g. "Explain like I'm five", "Why does it fold?", "What does it do?")...`}
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-800/90 border border-indigo-200 dark:border-indigo-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs transition-all"
                />
                {inputText && (
                  <button
                    type="button"
                    onClick={() => setInputText('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Ask Question</span>
                <span className="text-[10px] opacity-75 font-normal ml-0.5">+5 XP</span>
              </button>
            </form>

            {/* Quick Inspiration Chips */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 text-xs">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                <span>Quick Prompts:</span>
              </span>
              <button
                type="button"
                onClick={() => sendMessage(`Explain ${topic.title.split(':')[0]} like I'm 5 years old.`)}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-medium text-[11px] shrink-0 border border-indigo-100 dark:border-indigo-900/40 transition-colors"
              >
                👶 Explain like I&apos;m 5
              </button>
              <button
                type="button"
                onClick={() => sendMessage(`Explain the structure of ${topic.title.split(':')[0]} and its chemical compounds along with labels.`)}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-medium text-[11px] shrink-0 border border-emerald-100 dark:border-emerald-900/40 transition-colors"
              >
                🔬 Chemical Compounds &amp; Labels
              </button>
              <button
                type="button"
                onClick={() => sendMessage(`How are the atoms bonded together in ${topic.title.split(':')[0]}?`)}
                className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-medium text-[11px] shrink-0 border border-amber-100 dark:border-amber-900/40 transition-colors"
              >
                🧪 Atomic Bonds &amp; Angles
              </button>
              <button
                type="button"
                onClick={() => sendMessage(`Give me a fun, relatable real-world analogy for how ${topic.title.split(':')[0]} works.`)}
                className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-medium text-[11px] shrink-0 border border-purple-100 dark:border-purple-900/40 transition-colors"
              >
                ✨ Fun Analogy
              </button>
              <button
                type="button"
                onClick={() => sendMessage(`Why does the 3D molecular fold matter in ${topic.title.split(':')[0]}?`)}
                className="px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 text-cyan-700 dark:text-cyan-300 font-medium text-[11px] shrink-0 border border-cyan-100 dark:border-cyan-900/40 transition-colors"
              >
                🧬 Why shape matters
              </button>
            </div>

            {/* Latest Live Answer Display Box */}
            {latestModelMessage && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{character.avatarEmoji}</span>
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {character.name}’s Response
                      </span>
                      {latestUserMessage && (
                        <p className="text-[11px] text-slate-400 truncate max-w-md">
                          Regarding: &ldquo;{latestUserMessage.text}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Audio read-aloud button */}
                    <button
                      type="button"
                      onClick={() => handleSpeak(latestModelMessage)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        currentlySpeakingId === latestModelMessage.id
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100'
                      }`}
                      title="Read explanation out loud with tutor voice"
                    >
                      {currentlySpeakingId === latestModelMessage.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Stop Voice</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen Voice</span>
                        </>
                      )}
                    </button>

                    {/* Expand full conversation history toggle */}
                    <button
                      type="button"
                      onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                      className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      {isHistoryExpanded ? 'Collapse Chat History' : `History (${messages.length})`}
                    </button>
                  </div>
                </div>

                {/* The Answer Text */}
                <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal whitespace-pre-wrap pl-1">
                  {latestModelMessage.text}
                </div>

                {/* Citation Quotes if present */}
                {latestModelMessage.citationQuotes && latestModelMessage.citationQuotes.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-300 flex items-start gap-2">
                    <Quote className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-semibold text-[11px] block">NotebookLM Source Evidence:</span>
                      {latestModelMessage.citationQuotes.map((q, idx) => (
                        <p key={idx} className="italic text-[11px] opacity-90">
                          &ldquo;{q}&rdquo;
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up question chips */}
                {latestModelMessage.followUpQuestions && latestModelMessage.followUpQuestions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Suggested Follow-up:
                    </span>
                    {latestModelMessage.followUpQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => sendMessage(q)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-[11px] font-medium text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        {q} →
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Expanded Full Conversation History */}
            {isHistoryExpanded && (
              <div className="max-h-72 overflow-y-auto p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Full Conversation with {character.name}
                </div>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      m.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-[10px] mb-1 opacity-80">
                        <span>{m.role === 'user' ? '👤 You' : `${character.avatarEmoji} ${character.name}`}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
