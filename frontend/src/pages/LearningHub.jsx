import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useAccessibility } from '../context/AccessibilityContext';
import { BookOpen, Play, Square, Award, CheckCircle, RefreshCw } from 'lucide-react';

export default function LearningHub() {
  const { t, i18n } = useTranslation();
  const { largeFont, darkMode } = useSelector(state => state.settings);
  const { speakText, stopSpeaking } = useAccessibility();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readingId, setReadingId] = useState(null);

  // Quiz state
  const [quizState, setQuizState] = useState('idle'); // 'idle', 'active', 'completed'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [answersChecked, setAnswersChecked] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
    {
      questionKey: 'learning.quiz.q1_q',
      optionsKeys: ['learning.quiz.q1_o1', 'learning.quiz.q1_o2', 'learning.quiz.q1_o3'],
      correctIndex: 0
    },
    {
      questionKey: 'learning.quiz.q2_q',
      optionsKeys: ['learning.quiz.q2_o1', 'learning.quiz.q2_o2', 'learning.quiz.q2_o3'],
      correctIndex: 2
    },
    {
      questionKey: 'learning.quiz.q3_q',
      optionsKeys: ['learning.quiz.q3_o1', 'learning.quiz.q3_o2', 'learning.quiz.q3_o3'],
      correctIndex: 1
    }
  ];

  const handleStartQuiz = () => {
    setQuizState('active');
    setCurrentQuestionIndex(0);
    setSelectedAnswerIndex(null);
    setAnswersChecked(false);
    setScore(0);
  };

  const handleSelectAnswer = (idx) => {
    if (answersChecked) return;
    setSelectedAnswerIndex(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswerIndex === null) return;
    const isCorrect = selectedAnswerIndex === questions[currentQuestionIndex].correctIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
    setAnswersChecked(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswerIndex(null);
      setAnswersChecked(false);
    } else {
      setQuizState('completed');
    }
  };

  const handleRestartQuiz = () => {
    handleStartQuiz();
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/health/learning/resources?lang=${i18n.language}`)
      .then(res => res.json())
      .then(data => {
        setResources(data.resources || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [i18n.language]);

  const handleReadArticle = (id, text) => {
    if (readingId === id) {
      stopSpeaking();
      setReadingId(null);
    } else {
      speakText(text, i18n.language, true);
      setReadingId(id);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto px-4 py-8 ${largeFont ? 'text-lg' : 'text-sm'}`}>
      
      {/* Header */}
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black font-display mb-2" style={{ color: darkMode ? '#ffffff' : '#0c1a2e' }}>
          {t('learning.title')}
        </h2>
        <p className="max-w-xl mx-auto leading-relaxed text-xs" style={{ color: darkMode ? '#94a3b8' : '#4a6280' }}>
          {t('learning.desc')}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {resources.map((res) => (
            <div 
              key={res.id}
              className="glass-panel p-6 md:p-8 rounded-2xl shadow-lg transition-all duration-300 relative overflow-hidden"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider sub-card" style={{ color: 'var(--text-secondary)' }}>
                    {res.category}
                  </span>
                  <h3 className="font-extrabold text-lg font-display mt-2" style={{ color: 'var(--text-primary)' }}>
                    {res.title}
                  </h3>
                </div>
                
                <button
                  onClick={() => handleReadArticle(res.id, res.content)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border"
                  style={readingId === res.id ? {
                    borderColor: '#ec4899',
                    background: 'rgba(236,72,153,0.1)',
                    color: '#f472b6',
                  } : {
                    borderColor: 'var(--border-default)',
                    background: 'var(--bg-hover)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {readingId === res.id ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" /> Stop Audio
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" /> Read Aloud
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
                {res.summary}
              </p>

              <div className="inner-card text-xs leading-relaxed whitespace-pre-wrap font-sans">
                {res.content}
              </div>

              <div className="mt-4 flex justify-between items-center text-[10px]" style={{ color: 'var(--text-faint)' }}>
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-health-500" /> Verified Source: {res.source || 'WHO/CDC Guidelines'}
                </span>
                <span className="font-semibold">{res.duration || '3 mins read'}</span>
              </div>
            </div>
          ))}

          {/* Quick Quiz Card */}
          <div className="inner-card p-6 md:p-8 relative overflow-hidden">
            {quizState === 'idle' && (
              <div className="flex flex-col md:flex-row items-center gap-6 justify-between animate-fadeIn">
                <div className="max-w-xl">
                  <h4 className="font-extrabold text-base flex items-center gap-2 mb-2" style={{ color: 'var(--text-primary)' }}>
                    <CheckCircle className="w-5 h-5 text-health-400" /> {t('learning.quiz.title')}
                  </h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {t('learning.quiz.desc')}
                  </p>
                </div>
                <button 
                  onClick={handleStartQuiz}
                  className="premium-btn px-5 py-2.5 whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> {t('learning.quiz.startBtn')}
                </button>
              </div>
            )}

            {quizState === 'active' && (
              <div className="animate-fadeIn">
                {/* Header */}
                <div className="flex justify-between items-center mb-3 text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  <span className="uppercase">
                    {t('learning.quiz.title')}
                  </span>
                  <span>
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full rounded-full h-1 mb-5 overflow-hidden border" style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-default)' }}>
                  <div 
                    className="bg-brand-500 h-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>

                {/* Question */}
                <div className="mb-5 flex gap-3 items-start justify-between">
                  <h5 className="font-extrabold text-sm leading-relaxed flex-1 font-display" style={{ color: 'var(--text-primary)' }}>
                    {t(questions[currentQuestionIndex].questionKey)}
                  </h5>
                  <button
                    onClick={() => {
                      const optionsText = questions[currentQuestionIndex].optionsKeys
                        .map((key, i) => `${i + 1}: ${t(key)}`)
                        .join('. ');
                      speakText(`${t(questions[currentQuestionIndex].questionKey)}. Options are: ${optionsText}`, i18n.language, true);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 text-[10px]"
                    style={{
                      background: 'var(--bg-hover)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-secondary)',
                    }}
                    title="Read Question Aloud"
                  >
                    <Play className="w-3 h-3 fill-current" /> Read
                  </button>
                </div>

                {/* Options */}
                <div className="space-y-2.5 mb-5">
                  {questions[currentQuestionIndex].optionsKeys.map((optKey, idx) => {
                    const isSelected = selectedAnswerIndex === idx;
                    const isCorrect = idx === questions[currentQuestionIndex].correctIndex;
                    const isWrong = isSelected && !isCorrect;
                    
                    let activeClasses = "";
                    if (isSelected && !answersChecked) {
                      activeClasses = "border-brand-500 bg-brand-500/10 text-brand-500 dark:text-indigo-400";
                    } else if (answersChecked) {
                      if (isCorrect) {
                        activeClasses = "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400 font-bold";
                      } else if (isWrong) {
                        activeClasses = "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400";
                      } else {
                        activeClasses = "opacity-40";
                      }
                    }
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => !answersChecked && handleSelectAnswer(idx)}
                        disabled={answersChecked}
                        className={`sub-card w-full text-left flex justify-between items-center transition-all p-3.5 rounded-xl ${activeClasses}`}
                      >
                        <span>{t(optKey)}</span>
                        {answersChecked && isCorrect && (
                          <span className="w-4 h-4 rounded-full bg-health-500 flex items-center justify-center text-[10px] text-white font-bold shrink-0">✓</span>
                        )}
                        {answersChecked && isWrong && (
                          <span className="w-4 h-4 rounded-full bg-myth-500 flex items-center justify-center text-[10px] text-white font-bold shrink-0">✗</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Footer buttons */}
                <div className="flex justify-between items-center gap-4">
                  <button
                    onClick={() => {
                      stopSpeaking();
                      setQuizState('idle');
                    }}
                    className="px-3 py-1.5 border rounded-lg text-[10px] font-bold transition-all"
                    style={{
                      background: 'var(--bg-hover)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Cancel
                  </button>

                  {!answersChecked ? (
                    <button
                      disabled={selectedAnswerIndex === null}
                      onClick={handleSubmitAnswer}
                      className="premium-btn px-4 py-2"
                    >
                      {t('learning.quiz.submitBtn')}
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="premium-btn px-4 py-2 flex items-center gap-1.5"
                    >
                      {currentQuestionIndex < questions.length - 1 
                        ? t('learning.quiz.nextBtn') 
                        : t('learning.quiz.finishBtn')}
                    </button>
                  )}
                </div>
              </div>
            )}

            {quizState === 'completed' && (
              <div className="text-center py-4 flex flex-col items-center animate-fadeIn">
                {/* Glowing badge award anim */}
                <div className="relative mb-5">
                  <div className="absolute inset-0 bg-gradient-to-tr from-brand-500 to-yellow-500 rounded-full blur-xl opacity-35 scale-125 animate-pulse" />
                  <div 
                    className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-2xl border"
                    style={{
                      background: 'var(--bg-card-deep)',
                      borderColor: '#fbbf24',
                    }}
                  >
                    <Award className="w-8 h-8 text-yellow-500 animate-bounce" />
                  </div>
                </div>

                <h4 className="font-extrabold text-base mb-1 font-display" style={{ color: 'var(--text-primary)' }}>
                  {t('learning.quiz.congrats')}
                </h4>
                <p className="text-xs max-w-md mx-auto mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {t('learning.quiz.congratsDesc')}
                </p>

                <div className="border px-4 py-2 rounded-xl text-xs font-black mb-5 tracking-wide font-sans sub-card" style={{ color: 'var(--text-secondary)' }}>
                  {t('learning.quiz.score', { score: score, total: questions.length })}
                </div>

                <button
                  onClick={handleRestartQuiz}
                  className="premium-btn px-4 py-2 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" /> {t('learning.quiz.restartBtn')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
