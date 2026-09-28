/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileText, Image, BarChart2, AlertTriangle, UserCheck, X } from 'lucide-react';

interface WhatsAppAttachMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachDocument: () => void;
  onAttachPhoto: () => void;
  onOpenPoll: () => void;
  onAttachAlert: () => void;
  onShareContact: () => void;
}

export const WhatsAppAttachMenu: React.FC<WhatsAppAttachMenuProps> = ({
  isOpen,
  onClose,
  onAttachDocument,
  onAttachPhoto,
  onOpenPoll,
  onAttachAlert,
  onShareContact
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-16 left-12 sm:left-14 z-40 p-2.5 rounded-2xl bg-white shadow-2xl border border-[#d1d7db] flex flex-col gap-1.5 animate-in fade-in zoom-in-95 w-48">
      {/* Document */}
      <button
        type="button"
        onClick={() => {
          onAttachDocument();
          onClose();
        }}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#f0f2f5] transition-colors cursor-pointer text-left"
      >
        <div className="w-8 h-8 rounded-full bg-[#515836] text-white flex items-center justify-center shrink-0 shadow-xs">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-[#111b21] block leading-tight">Document</span>
          <span className="text-[10px] text-[#667781] block">IE Spec & Excel</span>
        </div>
      </button>

      {/* Photos & Videos */}
      <button
        type="button"
        onClick={() => {
          onAttachPhoto();
          onClose();
        }}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#f0f2f5] transition-colors cursor-pointer text-left"
      >
        <div className="w-8 h-8 rounded-full bg-[#ac44cf] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Image className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-[#111b21] block leading-tight">Photos & Videos</span>
          <span className="text-[10px] text-[#667781] block">Floor snapshot</span>
        </div>
      </button>

      {/* Poll */}
      <button
        type="button"
        onClick={() => {
          onOpenPoll();
          onClose();
        }}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#f0f2f5] transition-colors cursor-pointer text-left"
      >
        <div className="w-8 h-8 rounded-full bg-[#008069] text-white flex items-center justify-center shrink-0 shadow-xs">
          <BarChart2 className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-[#111b21] block leading-tight">Poll</span>
          <span className="text-[10px] text-[#667781] block">Vote on Line Decision</span>
        </div>
      </button>

      {/* Quick Alert */}
      <button
        type="button"
        onClick={() => {
          onAttachAlert();
          onClose();
        }}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#f0f2f5] transition-colors cursor-pointer text-left"
      >
        <div className="w-8 h-8 rounded-full bg-[#e542a3] text-white flex items-center justify-center shrink-0 shadow-xs">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-[#111b21] block leading-tight">Floor Alert</span>
          <span className="text-[10px] text-[#667781] block">Bottleneck / Stoppage</span>
        </div>
      </button>

      {/* Contact */}
      <button
        type="button"
        onClick={() => {
          onShareContact();
          onClose();
        }}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#f0f2f5] transition-colors cursor-pointer text-left"
      >
        <div className="w-8 h-8 rounded-full bg-[#007bfc] text-white flex items-center justify-center shrink-0 shadow-xs">
          <UserCheck className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-[#111b21] block leading-tight">Contact</span>
          <span className="text-[10px] text-[#667781] block">Share Engineer Card</span>
        </div>
      </button>
    </div>
  );
};
