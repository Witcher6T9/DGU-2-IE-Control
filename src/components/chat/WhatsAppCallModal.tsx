/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  SwitchCamera,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { ChatUserMember, ChatChannel } from '../../types';
import { whatsAppAudio } from '../../utils/whatsappAudio';

interface WhatsAppCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: ChatUserMember | null;
  channel?: ChatChannel | null;
  isVideo?: boolean;
}

export const WhatsAppCallModal: React.FC<WhatsAppCallModalProps> = ({
  isOpen,
  onClose,
  contact,
  channel,
  isVideo = false
}) => {
  const [callState, setCallState] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(isVideo);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  // Play ringing sound on start, then switch to 'connected' after 3.5s
  useEffect(() => {
    if (!isOpen) {
      setCallState('ringing');
      setDuration(0);
      whatsAppAudio.stopCallingTone();
      return;
    }

    setCallState('ringing');
    whatsAppAudio.startCallingTone();

    const connectTimeout = setTimeout(() => {
      whatsAppAudio.stopCallingTone();
      setCallState('connected');
    }, 3800);

    return () => {
      clearTimeout(connectTimeout);
      whatsAppAudio.stopCallingTone();
    };
  }, [isOpen]);

  // Duration timer when connected
  useEffect(() => {
    let timer: any = null;
    if (isOpen && callState === 'connected') {
      timer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, callState]);

  if (!isOpen) return null;

  const title = contact?.name || channel?.name || 'IE Shop Floor Contact';
  const subtitle = contact?.role || channel?.description || 'Floor Management & IE';
  const avatar = contact?.avatar;

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  const handleEndCall = () => {
    whatsAppAudio.stopCallingTone();
    setCallState('ended');
    setTimeout(() => {
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md sm:max-w-lg h-[540px] sm:h-[620px] rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between bg-gradient-to-b from-[#111b21] via-[#0b141a] to-[#0b141a] text-white border border-white/10">
        {/* Top Header */}
        <div className="p-4 sm:p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>End-to-end encrypted</span>
          </div>

          <div className="text-xs text-[#aebac1] font-mono">
            {callState === 'ringing' ? (
              <span className="text-amber-400 animate-pulse font-bold">Ringing...</span>
            ) : callState === 'connected' ? (
              <span className="text-emerald-400 font-bold">{formatCallTime(duration)}</span>
            ) : (
              <span className="text-rose-400">Call Ended</span>
            )}
          </div>
        </div>

        {/* Center Video Stream or Avatar Screen */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 z-10">
          {isVideoEnabled && callState === 'connected' ? (
            <div className="relative w-full h-full max-h-[360px] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center">
              {/* Simulated Remote Camera Stream */}
              <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-teal-950 to-slate-800 flex items-center justify-center">
                <div className="text-center p-6 space-y-3">
                  <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-2 border-emerald-400 shadow-xl">
                    {avatar ? (
                      <img src={avatar} alt={title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-[#128c7e] text-white flex items-center justify-center text-3xl font-bold">
                        {title.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-white">{title}</h3>
                  <p className="text-xs text-emerald-300">Live Shop-Floor Video Stream Active</p>
                </div>
              </div>

              {/* Self Picture-in-Picture window */}
              <div className="absolute bottom-3 right-3 w-28 h-36 rounded-xl overflow-hidden bg-black/80 border-2 border-white/30 shadow-lg flex items-center justify-center">
                <div className="text-center p-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs mx-auto mb-1">
                    You
                  </div>
                  <span className="text-[9px] text-white/70 block">Front Camera</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              {/* Animated Ringing Avatar Ring */}
              <div className="relative mx-auto w-28 h-28 sm:w-36 sm:h-36">
                {callState === 'ringing' && (
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/40 animate-ping" />
                )}
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-emerald-500/80 shadow-2xl bg-slate-800">
                  {avatar ? (
                    <img src={avatar} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#075e54] text-white flex items-center justify-center text-4xl font-bold">
                      {title.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">{title}</h2>
                <p className="text-xs text-[#8696a0] mt-1">{subtitle}</p>
              </div>

              <div className="text-sm font-semibold tracking-wider">
                {callState === 'ringing' ? (
                  <span className="text-emerald-400">WhatsApp Calling...</span>
                ) : callState === 'connected' ? (
                  <span className="text-slate-300">WhatsApp Voice Call</span>
                ) : (
                  <span className="text-rose-400">Call Ended</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Control Actions (Classic WhatsApp Call Controls) */}
        <div className="p-6 bg-gradient-to-t from-black/80 to-transparent z-10">
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            {/* Speaker Toggle */}
            <button
              type="button"
              onClick={() => setIsSpeakerOn(prev => !prev)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isSpeakerOn ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white/10 text-white/50'
              }`}
              title={isSpeakerOn ? 'Speaker ON' : 'Speaker OFF'}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Video Toggle */}
            <button
              type="button"
              onClick={() => setIsVideoEnabled(prev => !prev)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isVideoEnabled ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white/10 text-white/50'
              }`}
              title={isVideoEnabled ? 'Camera ON' : 'Camera OFF'}
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            {/* Mute Mic */}
            <button
              type="button"
              onClick={() => setIsMuted(prev => !prev)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isMuted ? 'bg-rose-500/80 text-white' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Flip Camera (if video active) */}
            {isVideoEnabled && (
              <button
                type="button"
                onClick={() => setIsFrontCamera(prev => !prev)}
                className="w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-all cursor-pointer"
                title="Flip Camera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            )}

            {/* End Call Button (Big Red Circle) */}
            <button
              type="button"
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-90 text-white flex items-center justify-center shadow-lg transition-all cursor-pointer ml-2"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
