import React from 'react';
import { Translator } from './components/Translator.tsx';
import { Sparkles, Zap } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-md">
              <Zap size={20} fill="currentColor" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">FastFormat AI</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100 flex items-center gap-1">
              <Sparkles size={12} />
              Gemini Flash Lite
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Instant Content Rewriter
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Rewrite your text instantly for <span className="font-semibold text-indigo-600">Email</span>, <span className="font-semibold text-pink-600">SMS</span>, and <span className="font-semibold text-green-600">WhatsApp</span> with professional audio.
            </p>
          </div>
          
          <Translator />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} FastFormat AI. Powered by Google Gemini.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;