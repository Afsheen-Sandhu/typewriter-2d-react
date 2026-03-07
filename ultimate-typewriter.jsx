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
    if (stats.startTime) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - stats.startTime) / 1000 / 60;
        const words = stats.characters / 5;
        const wpm = elapsed > 0 ? Math.round(words / elapsed) : 0;
        setStats(prev => ({ ...prev, wpm }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [stats.startTime, stats.characters]);
  
  const startNewChallenge = () => {
    const filteredQuotes = settings.difficulty === 'all' 
      ? CHALLENGE_QUOTES 
      : CHALLENGE_QUOTES.filter(q => q.difficulty === settings.difficulty);
    
    const randomQuote = filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];
    setCurrentQuote(randomQuote);
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
  };
  
  useEffect(() => {
    if (mode === 'challenge') {
      startNewChallenge();
    } else {
      setCurrentQuote(null);
      setChallengeText('');
      setChallengeIndex(0);
      setMistakes([]);
    }
  }, [mode]);
  
  useEffect(() => {
    if (mode === 'challenge' && currentQuote && challengeText === currentQuote.text) {
      setCelebrationActive(true);
      audioRef.current.playSuccess();
      
      setTimeout(() => {
        setCelebrationActive(false);
      }, 3000);
    }
  }, [challengeText, currentQuote, mode]);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
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
  }, [settings.soundEnabled, stats.startTime, stats.totalKeystrokes, mode, currentQuote, challengeIndex, stats.correctKeystrokes]);
  
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
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #f5e6d3 0%, #d4c4b0 50%, #b5a592 100%)',
      padding: '40px 20px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      overflow: 'auto'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Special+Elite&display=swap');
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(201, 184, 150, 0.5); }
          50% { box-shadow: 0 0 40px rgba(201, 184, 150, 0.8); }
        }
      `}</style>
      
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at 30% 20%, rgba(255, 240, 200, 0.3) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' opacity=\'0.03\'/%3E%3C/svg%3E")', opacity: 0.4, pointerEvents: 'none', zIndex: 0 }} />
      
      {celebrationActive && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1000 }}>
          {[...Array(50)].map((_, i) => (
            <div key={i} style={{ position: 'absolute', top: '-10px', left: `${Math.random() * 100}%`, width: '10px', height: '10px', background: ['#c9b896', '#a89876', '#8b7856', '#ffd700', '#ff6b6b'][Math.floor(Math.random() * 5)], animation: `confetti ${2 + Math.random() * 2}s linear forwards`, animationDelay: `${Math.random() * 0.5}s` }} />
          ))}
        </div>
      )}
      
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1100px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontFamily: '"Playfair Display", "Georgia", serif', fontSize: '56px', fontWeight: '700', color: '#3d2f1f', margin: '0 0 10px 0', textShadow: '3px 3px 6px rgba(0,0,0,0.15)', letterSpacing: '4px' }}>
            Vintage Typewriter
          </h1>
          <p style={{ fontFamily: '"Crimson Text", "Georgia", serif', fontSize: '20px', color: '#6b5d4f', margin: 0, fontStyle: 'italic' }}>
            Master your typing with timeless elegance
          </p>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' }}>
          {['free', 'challenge'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ padding: '12px 32px', background: mode === m ? 'linear-gradient(to bottom, #c9b896 0%, #a89876 100%)' : 'linear-gradient(to bottom, rgba(201, 184, 150, 0.3) 0%, rgba(168, 152, 118, 0.3) 100%)', color: mode === m ? '#2a2520' : '#6b5d4f', border: '2px solid #8b7856', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', fontFamily: '"Crimson Text", Georgia, serif', boxShadow: mode === m ? '0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.3)' : '0 2px 6px rgba(0,0,0,0.15)', transition: 'all 0.3s ease', letterSpacing: '1px', textTransform: 'capitalize' }}>
              {m === 'free' ? 'Free Practice' : 'Challenge Mode'}
            </button>
          ))}
        </div>
        
        {mode === 'challenge' && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
            {['all', 'easy', 'medium', 'hard'].map(diff => (
              <button key={diff} onClick={() => { setSettings(prev => ({ ...prev, difficulty: diff })); setTimeout(startNewChallenge, 100); }} style={{ padding: '8px 20px', background: settings.difficulty === diff ? 'linear-gradient(to bottom, #8b7856 0%, #6b5846 100%)' : 'transparent', color: settings.difficulty === diff ? '#fff' : '#6b5d4f', border: '2px solid #8b7856', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', fontFamily: '"Crimson Text", Georgia, serif', transition: 'all 0.2s ease', textTransform: 'capitalize' }}>
                {diff === 'all' ? 'All Levels' : diff}
              </button>
            ))}
          </div>
        )}
        
        {celebrationActive && currentQuote && (
          <div style={{ textAlign: 'center', marginBottom: '20px', padding: '20px', background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.9) 0%, rgba(34, 139, 58, 0.9) 100%)', borderRadius: '12px', animation: 'float 2s ease-in-out infinite', boxShadow: '0 8px 32px rgba(40, 167, 69, 0.4)' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff', marginBottom: '10px', fontFamily: '"Playfair Display", serif' }}>🎉 Perfect! 🎉</div>
            <div style={{ fontSize: '16px', color: '#fff', fontFamily: '"Crimson Text", serif' }}>You completed "{currentQuote.author}" quote with {stats.accuracy}% accuracy!</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', marginTop: '8px', fontFamily: '"Crimson Text", serif' }}>{stats.wpm} WPM</div>
          </div>
        )}
        
        <div style={{ background: 'linear-gradient(135deg, #2a2520 0%, #1a1612 100%)', borderRadius: '20px 20px 8px 8px', padding: '40px 30px 30px', boxShadow: '0 30px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)', border: '3px solid #3d3530', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #c9b896 0%, #a89876 100%)', padding: '5px 24px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', color: '#2a2520', letterSpacing: '3px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.2)', fontFamily: '"Courier New", monospace' }}>
            REMINGTON DELUXE
          </div>
          
          <div style={{ background: 'linear-gradient(to bottom, #4a4238 0%, #3a3228 100%)', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.6), 0 2px 4px rgba(255,255,255,0.05)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-15px', left: '20px', right: '20px', height: '30px', background: 'linear-gradient(to bottom, #8b8680 0%, #6b6660 50%, #8b8680 100%)', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)', border: '2px solid #4a4238' }}>
              <div style={{ position: 'absolute', left: '-28px', top: '50%', transform: 'translateY(-50%)', width: '38px', height: '38px', background: 'radial-gradient(circle, #1a1612 0%, #0a0602 100%)', borderRadius: '50%', border: '3px solid #2a2520', boxShadow: '0 3px 8px rgba(0,0,0,0.6), inset 0 -2px 4px rgba(0,0,0,0.3)' }} />
              <div style={{ position: 'absolute', right: '-28px', top: '50%', transform: 'translateY(-50%)', width: '38px', height: '38px', background: 'radial-gradient(circle, #1a1612 0%, #0a0602 100%)', borderRadius: '50%', border: '3px solid #2a2520', boxShadow: '0 3px 8px rgba(0,0,0,0.6), inset 0 -2px 4px rgba(0,0,0,0.3)' }} />
            </div>
            
            <div style={{ background: 'linear-gradient(to bottom, #fffef8 0%, #faf9f0 100%)', minHeight: mode === 'challenge' ? '280px' : '340px', maxHeight: mode === 'challenge' ? '280px' : '460px', overflowY: 'auto', padding: '30px 45px', borderRadius: '4px 4px 0 0', boxShadow: '0 10px 30px rgba(0,0,0,0.35), inset 0 0 80px rgba(0,0,0,0.02)', border: '1px solid #e8e6dc', position: 'relative', fontFamily: '"Special Elite", "Courier Prime", "Courier New", monospace', fontSize: '20px', lineHeight: '28px', color: '#1a1a1a', letterSpacing: '0.5px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'repeating-linear-gradient(transparent, transparent 27px, rgba(180, 200, 220, 0.12) 27px, rgba(180, 200, 220, 0.12) 28px)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: 0, left: '40px', bottom: 0, width: '2px', background: 'rgba(220, 100, 100, 0.15)', pointerEvents: 'none' }} />
              
              <div style={{ position: 'relative', zIndex: 1 }}>
                {mode === 'challenge' ? (currentQuote ? renderChallengeText() : <div style={{ color: '#bbb', fontStyle: 'italic' }}>Loading challenge...</div>) : (text ? renderFreeText() : <div style={{ color: '#bbb', fontStyle: 'italic' }}>Start typing...{cursorVisible && <span style={{ display: 'inline-block', width: '3px', height: '24px', background: '#1a1a1a', verticalAlign: 'text-bottom', marginLeft: '4px' }} />}</div>)}
              </div>
            </div>
            
            {mode === 'challenge' && currentQuote && (
              <div style={{ marginTop: '15px', textAlign: 'right', fontFamily: '"Crimson Text", serif', fontSize: '16px', fontStyle: 'italic', color: '#e8dcc8', paddingRight: '20px' }}>— {currentQuote.author}</div>
            )}
          </div>
          
          <div style={{ background: 'linear-gradient(to bottom, #3a3228 0%, #2a2520 100%)', padding: '28px 20px 22px', borderRadius: '10px', boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.6)' }}>
            {keyboardRows.map((row, rowIdx) => (
              <div key={rowIdx} style={{ display: 'flex', gap: '7px', marginBottom: '7px', justifyContent: 'center', paddingLeft: rowIdx === 2 ? '18px' : rowIdx === 3 ? '36px' : '0' }}>
                {row.map(key => {
                  const isPressed = pressedKeys.has(key.toLowerCase());
                  const shouldHighlight = mode === 'challenge' && currentQuote && currentQuote.text[challengeIndex]?.toUpperCase() === key;
                  
                  return (
                    <div key={key} style={{ width: '48px', height: '48px', background: isPressed ? 'linear-gradient(to bottom, #c4b8a8 0%, #b4a898 100%)' : shouldHighlight ? 'linear-gradient(to bottom, #f4f0e8 0%, #e8e4d8 100%)' : 'linear-gradient(to bottom, #f8f4e8 0%, #e8e4d8 100%)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px', fontWeight: 'bold', color: '#2a2520', boxShadow: isPressed ? 'inset 0 4px 8px rgba(0,0,0,0.45), inset 0 -1px 2px rgba(255,255,255,0.2)' : shouldHighlight ? '0 4px 0 #1a1612, 0 6px 12px rgba(201, 184, 150, 0.6), inset 0 1px 0 rgba(255,255,255,0.4)' : '0 4px 0 #1a1612, 0 6px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.3)', transform: isPressed ? 'translateY(4px)' : 'translateY(0)', transition: 'all 0.08s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default', userSelect: 'none', fontFamily: '"Courier New", monospace', border: isPressed ? '1px solid #a89886' : shouldHighlight ? '2px solid #c9b896' : '1px solid #d8d4c8', position: 'relative', animation: shouldHighlight ? 'glow 1.5s ease-in-out infinite' : 'none' }}>
                      <span style={{ textShadow: isPressed ? 'none' : '0 1px 0 rgba(255,255,255,0.6)' }}>{key}</span>
                      {!isPressed && <div style={{ position: 'absolute', top: '3px', left: '3px', right: '3px', height: '42%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.35), transparent)', borderRadius: '4px', pointerEvents: 'none' }} />}
                    </div>
                  );
                })}
              </div>
            ))}
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '7px' }}>
              <div style={{ width: '360px', height: '48px', background: pressedKeys.has(' ') ? 'linear-gradient(to bottom, #c4b8a8 0%, #b4a898 100%)' : 'linear-gradient(to bottom, #f8f4e8 0%, #e8e4d8 100%)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: '#2a2520', boxShadow: pressedKeys.has(' ') ? 'inset 0 4px 8px rgba(0,0,0,0.45), inset 0 -1px 2px rgba(255,255,255,0.2)' : '0 4px 0 #1a1612, 0 6px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.3)', transform: pressedKeys.has(' ') ? 'translateY(4px)' : 'translateY(0)', transition: 'all 0.08s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'default', userSelect: 'none', border: pressedKeys.has(' ') ? '1px solid #a89886' : '1px solid #d8d4c8', position: 'relative', letterSpacing: '6px' }}>
                SPACE
                {!pressedKeys.has(' ') && <div style={{ position: 'absolute', top: '3px', left: '3px', right: '3px', height: '42%', background: 'linear-gradient(to bottom, rgba(255,255,255,0.35), transparent)', borderRadius: '4px', pointerEvents: 'none' }} />}
              </div>
            </div>
          </div>
        </div>
        
        {settings.showStats && (
          <div style={{ position: 'fixed', top: '30px', right: '30px', background: 'linear-gradient(135deg, rgba(42, 37, 32, 0.95) 0%, rgba(26, 22, 18, 0.95) 100%)', backdropFilter: 'blur(15px)', padding: '28px', borderRadius: '14px', boxShadow: '0 12px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)', border: '3px solid #c9b896', minWidth: '240px' }}>
            <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '22px', fontWeight: 'bold', color: '#c9b896', marginBottom: '18px', paddingBottom: '12px', borderBottom: '2px solid #c9b896', letterSpacing: '2px' }}>Statistics</div>
            <div style={{ fontFamily: '"Crimson Text", Georgia, serif', fontSize: '17px', color: '#e8dcc8', lineHeight: '2' }}>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#a89876' }}>WPM:</span>
                <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '22px' }}>{stats.wpm}</span>
              </div>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#a89876' }}>Accuracy:</span>
                <span style={{ fontWeight: 'bold', color: stats.accuracy >= 95 ? '#28a745' : stats.accuracy >= 80 ? '#ffc107' : '#dc3545', fontSize: '22px' }}>{stats.accuracy}%</span>
              </div>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a89876' }}>Characters:</span>
                <span style={{ fontWeight: 'bold', color: '#fff' }}>{stats.characters}</span>
              </div>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a89876' }}>Time:</span>
                <span style={{ fontWeight: 'bold', color: '#fff' }}>{formatTime(stats.startTime)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a89876' }}>Errors:</span>
                <span style={{ fontWeight: 'bold', color: '#fff' }}>{stats.errors}</span>
              </div>
            </div>
          </div>
        )}
        
        <div style={{ marginTop: '35px', background: 'linear-gradient(135deg, rgba(42, 37, 32, 0.85) 0%, rgba(26, 22, 18, 0.85) 100%)', backdropFilter: 'blur(12px)', padding: '28px', borderRadius: '14px', boxShadow: '0 10px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)', border: '2px solid #3d3530' }}>
          <div style={{ display: 'flex', gap: '35px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { label: 'Sound Effects', key: 'soundEnabled' },
                { label: 'Show Stats', key: 'showStats' }
              ].map(setting => (
                <label key={setting.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontFamily: '"Crimson Text", Georgia, serif', fontSize: '17px', color: '#e8dcc8' }}>
                  <input type="checkbox" checked={settings[setting.key]} onChange={(e) => setSettings(prev => ({ ...prev, [setting.key]: e.target.checked }))} style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#c9b896' }} />
                  {setting.label}
                </label>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '14px' }}>
              {[
                { label: mode === 'challenge' ? 'New Challenge' : 'Reset', onClick: resetSession },
                { label: 'Save Text', onClick: downloadText }
              ].map(btn => (
                <button key={btn.label} onClick={btn.onClick} style={{ padding: '14px 28px', background: 'linear-gradient(to bottom, #c9b896 0%, #a89876 100%)', color: '#2a2520', border: '2px solid #8b7856', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', fontFamily: '"Crimson Text", Georgia, serif', boxShadow: '0 5px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35)', transition: 'all 0.2s ease', letterSpacing: '1px' }} onMouseOver={(e) => { e.target.style.transform = 'translateY(-3px)'; e.target.style.boxShadow = '0 8px 16px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.35)'; }} onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 5px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.35)'; }}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div style={{ marginTop: '28px', textAlign: 'center', fontFamily: '"Crimson Text", Georgia, serif', fontSize: '17px', color: '#8b7d6f', fontStyle: 'italic', lineHeight: '1.6' }}>
          {mode === 'challenge' ? 'Type the quote exactly as shown • Watch the highlighted key for guidance' : 'Start typing to begin your practice session • Press Enter for a new line'}
        </div>
      </div>
    </div>
  );
}
