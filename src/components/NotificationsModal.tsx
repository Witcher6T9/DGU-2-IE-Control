/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Trash2, 
  ArrowRight, 
  Layers, 
  FileSpreadsheet,
  Activity,
  Zap,
  CheckCheck,
  Check
} from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClearAll: () => void;
  onNavigate?: (tab: string, lineNo?: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onNavigate
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const urgentCount = notifications.filter(
    n => !n.read && (
      n.id.includes('wip-alert') || 
      n.title.toLowerCase().includes('wip') || 
      n.id.includes('bottleneck-alert') || 
      n.title.toLowerCase().includes('bottleneck')
    )
  ).length;

  const handleBulkResolve = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    } else {
      notifications.forEach(n => {
        if (!n.read) onMarkAsRead(n.id);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="bg-[#fbfaf6] border border-[#d9d2c2] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Bell className="w-5 h-5 text-[#176f78]" />
            <h3 className="font-display text-xl font-bold uppercase text-[#17343a]">
              Floor Alerts &amp; IE Notifications
            </h3>
            {urgentCount > 0 && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white tracking-wider animate-pulse">
                {urgentCount} Critical {urgentCount === 1 ? 'Alert' : 'Alerts'}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-[#e7e1d5] text-slate-500 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick action toolbar with Bulk Resolve */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#f1eee6]/80 border border-[#e7e1d5] text-xs gap-3">
            <div className="text-[11px] text-[#527078]">
              {unreadCount === 0 ? (
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <Check className="w-3.5 h-3.5" /> All alerts marked as resolved
                </span>
              ) : (
                <span>
                  <strong className="text-[#17343a] font-mono-numbers">{unreadCount}</strong> unread {unreadCount === 1 ? 'alert' : 'alerts'} pending review
                </span>
              )}
            </div>

            <button
              type="button"
              id="notifications-bulk-resolve-btn"
              onClick={handleBulkResolve}
              disabled={unreadCount === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#176f78] hover:bg-[#12555c] active:scale-95 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0"
              title="Mark all active alerts as read in a single action"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Bulk Resolve{unreadCount > 0 ? ` (${unreadCount})` : ''}</span>
            </button>
          </div>
        )}

        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#527078]">
              No active floor alerts at this time.
            </div>
          ) : (
            <AnimatePresence initial={false} mode="popLayout">
              {notifications.map((item, index) => {
                const isAlert = item.type === 'alert';
                const isWarning = item.type === 'warning';
                const isWipAlert = item.id.includes('wip-alert') || item.title.toLowerCase().includes('wip');
                const isBottleneckAlert = 
                  item.id.includes('bottleneck-alert') || 
                  item.title.toLowerCase().includes('bottleneck') || 
                  item.message.toLowerCase().includes('bottleneck');
                const isUrgent = (isWipAlert || isBottleneckAlert) && !item.read;

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{
                      opacity: 0,
                      x: isUrgent ? 48 : 24,
                      scale: isUrgent ? 0.94 : 0.97
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: 1
                    }}
                    exit={{
                      opacity: 0,
                      x: -30,
                      scale: 0.95,
                      transition: { duration: 0.2 }
                    }}
                    transition={
                      isUrgent
                        ? {
                            type: 'spring',
                            stiffness: 450,
                            damping: 24,
                            mass: 0.8
                          }
                        : {
                            duration: 0.26,
                            ease: [0.16, 1, 0.3, 1],
                            delay: Math.min(index * 0.02, 0.1)
                          }
                    }
                    onClick={() => onMarkAsRead(item.id)}
                    className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                      item.read
                        ? 'border-[#e7e1d5] bg-white opacity-70'
                        : isWipAlert
                        ? 'border-rose-300 bg-rose-50/80 ring-2 ring-rose-400/50 shadow-xs'
                        : isBottleneckAlert
                        ? 'border-amber-400 bg-amber-50/80 ring-2 ring-amber-400/50 shadow-xs'
                        : isAlert
                        ? 'border-rose-300 bg-rose-50/40'
                        : isWarning
                        ? 'border-amber-300 bg-amber-50/40'
                        : 'border-[#176f78]/30 bg-[#dceceb]/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        {isWipAlert ? (
                          <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                            <Layers className="w-3.5 h-3.5" />
                          </div>
                        ) : isBottleneckAlert ? (
                          <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          </div>
                        ) : isAlert ? (
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-[#176f78] shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[#17343a] text-xs sm:text-sm">{item.title}</span>
                            {isWipAlert && !item.read && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white tracking-wider animate-pulse">
                                WIP THRESHOLD EXCEEDED
                              </span>
                            )}
                            {isBottleneckAlert && !isWipAlert && !item.read && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-600 text-white tracking-wider animate-pulse">
                                BOTTLENECK DETECTED
                              </span>
                            )}
                            {item.lineNo && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#f1eee6] text-[#176f78] border border-[#d9d2c2]">
                                Line {item.lineNo}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#527078] mt-1 leading-relaxed">
                            {item.message}
                          </p>

                          {/* Quick action buttons for WIP alerts */}
                          {isWipAlert && onNavigate && (
                            <div className="mt-2.5 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkAsRead(item.id);
                                  onNavigate('reports', item.lineNo);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#176f78] text-white text-[10px] font-bold flex items-center gap-1 hover:bg-[#125860] transition-colors cursor-pointer"
                              >
                                <FileSpreadsheet className="w-3 h-3" />
                                <span>View in Reports</span>
                              </button>
                              {item.lineNo && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkAsRead(item.id);
                                    onNavigate('linedata', item.lineNo);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white border border-[#d9d2c2] text-[#17343a] text-[10px] font-bold flex items-center gap-1 hover:bg-[#f1eee6] transition-colors cursor-pointer"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                  <span>Inspect Line {item.lineNo}</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Quick action buttons for Bottleneck alerts */}
                          {isBottleneckAlert && !isWipAlert && onNavigate && item.lineNo && (
                            <div className="mt-2.5 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkAsRead(item.id);
                                  onNavigate('linedata', item.lineNo);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[10px] font-bold flex items-center gap-1 hover:bg-amber-700 transition-colors cursor-pointer shadow-2xs"
                              >
                                <ArrowRight className="w-3 h-3" />
                                <span>Inspect Line {item.lineNo} Station</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkAsRead(item.id);
                                  onNavigate('iesimulator', item.lineNo);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-900 text-[10px] font-bold flex items-center gap-1 hover:bg-amber-50 transition-colors cursor-pointer"
                              >
                                <Activity className="w-3 h-3 text-amber-600" />
                                <span>Line Pitch Simulator</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {!item.read && (
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${
                          isWipAlert ? 'bg-rose-500 animate-ping' : isBottleneckAlert ? 'bg-amber-500 animate-ping' : 'bg-rose-500'
                        }`} />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2 text-right font-mono-numbers">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-[#e7e1d5] gap-2 flex-wrap">
          <button
            type="button"
            onClick={onClearAll}
            disabled={notifications.length === 0}
            className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 hover:underline font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="notifications-bulk-resolve-footer-btn"
              onClick={handleBulkResolve}
              disabled={unreadCount === 0}
              className="px-3 py-1.5 rounded-xl border border-[#176f78] text-[#176f78] hover:bg-[#176f78]/10 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              title="Mark all alerts as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Bulk Resolve</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors cursor-pointer shadow-2xs"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
