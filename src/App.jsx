import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Sun, Moon, Share2, Activity, MapPin, Brain, GitGraph, Sparkles, RefreshCcw, ArrowRight, Check } from 'lucide-react';

// --- Constants & Data ---
const API_URL = 'http://localhost:8000';

const CULTURAL_FACTS = {
  Japan: "Known for cherry blossoms, sushi, and a perfect blend of ancient tradition with modern technology.",
  Italy: "Home to the Roman Empire, Renaissance art, and the birthplace of pizza and pasta.",
  Mexico: "Famous for its vibrant festivals like Day of the Dead, spicy cuisine, and ancient Mayan ruins.",
  Ethiopia: "The only African nation never colonized, origin of coffee, and home to rock-hewn churches.",
  India: "A land of diverse cultures, Bollywood, spicy curries, and the magnificent Taj Mahal."
};

const CATEGORY_HINTS = {
  Food: "What's your ideal comfort meal?",
  Music: "What genre gets you moving?",
  Clothing: "Which style suits your vibe?",
  Language: "Which language sounds most beautiful to you?",
  Landmark: "Where would you most like to visit?"
};

const THEMES = {
  light: { 
    bg: '#f0f9ff', 
    text: '#0f172a', 
    card: 'rgba(255, 255, 255, 0.6)', 
    accent: '#0ea5e9', 
    gradient: 'from-cyan-400 via-blue-500 to-purple-600',
    border: 'rgba(255, 255, 255, 0.4)'
  },
  dark: { 
    bg: '#020617', // Deeper, richer dark
    text: '#f8fafc', 
    card: 'rgba(15, 23, 42, 0.6)', 
    accent: '#38bdf8', 
    gradient: 'from-pink-500 via-purple-500 to-cyan-500', // Vaporwave/Cyberpunk
    border: 'rgba(255, 255, 255, 0.1)'
  }
};

// --- Components ---

const ParticleBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black opacity-80"></div>
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 brightness-100 contrast-150 mix-blend-overlay"></div>
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full mix-blend-screen filter blur-2xl"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: Math.random() * 0.5 + 0.5,
            opacity: Math.random() * 0.4 + 0.2
          }}
          animate={{
            y: [null, Math.random() * window.innerHeight],
            x: [null, Math.random() * window.innerWidth],
            scale: [null, Math.random() * 1.5 + 0.5],
            opacity: [null, Math.random() * 0.5 + 0.3]
          }}
          transition={{
            duration: Math.random() * 20 + 15,
            repeat: Infinity,
            ease: "linear",
            repeatType: "mirror"
          }}
          style={{
            width: Math.random() * 400 + 100,
            height: Math.random() * 400 + 100,
            background: i % 3 === 0 ? 'rgba(56, 189, 248, 0.2)' : i % 3 === 1 ? 'rgba(236, 72, 153, 0.2)' : 'rgba(168, 85, 247, 0.2)', // Blue, Pink, Purple
          }}
        />
      ))}
    </div>
  );
};

const LoadingSpinner = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 1 }}
    className="w-16 h-16 border-4 border-t-transparent border-blue-500 rounded-full mx-auto"
  />
);

const ThemeToggle = ({ theme, toggleTheme }) => (
  <motion.button 
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={toggleTheme} 
    className="fixed top-6 right-6 p-3 rounded-full bg-white/10 backdrop-blur-md z-50 border border-white/20 shadow-xl"
  >
    {theme === 'dark' ? <Sun className="text-yellow-400" /> : <Moon className="text-slate-700" />}
  </motion.button>
);

const ProgressBar = ({ progress, color = "bg-blue-500" }) => (
  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden shadow-inner">
    <motion.div 
      className={`h-full ${color}`}
      initial={{ width: 0 }}
      animate={{ width: `${progress * 100}%` }}
      transition={{ duration: 1.5, ease: "easeOut" }}
    />
  </div>
);

const CARD_VARIANTS = {
  emerald: {
    selectedBorder: 'border-emerald-500',
    selectedBg: 'bg-emerald-500/10',
    shadow: 'shadow-[0_0_50px_rgba(16,185,129,0.3)]',
    gradient: 'from-emerald-500/20',
    glow: 'bg-emerald-500/10',
    hoverGlow: 'group-hover:bg-emerald-500/20',
    iconBg: 'bg-emerald-500/20',
    iconText: 'text-emerald-400',
    iconShadow: 'shadow-emerald-500/20',
    ring: 'ring-emerald-500/30',
    button: 'bg-emerald-500',
    buttonShadow: 'shadow-emerald-500/40'
  },
  cyan: {
    selectedBorder: 'border-cyan-500',
    selectedBg: 'bg-cyan-500/10',
    shadow: 'shadow-[0_0_50px_rgba(6,182,212,0.3)]',
    gradient: 'from-cyan-500/20',
    glow: 'bg-cyan-500/10',
    hoverGlow: 'group-hover:bg-cyan-500/20',
    iconBg: 'bg-cyan-500/20',
    iconText: 'text-cyan-400',
    iconShadow: 'shadow-cyan-500/20',
    ring: 'ring-cyan-500/30',
    button: 'bg-cyan-500',
    buttonShadow: 'shadow-cyan-500/40'
  }
};

const ModelCard = ({ title, icon: Icon, description, selected, onSelect, color }) => {
  const styles = CARD_VARIANTS[color];
  
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`
        cursor-pointer relative overflow-hidden p-8 md:p-12 rounded-[2.5rem] border-2 transition-all duration-300 ease-out group flex flex-col items-center text-center h-full min-h-[400px] touch-manipulation
        ${selected 
          ? `${styles.selectedBorder} ${styles.selectedBg} ${styles.shadow} ring-4 ${styles.ring}` 
          : 'border-white/20 bg-white/10 hover:bg-white/15 hover:border-white/40 hover:shadow-2xl'}
      `}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Animated gradient border effect */}
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${styles.gradient} to-transparent pointer-events-none`} />
      
      <div className={`absolute top-0 right-0 p-40 -mr-20 -mt-20 rounded-full ${styles.glow} blur-3xl transition-all duration-300 ${styles.hoverGlow}`} />
      
      {/* Checkmark feedback */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`absolute top-6 right-6 z-20 p-3 rounded-full ${styles.button} shadow-lg`}
      >
        <Check size={24} className="text-white" strokeWidth={3} />
      </motion.div>
      
      <div className="relative z-10 flex flex-col items-center w-full">
        <div className={`p-8 rounded-3xl ${styles.iconBg} mb-8 ${styles.iconText} group-hover:scale-110 transition-transform duration-300 shadow-lg ${styles.iconShadow} ring-2 ${styles.ring}`}>
          <Icon size={80} strokeWidth={1.5} />
        </div>
        <h3 className="text-3xl md:text-5xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200 tracking-tight">{title}</h3>
        <p className="text-lg md:text-xl opacity-80 leading-relaxed mb-8 max-w-sm">{description}</p>
        
        <div className="mt-auto w-full">
          <motion.div 
            animate={{ opacity: selected ? 1 : 0.8, scale: selected ? 1 : 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`w-full py-4 md:py-5 rounded-2xl font-bold text-lg md:text-xl tracking-widest uppercase transition-all duration-300 border
              ${selected 
                ? `${styles.button} border-transparent text-white shadow-lg ${styles.buttonShadow}` 
                : 'bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/60'}
            `}
          >
            {selected ? 'Selected' : 'Choose'}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

const QuizOption = ({ label, value, selected, onSelect, index, focused }) => {
  const modelColor = selected ? 'pink' : 'pink';
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
      whileHover={{ scale: 1.05, x: 5 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(value)}
      className={`
        group relative p-8 md:p-10 rounded-3xl border-2 transition-all duration-300 ease-out w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.33%-1rem)] text-left overflow-hidden min-h-[100px] touch-manipulation
        ${selected 
          ? 'border-pink-500 bg-pink-500/20 shadow-[0_0_40px_rgba(236,72,153,0.4)] ring-4 ring-pink-500/30' 
          : focused
          ? 'border-pink-400/80 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.2)] ring-2 ring-pink-400/20'
          : 'border-white/10 bg-white/5 hover:border-pink-400/60 hover:bg-white/10 hover:shadow-xl'}
      `}
      role="button"
      tabIndex={0}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
      <span className="relative z-10 font-bold text-xl md:text-3xl flex items-center justify-between">
        {value}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="flex items-center gap-2"
        >
          {selected ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
                className="p-2 rounded-full bg-pink-500 shadow-lg"
              >
                <Check size={20} className="text-white" strokeWidth={3} />
              </motion.div>
            </>
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-white/20 group-hover:border-pink-400 transition-colors duration-300" />
          )}
        </motion.div>
      </span>
    </motion.button>
  );
};

const WorldMap = ({ highlightedCountry, modelType }) => {
    // Simplified World Map
    const countries = [
        { name: 'Japan', cx: 350, cy: 150, r: 15 },
        { name: 'Italy', cx: 210, cy: 140, r: 12 },
        { name: 'Mexico', cx: 90, cy: 180, r: 18 },
        { name: 'Ethiopia', cx: 230, cy: 210, r: 15 },
        { name: 'India', cx: 290, cy: 180, r: 20 },
    ];

    const highlightColor = modelType === 'dt' ? '#10b981' : '#3b82f6';

    return (
        <div className="relative w-full h-64 bg-slate-900/50 rounded-2xl overflow-hidden border border-white/10 shadow-inner">
            <svg viewBox="0 0 400 300" className="w-full h-full">
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <path d="M50,150 Q100,50 150,150 T250,150 T350,150" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="100" />
                
                {countries.map(c => (
                    <g key={c.name}>
                        <motion.circle
                            cx={c.cx}
                            cy={c.cy}
                            r={c.r}
                            fill={highlightedCountry === c.name ? highlightColor : "#475569"}
                            filter={highlightedCountry === c.name ? "url(#glow)" : ""}
                            animate={{ 
                                scale: highlightedCountry === c.name ? [1, 1.2, 1] : 1,
                                opacity: highlightedCountry === c.name ? 1 : 0.4
                            }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="cursor-pointer"
                        />
                        {highlightedCountry === c.name && (
                             <motion.text 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                x={c.cx} 
                                y={c.cy - 25} 
                                textAnchor="middle" 
                                fill="white"
                                fontSize="14"
                                fontWeight="bold"
                                className="drop-shadow-lg"
                            >
                                {c.name}
                            </motion.text>
                        )}
                    </g>
                ))}
            </svg>
        </div>
    );
};

// --- Main App ---

function App() {
  const [theme, setTheme] = useState('dark');
  const [options, setOptions] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null); // 'dt' or 'lr'
  const [selections, setSelections] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(-1); // -1: Model Select, 0-4: Quiz
  const [showOtherModel, setShowOtherModel] = useState(false);
  const [focusedOptionIndex, setFocusedOptionIndex] = useState(0);
  const [livePrediction, setLivePrediction] = useState(null);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    document.body.className = theme;
    document.body.style.backgroundColor = THEMES[theme].bg;
    document.body.style.color = THEMES[theme].text;
    document.documentElement.style.backgroundColor = THEMES[theme].bg;
    
    // Fallback options if API fails
    const fallbackOptions = {
      "Food": ['Sushi', 'Pizza', 'Tacos', 'Injera', 'Curry', 'Burger', 'Croissant'],
      "Music": ['J-Pop', 'Opera', 'Mariachi', 'Ethio-Jazz', 'Bollywood', 'Pop', 'Chanson'],
      "Clothing": ['Kimono', 'Designer Suit', 'Poncho', 'Habesha Kemis', 'Saree', 'Jeans', 'Beret'],
      "Language": ['Japanese', 'Italian', 'Spanish', 'Amharic', 'Hindi', 'English', 'French'],
      "Landmark": ['Mt. Fuji', 'Colosseum', 'Chichen Itza', 'Lalibela', 'Taj Mahal', 'Statue of Liberty', 'Eiffel Tower']
    };
    
    axios.get(`${API_URL}/options`)
      .then(res => {
        if (res.data && Object.keys(res.data).length > 0) {
          setOptions(res.data);
        } else {
          setOptions(fallbackOptions);
        }
      })
      .catch(err => {
        console.error('API error, using fallback options:', err);
        setOptions(fallbackOptions);
      });
  }, [theme]);

  const handleModelSelect = (model) => {
    setSelectedModel(model);
    setStep(0);
  };

  const handlePredict = useCallback(async (finalSelections) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch both for comparison, but highlight selected
      const dtRes = await axios.post(`${API_URL}/predict/dt`, finalSelections);
      const lrRes = await axios.post(`${API_URL}/predict/lr`, finalSelections);
      
      // Artificial delay for "thinking" effect
      setTimeout(() => {
        setPrediction({
          dt: dtRes.data,
          lr: lrRes.data
        });
        setLoading(false);
        new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3').play().catch(() => {});
      }, 1500);
      
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.detail || err.message || "Failed to consult the Oracle. Please try again.";
      setError(errorMsg);
      setLoading(false);
    }
  }, []);

  const handleLivePredict = useCallback(async (currentSelections) => {
    if (!selectedModel) return;
    
    try {
      const res = await axios.post(`${API_URL}/predict/${selectedModel}`, currentSelections);
      setLivePrediction(res.data);
    } catch (err) {
      // Silently fail for live updates
      console.error('Live prediction error:', err);
    }
  }, [selectedModel]);

  const handleSelect = useCallback((category, value) => {
    setSelections(prevSelections => {
      const newSelections = { ...prevSelections, [category]: value };
      
      // Live prediction update
      if (selectedModel && Object.keys(newSelections).length > 0) {
        handleLivePredict(newSelections);
      }
      
      return newSelections;
    });
    
    setFocusedOptionIndex(0);
    
    // Play sound
    new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3').play().catch(() => {});
    
    if (step < 4) {
      setTimeout(() => setStep(step + 1), 400);
    } else {
      setSelections(prevSelections => {
        const finalSelections = { ...prevSelections, [category]: value };
        handlePredict(finalSelections);
        return finalSelections;
      });
    }
  }, [step, selectedModel, handleLivePredict, handlePredict]);

  // Reset focused option when step changes
  useEffect(() => {
    setFocusedOptionIndex(0);
  }, [step]);

  // Keyboard navigation for quiz options
  useEffect(() => {
    if (step >= 0 && step < 5 && options) {
      const categories = Object.keys(options);
      const currentCategory = categories[step];
      const currentOptions = options[currentCategory] || [];
      
      const handleKeyDown = (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusedOptionIndex((prev) => (prev + 1) % currentOptions.length);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusedOptionIndex((prev) => (prev - 1 + currentOptions.length) % currentOptions.length);
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (currentOptions[focusedOptionIndex]) {
            handleSelect(currentCategory, currentOptions[focusedOptionIndex]);
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [step, options, focusedOptionIndex, handleSelect]);

  const reset = () => {
    setPrediction(null);
    setStep(-1);
    setSelections({});
    setSelectedModel(null);
    setShowOtherModel(false);
    setFocusedOptionIndex(0);
    setLivePrediction(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!options) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  const categories = Object.keys(options);
  const currentCategory = categories[step];

  // Logic for displaying results
  const primaryResult = prediction ? (selectedModel === 'dt' ? prediction.dt : prediction.lr) : null;
  const secondaryResult = prediction ? (selectedModel === 'dt' ? prediction.lr : prediction.dt) : null;

  return (
    <div className={`min-h-[100dvh] p-4 md:p-6 transition-colors duration-700 font-sans relative overflow-x-hidden ${theme === 'dark' ? 'dark' : ''}`}>
      <ParticleBackground />
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      
      <div className="max-w-7xl mx-auto relative z-10 flex flex-col min-h-[90vh]">
        
        {/* Header - Moved UP */}
        <header className="mb-8 text-center pt-4 md:pt-8 flex-shrink-0">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-block relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <h1 className={`relative text-4xl md:text-7xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r ${THEMES[theme].gradient} tracking-tighter drop-shadow-sm`}>
              CULTURE ORACLE
            </h1>
            <div className="h-1.5 w-32 bg-gradient-to-r from-transparent via-pink-500 to-transparent mx-auto rounded-full mt-2" />
          </motion.div>
        </header>

        <AnimatePresence mode="wait">
          
          {/* STEP -1: Model Selection */}
          {step === -1 && (
            <motion.div 
              key="model-select"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full max-w-6xl mx-auto flex flex-col justify-start pt-10 pb-12"
            >
              <h2 className="text-3xl md:text-6xl font-black text-center mb-12 md:mb-16 text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-200 to-white drop-shadow-sm">Choose Your Oracle</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                <ModelCard 
                  title="Decision Tree"
                  icon={GitGraph}
                  description="A deterministic path. Follows a strict flowchart of rules to arrive at a precise conclusion. Transparent and logical."
                  selected={selectedModel === 'dt'}
                  onSelect={() => handleModelSelect('dt')}
                  color="emerald"
                />
                <ModelCard 
                  title="Logistic Regression"
                  icon={Brain}
                  description="A probabilistic mind. Weighs every feature to calculate the exact likelihood of each outcome. Nuanced and statistical."
                  selected={selectedModel === 'lr'}
                  onSelect={() => handleModelSelect('lr')}
                  color="cyan"
                />
              </div>
            </motion.div>
          )}

          {/* STEP 0-4: Quiz */}
          {step >= 0 && !prediction && !loading && !error && (
            <motion.div 
              key="quiz"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-5xl mx-auto flex flex-col justify-start pt-8 pb-12"
            >
              <div className="bg-white/5 backdrop-blur-2xl rounded-[2.5rem] p-6 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.3)] border border-white/10 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 relative z-10 gap-4">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs font-bold tracking-widest uppercase mb-3 border border-pink-500/30">
                      Question {step + 1} / {categories.length}
                    </span>
                    <h2 className="text-2xl md:text-5xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                      {CATEGORY_HINTS[currentCategory]}
                    </h2>
                  </div>
                  <div className="text-5xl md:text-7xl opacity-10 font-black tracking-tighter absolute right-0 top-0 md:relative">
                    {currentCategory}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 md:gap-6 relative z-10">
                  {options[currentCategory].map((opt, idx) => (
                    <QuizOption 
                      key={opt} 
                      value={opt} 
                      index={idx}
                      selected={selections[currentCategory] === opt}
                      focused={focusedOptionIndex === idx && selections[currentCategory] !== opt}
                      onSelect={(val) => handleSelect(currentCategory, val)} 
                    />
                  ))}
                </div>

                {/* Live Prediction Preview */}
                {livePrediction && Object.keys(selections).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm opacity-60 mb-1">Live Prediction</div>
                        <div className="text-2xl font-bold">{livePrediction.prediction}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm opacity-60 mb-1">Confidence</div>
                        <div className="text-xl font-bold">{(livePrediction.confidence * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="mt-16">
                  <div className="flex justify-between text-xs font-bold tracking-widest opacity-60 mb-3">
                    <span>JOURNEY PROGRESS</span>
                    <span>{Math.round(((step + 1) / categories.length) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-black/40 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                    <motion.div 
                      className={`h-full ${
                        selectedModel === 'dt' 
                          ? 'bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600' 
                          : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600'
                      }`}
                      animate={{ width: `${((step + 1) / categories.length) * 100}%` }}
                      transition={{ ease: "easeOut", duration: 0.3 }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* LOADING STATE */}
          {loading && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center mt-20"
            >
              <div className="relative inline-block">
                <div className={`absolute inset-0 ${selectedModel === 'dt' ? 'bg-emerald-500' : 'bg-blue-500'} blur-xl opacity-20 animate-pulse`} />
                <Brain size={80} className={`${selectedModel === 'dt' ? 'text-emerald-400' : 'text-blue-400'} animate-bounce`} />
              </div>
              <h3 className="text-2xl font-bold mt-8">Consulting the Oracle...</h3>
              <p className="opacity-60 mt-2">Analyzing your cultural signature</p>
            </motion.div>
          )}

          {/* ERROR STATE */}
          {error && (
            <motion.div 
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center mt-20 p-8 bg-red-500/20 backdrop-blur-md rounded-3xl border border-red-500/30 max-w-md mx-auto"
            >
              <h3 className="text-2xl font-bold text-red-400 mb-4">Connection Lost</h3>
              <p className="opacity-80 mb-6">{error}</p>
              <button 
                onClick={reset}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-bold transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* RESULTS */}
          {prediction && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Main Result Card */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${selectedModel === 'dt' ? 'from-emerald-400 to-teal-500' : 'from-blue-400 to-indigo-500'}`} />
                  
                  <div className="flex items-center gap-3 mb-6">
                     {selectedModel === 'dt' ? <GitGraph className="text-emerald-400" /> : <Brain className="text-blue-400" />}
                     <span className="uppercase tracking-widest text-sm font-bold opacity-70">
                       {selectedModel === 'dt' ? 'Decision Tree' : 'Logistic Regression'} Result
                     </span>
                  </div>

                  <div className="text-center mb-8">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="inline-block mb-4"
                    >
                      <h2 className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        {primaryResult.prediction}
                      </h2>
                    </motion.div>
                    <p className="text-lg opacity-80 max-w-lg mx-auto leading-relaxed">
                      {CULTURAL_FACTS[primaryResult.prediction]}
                    </p>
                  </div>

                  <WorldMap highlightedCountry={primaryResult.prediction || livePrediction?.prediction} modelType={selectedModel} />

                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-black/20">
                      <div className="text-sm opacity-50 mb-1">CONFIDENCE</div>
                      <div className="text-2xl font-bold mb-3">{(primaryResult.confidence * 100).toFixed(1)}%</div>
                      {/* Circular Progress Indicator */}
                      <div className="relative w-20 h-20 mx-auto">
                        <svg className="transform -rotate-90 w-20 h-20">
                          <circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="6"
                            fill="none"
                          />
                          <motion.circle
                            cx="40"
                            cy="40"
                            r="36"
                            stroke={selectedModel === 'dt' ? '#10b981' : '#3b82f6'}
                            strokeWidth="6"
                            fill="none"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: primaryResult.confidence }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            strokeDasharray={`${2 * Math.PI * 36}`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold">
                            {Math.round(primaryResult.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                      <ProgressBar progress={primaryResult.confidence} color={selectedModel === 'dt' ? 'bg-emerald-500' : 'bg-blue-500'} />
                    </div>
                    <div className="p-4 rounded-2xl bg-black/20">
                      <div className="text-sm opacity-50 mb-1">MODEL TYPE</div>
                      <div className="text-lg font-bold truncate">{selectedModel === 'dt' ? 'Deterministic' : 'Probabilistic'}</div>
                      <div className="text-xs opacity-50 mt-2">
                        {selectedModel === 'dt' ? 'Based on rule path' : 'Based on feature weights'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compare Button */}
                {!showOtherModel && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setShowOtherModel(true)}
                    className="w-full py-4 rounded-2xl border border-white/10 hover:bg-white/5 transition flex items-center justify-center gap-2 font-semibold"
                  >
                    <RefreshCcw size={18} /> Compare with {selectedModel === 'dt' ? 'Logistic Regression' : 'Decision Tree'}
                  </motion.button>
                )}

                {/* Secondary Model Reveal */}
                {showOtherModel && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/5"
                  >
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-400">
                      Alternative Perspective ({secondaryResult.model})
                    </h3>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">{secondaryResult.prediction}</span>
                      <div className="text-right">
                        <div className="text-sm opacity-50">Confidence</div>
                        <div className="font-mono text-xl">{(secondaryResult.confidence * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Start Over Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={reset}
                  className="w-full mt-4 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition flex items-center justify-center gap-2 font-bold text-lg"
                >
                   Start Over / Choose Another Model
                </motion.button>
              </div>

              {/* Visualization Sidebar */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl h-full flex flex-col">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Activity className="text-purple-400" /> 
                    {selectedModel === 'lr' ? 'Probability Distribution' : 'Feature Match Intensity'}
                  </h3>
                  
                  <div className="flex-grow min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {selectedModel === 'lr' ? (
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={
                          Object.entries(prediction.lr.probabilities).map(([k, v]) => ({
                            subject: k,
                            A: v * 100,
                            fullMark: 100
                          }))
                        }>
                          <PolarGrid stroke="rgba(255,255,255,0.1)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="Probability" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                          />
                        </RadarChart>
                      ) : (
                        <BarChart
                           layout="vertical"
                           data={[
                             { name: 'Features Matched', value: 100 }, 
                             { name: 'Path Depth', value: 80 },
                             { name: 'Node Purity', value: 95 }
                           ]}
                           margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                        >
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" width={100} tick={{fill: 'white', fontSize: 10}} />
                          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#000', borderRadius: '10px', border: 'none'}} />
                          <Bar dataKey="value" fill="#10b981" radius={[0, 10, 10, 0]} barSize={20} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={reset}
                    className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 group"
                  >
                    Start New Journey <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
