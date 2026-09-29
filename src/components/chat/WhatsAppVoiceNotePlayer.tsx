/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

interface WhatsAppVoiceNotePlayerProps {
  durationSec: number;
  wavePeaks?: number[];
  senderAvatar?: string;
  isSelf?: boolean;
}

export const WhatsAppVoiceNotePlayer: React.FC<WhatsAppVoiceNotePlayerProps> = ({
  durationSec = 18,
  wavePeaks,
  senderAvatar,
  isSelf = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const animationRef = useRef<any>(null);

  // Generate standard WhatsApp waveform heights if none provided
  const peaks = wavePeaks || [
    30, 45, 70, 90, 60, 40, 20, 50, 85, 100, 75, 45, 30, 60, 80, 95, 70, 50,
    35, 65, 85, 60, 40, 55, 75, 90, 65, 40, 25, 45, 70, 80, 50, 30, 20
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const toggleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaybackRate(prev => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
  };

  useEffect(() => {
    if (isPlaying) {
      const stepDuration = 100; // ms
      const increment = (stepDuration / 1000 / durationSec) * playbackRate;

      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev + increment >= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev + increment;
        });
      }, stepDuration);

      return () => clearInterval(timer);
    }
  }, [isPlaying, durationSec, playbackRate]);

  const currentSeconds = Math.floor(progress * durationSec);

  return (
    <div className="flex items-center gap-3 py-1 px-1 min-w-[240px] sm:min-w-[280px]">
      {/* Avatar with Mic Indicator */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-black/10 bg-slate-200">
          {senderAvatar ? (
            <img src={senderAvatar} alt="Sender" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-xs">
              IE
            </div>
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#25d366] text-white flex items-center justify-center shadow-xs">
          <Mic className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90 cursor-pointer shadow-xs ${
          isSelf
            ? 'bg-[#00a884] text-white hover:bg-[#008f6f]'
            : 'bg-[#25d366] text-white hover:bg-[#1faa53]'
        }`}
        title={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-white" />
        ) : (
          <Play className="w-4 h-4 fill-white ml-0.5" />
        )}
      </button>

      {/* Waveform and Timer */}
      <div className="flex-1 flex flex-col justify-center gap-1">
        <div
          className="flex items-center gap-[2px] h-6 cursor-pointer"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            setProgress(Math.max(0, Math.min(1, clickPos)));
          }}
        >
          {peaks.map((height, idx) => {
            const barPos = idx / peaks.length;
            const isPlayed = barPos <= progress;

            return (
              <div
                key={idx}
                style={{ height: `${Math.max(15, height * 0.24)}px` }}
                className={`w-[3px] rounded-full transition-colors ${
                  isPlayed
                    ? isSelf
                      ? 'bg-[#00a884]'
                      : 'bg-[#34b7f1]'
                    : isSelf
                    ? 'bg-[#aebac1]/60'
                    : 'bg-[#aebac1]/70'
                }`}
              />
            );
          })}
        </div>

        {/* Duration & Speed */}
        <div className="flex items-center justify-between text-[11px] text-[#667781] font-mono leading-none">
          <span>{isPlaying ? formatTime(currentSeconds) : formatTime(durationSec)}</span>
          <button
            type="button"
            onClick={toggleSpeed}
            className="px-1.5 py-0.5 rounded-full bg-black/5 hover:bg-black/10 text-[10px] font-bold text-[#111b21] transition-colors"
            title="Toggle playback speed"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};
