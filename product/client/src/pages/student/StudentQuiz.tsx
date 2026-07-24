import React, { useState, useEffect } from 'react';
import { HelpCircle, Clock, CheckCircle2, AlertCircle, Award, Trophy, ChevronRight, RotateCcw, Send, Zap, BookOpen } from 'lucide-react';
import { toast } from '../../components/ui/Toast';
import { Loading } from '../../components/ui/Loading';
import api from '../../lib/axios';

interface Question {
  id: string;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  marks: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  subjectName: string;
  durationMins: number;
  totalMarks: number;
  passMarks: number;
  negativeMark: number;
  status: string;
  questions: Question[];
}

export const StudentQuiz: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/enterprise/quizzes');
      if (res.data?.status === 'success') {
        setQuizzes(res.data.data);
      }
    } catch {
      toast.error('Failed to load quizzes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (selectedQuiz && !result && timeLeftSeconds > 0) {
      timer = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [selectedQuiz, result, timeLeftSeconds]);

  const startQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setActiveQuestionIndex(0);
    setSelectedAnswers({});
    setResult(null);
    setTimeLeftSeconds(quiz.durationMins * 60);
    toast.success(`Started "${quiz.title}". Good luck!`);
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz) return;
    try {
      setIsSubmitting(true);
      const res = await api.post(`/enterprise/quizzes/${selectedQuiz.id}/submit`, {
        answers: selectedAnswers,
      });

      if (res.data?.status === 'success') {
        setResult(res.data.data);
        toast.success('Quiz submitted successfully!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    toast.error('Time limit reached! Auto-submitting quiz...');
    handleSubmitQuiz();
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) return <Loading text="Loading Online Quiz Portal..." />;

  return (
    <div className="space-y-6 text-left pb-16 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 bg-card border p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-indigo-600" /> Interactive Quiz & Assessment Arena
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time online examinations, instant auto-evaluation, negative marking, and leaderboards
          </p>
        </div>
      </div>

      {/* Main View: Quiz List or Active Test */}
      {!selectedQuiz ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="border bg-card p-5 rounded-2xl shadow-sm space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    {quiz.subjectName}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" /> {quiz.totalMarks} Marks
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-white">{quiz.title}</h3>
                <p className="text-xs text-muted-foreground font-medium">{quiz.description}</p>
              </div>

              <div className="pt-3 border-t flex items-center justify-between text-xs font-bold text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-amber-500" /> {quiz.durationMins} Mins</span>
                  <span className="flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5 text-indigo-500" /> {quiz.questions?.length || 5} Questions</span>
                </div>
                <button
                  onClick={() => startQuiz(quiz)}
                  className="px-4 py-2 bg-indigo-600 text-white font-extrabold rounded-xl hover:bg-indigo-700 text-xs shadow flex items-center gap-1 transition-all"
                >
                  Start Assessment <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : result ? (
        /* Quiz Result View */
        <div className="border bg-card p-6 rounded-2xl shadow-sm space-y-6 text-center">
          <div className="h-16 w-16 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 flex items-center justify-center mx-auto text-2xl font-black">
            {result.passed ? '🎉' : '📊'}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">
              {result.passed ? 'Congratulations! You Passed' : 'Assessment Completed'}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Your test response has been evaluated with instant scoring rules
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs max-w-2xl mx-auto">
            <div className="p-3 bg-muted/40 rounded-xl">
              <span className="text-[9px] uppercase font-black text-slate-400 block">Score Achieved</span>
              <span className="text-lg font-black text-indigo-600">{result.score} / {result.totalMarks}</span>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl">
              <span className="text-[9px] uppercase font-black text-slate-400 block">Correct Answers</span>
              <span className="text-lg font-black text-emerald-600">{result.correctCount}</span>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl">
              <span className="text-[9px] uppercase font-black text-slate-400 block">Wrong Answers</span>
              <span className="text-lg font-black text-rose-600">{result.wrongCount}</span>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl">
              <span className="text-[9px] uppercase font-black text-slate-400 block">Status</span>
              <span className={`text-lg font-black ${result.passed ? 'text-emerald-600' : 'text-rose-500'}`}>
                {result.passed ? 'PASSED' : 'RE-ATTEMPT'}
              </span>
            </div>
          </div>

          <button
            onClick={() => { setSelectedQuiz(null); setResult(null); }}
            className="px-6 py-2.5 bg-indigo-600 text-white font-extrabold text-xs rounded-xl hover:bg-indigo-700 transition-all inline-flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" /> Return to Quiz Arena
          </button>
        </div>
      ) : (
        /* Active Quiz Taking Interface */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Question Box */}
          <div className="lg:col-span-3 border bg-card p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b">
              <div>
                <span className="text-[9px] font-black uppercase text-indigo-600 tracking-wider">
                  Question {activeQuestionIndex + 1} of {selectedQuiz.questions.length}
                </span>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mt-1">
                  {selectedQuiz.questions[activeQuestionIndex].question}
                </h3>
              </div>
              <span className="text-xs font-black bg-amber-50 dark:bg-amber-900/30 text-amber-600 px-2.5 py-1 rounded-xl">
                {selectedQuiz.questions[activeQuestionIndex].marks} Marks
              </span>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {selectedQuiz.questions[activeQuestionIndex].options.length > 0 ? (
                selectedQuiz.questions[activeQuestionIndex].options.map((opt, idx) => {
                  const qId = selectedQuiz.questions[activeQuestionIndex].id;
                  const isSelected = selectedAnswers[qId] === opt;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(qId, opt)}
                      className={`w-full text-left p-4 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                          : 'bg-background hover:bg-muted/50'
                      }`}
                    >
                      <span>{opt}</span>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />}
                    </button>
                  );
                })
              ) : (
                <textarea
                  rows={4}
                  placeholder="Type your code snippet or explanation here..."
                  value={selectedAnswers[selectedQuiz.questions[activeQuestionIndex].id] || ''}
                  onChange={(e) => handleSelectOption(selectedQuiz.questions[activeQuestionIndex].id, e.target.value)}
                  className="w-full p-4 border bg-background text-xs font-mono rounded-xl outline-none"
                />
              )}
            </div>

            {/* Nav Controls */}
            <div className="flex justify-between items-center pt-4 border-t">
              <button
                disabled={activeQuestionIndex === 0}
                onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 border rounded-xl text-xs font-extrabold disabled:opacity-40"
              >
                Previous
              </button>
              {activeQuestionIndex < selectedQuiz.questions.length - 1 ? (
                <button
                  onClick={() => setActiveQuestionIndex((prev) => prev + 1)}
                  className="px-5 py-2 bg-indigo-600 text-white font-extrabold rounded-xl text-xs hover:bg-indigo-700"
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-emerald-600 text-white font-extrabold rounded-xl text-xs hover:bg-emerald-700 shadow flex items-center gap-1"
                >
                  <Send className="h-3.5 w-3.5" /> Submit Assessment
                </button>
              )}
            </div>
          </div>

          {/* Right Sidebar Timer & Palette */}
          <div className="space-y-5">
            <div className="border bg-card p-5 rounded-2xl shadow-sm text-center space-y-2">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Time Remaining</span>
              <div className="text-2xl font-black text-rose-600 font-mono tracking-wider">
                {formatTimer(timeLeftSeconds)}
              </div>
            </div>

            <div className="border bg-card p-5 rounded-2xl shadow-sm space-y-3">
              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider">Question Navigator</span>
              <div className="grid grid-cols-5 gap-2">
                {selectedQuiz.questions.map((q, idx) => {
                  const isAnswered = !!selectedAnswers[q.id];
                  const isCurrent = activeQuestionIndex === idx;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setActiveQuestionIndex(idx)}
                      className={`h-8 w-8 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center ${
                        isCurrent
                          ? 'ring-2 ring-indigo-600 font-black scale-105 bg-indigo-600 text-white'
                          : isAnswered
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-muted text-slate-500'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentQuiz;
