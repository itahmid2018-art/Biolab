import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  Quote,
  MessageSquare,
  HelpCircle,
  CheckCircle,
  Info,
  BookOpen,
} from 'lucide-react';
import { Character, Topic, ChatMessage, ReadingLevel, UserProfile } from '../types';
import { TUTOR_CHARACTERS } from '../data/tutors';

interface TutorChatProps {
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

export const TutorChat: React.FC<TutorChatProps> = ({
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize with character greeting on mount or character change
  useEffect(() => {
    const greetingText = userProfile?.name
      ? character.id === 'sofia'
        ? `Hello, wonderful ${userProfile.name}! I'm Sofia Carter, and I am so glad you're here. In our learning circle, you can ask anything at all without any stress. We will explore ${topic.title.split(':')[0]} together at your own pace. What are you wondering about today?`
        : `Hello ${userProfile.name}! ${character.greeting}`
      : character.greeting;

    setMessages([
      {
        id: `init-${character.id}-${Date.now()}`,
        role: 'model',
        characterId: character.id,
        text: greetingText,
        timestamp: Date.now(),
        followUpQuestions: topic.keyQuestions.slice(0, 2),
      },
    ]);
  }, [character.id, topic.id, userProfile?.name]);

  // Handle external query prompt (e.g. from clicking "Ask Tutor About This" in NotebookOverview)
  useEffect(() => {
    if (externalQueryPrompt) {
      sendMessage(externalQueryPrompt);
      if (onClearExternalQuery) {
        onClearExternalQuery();
      }
    }
  }, [externalQueryPrompt]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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
      onAwardXp(5, 'Curious Inquiry');
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
        text: `Hoo! That is such a thoughtful question about ${topic.title.split(':')[0]}! In living systems, molecules always assemble into specific 3D folds to perform their jobs. Check out the 3D viewer above to see how its shapes interlock!`,
        followUpQuestions: ['Why is this molecule shaped this way?'],
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

  return (
    <div className="flex flex-col h-[560px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      {/* Top Header: Current Tutor & Quick Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenTutorProfile && onOpenTutorProfile(character)}
            className="text-2xl select-none hover:scale-105 transition-transform cursor-pointer"
            title="Click to view tutor backstory & profile"
          >
            {character.avatarEmoji}
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {character.name}
              </span>
              <span className="text-slate-400 text-xs">·</span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                {character.conversationalStyle}
              </span>
              {onOpenTutorProfile && (
                <button
                  type="button"
                  onClick={() => onOpenTutorProfile(character)}
                  className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-[10px] underline ml-1 inline-flex items-center gap-0.5"
                >
                  <BookOpen className="w-2.5 h-2.5" />
                  <span>Backstory</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs italic">
              &ldquo;{character.catchphrase}&rdquo;
            </p>
          </div>
        </div>

        {/* Tutor Character Quick-Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">
            Tutors:
          </span>
          {TUTOR_CHARACTERS.map((char) => {
            const isSelected = char.id === character.id;
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => onSelectCharacter(char)}
                className={`relative w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                  isSelected
                    ? 'bg-indigo-100 dark:bg-indigo-950/80 ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-900 shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 opacity-60 hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={`${char.name} (${char.conversationalStyle})`}
              >
                {char.avatarEmoji}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isSpeaking = currentlySpeakingId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div
                  onClick={() => onOpenTutorProfile && onOpenTutorProfile(character)}
                  className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-lg shrink-0 select-none cursor-pointer hover:ring-1 hover:ring-indigo-400"
                  title="View tutor backstory"
                >
                  {character.avatarEmoji}
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 space-y-2 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                {/* Header with speaker button */}
                <div className="flex items-center justify-between gap-2 border-b border-black/5 dark:border-white/5 pb-1">
                  <span className="font-semibold text-[11px] opacity-80">
                    {isUser ? 'You' : character.name}
                  </span>
                  {!isUser && (
                    <button
                      type="button"
                      onClick={() => handleSpeak(msg)}
                      className={`p-1 rounded-md transition-colors ${
                        isSpeaking
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                      }`}
                      title={isSpeaking ? 'Stop reading' : 'Read aloud with tutor voice'}
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Message Body */}
                <p className="whitespace-pre-line text-xs sm:text-[13px]">{msg.text}</p>

                {/* Grounded NotebookLM Citations */}
                {msg.citationQuotes && msg.citationQuotes.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      <Quote className="w-3 h-3 text-indigo-500" />
                      <span>Referenced from NotebookLM Summary:</span>
                    </div>
                    {msg.citationQuotes.map((quote, qIdx) => (
                      <p
                        key={qIdx}
                        className="text-[11px] italic pl-2 border-l-2 border-indigo-400/80 text-slate-600 dark:text-slate-300"
                      >
                        &ldquo;{quote}&rdquo;
                      </p>
                    ))}
                  </div>
                )}

                {/* Interactive Follow-up Question Chips */}
                {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 block">
                      Curious Next Questions (+5 XP):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.followUpQuestions.map((q, qIdx) => (
                        <button
                          key={qIdx}
                          type="button"
                          onClick={() => sendMessage(q)}
                          className="text-left px-2 py-1 rounded-md text-[11px] bg-white dark:bg-slate-900/80 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900 hover:border-indigo-300 transition-colors"
                        >
                          ✨ {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-lg select-none">
              {character.avatarEmoji}
            </div>
            <div className="p-3 rounded-2xl rounded-tl-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
              <span>{character.name} is checking the lesson notes...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Starter Prompts */}
      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
        <span className="text-slate-400 shrink-0">Ask (+5 XP):</span>
        <button
          type="button"
          onClick={() => sendMessage(`Why does ${topic.title.split(':')[0]} have its specific shape?`)}
          className="shrink-0 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-indigo-600 transition-colors"
        >
          Why this shape?
        </button>
        <button
          type="button"
          onClick={() => sendMessage('Can you explain this like I am 8 years old with a fun story?')}
          className="shrink-0 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-indigo-600 transition-colors"
        >
          Explain as story
        </button>
        <button
          type="button"
          onClick={() => sendMessage(`What is your favorite discovery about ${topic.title.split(':')[0]}?`)}
          className="shrink-0 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-indigo-600 transition-colors"
        >
          Your favorite discovery
        </button>
      </div>

      {/* Bottom Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(inputText);
        }}
        className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Ask ${character.name} about ${topic.title.split(':')[0]}... (+5 XP)`}
          className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || loading}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask</span>
        </button>
      </form>
    </div>
  );
};
