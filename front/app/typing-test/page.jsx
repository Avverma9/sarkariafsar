'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Timer, RotateCcw, Trophy, Target, Keyboard } from 'lucide-react';
import { dataStore, funnyJokes, getFeedback } from '@/app/lib/typingAsset';

const TIME_LIMIT = 60;
const DEFAULT_CATEGORY = 'sentences';
const DEFAULT_DIFFICULTY = 'medium';
const TARGET_ITEMS = {
  words: 70,
  meanings: 60,
  phrases: 35,
  sentences: 14,
};

const getRandomItem = (items) => items[Math.floor(Math.random() * items.length)];

const buildTextFromPool = (pool, category, options = {}) => {
  if (!Array.isArray(pool) || pool.length === 0) return '';
  const { randomize = true } = options;

  const count = TARGET_ITEMS[category] || 40;
  const chunks = randomize
    ? Array.from({ length: count }, () => getRandomItem(pool))
    : Array.from({ length: count }, (_, index) => pool[index % pool.length]);
  return chunks.join(' ');
};

const getTestText = (category, difficulty, options = {}) => {
  const { randomize = true } = options;
  if (category === 'jokes') {
    return Array.isArray(funnyJokes) && funnyJokes.length > 0
      ? (randomize ? getRandomItem(funnyJokes) : funnyJokes[0])
      : 'No jokes available right now.';
  }

  const pool = dataStore?.[category]?.[difficulty];
  const text = buildTextFromPool(pool, category, { randomize });
  return text || 'No typing content available for this category.';
};

const INITIAL_TEXT = getTestText(DEFAULT_CATEGORY, DEFAULT_DIFFICULTY, { randomize: false });

const calculateStats = (finalInput, sourceText, remainingTime) => {
  const wordsTyped = finalInput.length / 5;
  const timeSpentMinutes = (TIME_LIMIT - remainingTime) / 60;
  const wpm = timeSpentMinutes > 0 ? Math.round(wordsTyped / timeSpentMinutes) : 0;

  let correctChars = 0;
  for (let i = 0; i < finalInput.length; i++) {
    if (finalInput[i] === sourceText[i]) {
      correctChars++;
    }
  }

  const accuracy = finalInput.length > 0 ? Math.round((correctChars / finalInput.length) * 100) : 0;
  return { wpm, accuracy };
};

export default function App() {
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY);
  const [text, setText] = useState(INITIAL_TEXT);
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [status, setStatus] = useState('waiting');
  const [stats, setStats] = useState({ wpm: 0, accuracy: 0 });
  const inputRef = useRef(null);
  const userInputRef = useRef('');
  const textRef = useRef(INITIAL_TEXT);

  const startNewTest = (nextCategory = category, nextDifficulty = difficulty) => {
    const randomText = getTestText(nextCategory, nextDifficulty);

    textRef.current = randomText;
    userInputRef.current = '';
    setText(randomText);
    setUserInput('');
    setTimeLeft(TIME_LIMIT);
    setStatus('waiting');
    setStats({ wpm: 0, accuracy: 0 });
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const finishTest = (finalInput = userInputRef.current, remainingTime = timeLeft) => {
    setStatus('finished');
    setStats(calculateStats(finalInput, textRef.current, remainingTime));
  }; 

  useEffect(() => {
    if (status !== 'running' || timeLeft <= 0) return undefined;

    const timer = setTimeout(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const finalInput = userInputRef.current;
          setStatus('finished');
          setStats(calculateStats(finalInput, textRef.current, 0));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, status]);

  const handleInputChange = (e) => {
    if (status === 'finished') return;
    
    const val = e.target.value;
    
    if (status === 'waiting' && val.length > 0) {
      setStatus('running');
    }

    if (val.length <= text.length) {
      userInputRef.current = val;
      setUserInput(val);
      
      if (val.length === text.length) {
        finishTest(val, timeLeft);
      }
    }
  };

  const handleCategoryChange = (event) => {
    const nextCategory = event.target.value;
    setCategory(nextCategory);
    startNewTest(nextCategory, difficulty);
  };

  const handleDifficultyChange = (event) => {
    const nextDifficulty = event.target.value;
    setDifficulty(nextDifficulty);
    startNewTest(category, nextDifficulty);
  };

  const handleContainerClick = () => {
    if (inputRef.current && status !== 'finished') {
      inputRef.current.focus();
    }
  };

  const renderText = () => {
    return text.split('').map((char, index) => {
      let color = 'text-slate-400';
      let isCurrent = index === userInput.length && status !== 'finished';
      
      if (index < userInput.length) {
        color = userInput[index] === char ? 'text-emerald-500' : 'text-red-500 bg-red-100 rounded-sm';
      }

      return (
        <span 
          key={index} 
          className={`text-2xl font-mono transition-colors ${color} ${isCurrent ? 'border-b-2 border-indigo-500 animate-pulse' : ''}`}
        >
          {char}
        </span>
      );
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-full mb-4 shadow-lg shadow-indigo-200">
            <Keyboard size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Typing Speed Test</h1>
          <p className="text-slate-500 font-medium">Test your typing skills and improve your speed</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold ${timeLeft <= 10 && status === 'running' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-700'}`}>
                <Timer size={20} />
                <span className="text-xl">{timeLeft}s</span>
              </div>
              {status === 'running' && (
                <div className="text-slate-500 font-medium animate-pulse flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Test in progress...
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={category}
                onChange={handleCategoryChange}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
              >
                <option value="words">Words</option>
                <option value="meanings">Meanings</option>
                <option value="phrases">Phrases</option>
                <option value="sentences">Sentences</option>
                <option value="jokes">Funny Jokes</option>
              </select>

              {category !== 'jokes' && (
                <select
                  value={difficulty}
                  onChange={handleDifficultyChange}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              )}

              <button 
                onClick={startNewTest}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 shadow-sm"
              >
                <RotateCcw size={18} />
                Restart
              </button>
            </div>
          </div>

          <div 
            className="p-8 md:p-12 cursor-text relative"
            onClick={handleContainerClick}
          >
            {status === 'waiting' && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <p className="text-lg font-bold text-slate-600 bg-white px-6 py-3 rounded-full shadow-md">
                  Start typing to begin the test
                </p>
              </div>
            )}
            
            <div className="leading-relaxed select-none mb-4" style={{ wordBreak: 'break-word' }}>
              {renderText()}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={handleInputChange}
              className="absolute opacity-0 pointer-events-none"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              disabled={status === 'finished'}
            />
          </div>

          {status === 'finished' && (
            <div className="border-t border-slate-100 bg-indigo-50/50 p-8 animate-in slide-in-from-bottom-4 duration-500">
              <h3 className="text-center text-xl font-bold text-slate-800 mb-6">Test Results</h3>
              <div className="grid grid-cols-2 gap-6 max-w-xl mx-auto">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                    <Trophy size={24} className="text-amber-600" />
                  </div>
                  <div className="text-4xl font-black text-slate-800 mb-1">{stats.wpm}</div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">WPM</div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                    <Target size={24} className="text-emerald-600" />
                  </div>
                  <div className="text-4xl font-black text-slate-800 mb-1">{stats.accuracy}%</div>
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Accuracy</div>
                </div>
              </div>
              <div className="mt-8 text-center">
                <p className="mb-4 text-sm font-medium text-slate-600">
                  {getFeedback(stats.wpm, stats.accuracy)}
                </p>
                <button 
                  onClick={startNewTest}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all transform hover:-translate-y-0.5 shadow-lg shadow-indigo-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
                >
                  <RotateCcw size={20} />
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
