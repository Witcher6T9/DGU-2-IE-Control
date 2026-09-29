/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Smile, ThumbsUp, Heart, Wrench, Sparkles, X } from 'lucide-react';

interface WhatsAppEmojiDrawerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😎', '🤓', '🧐', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '🥱', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '😡', '😠', '🤬', '😷', '🤒', '🤕']
  },
  {
    id: 'gestures',
    name: 'Gestures',
    icon: ThumbsUp,
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '💪', '👏', '🙌', '👐', '🤲', '🙏', '✍️', '💅', '🤳']
  },
  {
    id: 'factory',
    name: 'IE & Floor',
    icon: Wrench,
    emojis: ['⏱️', '📊', '📈', '📉', '🧵', '🪡', '✂️', '📏', '📐', '🔧', '🔨', '⚙️', '⚡', '🏭', '📋', '📁', '📦', '🏷️', '🚨', '⚠️', '🎯', '✅', '❌', '💡', '🔥', '🏆', '🥇', '🥈', '🥉', '🔔', '📢']
  },
  {
    id: 'hearts',
    name: 'Hearts',
    icon: Heart,
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '⭐', '🌟', '💫', '💥', '💯']
  }
];

export const WhatsAppEmojiDrawer: React.FC<WhatsAppEmojiDrawerProps> = ({
  onSelectEmoji,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState('smileys');

  const currentCategory = EMOJI_CATEGORIES.find(c => c.id === activeTab) || EMOJI_CATEGORIES[0];

  return (
    <div className="absolute bottom-16 left-3 sm:left-4 z-40 w-72 sm:w-84 h-72 rounded-2xl bg-white shadow-2xl border border-[#d1d7db] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
      {/* Category Tabs */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#f0f2f5] border-b border-[#e9edef]">
        <div className="flex items-center gap-1">
          {EMOJI_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isActive ? 'bg-[#00a884] text-white shadow-xs' : 'text-[#54656f] hover:bg-[#e9edef]'
                }`}
                title={cat.name}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-[#54656f] hover:bg-[#e9edef] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Emoji Grid */}
      <div className="flex-1 p-3 overflow-y-auto">
        <span className="text-[10px] font-bold text-[#54656f] uppercase block mb-1.5">
          {currentCategory.name}
        </span>
        <div className="grid grid-cols-7 gap-1 text-xl sm:text-2xl text-center select-none">
          {currentCategory.emojis.map((emoji, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectEmoji(emoji)}
              className="p-1 rounded-lg hover:bg-[#f0f2f5] transition-transform active:scale-125 cursor-pointer flex items-center justify-center"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
