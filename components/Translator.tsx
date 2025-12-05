import React, { useState, useRef, useEffect } from 'react';
import { Mail, MessageSquare, MessageCircle, Send, Eraser, Loader2, AlertCircle } from 'lucide-react';
import { generateRewrites } from '../services/geminiService.ts';
import { ResultCard } from './ResultCard.tsx';
import { TranslationResult } from '../types.ts';

export const Translator: React.FC = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Focus textarea on mount
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleTranslate = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null); // Clear previous results to show loading skeletons

    try {
      const data = await generateRewrites(input);
      setResult(data);
    } catch (err) {
      console.error(err);
      if (err instanceof Error) {
        // Show specific error message for debugging
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setResult(null);
    setError(null);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleTranslate();
    }
  };

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-1">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type text here to rewrite (e.g., 'I am running late for the meeting, please start without me.')"
            className="w-full min-h-[160px] p-6 text-lg text-slate-800 placeholder:text-slate-400 focus:outline-none rounded-xl resize-y bg-white"
            disabled={loading}
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-3">
             {input && (
                <button
                  onClick={handleClear}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  title="Clear text"
                  disabled={loading}
                >
                  <Eraser size={20} />
                </button>
             )}
             <button
              onClick={handleTranslate}
              disabled={loading || !input.trim()}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-white shadow-md transition-all
                ${loading || !input.trim() 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-95'
                }
              `}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Rewriting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Rewrite
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              {error.includes("API_KEY") && (
                <div className="mt-3 bg-white p-3 rounded border border-red-200">
                  <p className="font-bold text-xs text-slate-700">How to fix:</p>
                  <ul className="list-disc pl-4 mt-1 text-xs text-slate-600 space-y-1">
                    <li><strong>Vercel:</strong> Go to Project Settings &gt; Environment Variables. Key: <code>API_KEY</code>, Value: Your Gemini Key. Redeploy your project.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ResultCard
          title="Email"
          content={result?.email || ''}
          icon={<Mail size={18} />}
          colorClass="bg-indigo-500"
          isLoading={loading}
          delay={0}
        />
        <ResultCard
          title="SMS"
          content={result?.sms || ''}
          icon={<MessageSquare size={18} />}
          colorClass="bg-pink-500"
          isLoading={loading}
          delay={100}
        />
        <ResultCard
          title="WhatsApp"
          content={result?.whatsapp || ''}
          icon={<MessageCircle size={18} />}
          colorClass="bg-green-500"
          isLoading={loading}
          delay={200}
        />
      </div>
    </div>
  );
};