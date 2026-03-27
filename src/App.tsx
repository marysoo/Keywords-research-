import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, MapPin, Calendar, BarChart3, Loader2, ArrowRight, Info, Youtube, Video, Image as ImageIcon, Globe, Zap, ShieldCheck, ShieldAlert, Shield, PlayCircle, Sparkles, Lightbulb, Download, FileJson, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { getKeywordInsights, getTrendingKeywords, getYouTubeNicheKeywords, KeywordData, TrendingKeyword, YouTubeKeyword, isApiKeyMissing, setDynamicApiKey, getApiKey } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [mode, setMode] = useState<'search' | 'trending' | 'youtube'>('search');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<KeywordData | null>(null);
  const [trendingData, setTrendingData] = useState<TrendingKeyword[] | null>(null);
  const [youtubeData, setYoutubeData] = useState<YouTubeKeyword[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Analyzing search data...");

  const loadingMessages = [
    "Searching the web for real-time data...",
    "Analyzing monthly search volumes...",
    "Identifying geographic trends...",
    "Calculating platform engagement...",
    "Finding low-competition opportunities...",
    "Structuring insights for you...",
    "Almost there, finalizing report..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      let i = 0;
      setLoadingMessage(loadingMessages[0]);
      interval = setInterval(() => {
        i = (i + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[i]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState(getApiKey() || '');
  const [hasPlatformKey, setHasPlatformKey] = useState(false);

  useEffect(() => {
    const checkPlatformKey = async () => {
      if (window.aistudio) {
        try {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasPlatformKey(hasKey);
        } catch (e) {
          console.error("Failed to check platform key", e);
        }
      }
    };
    checkPlatformKey();
  }, []);

  const handleConnectPlatform = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setHasPlatformKey(true);
        setError(null);
        // Refresh the page or the service to use the new key
        window.location.reload();
      } catch (e) {
        console.error("Failed to open key selector", e);
      }
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    if (isApiKeyMissing()) {
      setError('Gemini API Key is missing. Please set it in Settings or environment variables.');
      setShowKeyModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setTrendingData(null);
    setYoutubeData(null);
    try {
      const result = await getKeywordInsights(query, location || "Global");
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTrendingSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!location.trim()) return;

    if (isApiKeyMissing()) {
      setError('Gemini API Key is missing. Please set it in Settings or environment variables.');
      setShowKeyModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setTrendingData(null);
    setYoutubeData(null);
    try {
      const result = await getTrendingKeywords(location);
      setTrendingData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleYouTubeSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!niche.trim()) return;

    if (isApiKeyMissing()) {
      setError('Gemini API Key is missing. Please set it in Settings or environment variables.');
      setShowKeyModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setTrendingData(null);
    setYoutubeData(null);
    try {
      const result = await getYouTubeNicheKeywords(niche);
      setYoutubeData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getCompetitionIcon = (level?: string) => {
    switch (level) {
      case 'Low': return <ShieldCheck className="w-3 h-3 text-emerald-500" />;
      case 'Medium': return <Shield className="w-3 h-3 text-amber-500" />;
      case 'High': return <ShieldAlert className="w-3 h-3 text-rose-500" />;
      default: return null;
    }
  };

  const getCompetitionColor = (level?: string) => {
    switch (level) {
      case 'Low': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'High': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  const exportToJSON = () => {
    const exportData = data || trendingData || youtubeData;
    if (!exportData) return;
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = data ? `keyword-${data.keyword}` : mode === 'trending' ? `trending-${location}` : `youtube-${niche}`;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (data) {
      let csvContent = "Section,Month/Keyword,Volume/Score,Competition/Potential\n";
      csvContent += "Historical Data\n";
      data.monthlySearches.forEach(s => {
        csvContent += `Monthly Search,${s.month},${s.volume},\n`;
      });
      csvContent += "\nPlatform Insights\n";
      csvContent += `Platform,YouTube,${data.platformUsage.youtube},\n`;
      csvContent += `Platform,Pinterest,${data.platformUsage.pinterest},\n`;
      csvContent += `Platform,TikTok,${data.platformUsage.tiktok},\n`;
      csvContent += "\nTop Locations\n";
      data.topLocations.forEach(tl => {
        csvContent += `Location,${tl.location},${tl.volume},\n`;
      });
      csvContent += "\nRelated Keywords\n";
      data.relatedKeywords.forEach(rk => {
        csvContent += `Related,${rk.keyword},${rk.volume},${rk.competition || ''}\n`;
      });
      csvContent += "\nSummary\n";
      csvContent += `Summary,"${data.summary.replace(/"/g, '""')}",,\n`;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keyword-${data.keyword}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (trendingData) {
      let csvContent = "Keyword,Volume,Competition,Reason,Related Keywords\n";
      trendingData.forEach(item => {
        csvContent += `"${item.keyword}",${item.volume},${item.competition},"${item.reason.replace(/"/g, '""')}","${item.relatedKeywords.join(', ')}"\n`;
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trending-${location}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (youtubeData) {
      let csvContent = "Keyword,Volume,Competition,Potential,Video Ideas\n";
      youtubeData.forEach(item => {
        csvContent += `"${item.keyword}",${item.searchVolume},${item.competition},${item.potential},"${item.videoIdeas.join(' | ')}"\n`;
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `youtube-${niche}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const saveApiKey = () => {
    setDynamicApiKey(tempKey);
    setShowKeyModal(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* API Key Warning / Platform Connection */}
      {((isApiKeyMissing() && !hasPlatformKey) || (window.aistudio && !hasPlatformKey)) && (
        <div className="bg-indigo-50 border-b border-indigo-100 py-2.5 px-4 text-center">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <p className="text-xs font-bold text-indigo-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600 animate-pulse" />
              Connect your Gemini API Key to enable keyword insights.
            </p>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowKeyModal(true)}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-1.5 rounded-full font-bold transition-all shadow-lg shadow-indigo-200"
              >
                Setup Free Key
              </button>
              {window.aistudio && (
                <button 
                  onClick={handleConnectPlatform}
                  className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
                  title="Only for Paid accounts"
                >
                  <Zap className="w-3 h-3" />
                  Connect Paid Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      <AnimatePresence>
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header - Sticky */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">API Settings</h2>
                </div>
                <button 
                  onClick={() => setShowKeyModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Modal Body - Scrollable */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  {/* Option 1: Free Key */}
                  <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        Option 1: Free Key (Recommended)
                      </h3>
                      <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] bg-white border border-indigo-200 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-50 font-bold transition-colors"
                      >
                        Get Key Here
                      </a>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                        Paste Your Key Below
                      </label>
                      <div className="relative">
                        <input 
                          type="password"
                          value={tempKey}
                          onChange={(e) => setTempKey(e.target.value)}
                          placeholder="Example: AIzaSyB..."
                          className={cn(
                            "w-full pl-4 pr-12 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-sm",
                            tempKey && !tempKey.startsWith('AIza') ? "border-amber-300 bg-amber-50" : "border-indigo-200"
                          )}
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400">
                          <Zap className="w-5 h-5" />
                        </div>
                      </div>
                      {tempKey && !tempKey.startsWith('AIza') && (
                        <div className="mt-2 p-2 bg-amber-100 border border-amber-200 rounded-lg">
                          <p className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" />
                            Format Warning:
                          </p>
                          <p className="text-[9px] text-amber-700 leading-tight mt-0.5">
                            This looks like a Project ID (e.g., "gen-lang-client..."). The API Key should start with <span className="font-bold underline">AIza</span> and be much longer.
                          </p>
                        </div>
                      )}
                      <p className="text-[10px] text-indigo-600/70 leading-relaxed italic">
                        * Note: Go to Google AI Studio, click "Get API key", then click "Copy" on the key itself (not the project name).
                      </p>
                    </div>
                  </div>

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold">
                      <span className="bg-white px-3 text-slate-300 tracking-widest">OR</span>
                    </div>
                  </div>

                  {/* Option 2: Paid Account */}
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Option 2: Paid Account
                    </h3>
                    <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                      Connect directly if you have a <span className="font-bold">Paid Google Cloud Project</span> with billing enabled for real-time search data.
                    </p>
                    
                    {window.aistudio && (
                      <button 
                        onClick={handleConnectPlatform}
                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Connect Paid AI Studio
                      </button>
                    )}
                    
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-100 rounded-lg">
                      <p className="text-[9px] text-amber-700 leading-tight">
                        ⚠️ If you see a "No Paid Project" error after clicking this, please use <span className="font-bold">Option 1</span> instead.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-500" />
                      Deployment Instructions
                    </h3>
                    <div className="space-y-3 text-xs text-slate-600">
                      <div>
                        <p className="font-bold text-slate-800">Netlify / Vercel:</p>
                        <p>Add environment variable <code className="bg-slate-200 px-1 rounded">GEMINI_API_KEY</code> in your dashboard and re-deploy.</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">GitHub Pages:</p>
                        <p>Add a Repository Secret named <code className="bg-slate-200 px-1 rounded">GEMINI_API_KEY</code> and update your Actions workflow.</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Local Development:</p>
                        <p>Create a <code className="bg-slate-200 px-1 rounded">.env</code> file in the root with <code className="bg-slate-200 px-1 rounded">GEMINI_API_KEY=your_key</code>.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer - Sticky */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowKeyModal(false)}
                    className="flex-1 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveApiKey}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all text-sm"
                  >
                    Save Key
                  </button>
                </div>
                <div className="mt-4 text-center">
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-indigo-600 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    Get a free API key from Google AI Studio <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Keyword Insights Pro</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-4 text-sm font-medium text-slate-500">
              <span>Powered by Gemini Search</span>
            </div>
            <button 
              onClick={() => setShowKeyModal(true)}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all relative"
              title="Settings"
            >
              <Zap className={cn("w-5 h-5", isApiKeyMissing() && !hasPlatformKey && "text-amber-500 animate-pulse")} />
              {isApiKeyMissing() && !hasPlatformKey && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-200 p-1 rounded-2xl flex flex-wrap justify-center gap-1">
            <button
              onClick={() => { setMode('search'); setError(null); }}
              className={cn(
                "px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                mode === 'search' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Search className="w-4 h-4" />
              Keyword Analysis
            </button>
            <button
              onClick={() => { setMode('trending'); setError(null); }}
              className={cn(
                "px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                mode === 'trending' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Globe className="w-4 h-4" />
              Trending Discovery
            </button>
            <button
              onClick={() => { setMode('youtube'); setError(null); }}
              className={cn(
                "px-4 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                mode === 'youtube' ? "bg-white text-red-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Youtube className="w-4 h-4" />
              YouTube Hot 10
            </button>
          </div>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto text-center mb-12">
          <motion.h2 
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight"
          >
            {mode === 'search' ? 'Unlock Keyword Potential' : mode === 'trending' ? 'Discover Local Trends' : 'YouTube Niche Hot 10'}
          </motion.h2>
          <motion.p 
            key={`${mode}-p`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 mb-8"
          >
            {mode === 'search' 
              ? 'Get real-time search volumes, geographic trends, and related insights for any keyword.'
              : mode === 'trending'
              ? 'Find out what people are searching for in your specific city, state, or country.'
              : 'Find the top 10 high-potential keywords and video ideas for your specific YouTube niche.'}
          </motion.p>

          {mode === 'search' ? (
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Keyword (e.g., 'AI tools')"
                  className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div className="relative flex-1 group sm:max-w-[200px]">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location (Global)"
                  className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze'}
              </button>
            </form>
          ) : mode === 'trending' ? (
            <form onSubmit={handleTrendingSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter a location (e.g., 'London', 'California', 'Nigeria')"
                className="block w-full pl-11 pr-32 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={loading || !location.trim()}
                className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Discover'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleYouTubeSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <PlayCircle className="h-5 w-5 text-slate-400 group-focus-within:text-red-500 transition-colors" />
              </div>
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Enter a niche (e.g., 'Tech Reviews', 'Cooking', 'Gaming')"
                className="block w-full pl-11 pr-32 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={loading || !niche.trim()}
                className="absolute right-2 top-2 bottom-2 px-6 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find Hot 10'}
              </button>
            </form>
          )}

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-sm text-red-500 font-medium"
            >
              {error}
            </motion.p>
          )}
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <p className="mt-6 text-slate-600 font-medium animate-pulse">{loadingMessage}</p>
              <p className="mt-2 text-xs text-slate-400">This may take a few seconds as we fetch live data from Google Search.</p>
            </motion.div>
          ) : data ? (
            <motion.div 
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Header with Export */}
              <div className="lg:col-span-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-slate-900">Analysis for "{data.keyword}"</h3>
                    {data.isEstimated && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
                        ESTIMATED DATA
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500">
                    {data.isEstimated 
                      ? "Insights based on AI training data (Real-time search unavailable with free key)." 
                      : "Comprehensive search and platform insights."}
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={exportToCSV}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button 
                    onClick={exportToJSON}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <FileJson className="w-4 h-4" />
                    JSON
                  </button>
                </div>
              </div>

              {/* Summary & Key Stats */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="stat-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="stat-label">Avg. Monthly Searches</span>
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="stat-value">
                    {Math.round(data.monthlySearches.reduce((acc, curr) => acc + curr.volume, 0) / data.monthlySearches.length).toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Based on last 12 months</p>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="stat-label">Top 3 Locations (Asc)</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    {data.topLocations
                      .sort((a, b) => a.volume - b.volume)
                      .slice(0, 3)
                      .map((loc, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-slate-700 font-medium truncate max-w-[100px]">{loc.location}</span>
                          <span className="text-slate-500 font-bold">{loc.volume.toLocaleString()}</span>
                        </div>
                      ))}
                    {data.topLocations.length === 0 && (
                      <div className="text-xs text-slate-400 italic">No location data</div>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Sorted by volume ascending</p>
                </div>

                <div className="stat-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="stat-label">Peak Month</span>
                    <Calendar className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="stat-value">
                    {data.highestSearchMonth.month}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {data.highestSearchMonth.volume.toLocaleString()} searches
                  </p>
                </div>

                <div className="stat-card bg-indigo-600 border-indigo-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="stat-label text-indigo-100">Trend Status</span>
                    <TrendingUp className="w-4 h-4 text-indigo-100" />
                  </div>
                  <div className="stat-value text-white">
                    {data.monthlySearches[data.monthlySearches.length - 1].volume > data.monthlySearches[0].volume ? 'Growing' : 'Stable'}
                  </div>
                  <p className="text-xs text-indigo-200 mt-1">Year-over-year comparison</p>
                </div>
              </div>

              {/* Main Chart */}
              <div className="lg:col-span-2 glass-card p-6">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Search Volume Trend</h3>
                    <p className="text-sm text-slate-500">Monthly breakdown for "{data.keyword}"</p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                    <button className="px-3 py-1 text-xs font-semibold bg-white rounded-md shadow-sm text-slate-900">Last 12 Months</button>
                  </div>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.monthlySearches}>
                      <defs>
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          borderRadius: '12px', 
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="volume" 
                        stroke="#4f46e5" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorVolume)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Related Keywords & Platform Usage */}
              <div className="space-y-6">
                {/* Platform Usage */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Platform Popularity</h3>
                  <p className="text-sm text-slate-500 mb-6">Engagement across social channels</p>
                  
                  <div className="space-y-5">
                    {[
                      { name: 'YouTube', score: data.platformUsage.youtube, icon: Youtube, color: 'bg-red-500' },
                      { name: 'Pinterest', score: data.platformUsage.pinterest, icon: ImageIcon, color: 'bg-rose-600' },
                      { name: 'TikTok', score: data.platformUsage.tiktok, icon: Video, color: 'bg-slate-900' },
                    ].map((platform) => (
                      <div key={platform.name} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <platform.icon className="w-4 h-4 text-slate-500" />
                            <span className="font-semibold text-slate-700">{platform.name}</span>
                          </div>
                          <span className="text-slate-500 font-medium">{platform.score}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${platform.score}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={cn("h-full rounded-full", platform.color)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Related Keywords */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Related Keywords</h3>
                  <p className="text-sm text-slate-500 mb-6">Opportunities for expansion</p>
                  
                  <div className="space-y-4">
                    {data.relatedKeywords.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer group"
                        onClick={() => {
                          setQuery(item.keyword);
                          handleSearch();
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.keyword}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-slate-500">{item.volume.toLocaleString()} searches/mo</p>
                              <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-md border font-bold flex items-center gap-1",
                                getCompetitionColor(item.competition)
                              )}>
                                {getCompetitionIcon(item.competition)}
                                {item.competition} Comp.
                              </span>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alternative Suggestions */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Alternative Angles</h3>
                  <p className="text-sm text-slate-500 mb-6">Complementary search terms</p>
                  
                  <div className="space-y-4">
                    {data.alternativeKeywords.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 rounded-xl bg-indigo-50/30 border border-indigo-100/50 hover:border-indigo-300 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-400" />
                            <div>
                              <p className="text-sm font-bold text-slate-900">{item.keyword}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[10px] text-slate-500">{item.volume.toLocaleString()} searches/mo</p>
                                <span className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded-md border font-bold flex items-center gap-1",
                                  getCompetitionColor(item.competition)
                                )}>
                                  {getCompetitionIcon(item.competition)}
                                  {item.competition} Comp.
                                </span>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              setQuery(item.keyword);
                              handleSearch();
                            }}
                            className="p-1.5 bg-white rounded-lg border border-slate-200 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                            title="Search this keyword"
                          >
                            <Search className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed italic">
                          "{item.reason}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="lg:col-span-3 glass-card p-6 bg-indigo-50/50 border-indigo-100">
                <div className="flex items-start gap-4">
                  <div className="bg-indigo-100 p-2 rounded-xl">
                    <Info className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Market Insight</h3>
                    <p className="text-slate-700 leading-relaxed">
                      {data.summary}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : trendingData ? (
            <motion.div 
              key="trending-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <div className="md:col-span-2 lg:col-span-3 mb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-amber-500" />
                    Trending in {location}
                  </h3>
                  <p className="text-slate-500">High-growth keywords currently ranking in this area.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={exportToCSV}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button 
                    onClick={exportToJSON}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <FileJson className="w-4 h-4" />
                    JSON
                  </button>
                </div>
              </div>
              
              {trendingData.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card p-6 flex flex-col h-full"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded-lg">
                      #{idx + 1}
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-1 rounded-lg border font-bold flex items-center gap-1",
                      getCompetitionColor(item.competition)
                    )}>
                      {getCompetitionIcon(item.competition)}
                      {item.competition} Competition
                    </span>
                  </div>
                  
                  <h4 className="text-xl font-bold text-slate-900 mb-1">{item.keyword}</h4>
                  <p className="text-sm font-medium text-indigo-600 mb-4">
                    ~{item.volume.toLocaleString()} searches / month
                  </p>
                  
                  <p className="text-sm text-slate-600 mb-6 flex-grow italic">
                    "{item.reason}"
                  </p>
                  
                  <div className="mt-auto border-t border-slate-100 pt-4">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-3">Related Suggestions</p>
                    <div className="flex flex-wrap gap-2">
                      {item.relatedKeywords.map((rel, rIdx) => (
                        <button 
                          key={rIdx}
                          onClick={() => {
                            setQuery(rel);
                            setMode('search');
                            handleSearch();
                          }}
                          className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all"
                        >
                          {rel}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : youtubeData ? (
            <motion.div 
              key="youtube-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="md:col-span-2 mb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Youtube className="w-6 h-6 text-red-600" />
                    YouTube Hot 10: {niche}
                  </h3>
                  <p className="text-slate-500">High-potential keywords and video ideas for your niche.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="hidden sm:flex items-center gap-2 bg-red-50 px-3 py-1 rounded-full border border-red-100 mr-2">
                    <Sparkles className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-bold text-red-700 uppercase tracking-wider">Creator Insights</span>
                  </div>
                  <button 
                    onClick={exportToCSV}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button 
                    onClick={exportToJSON}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <FileJson className="w-4 h-4" />
                    JSON
                  </button>
                </div>
              </div>
              
              {youtubeData.map((item, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-card p-6 flex flex-col border-l-4 border-l-red-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-lg">
                        #{idx + 1}
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.potential}</span>
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-1 rounded-lg border font-bold flex items-center gap-1",
                      getCompetitionColor(item.competition)
                    )}>
                      {getCompetitionIcon(item.competition)}
                      {item.competition} Comp.
                    </span>
                  </div>
                  
                  <h4 className="text-xl font-bold text-slate-900 mb-1">{item.keyword}</h4>
                  <p className="text-sm font-medium text-red-600 mb-6">
                    ~{item.searchVolume.toLocaleString()} YouTube searches / mo
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Lightbulb className="w-4 h-4" />
                      <p className="text-[10px] uppercase tracking-wider font-bold">Video Title Ideas</p>
                    </div>
                    {item.videoIdeas.map((idea, iIdx) => (
                      <div key={iIdx} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-red-200 transition-colors group">
                        <div className="text-red-400 font-mono text-xs mt-0.5">{iIdx + 1}.</div>
                        <p className="text-sm text-slate-700 font-medium leading-tight group-hover:text-slate-900">{idea}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                    <button 
                      onClick={() => {
                        setQuery(item.keyword);
                        setMode('search');
                        handleSearch();
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
                    >
                      Full Analysis <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Keyword Analyzed Yet</h3>
              <p className="text-slate-500 max-w-sm">
                Enter a keyword above to see search volumes, geographic data, and trends.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
