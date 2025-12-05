import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check, Share2, Play, Download, Square, Loader2 } from 'lucide-react';
import { ResultCardProps } from '../types';
import { generateAudio } from '../services/geminiService';

export const ResultCard: React.FC<ResultCardProps> = ({ 
  title, 
  content, 
  icon, 
  colorClass, 
  isLoading,
  delay
}) => {
  const [copied, setCopied] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Cleanup audio URL when content changes or component unmounts
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsPlaying(false);
  }, [content]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onpause = () => setIsPlaying(false);
      audioRef.current.onplay = () => setIsPlaying(true);
    }
  }, [audioRef.current]);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleShare = async () => {
    if (!content) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `FastFormat - ${title}`,
          text: content,
        });
      } catch (err) {
        console.log('Share skipped', err);
      }
    } else {
      handleCopy();
    }
  };

  const handlePlayAudio = async () => {
    if (!content) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    // If we already have the audio, play it
    if (audioUrl && audioRef.current) {
      try {
        await audioRef.current.play();
      } catch (e) {
        console.error("Playback error", e);
      }
      return;
    }

    // Otherwise generate it
    setIsGeneratingAudio(true);
    try {
      const url = await generateAudio(content);
      setAudioUrl(url);
      
      // Need a slight delay to let the audio element update with the new src
      setTimeout(async () => {
        if (audioRef.current) {
          try {
            await audioRef.current.play();
          } catch (e) {
            console.error("Playback error after generation", e);
          }
        }
      }, 50);
    } catch (err) {
      console.error("Failed to generate audio", err);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full transition-all duration-500 ease-out transform ${isLoading ? 'opacity-50' : 'opacity-100 translate-y-0'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`px-4 py-3 border-b border-slate-100 flex items-center justify-between ${colorClass} bg-opacity-10`}>
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${colorClass} text-white`}>
            {icon}
          </div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
        {content && (
          <div className="flex items-center gap-1">
             {/* Hidden Audio Element */}
             <audio ref={audioRef} src={audioUrl || undefined} />

             {/* Play Button */}
             <button
               onClick={handlePlayAudio}
               disabled={isGeneratingAudio}
               className={`p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors ${isPlaying ? 'text-indigo-600 bg-indigo-50' : ''}`}
               title={isPlaying ? "Stop" : "Read aloud (Kore)"}
             >
               {isGeneratingAudio ? (
                 <Loader2 size={16} className="animate-spin text-indigo-500" />
               ) : isPlaying ? (
                 <Square size={16} fill="currentColor" />
               ) : (
                 <Play size={16} fill="currentColor" />
               )}
             </button>

             {/* Download Button */}
             {audioUrl && (
               <a
                 href={audioUrl}
                 download={`${title.toLowerCase()}-audio.wav`}
                 className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                 title="Download Audio"
               >
                 <Download size={16} />
               </a>
             )}
          </div>
        )}
      </div>
      
      <div className="p-5 flex-grow relative min-h-[160px]">
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-100 rounded w-3/4"></div>
            <div className="h-4 bg-slate-100 rounded w-1/2"></div>
            <div className="h-4 bg-slate-100 rounded w-5/6"></div>
          </div>
        ) : content ? (
          <p className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap font-medium">
            {content}
          </p>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">
            Waiting for input...
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
         {content && (
           <>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Share"
            >
              <Share2 size={16} />
            </button>
           </>
         )}
      </div>
    </div>
  );
};