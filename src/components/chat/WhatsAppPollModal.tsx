/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Plus, Trash2, BarChart2 } from 'lucide-react';

interface WhatsAppPollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPoll: (question: string, options: string[]) => void;
}

export const WhatsAppPollModal: React.FC<WhatsAppPollModalProps> = ({
  isOpen,
  onClose,
  onSubmitPoll
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions(prev => [...prev, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    setOptions(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuestion = question.trim();
    const cleanOptions = options.map(o => o.trim()).filter(Boolean);

    if (!cleanQuestion || cleanOptions.length < 2) return;

    onSubmitPoll(cleanQuestion, cleanOptions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#d1d7db] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e9edef]">
          <div className="flex items-center gap-2 text-[#008069]">
            <BarChart2 className="w-5 h-5" />
            <h3 className="font-bold text-base text-[#111b21]">Create Shop-Floor Poll</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#54656f] hover:bg-[#f0f2f5] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#54656f] mb-1">
              Poll Question
            </label>
            <input
              type="text"
              required
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. Approve 45 min overtime on Line 18 today?"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#f0f2f5] border border-transparent focus:border-[#00a884] focus:bg-white text-xs text-[#111b21] focus:outline-hidden transition-all"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase text-[#54656f]">
              Options (2 to 5)
            </label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={opt}
                  onChange={e => handleOptionChange(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#f0f2f5] border border-transparent focus:border-[#00a884] focus:bg-white text-xs text-[#111b21] focus:outline-hidden"
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(idx)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {options.length < 5 && (
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center gap-1.5 text-xs font-bold text-[#008069] hover:underline pt-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Option</span>
              </button>
            )}
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#e9edef]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#54656f] hover:bg-[#f0f2f5] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#008069] hover:bg-[#00705c] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Send Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
