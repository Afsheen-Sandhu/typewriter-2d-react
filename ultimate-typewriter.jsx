import React, { useState, useEffect, useRef } from 'react';

// ==================== CHALLENGE QUOTES ====================
const CHALLENGE_QUOTES = [
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    difficulty: "easy"
  },
  {
    text: "In the middle of difficulty lies opportunity.",
    author: "Albert Einstein",
    difficulty: "easy"
  },
  {
    text: "Life is what happens when you're busy making other plans.",
    author: "John Lennon",
    difficulty: "medium"
  },
  {
    text: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    difficulty: "medium"
  },
  {
    text: "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle",
    difficulty: "medium"
  },
  {
    text: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    author: "Nelson Mandela",
    difficulty: "hard"
  },
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    difficulty: "easy"
  },
  {
    text: "Your time is limited, so don't waste it living someone else's life.",
    author: "Steve Jobs",
    difficulty: "medium"
  },
  {
    text: "If life were predictable it would cease to be life, and be without flavor.",
    author: "Eleanor Roosevelt",
    difficulty: "hard"
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
    difficulty: "hard"
  },
  {
    text: "The best time to plant a tree was twenty years ago. The second best time is now.",
    author: "Chinese Proverb",
    difficulty: "medium"
  },
  {
    text: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs",
    difficulty: "medium"
  },
  {
    text: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins",
    difficulty: "easy"
  },
  {
    text: "Believe you can and you're halfway there.",
    author: "Theodore Roosevelt",
    difficulty: "easy"
  },
  {
    text: "Everything you've ever wanted is on the other side of fear.",
    author: "George Addair",
    difficulty: "medium"
  }
];

// ==================== AUDIO SYSTEM ====================
class TypewriterAudio {
  constructor() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.masterVolume = 0.3;
      this.enabled = true;
    } catch (e) {
      console.log('Audio not available');
      this.enabled = false;
    }
  }

  playKeyPress(pitch = 0, isCorrect = true) {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = isCorrect ? 800 + pitch * 50 : 400;
    gain.gain.setValueAtTime(this.masterVolume * (isCorrect ? 0.4 : 0.2), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.context.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playCarriageReturn() {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;

    const bell1 = this.context.createOscillator();
    const bell2 = this.context.createOscillator();
    const bellGain = this.context.createGain();

    bell1.frequency.value = 1200;
    bell2.frequency.value = 1800;
    bellGain.gain.setValueAtTime(this.masterVolume * 0.5, now);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    bell1.connect(bellGain);
    bell2.connect(bellGain);
    bellGain.connect(this.context.destination);

    bell1.start(now);
    bell2.start(now);
    bell1.stop(now + 0.6);
    bell2.stop(now + 0.6);
  }

  playSuccess() {
    if (!this.enabled || !this.context) return;
    const now = this.context.currentTime;

    [0, 0.1, 0.2].forEach((delay, idx) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();

      osc.frequency.value = 800 + idx * 200;
      gain.gain.setValueAtTime(this.masterVolume * 0.3, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);

      osc.connect(gain);
      gain.connect(this.context.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.3);
    });
  }
}

// ==================== MAIN APP ====================
export default function TypewriterApp() {
  const [appState, setAppState] = useState('menu'); // 'menu', 'typing', 'results'
  const [mode, setMode] = useState('free');
  const [text, setText] = useState('');
  const [challengeText, setChallengeText] = useState('');
  const [currentQuote, setCurrentQuote] = useState(null);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [cursorVisible, setCursorVisible] = useState(true);
  const [mistakes, setMistakes] = useState([]);

  const [stats, setStats] = useState({
    wpm: 0,
    accuracy: 100,
    characters: 0,
    errors: 0,
    startTime: null,
    totalKeystrokes: 0,
    correctKeystrokes: 0
  });

  const [settings, setSettings] = useState({
    soundEnabled: true,
    showStats: true,
    difficulty: 'all'
  });

  const [celebrationActive, setCelebrationActive] = useState(false);
  const audioRef = useRef(new TypewriterAudio());

  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (stats.startTime && appState === 'typing') {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - stats.startTime) / 1000 / 60;
        const words = stats.characters / 5;
        const wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;
        setStats(prev => ({ ...prev, wpm }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [stats.startTime, stats.characters, appState]);

  const startSession = () => {
    const filteredQuotes = settings.difficulty === 'all'
      ? CHALLENGE_QUOTES
      : CHALLENGE_QUOTES.filter(q => q.difficulty === settings.difficulty);

    if (mode === 'challenge') {
      const randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
      setCurrentQuote(randomQuote);
    } else {
      setCurrentQuote(null);
    }

    setText('');
    setChallengeText('');
    setChallengeIndex(0);
    setMistakes([]);
    setCelebrationActive(false);
    setStats({
      wpm: 0,
      accuracy: 100,
      characters: 0,
      errors: 0,
      startTime: null,
      totalKeystrokes: 0,
      correctKeystrokes: 0
    });
    setAppState('typing');
  };

  useEffect(() => {
    if (appState === 'typing' && mode === 'challenge' && currentQuote && challengeText === currentQuote.text) {
      setCelebrationActive(true);
      audioRef.current.playSuccess();

      setTimeout(() => {
        setAppState('results');
      }, 1500);
    }
  }, [challengeText, currentQuote, mode, appState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (appState !== 'typing') return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') e.preventDefault();
        return;
      }

      const key = e.key;
      const audio = audioRef.current;
      audio.enabled = settings.soundEnabled;

      if (!stats.startTime && key.length === 1) {
        setStats(prev => ({ ...prev, startTime: Date.now() }));
      }

      setPressedKeys(prev => new Set(prev).add(key.toLowerCase()));

      if (mode === 'challenge' && currentQuote) {
        if (key === 'Backspace') {
          setChallengeText(prev => prev.slice(0, -1));
          setChallengeIndex(prev => Math.max(0, prev - 1));
          setMistakes(prev => prev.filter(idx => idx !== challengeIndex - 1));
          audio.playKeyPress(-3, true);
          setStats(prev => ({
            ...prev,
            errors: prev.errors + 1,
            totalKeystrokes: prev.totalKeystrokes + 1
          }));
        } else if (key.length === 1) {
          const expectedChar = currentQuote.text[challengeIndex];
          const isCorrect = key === expectedChar;

          if (isCorrect) {
            setChallengeText(prev => prev + key);
            setChallengeIndex(prev => prev + 1);
            audio.playKeyPress((Math.random() - 0.5) * 4, true);
            setStats(prev => ({
              ...prev,
              characters: prev.characters + 1,
              totalKeystrokes: prev.totalKeystrokes + 1,
              correctKeystrokes: prev.correctKeystrokes + 1
            }));
          } else {
            setMistakes(prev => [...prev, challengeIndex]);
            audio.playKeyPress(0, false);
            setStats(prev => ({
              ...prev,
              errors: prev.errors + 1,
              totalKeystrokes: prev.totalKeystrokes + 1
            }));
          }
        }
      } else {
        if (key === 'Enter') {
          setText(prev => prev + '\n');
          audio.playCarriageReturn();
        } else if (key === 'Backspace') {
          setText(prev => prev.slice(0, -1));
          audio.playKeyPress(-3, true);
          setStats(prev => ({
            ...prev,
            errors: prev.errors + 1,
            totalKeystrokes: prev.totalKeystrokes + 1
          }));
        } else if (key.length === 1) {
          setText(prev => prev + key);
          const pitch = (Math.random() - 0.5) * 4;
          audio.playKeyPress(pitch, true);
          setStats(prev => ({
            ...prev,
            characters: prev.characters + 1,
            totalKeystrokes: prev.totalKeystrokes + 1,
            correctKeystrokes: prev.correctKeystrokes + 1
          }));
        }
      }

      if (stats.totalKeystrokes > 0) {
        const accuracy = Math.round((stats.correctKeystrokes / stats.totalKeystrokes) * 100);
        setStats(prev => ({ ...prev, accuracy }));
      }
    };

    const handleKeyUp = (e) => {
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(e.key.toLowerCase());
        return newSet;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [settings.soundEnabled, stats.startTime, stats.totalKeystrokes, mode, currentQuote, challengeIndex, stats.correctKeystrokes, appState]);

  const formatTime = (ms) => {
    if (!ms) return '0:00';
    const seconds = Math.floor((Date.now() - ms) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetSession = () => {
    if (mode === 'challenge') {
      startNewChallenge();
    } else {
      setText('');
      setStats({
        wpm: 0,
        accuracy: 100,
        characters: 0,
        errors: 0,
        startTime: null,
        totalKeystrokes: 0,
        correctKeystrokes: 0
      });
    }
  };

  const downloadText = () => {
    const content = mode === 'challenge' ? challengeText : text;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `typewriter-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderFreeText = () => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const isLastLine = lineIdx === lines.length - 1;
      return (
        <div key={lineIdx} style={{ minHeight: '28px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {line.split('').map((char, charIdx) => (
            <span key={charIdx} style={{
              display: 'inline-block',
              transform: `rotate(${(Math.random() - 0.5) * 0.8}deg) translateY(${(Math.random() - 0.5) * 0.5}px)`,
              opacity: 0.82 + Math.random() * 0.18
            }}>
              {char}
            </span>
          ))}
          {isLastLine && cursorVisible && (
            <span style={{ display: 'inline-block', width: '3px', height: '24px', background: '#1a1a1a', marginLeft: '1px', verticalAlign: 'text-bottom' }} />
          )}
        </div>
      );
    });
  };

  const renderChallengeText = () => {
    if (!currentQuote) return null;

    return (
      <div style={{ position: 'relative' }}>
        <div style={{ color: 'rgba(26, 26, 26, 0.25)', marginBottom: '20px', padding: '15px', background: 'rgba(201, 184, 150, 0.08)', borderRadius: '6px', borderLeft: '4px solid rgba(201, 184, 150, 0.3)' }}>
          {currentQuote.text.split('').map((char, idx) => {
            const isTyped = idx < challengeIndex;
            const isCurrent = idx === challengeIndex;
            const isMistake = mistakes.includes(idx);

            return (
              <span
                key={idx}
                style={{
                  display: 'inline-block',
                  background: isCurrent ? 'rgba(201, 184, 150, 0.3)' : isMistake ? 'rgba(220, 53, 69, 0.2)' : 'transparent',
                  color: isTyped ? (isMistake ? '#dc3545' : 'rgba(26, 26, 26, 0.6)') : 'rgba(26, 26, 26, 0.25)',
                  padding: '2px 1px',
                  borderRadius: '2px',
                  fontWeight: isCurrent ? 'bold' : 'normal',
                  transition: 'all 0.15s ease'
                }}
              >
                {char}
              </span>
            );
          })}
        </div>

        <div style={{ marginTop: '30px' }}>
          {challengeText.split('').map((char, charIdx) => (
            <span key={charIdx} style={{
              display: 'inline-block',
              transform: `rotate(${(Math.random() - 0.5) * 0.8}deg) translateY(${(Math.random() - 0.5) * 0.5}px)`,
              opacity: 0.82 + Math.random() * 0.18,
              color: mistakes.includes(charIdx) ? '#dc3545' : '#1a1a1a'
            }}>
              {char}
            </span>
          ))}
          {cursorVisible && challengeText.length < currentQuote.text.length && (
            <span style={{ display: 'inline-block', width: '3px', height: '24px', background: '#1a1a1a', marginLeft: '1px', verticalAlign: 'text-bottom' }} />
          )}
        </div>

        <div style={{ marginTop: '20px', height: '8px', background: 'rgba(201, 184, 150, 0.2)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #c9b896 0%, #a89876 100%)',
            width: `${(challengeIndex / currentQuote.text.length) * 100}%`,
            transition: 'width 0.2s ease',
            boxShadow: '0 0 10px rgba(201, 184, 150, 0.5)'
          }} />
        </div>
      </div>
    );
  };

  const keyboardRows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ];

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'radial-gradient(ellipse at center, #f5e6d3 0%, #d4c4b0 50%, #b5a592 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Special+Elite&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        .glass-panel { background: rgba(255, 255, 255, 0.25); backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.3); border-radius: 24px; box-shadow: 0 12px 40px rgba(0,0,0,0.1); }
        .typewriter-key { transition: all 0.08s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; user-select: none; }
        .typewriter-key:active { transform: translateY(2px); }
      `}</style>

      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.03\'/%3E%3C/svg%3E")', opacity: 0.4, pointerEvents: 'none', zIndex: 0 }} />

      {/* --- SCREEN 1: MENU --- */}
      {appState === 'menu' && (
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.8s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: '72px', color: '#3d2f1f', margin: '0 0 10px 0', textShadow: '4px 4px 8px rgba(0,0,0,0.1)', letterSpacing: '4px' }}>
              Vintage Typewriter
            </h1>
            <p style={{ fontFamily: '"Crimson Text", serif', fontSize: '24px', color: '#6b5d4f', fontStyle: 'italic' }}>
              Master your typing with timeless elegance
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '60px', width: '90%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <label style={{ fontSize: '18px', fontWeight: 'bold', color: '#4a3a2a', fontFamily: '"Playfair Display", serif', letterSpacing: '1px' }}>Mode Selection</label>
              <div style={{ display: 'flex', gap: '15px' }}>
                {['free', 'challenge'].map(m => (
                  <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '16px', background: mode === m ? 'linear-gradient(135deg, #c9b896 0%, #a89876 100%)' : '#fff', color: mode === m ? '#1a1a1a' : '#6b5d4f', border: `2px solid ${mode === m ? '#8b7856' : '#ddd'}`, borderRadius: '12px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', fontFamily: '"Crimson Text", serif', transition: 'all 0.3s ease', boxShadow: mode === m ? '0 5px 15px rgba(168, 152, 118, 0.4)' : 'none' }}>
                    {m === 'free' ? 'Free Practice' : 'Challenge Mode'}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'challenge' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.3s ease' }}>
                <label style={{ fontSize: '18px', fontWeight: 'bold', color: '#4a3a2a', fontFamily: '"Playfair Display", serif', letterSpacing: '1px' }}>Difficulty Level</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['all', 'easy', 'medium', 'hard'].map(diff => (
                    <button key={diff} onClick={() => setSettings(prev => ({ ...prev, difficulty: diff }))} style={{ flex: 1, padding: '12px', background: settings.difficulty === diff ? '#8b7856' : '#fff', color: settings.difficulty === diff ? '#fff' : '#1a1a1a', border: '1px solid #8b7856', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={startSession} style={{ marginTop: '20px', padding: '20px', background: 'linear-gradient(135deg, #3d2f1f 0%, #1a1a1a 100%)', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 8px 16px rgba(0,0,0,0.2)', transition: 'all 0.2s' }} onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.target.style.transform = 'translateY(0)'}>
              Begin Journey
            </button>
          </div>
        </div>
      )}

      {/* --- SCREEN 2: TYPING (Full 100vh focused) --- */}
      {appState === 'typing' && (
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* STATS NAVBAR AT TOP */}
          <div style={{ height: '70px', width: '100%', background: 'rgba(42, 37, 32, 0.95)', borderBottom: '2px solid #c9b896', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 50px', backdropFilter: 'blur(10px)', color: '#fff', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', gap: '60px', fontFamily: '"Crimson Text", serif', fontSize: '20px' }}>
              <div style={{ width: '100px' }}>WPM: <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '24px' }}>{stats.wpm}</span></div>
              <div style={{ width: '140px' }}>Accuracy: <span style={{ color: stats.accuracy > 90 ? '#28a745' : '#ffc107', fontWeight: 'bold', fontSize: '24px' }}>{stats.accuracy}%</span></div>
              <div style={{ width: '120px' }}>Time: <span style={{ color: '#fff', fontWeight: 'bold' }}>{formatTime(stats.startTime)}</span></div>
            </div>
            <button onClick={() => setAppState('menu')} style={{ background: 'transparent', border: '1px solid #c9b896', color: '#c9b896', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }} onMouseEnter={e => e.target.style.background = 'rgba(201, 184, 150, 0.1)'} onMouseLeave={e => e.target.style.background = 'transparent'}>
              Abandon Draft
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '30px', boxSizing: 'border-box' }}>
            {/* TYPEWRITER BODY */}
            <div style={{ background: 'linear-gradient(135deg, #2a2520 0%, #1a1612 100%)', borderRadius: '24px 24px 12px 12px', padding: '30px 40px', boxShadow: '0 40px 100px rgba(0,0,0,0.6)', border: '4px solid #3d3530', width: '100%', maxWidth: '1000px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: 'linear-gradient(to bottom, #4a4238 0%, #3a3228 100%)', padding: '15px', borderRadius: '12px', flex: 1, display: 'flex', flexDirection: 'column', boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.6)' }}>
                {/* PAPER AREA */}
                <div style={{ background: '#fffef8', padding: '30px 45px', borderRadius: '6px', flex: 1, overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '1px solid #e8e6dc', fontFamily: '"Special Elite", monospace', fontSize: '22px', lineHeight: '30px', color: '#1a1a1a', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: 0, left: '40px', bottom: 0, width: '2px', background: 'rgba(220, 100, 100, 0.15)', pointerEvents: 'none' }} />
                  {mode === 'challenge' ? renderChallengeText() : renderFreeText()}
                </div>
              </div>
            </div>

            {/* MECHANICAL KEYBOARD (COMPACT TO FIT) */}
            <div style={{ background: 'linear-gradient(to bottom, #3a3228 0%, #2a2520 100%)', padding: '24px', borderRadius: '15px', boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.7)', width: '100%', maxWidth: '850px' }}>
              {keyboardRows.map((row, rowIdx) => (
                <div key={rowIdx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', justifyContent: 'center', paddingLeft: rowIdx === 2 ? '20px' : rowIdx === 3 ? '40px' : '0' }}>
                  {row.map(char => {
                    const isPressed = pressedKeys.has(char.toLowerCase());
                    const shouldHighlight = mode === 'challenge' && currentQuote && currentQuote.text[challengeIndex]?.toUpperCase() === char;
                    return (
                      <div key={char} className="typewriter-key" style={{ width: '45px', height: '45px', background: isPressed ? '#c4b8a8' : shouldHighlight ? '#f4f0e8' : '#f8f4e8', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', color: '#2a2520', boxShadow: isPressed ? 'inset 0 4px 8px rgba(0,0,0,0.5)' : '0 4px 0 #1a1612, 0 6px 12px rgba(0,0,0,0.35)', transform: isPressed ? 'translateY(4px)' : 'translateY(0)', border: shouldHighlight ? '2px solid #c9b896' : '1px solid #d8d4c8' }}>
                        {char}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                <div className="typewriter-key" style={{ width: '320px', height: '45px', background: pressedKeys.has(' ') ? '#c4b8a8' : '#f8f4e8', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: '#2a2520', boxShadow: pressedKeys.has(' ') ? 'inset 0 4px 8px rgba(0,0,0,0.5)' : '0 4px 0 #1a1612, 0 6px 12px rgba(0,0,0,0.35)', transform: pressedKeys.has(' ') ? 'translateY(4px)' : 'translateY(0)', letterSpacing: '8px' }}>
                  SPACE
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SCREEN 3: RESULTS CARD --- */}
      {appState === 'results' && (
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.8s ease' }}>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '56px', color: '#3d2f1f', margin: '0 0 40px 0', textShadow: '4px 4px 8px rgba(0,0,0,0.1)' }}>The Final Manuscript</h2>

          <div className="glass-panel" style={{ padding: '60px', width: '90%', maxWidth: '600px', textAlign: 'center' }}>
            <div style={{ marginBottom: '40px' }}>
              <div style={{ fontSize: '18px', color: '#8b7856', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '10px', fontFamily: '"Crimson Text", serif' }}>Words Per Minute</div>
              <div style={{ fontSize: '110px', fontWeight: 'bold', color: '#3d3530', lineHeight: 1, fontFamily: '"Playfair Display", serif' }}>{stats.wpm}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', borderTop: '2px solid rgba(0,0,0,0.05)', borderBottom: '2px solid rgba(0,0,0,0.05)', padding: '40px 0', marginBottom: '40px' }}>
              <div>
                <div style={{ color: '#8b7856', fontSize: '14px', marginBottom: '5px' }}>Accuracy</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: stats.accuracy > 90 ? '#28a745' : '#ffc107' }}>{stats.accuracy}%</div>
              </div>
              <div>
                <div style={{ color: '#8b7856', fontSize: '14px', marginBottom: '5px' }}>Errors</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc3545' }}>{stats.errors}</div>
              </div>
              <div>
                <div style={{ color: '#8b7856', fontSize: '14px', marginBottom: '5px' }}>Characters</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3d3530' }}>{stats.characters}</div>
              </div>
              <div>
                <div style={{ color: '#8b7856', fontSize: '14px', marginBottom: '5px' }}>Time Taken</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3d3530' }}>{formatTime(stats.startTime)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <button onClick={startSession} style={{ flex: 1, padding: '18px', background: 'linear-gradient(135deg, #c9b896 0%, #a89876 100%)', color: '#1a1a1a', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>New Draft</button>
              <button onClick={() => setAppState('menu')} style={{ flex: 1, padding: '18px', background: 'rgba(0,0,0,0.05)', color: '#3d2f1f', border: '2px solid #8b7856', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>Return to Library</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
