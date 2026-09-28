/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Send, Eye, Plus, Sparkles } from 'lucide-react';
import { WhatsAppStatusStory, UserProfile } from '../../types';

interface WhatsAppStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: WhatsAppStatusStory[];
  initialIndex?: number;
  onSendStatusReply: (authorName: string, replyText: string) => void;
  onAddStatus?: (story: WhatsAppStatusStory) => void;
  profile: UserProfile;
}

export const WhatsAppStatusModal: React.FC<WhatsAppStatusModalProps> = ({
  isOpen,
  onClose,
  stories,
  initialIndex = 0,
  onSendStatusReply,
  onAddStatus,
  profile
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newStatusCaption, setNewStatusCaption] = useState('');
  const [newStatusBg, setNewStatusBg] = useState('#075e54');

  const STORY_DURATION = 5000; // 5 seconds per story

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex, isOpen]);

  // Auto-advance timer
  useEffect(() => {
    if (!isOpen || isPaused || isCreateOpen || stories.length === 0) return;

    const intervalTime = 50; // ms
    const step = (intervalTime / STORY_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev + step >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(c => c + 1);
            return 0;
          } else {
            onClose();
            return 0;
          }
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isOpen, currentIndex, isPaused, isCreateOpen, stories.length, onClose]);

  if (!isOpen || stories.length === 0) return null;

  const currentStory = stories[currentIndex] || stories[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onSendStatusReply(currentStory.authorName, replyText.trim());
    setReplyText('');
    onClose();
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusCaption.trim() || !onAddStatus) return;

    const newStory: WhatsAppStatusStory = {
      id: `status_${Date.now()}`,
      authorId: profile.email || 'self',
      authorName: profile.name || 'You',
      authorAvatar: profile.photoURL,
      authorRole: profile.jobTitle || 'Industrial Engineer',
      timestamp: 'Just now',
      caption: newStatusCaption.trim(),
      backgroundColor: newStatusBg,
      viewsCount: 1
    };

    onAddStatus(newStory);
    setNewStatusCaption('');
    setIsCreateOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div
        className="relative w-full max-w-sm sm:max-w-md h-[600px] sm:h-[680px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between select-none"
        style={{ backgroundColor: currentStory.backgroundColor || '#075e54' }}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Top Progress Bars */}
        <div className="p-3 sm:p-4 space-y-3 z-20 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-1.5 w-full">
            {stories.map((st, idx) => {
              let fillPct = 0;
              if (idx < currentIndex) fillPct = 100;
              else if (idx === currentIndex) fillPct = progress;

              return (
                <div key={st.id} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-75"
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Author Header */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/80 bg-slate-800">
                {currentStory.authorAvatar ? (
                  <img
                    src={currentStory.authorAvatar}
                    alt={currentStory.authorName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-sm bg-emerald-700">
                    {currentStory.authorName.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight">{currentStory.authorName}</h4>
                <p className="text-[11px] text-white/80 leading-tight">
                  {currentStory.authorRole} • {currentStory.timestamp}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                title="Post new factory status"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Center Story Content & Navigation Tap Areas */}
        <div className="flex-1 relative flex items-center justify-center px-6 text-center text-white z-10">
          {/* Left tap for previous */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1/4 cursor-pointer z-20 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity"
            onClick={handlePrev}
          >
            {currentIndex > 0 && (
              <div className="p-2 rounded-full bg-black/40 text-white">
                <ChevronLeft className="w-6 h-6" />
              </div>
            )}
          </div>

          {/* Center Story Caption */}
          <div className="max-w-xs space-y-4 animate-in zoom-in-95 duration-200">
            <p className="text-xl sm:text-2xl font-bold leading-relaxed drop-shadow-md">
              {currentStory.caption}
            </p>
          </div>

          {/* Right tap for next */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1/4 cursor-pointer z-20 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
            onClick={handleNext}
          >
            <div className="p-2 rounded-full bg-black/40 text-white">
              <ChevronRight className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Bottom Views Counter & Reply Input */}
        <div className="p-3 sm:p-4 z-20 bg-gradient-to-t from-black/70 via-black/40 to-transparent space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs text-white/80">
            <Eye className="w-3.5 h-3.5" />
            <span>{currentStory.viewsCount || 12} views</span>
          </div>

          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <input
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={`Reply to ${currentStory.authorName.split(' ')[0]}...`}
              className="flex-1 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white placeholder-white/70 text-xs border border-white/30 focus:outline-hidden focus:ring-1 focus:ring-white"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="p-2 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white transition-all cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Create Status Modal Popup */}
        {isCreateOpen && (
          <div className="absolute inset-0 z-30 bg-[#111b21] p-5 flex flex-col justify-between text-white animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-sm">Post Factory Status (24h)</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 my-auto">
              <textarea
                rows={4}
                value={newStatusCaption}
                onChange={e => setNewStatusCaption(e.target.value)}
                placeholder="Type your shop-floor status update (e.g. Line 18 rebalancing complete)..."
                className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-white/50 text-sm focus:outline-hidden focus:ring-1 focus:ring-emerald-400"
              />

              <div>
                <label className="block text-[11px] font-bold uppercase text-white/70 mb-2">
                  Card Theme
                </label>
                <div className="flex items-center gap-3">
                  {['#075e54', '#128c7e', '#25d366', '#d97706', '#dc2626', '#4338ca'].map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setNewStatusBg(col)}
                      style={{ backgroundColor: col }}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        newStatusBg === col ? 'border-white scale-110' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateSubmit}
              disabled={!newStatusCaption.trim()}
              className="w-full py-2.5 rounded-full bg-[#25d366] hover:bg-[#1faa53] text-[#111b21] font-bold text-xs disabled:opacity-40 transition-all cursor-pointer shadow-lg"
            >
              Share Status to Shop Floor
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
