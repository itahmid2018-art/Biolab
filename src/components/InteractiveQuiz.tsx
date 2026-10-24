import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Send,
  Zap,
  TrendingUp,
  BrainCircuit,
} from 'lucide-react';
import { Topic, Character, QuizQuestion, ReadingLevel, TopicMastery } from '../types';

interface InteractiveQuizProps {
  topic: Topic;
  character: Character;
  readingLevel: ReadingLevel;
  onAskTutor?: (question: string) => void;
  onAwardXp: (amount: number, title: string) => void;
  topicMastery?: TopicMastery;
  onUpdateTopicMastery: (topicId: string, mastery: Partial<TopicMastery>) => void;
}

export const InteractiveQuiz: React.FC<InteractiveQuizProps> = ({
  topic,
  character,
  readingLevel,
  onAskTutor,
  onAwardXp,
  topicMastery,
  onUpdateTopicMastery,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Multiple Choice state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Short Answer state
  const [shortAnswerInput, setShortAnswerInput] = useState<string>('');
  const [evaluatingShortAnswer, setEvaluatingShortAnswer] = useState<boolean>(false);
  const [shortAnswerFeedback, setShortAnswerFeedback] = useState<{
    isCorrect: boolean;
    feedback: string;
    tutorCheer: string;
  } | null>(null);

  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [quizComplete, setQuizComplete] = useState<boolean>(false);

  const fetchQuiz = async () => {
    setLoading(true);
    setCurrentIndex(0);
    setSelectedOption(null);
    setShortAnswerInput('');
    setShortAnswerFeedback(null);
    setIsAnswered(false);
    setScore(0);
    setQuizComplete(false);

    try {
      const res = await fetch('/api/notebook/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceText: topic.fullContent,
          topicTitle: topic.title,
          readingLevel,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          return;
        }
      }
    } catch {
      // High-quality fallback questions with both MCQ and Short Answer
      setQuestions([
        {
          id: 'q1',
          type: 'multiple-choice',
          question: `What primary feature gives ${topic.title.split(':')[0]} its specialized biological ability?`,
          options: [
            'Its intricate 3D molecular fold and shape',
            'It is constructed entirely from liquid mercury',
            'It is made of stone and does not move',
            'It only works when frozen in outer space',
          ],
          correctIndex: 0,
          explanation:
            'Exactly right! In molecular biology, shape is destiny. The exact 3D fold creates molecular pockets that perform life-sustaining jobs!',
          tutorCheer: 'Brilliant deduction! You spotted the core scientific principle!',
        },
        {
          id: 'q2',
          type: 'multiple-choice',
          question: 'Why do biologists and doctors use high-resolution 3D models of proteins and DNA?',
          options: [
            'Just to paint pretty colors',
            'To discover how cells function and design life-saving medicines',
            'Because molecules are two-dimensional flat circles',
            'To turn rocks into gold',
          ],
          correctIndex: 1,
          explanation:
            'Spot on! Understanding molecules in 3D allows biomedical scientists to see how drugs bind and how living systems heal.',
          tutorCheer: 'Phenomenal thinking! You think just like a lead laboratory researcher!',
        },
        {
          id: 'q3',
          type: 'short-answer',
          question: `In your own words: Why is ${topic.title.split(':')[0]} so important for the survival of living creatures?`,
          sampleAnswer: 'It performs an essential life process like moving oxygen, producing energy, or guarding against germs.',
          keyConcepts: ['oxygen', 'energy', 'protect', 'cell', 'life', 'body', 'shape'],
          explanation: 'Living organisms rely on precision nanoscale machinery to keep cells alive, healthy, and working.',
          tutorCheer: 'Magnificent explanation! You explained that with real scientific clarity!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [topic.id, readingLevel]);

  // Handle multiple-choice option selection
  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const currentQ = questions[currentIndex];
    const isCorrect = idx === currentQ.correctIndex;

    if (isCorrect) {
      setScore((prev) => prev + 1);
      onAwardXp(15, 'Correct Quiz Answer');
      triggerConfetti();
    }
  };

  // Handle short-answer submission
  const handleSubmitShortAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswered || !shortAnswerInput.trim() || evaluatingShortAnswer) return;

    setEvaluatingShortAnswer(true);
    const currentQ = questions[currentIndex];

    try {
      const res = await fetch('/api/quiz/evaluate-short-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          studentAnswer: shortAnswerInput,
          sampleAnswer: currentQ.sampleAnswer,
          keyConcepts: currentQ.keyConcepts,
          character: {
            name: character.name,
            personality: character.personality,
          },
        }),
      });

      const data = await res.json();
      setShortAnswerFeedback({
        isCorrect: data.isCorrect,
        feedback: data.feedback,
        tutorCheer: data.tutorCheer || 'Great explanation!',
      });
      setIsAnswered(true);

      if (data.isCorrect) {
        setScore((prev) => prev + 1);
        onAwardXp(data.scoreAwarded || 15, 'Short Answer Mastery');
        triggerConfetti();
      } else {
        onAwardXp(5, 'Thoughtful Attempt');
      }
    } catch {
      setIsAnswered(true);
      setShortAnswerFeedback({
        isCorrect: true,
        feedback: 'Great effort expressing your thoughts in your own words!',
        tutorCheer: 'Splendid thinking, explorer!',
      });
      setScore((prev) => prev + 1);
      onAwardXp(10, 'Short Answer Attempt');
    } finally {
      setEvaluatingShortAnswer(false);
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b'],
      });
    } catch {
      // ignore
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShortAnswerInput('');
      setShortAnswerFeedback(null);
      setIsAnswered(false);
    } else {
      // Quiz complete!
      setQuizComplete(true);
      const totalQ = questions.length;
      const finalScore = score;
      const percentage = Math.round((finalScore / totalQ) * 100);

      // Award bonus XP for completing the quiz
      const completionXp = percentage === 100 ? 50 : 25;
      onAwardXp(completionXp, percentage === 100 ? 'Perfect Quiz Bonus!' : 'Quiz Completion');

      // Update persistent Topic Mastery
      onUpdateTopicMastery(topic.id, {
        completed: true,
        quizScore: finalScore,
        quizTotal: totalQ,
        bestScorePercentage: Math.max(percentage, topicMastery?.bestScorePercentage || 0),
        quizzesTaken: (topicMastery?.quizzesTaken || 0) + 1,
        lastStudiedAt: Date.now(),
      });
    }
  };

  const currentQ = questions[currentIndex];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          Crafting Dynamic Retention Challenge...
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {character.name} is preparing personalized questions from your NotebookLM summary!
        </p>
      </div>
    );
  }

  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    const isPerfect = percentage === 100;

    return (
      <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
          <Award className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {isPerfect ? '🌟 Perfect Recall Mastered!' : 'Retention Challenge Completed!'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            You scored {score} out of {questions.length} questions ({percentage}%)!
          </p>
        </div>

        {/* Progress & Mastery Meter */}
        <div className="max-w-xs mx-auto p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Topic Mastery:</span>
          </div>
          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {Math.max(percentage, topicMastery?.bestScorePercentage || 0)}%
          </span>
        </div>

        {/* In-character Tutor Evaluation */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 max-w-md mx-auto text-left">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xl">{character.avatarEmoji}</span>
            <span className="text-xs font-semibold text-slate-900 dark:text-white">
              {character.name}&apos;s Praise:
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
            &ldquo;{isPerfect
              ? `Incredible mastery, explorer! As I always say: "${character.catchphrase}". You absorbed every single detail of ${topic.title.split(':')[0]}!`
              : `Wonderful effort! Just like building a scientific experiment, every round sharpens your understanding. You are making real progress!`}&rdquo;
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={fetchQuiz}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Challenge</span>
          </button>

          {onAskTutor && (
            <button
              type="button"
              onClick={() =>
                onAskTutor(`Can you review the key takeaways from ${topic.title.split(':')[0]} with me?`)
              }
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Review With {character.name}</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!currentQ) return null;

  const isShortAnswer = currentQ.type === 'short-answer';

  return (
    <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
      {/* Header: Progress, Question Type, & Current Score */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{character.avatarEmoji}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Dynamic Retention Challenge
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                {isShortAnswer ? 'Short Answer' : 'Multiple Choice'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span aria-hidden="true">·</span>
              <span>Score: {score}/{currentIndex + (isAnswered ? 1 : 0)}</span>
              {topicMastery && topicMastery.bestScorePercentage > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Best: {topicMastery.bestScorePercentage}%</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-24 sm:w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Prompt */}
      <div>
        <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-snug">
          {currentQ.question}
        </h3>
      </div>

      {/* QUESTION TYPE 1: MULTIPLE CHOICE */}
      {!isShortAnswer && currentQ.options && (
        <div className="space-y-2.5">
          {currentQ.options.map((option, idx) => {
            let optionStyle =
              'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-600';
            let indicatorIcon = null;

            if (isAnswered) {
              if (idx === currentQ.correctIndex) {
                optionStyle =
                  'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-medium shadow-2xs';
                indicatorIcon = <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
              } else if (idx === selectedOption) {
                optionStyle =
                  'border-rose-400 bg-rose-50/60 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200';
                indicatorIcon = <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
              } else {
                optionStyle = 'opacity-40 border-slate-200 dark:border-slate-800';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-center justify-between gap-3 ${optionStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{option}</span>
                </div>
                {indicatorIcon}
              </button>
            );
          })}
        </div>
      )}

      {/* QUESTION TYPE 2: SHORT ANSWER (Open-Ended Conceptual Evaluation) */}
      {isShortAnswer && (
        <form onSubmit={handleSubmitShortAnswer} className="space-y-3">
          <textarea
            disabled={isAnswered || evaluatingShortAnswer}
            rows={3}
            value={shortAnswerInput}
            onChange={(e) => setShortAnswerInput(e.target.value)}
            placeholder="Type your explanation in 1–2 sentences... (e.g., how the structure works, what job it performs)"
            className="w-full p-3 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          />

          {!isAnswered && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                💡 Be thoughtful—your tutor checks for key biological ideas!
              </span>
              <button
                type="submit"
                disabled={!shortAnswerInput.trim() || evaluatingShortAnswer}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors"
              >
                {evaluatingShortAnswer ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Evaluating...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Answer (+15 XP)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      )}

      {/* Immediate In-Character Tutor Feedback Card */}
      {isAnswered && (
        <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 dark:text-indigo-200">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>
              {shortAnswerFeedback?.tutorCheer || currentQ.tutorCheer || 'Great discovery!'}
            </span>
          </div>

          <p className="text-xs text-indigo-950/80 dark:text-indigo-300/90 leading-relaxed">
            {shortAnswerFeedback?.feedback || currentQ.explanation}
          </p>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <span>{currentIndex + 1 < questions.length ? 'Next Question' : 'See Results'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
