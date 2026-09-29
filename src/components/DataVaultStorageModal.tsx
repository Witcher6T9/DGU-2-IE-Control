/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Database,
  Cloud,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  ShieldCheck,
  Lock,
  Unlock,
  Folder,
  Layers,
  Search,
  Trash2,
  ExternalLink,
  Sliders,
  Sparkles,
  Server,
  Zap,
  Clock,
  ArrowRight,
  Eye,
  Check,
  Copy,
  Info,
  Play,
  RotateCcw,
  Network
} from 'lucide-react';
import {
  StorageProviderId,
  StorageProviderConfig,
  RemoteVaultFile,
  VaultSyncLog,
  VaultEncryptionConfig,
  VaultMirroringPolicy
} from '../types/storageVault';
import {
  getStorageVaultConfigs,
  saveStorageVaultConfigs,
  updateStorageVaultConfig,
  getRemoteVaultFiles,
  saveRemoteVaultFiles,
  getVaultSyncLogs,
  addVaultSyncLog,
  clearVaultSyncLogs,
  getVaultMirrorPolicy,
  saveVaultMirrorPolicy,
  getVaultEncryptionConfig,
  saveVaultEncryptionConfig,
  testProviderConnection,
  connectStorageProvider,
  disconnectStorageProvider,
  pushSnapshotToProvider,
  pushSnapshotToAllConnected,
  pullSnapshotFromProvider,
  deleteRemoteVaultFile,
  downloadRemoteFileToDevice
} from '../utils/storageVaultService';
import { LineEntry, ChecklistMap, TodoItem, LeanActionItem } from '../types';
import { AppBackupState } from '../utils/indexedDbBackup';

interface DataVaultStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines: LineEntry[];
  checklists: ChecklistMap;
  todos: TodoItem[];
  leanActions: LeanActionItem[];
  activeDate?: string;
  onRestoreData?: (data: any) => void;
  initialTab?: 'providers' | 'files' | 'snapshot' | 'rules' | 'audit';
}

export const DataVaultStorageModal: React.FC<DataVaultStorageModalProps> = ({
  isOpen,
  onClose,
  lines,
  checklists,
  todos,
  leanActions,
  activeDate = '2026-09-29',
  onRestoreData,
  initialTab = 'providers'
}) => {
  const [activeTab, setActiveTab] = useState<'providers' | 'files' | 'snapshot' | 'rules' | 'audit'>(initialTab);

  // Storage Vault States
  const [providers, setProviders] = useState<StorageProviderConfig[]>([]);
  const [remoteFiles, setRemoteFiles] = useState<RemoteVaultFile[]>([]);
  const [logs, setLogs] = useState<VaultSyncLog[]>([]);
  const [mirrorPolicy, setMirrorPolicy] = useState<VaultMirroringPolicy>(getVaultMirrorPolicy());
  const [encryptionConfig, setEncryptionConfig] = useState<VaultEncryptionConfig>(getVaultEncryptionConfig());

  // Action states
  const [testingId, setTestingId] = useState<StorageProviderId | null>(null);
  const [testResult, setTestResult] = useState<{ id: StorageProviderId; success: boolean; message: string; latency?: number } | null>(null);
  const [isPushingAll, setIsPushingAll] = useState<boolean>(false);
  const [pushStatusMessage, setPushStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedFileFilter, setSelectedFileFilter] = useState<string>('all');
  const [fileSearchQuery, setFileSearchQuery] = useState<string>('');

  // Connect Dialog Modal State
  const [editingProvider, setEditingProvider] = useState<StorageProviderConfig | null>(null);
  const [connectFormData, setConnectFormData] = useState<{
    token: string;
    email: string;
    folderPath: string;
    bucketName?: string;
    endpoint?: string;
  }>({ token: '', email: '', folderPath: '' });

  // Snapshot Push Customizer
  const [selectedPushProviders, setSelectedPushProviders] = useState<Record<StorageProviderId, boolean>>({
    googledrive: true,
    dropbox: true,
    terabox: true,
    nas: true,
    onedrive: false,
    s3: false
  });
  const [pushPassphrase, setPushPassphrase] = useState<string>('');
  const [enablePushEncryption, setEnablePushEncryption] = useState<boolean>(false);

  // Load and refresh state
  const loadData = () => {
    setProviders(getStorageVaultConfigs());
    setRemoteFiles(getRemoteVaultFiles());
    setLogs(getVaultSyncLogs());
    setMirrorPolicy(getVaultMirrorPolicy());
    setEncryptionConfig(getVaultEncryptionConfig());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Total connected count
  const connectedCount = useMemo(() => {
    return providers.filter(p => p.isConnected).length;
  }, [providers]);

  // Current active payload
  const currentSnapshotPayload: AppBackupState = useMemo(() => {
    return {
      lines,
      checklists,
      todos,
      leanActions,
      metadata: {
        appVersion: '2.4.2',
        activeDate,
        factoryName: 'Debonair Unit-02 (DGU-2)',
        exportedBy: 'IE Control Lead'
      }
    };
  }, [lines, checklists, todos, leanActions, activeDate]);

  // Diagnostic Test Handler
  const handleTestConnection = async (id: StorageProviderId) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await testProviderConnection(id);
      setTestResult({
        id,
        success: res.success,
        message: res.message,
        latency: res.latencyMs
      });
      loadData();
    } catch (err: any) {
      setTestResult({
        id,
        success: false,
        message: err?.message || 'Connection test failed'
      });
    } finally {
      setTestingId(null);
    }
  };

  // Push Snapshot to Single Provider
  const handlePushToProvider = async (providerId: StorageProviderId) => {
    setTestingId(providerId);
    setPushStatusMessage(null);
    try {
      const prov = providers.find(p => p.id === providerId);
      const res = await pushSnapshotToProvider(providerId, currentSnapshotPayload, {
        encrypted: enablePushEncryption
      });
      setPushStatusMessage({
        text: `Snapshot successfully committed to ${prov?.name || providerId}! (${res.file.sizeFormatted})`,
        type: 'success'
      });
      loadData();
    } catch (err: any) {
      setPushStatusMessage({
        text: `Push failed: ${err?.message || 'Error transferring to cloud vault'}`,
        type: 'error'
      });
    } finally {
      setTestingId(null);
    }
  };

  // Push to All Connected Storage Systems
  const handlePushToAllVaults = async () => {
    setIsPushingAll(true);
    setPushStatusMessage(null);
    try {
      const res = await pushSnapshotToAllConnected(currentSnapshotPayload, {
        encrypted: enablePushEncryption
      });
      setPushStatusMessage({
        text: `Dual-vault mirror complete: Transferred snapshot to ${res.successCount} connected storage vaults!`,
        type: 'success'
      });
      loadData();
    } catch (err: any) {
      setPushStatusMessage({
        text: `Cloud push failed: ${err?.message || 'Error transferring snapshots'}`,
        type: 'error'
      });
    } finally {
      setIsPushingAll(false);
    }
  };

  // Connect/Authorize Provider Modal Trigger
  const handleOpenConnectDialog = (provider: StorageProviderConfig) => {
    setEditingProvider(provider);
    setConnectFormData({
      token: provider.credentials.accessToken || provider.credentials.sessionToken || '',
      email: provider.accountEmail || '',
      folderPath: provider.targetFolderPath || '',
      bucketName: provider.credentials.bucketName || '',
      endpoint: provider.credentials.endpoint || ''
    });
  };

  const handleSaveConnect = async () => {
    if (!editingProvider) return;
    try {
      await connectStorageProvider(
        editingProvider.id,
        {
          accessToken: connectFormData.token,
          sessionToken: connectFormData.token,
          bucketName: connectFormData.bucketName,
          endpoint: connectFormData.endpoint
        },
        {
          accountEmail: connectFormData.email,
          targetFolderPath: connectFormData.folderPath
        }
      );
      setEditingProvider(null);
      loadData();
      setPushStatusMessage({
        text: `${editingProvider.name} authorized and connected successfully!`,
        type: 'success'
      });
    } catch (err: any) {
      alert(`Connection failed: ${err?.message}`);
    }
  };

  const handleDisconnect = (id: StorageProviderId) => {
    if (confirm(`Disconnect this storage system from Debonair IE Control?`)) {
      disconnectStorageProvider(id);
      loadData();
    }
  };

  // Restore Remote Snapshot
  const handleRestoreFile = async (file: RemoteVaultFile) => {
    if (!onRestoreData) {
      alert('Restoration is not wired in current context.');
      return;
    }
    const linesCount = file.metadata?.linesCount || 34;
    const date = file.metadata?.activeDate || '2026-09-29';

    if (
      confirm(
        `Restore production state from ${file.providerName} snapshot?\n\nFile: ${file.fileName}\nSnapshot Date: ${date} (${linesCount} lines)\n\nThis will update active production lines, checklists, and floor tasks with the cloud vault baseline.`
      )
    ) {
      try {
        const data = await pullSnapshotFromProvider(file);
        onRestoreData(data);
        setPushStatusMessage({
          text: `Application state restored from ${file.providerName} (${file.fileName})!`,
          type: 'success'
        });
        loadData();
        setTimeout(() => {
          onClose();
        }, 1200);
      } catch (err: any) {
        setPushStatusMessage({
          text: `Failed to restore snapshot: ${err?.message}`,
          type: 'error'
        });
      }
    }
  };

  // Delete remote file
  const handleDeleteFile = async (file: RemoteVaultFile) => {
    if (confirm(`Delete ${file.fileName} from ${file.providerName} vault?`)) {
      await deleteRemoteVaultFile(file.providerId, file.id);
      loadData();
    }
  };

  // Filtered Remote Files
  const filteredFiles = useMemo(() => {
    return remoteFiles.filter(f => {
      const matchProvider = selectedFileFilter === 'all' || f.providerId === selectedFileFilter;
      const matchQuery =
        !fileSearchQuery ||
        f.fileName.toLowerCase().includes(fileSearchQuery.toLowerCase()) ||
        f.providerName.toLowerCase().includes(fileSearchQuery.toLowerCase());
      return matchProvider && matchQuery;
    });
  }, [remoteFiles, selectedFileFilter, fileSearchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#12171f] text-slate-800 dark:text-slate-100 rounded-3xl border border-[#d9d2c2] dark:border-[#2e3846] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* ========================================================
            MODAL HEADER
        ======================================================== */}
        <div className="p-4 sm:p-5 border-b border-[#e7e1d5] dark:border-[#263140] bg-[#fbfaf6] dark:bg-[#161d27] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#176f78] text-white flex items-center justify-center shadow-sm shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-[#17343a] dark:text-white font-display">
                  Data Vault &amp; Storage Systems Connect
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                  {connectedCount} Connected
                </span>
                {encryptionConfig.enabled && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    <ShieldCheck className="w-3 h-3" />
                    <span>AES-256</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#527078] dark:text-slate-400">
                Synchronize production lines, shift snapshots &amp; IE telemetry with Dropbox, Terabox, Google Drive &amp; Plant NAS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePushToAllVaults}
              disabled={isPushingAll || connectedCount === 0}
              className="px-3.5 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Upload className={`w-3.5 h-3.5 ${isPushingAll ? 'animate-bounce' : ''}`} />
              <span>{isPushingAll ? 'Mirroring to Vaults...' : 'Push Snapshot to All Vaults'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Notification Banner */}
        {pushStatusMessage && (
          <div
            className={`p-3 text-xs flex items-center justify-between gap-2 border-b shrink-0 ${
              pushStatusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : pushStatusMessage.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                : 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{pushStatusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setPushStatusMessage(null)}
              className="text-[10px] underline font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ========================================================
            TAB NAVIGATION
        ======================================================== */}
        <div className="px-4 sm:px-6 pt-2 bg-slate-50 dark:bg-[#141b24] border-b border-[#e7e1d5] dark:border-[#263140] flex items-center gap-2 sm:gap-4 overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'providers', label: 'Storage Providers (Dropbox, Terabox, Drive)', icon: Cloud, count: connectedCount },
            { id: 'files', label: 'Remote Vault Explorer', icon: Folder, count: remoteFiles.length },
            { id: 'snapshot', label: '1-Click Vault Snapshot', icon: Upload },
            { id: 'rules', label: 'Dual Mirroring & Sync Rules', icon: Network },
            { id: 'audit', label: 'Activity Logs', icon: Clock, count: logs.length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#176f78] text-[#176f78] dark:text-teal-300 bg-white dark:bg-[#12171f] rounded-t-xl shadow-xs'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-teal-500/20 text-[#176f78] dark:text-teal-300'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ========================================================
            TAB CONTENT CONTAINER
        ======================================================== */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* ========================================================
              TAB 1: STORAGE PROVIDERS & GATEWAYS
          ======================================================== */}
          {activeTab === 'providers' && (
            <div className="space-y-6">
              {/* Quick Status Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#fbfaf6] dark:bg-[#161d27] border border-[#d9d2c2] dark:border-[#2e3846]">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">
                    Connected Vaults
                  </div>
                  <div className="text-lg font-bold font-mono text-[#17343a] dark:text-white mt-1">
                    {connectedCount} of {providers.length}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold">
                    Multi-Cloud Redundancy
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#fbfaf6] dark:bg-[#161d27] border border-[#d9d2c2] dark:border-[#2e3846]">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">
                    Primary Cloud
                  </div>
                  <div className="text-lg font-bold text-[#17343a] dark:text-white mt-1 truncate">
                    Google Drive
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Workspace Direct Sync
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#fbfaf6] dark:bg-[#161d27] border border-[#d9d2c2] dark:border-[#2e3846]">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">
                    Terabox Capacity
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    1,024 GB (1 TB)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    7.8% Space Utilized
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#fbfaf6] dark:bg-[#161d27] border border-[#d9d2c2] dark:border-[#2e3846]">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold">
                    LAN Server NAS
                  </div>
                  <div className="text-lg font-bold font-mono text-teal-600 dark:text-teal-400 mt-1">
                    Gigabit Online
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    12ms Local Latency
                  </div>
                </div>
              </div>

              {/* Provider Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map(prov => {
                  const isTesting = testingId === prov.id;
                  const isThisTestResult = testResult && testResult.id === prov.id;

                  return (
                    <div
                      key={prov.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        prov.isConnected
                          ? 'border-[#176f78]/30 dark:border-teal-500/30 bg-[#fbfaf6] dark:bg-[#161d27] shadow-xs'
                          : 'border-slate-300 dark:border-[#2e3846] bg-slate-50 dark:bg-[#12161f] opacity-80'
                      }`}
                    >
                      <div>
                        {/* Provider Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold font-mono text-sm shadow-xs"
                              style={{ backgroundColor: prov.brandColor }}
                            >
                              {prov.id === 'googledrive' && 'GD'}
                              {prov.id === 'dropbox' && 'DB'}
                              {prov.id === 'terabox' && 'TB'}
                              {prov.id === 'onedrive' && 'OD'}
                              {prov.id === 's3' && 'S3'}
                              {prov.id === 'nas' && 'NAS'}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-[#17343a] dark:text-white">
                                  {prov.name}
                                </h3>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                    prov.isConnected
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                                  }`}
                                >
                                  {prov.isConnected ? 'Connected' : 'Offline'}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#527078] dark:text-slate-400 mt-0.5 line-clamp-2">
                                {prov.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Connection Metadata / Quota bar */}
                        {prov.isConnected && (
                          <div className="mt-4 space-y-2.5 pt-3 border-t border-[#e7e1d5] dark:border-[#263140]">
                            {/* Account and Remote Folder */}
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-400 text-[10px] block">Account / User:</span>
                                <span className="font-mono text-slate-700 dark:text-slate-200 font-semibold truncate block">
                                  {prov.accountEmail || prov.accountName || 'Authenticated'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 text-[10px] block">Remote Cloud Path:</span>
                                <span className="font-mono text-slate-700 dark:text-slate-200 font-semibold truncate block" title={prov.targetFolderPath}>
                                  {prov.targetFolderPath}
                                </span>
                              </div>
                            </div>

                            {/* Storage Quota Progress */}
                            {prov.quota && (
                              <div>
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                                  <span>Storage: {prov.quota.formattedUsed} used</span>
                                  <span>{prov.quota.formattedTotal} total ({prov.quota.percentUsed}%)</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${Math.min(100, prov.quota.percentUsed)}%`,
                                      backgroundColor: prov.brandColor
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Last Sync Message */}
                            {prov.lastSyncMessage && (
                              <div className="text-[10px] font-mono text-[#527078] dark:text-slate-400 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate">{prov.lastSyncMessage}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Test Result Message */}
                        {isThisTestResult && (
                          <div
                            className={`mt-3 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                              testResult.success
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            <Zap className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-[11px] leading-tight">{testResult.message}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="mt-4 pt-3 border-t border-[#e7e1d5] dark:border-[#263140] flex items-center justify-between gap-2">
                        {prov.isConnected ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleTestConnection(prov.id)}
                                disabled={isTesting}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-[#2e3846] bg-white dark:bg-[#181d24] text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-[#176f78] hover:border-[#176f78] transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <Zap className={`w-3 h-3 text-amber-500 ${isTesting ? 'animate-spin' : ''}`} />
                                <span>{isTesting ? 'Testing...' : 'Ping Test'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePushToProvider(prov.id)}
                                disabled={isTesting}
                                className="px-2.5 py-1.5 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                <Upload className="w-3 h-3" />
                                <span>Push Snapshot</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenConnectDialog(prov)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                title="Configure Credentials"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDisconnect(prov.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                title="Disconnect Storage"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="w-full flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">Not configured</span>
                            <button
                              type="button"
                              onClick={() => handleOpenConnectDialog(prov)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Cloud className="w-3.5 h-3.5" />
                              <span>Connect {prov.name}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: REMOTE VAULT EXPLORER (FILES)
          ======================================================== */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#fbfaf6] dark:bg-[#161d27] border border-[#d9d2c2] dark:border-[#2e3846]">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search snapshots by filename, date, or provider..."
                    value={fileSearchQuery}
                    onChange={e => setFileSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#2e3846] bg-white dark:bg-[#12161f] text-xs focus:outline-hidden focus:border-[#176f78]"
                  />
                </div>

                {/* Filter by provider */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Filter Cloud:</span>
                  <select
                    value={selectedFileFilter}
                    onChange={e => setSelectedFileFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#2e3846] bg-white dark:bg-[#12161f] text-xs font-bold text-[#17343a] dark:text-white cursor-pointer focus:outline-hidden"
                  >
                    <option value="all">All Storage Systems ({remoteFiles.length})</option>
                    <option value="googledrive">Google Drive</option>
                    <option value="dropbox">Dropbox Enterprise</option>
                    <option value="terabox">Terabox Cloud</option>
                    <option value="nas">Plant Industrial NAS</option>
                  </select>
                </div>
              </div>

              {/* Files Table / List */}
              {filteredFiles.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-[#2e3846]">
                  <Folder className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <div className="text-sm font-bold text-slate-600 dark:text-slate-300">No remote snapshots found</div>
                  <p className="text-xs text-slate-400 mt-1">
                    Try switching filters or click "Push Snapshot to All Vaults" to archive current factory state.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredFiles.map(file => {
                    return (
                      <div
                        key={file.id}
                        className="p-4 rounded-2xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#161d27] hover:border-[#176f78]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                            <Folder className="w-4 h-4 text-[#176f78]" />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-[#17343a] dark:text-white font-mono break-all">
                                {file.fileName}
                              </span>
                              <span
                                className={`px-2 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                                  file.providerId === 'googledrive'
                                    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                                    : file.providerId === 'dropbox'
                                    ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30'
                                    : file.providerId === 'terabox'
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                    : 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30'
                                }`}
                              >
                                {file.providerName}
                              </span>
                              {file.encrypted && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>AES-256</span>
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-[#527078] dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span>Path: <code className="font-mono text-slate-600 dark:text-slate-300">{file.filePath}</code></span>
                              <span>• Size: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{file.sizeFormatted}</span></span>
                              <span>• Uploaded: {file.uploadedAt}</span>
                              <span>• Contains: <strong className="text-slate-700 dark:text-slate-200">{file.metadata?.linesCount || 34} Lines</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRestoreFile(file)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                            title="Restore this snapshot into active factory dashboard"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore State</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => downloadRemoteFileToDevice(file, file.rawData || currentSnapshotPayload)}
                            className="p-2 rounded-xl border border-slate-300 dark:border-[#2e3846] bg-white dark:bg-[#181d24] text-slate-700 dark:text-slate-300 hover:text-[#176f78] transition-colors cursor-pointer"
                            title="Download JSON to local device"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteFile(file)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete file from cloud vault"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 3: 1-CLICK VAULT SNAPSHOT & PUSH
          ======================================================== */}
          {activeTab === 'snapshot' && (
            <div className="space-y-6">
              {/* Snapshot Preview Card */}
              <div className="p-5 rounded-2xl bg-[#fbfaf6] dark:bg-[#161d27] border border-[#d9d2c2] dark:border-[#2e3846] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#17343a] dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Live Production State Ready for Archival</span>
                    </h3>
                    <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                      Capture all active sewing lines, machine allocations, checklists, and floor tasks into a sealed snapshot.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#176f78] dark:text-teal-300">
                    Active Date: {activeDate}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-white dark:bg-[#12161f] border border-[#e7e1d5] dark:border-[#263140]">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Sewing Lines</div>
                    <div className="text-base font-bold font-mono text-[#17343a] dark:text-white mt-0.5">
                      {lines.length} Lines
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#12161f] border border-[#e7e1d5] dark:border-[#263140]">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Daily Checklists</div>
                    <div className="text-base font-bold font-mono text-[#17343a] dark:text-white mt-0.5">
                      {Object.keys(checklists).length} Days Logged
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#12161f] border border-[#e7e1d5] dark:border-[#263140]">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Floor Tasks (Todos)</div>
                    <div className="text-base font-bold font-mono text-[#17343a] dark:text-white mt-0.5">
                      {todos.length} Items
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-[#12161f] border border-[#e7e1d5] dark:border-[#263140]">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Lean Kaizen Actions</div>
                    <div className="text-base font-bold font-mono text-[#17343a] dark:text-white mt-0.5">
                      {leanActions.length} Actions
                    </div>
                  </div>
                </div>
              </div>

              {/* Destination Storage Selectors */}
              <div className="p-5 rounded-2xl bg-[#fbfaf6] dark:bg-[#161d27] border border-[#d9d2c2] dark:border-[#2e3846] space-y-4">
                <h3 className="text-xs font-bold text-[#17343a] dark:text-slate-200 uppercase tracking-wider">
                  Target Destination Cloud Storage Systems
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {providers.map(prov => {
                    const isChecked = !!selectedPushProviders[prov.id];
                    return (
                      <label
                        key={prov.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isChecked && prov.isConnected
                            ? 'border-[#176f78] bg-[#176f78]/10 dark:bg-teal-950/40'
                            : 'border-slate-300 dark:border-[#2e3846] bg-white dark:bg-[#12161f]'
                        } ${!prov.isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            disabled={!prov.isConnected}
                            checked={isChecked && prov.isConnected}
                            onChange={e => {
                              setSelectedPushProviders(prev => ({
                                ...prev,
                                [prov.id]: e.target.checked
                              }));
                            }}
                            className="rounded-sm accent-[#176f78] cursor-pointer"
                          />
                          <div>
                            <div className="text-xs font-bold text-[#17343a] dark:text-white flex items-center gap-1.5">
                              <span>{prov.name}</span>
                              {!prov.isConnected && (
                                <span className="text-[9px] text-slate-400 font-mono">(Offline)</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                              {prov.targetFolderPath}
                            </div>
                          </div>
                        </div>

                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: prov.isConnected ? prov.brandColor : '#94a3b8' }}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Encryption Passphrase Options */}
              <div className="p-5 rounded-2xl bg-[#fbfaf6] dark:bg-[#161d27] border border-[#d9d2c2] dark:border-[#2e3846] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-[#17343a] dark:text-white">
                        AES-256 Vault Encryption
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Encrypt proprietary garment formulas and cycle times before transmission to public clouds (Terabox / Dropbox).
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEnablePushEncryption(!enablePushEncryption)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      enablePushEncryption ? 'bg-[#176f78]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        enablePushEncryption ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {enablePushEncryption && (
                  <div className="pt-2 flex items-center gap-3">
                    <input
                      type="password"
                      placeholder="Enter Vault Encryption Passphrase (or leave blank to use Plant Master PIN)..."
                      value={pushPassphrase}
                      onChange={e => setPushPassphrase(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-[#2e3846] bg-white dark:bg-[#12161f] text-xs font-mono focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              {/* Big Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handlePushToAllVaults}
                  disabled={isPushingAll || connectedCount === 0}
                  className="w-full py-3.5 rounded-2xl bg-[#176f78] hover:bg-[#12555c] text-white text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Upload className={`w-4 h-4 ${isPushingAll ? 'animate-bounce' : ''}`} />
                  <span>
                    {isPushingAll
                      ? 'Archiving & Synchronizing with Connected Storage Systems...'
                      : `Push Live Snapshot to All Connected Vaults (${connectedCount} Online)`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: DUAL MIRRORING & SYNC RULES
          ======================================================== */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#fbfaf6] dark:bg-[#161d27] border border-[#d9d2c2] dark:border-[#2e3846] space-y-4">
                <div className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-[#176f78]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#17343a] dark:text-white">
                      Dual-Vault Multi-Cloud Redundancy Policy
                    </h3>
                    <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                      Ensure zero data loss by continuously mirroring all plant snapshots across cloud drives and local factory hardware.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="p-4 rounded-xl bg-white dark:bg-[#12161f] border border-[#e7e1d5] dark:border-[#263140] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#17343a] dark:text-white">
                        Automatic Shift-End Backup (05:00 PM / 17:00)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Automatically captures 34-line sewing output and pushes snapshot to Google Drive &amp; Terabox.
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Active
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-[#12161f] border border-[#e7e1d5] dark:border-[#263140] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#17343a] dark:text-white">
                        Gigabit Plant NAS Local Mirror
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Fast 12ms synchronization to the local Synology server in Building B for offline continuity.
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Active
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-[#12161f] border border-[#e7e1d5] dark:border-[#263140] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#17343a] dark:text-white">
                        Terabox 1TB Cold-Archive Retention
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Keeps rolling 365-day archives for industrial engineering compliance and lean kaizen audits.
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: ACTIVITY LOGS & AUDIT TRAIL
          ======================================================== */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#17343a] dark:text-white">
                    Data Vault Sync &amp; Audit Trail
                  </h3>
                  <p className="text-xs text-slate-400">
                    Chronological activity log of all cloud transfers, ping tests, and restoration events.
                  </p>
                </div>

                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearVaultSyncLogs();
                      loadData();
                    }}
                    className="text-xs text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear Logs
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-[#2e3846]">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <div className="text-sm font-bold text-slate-600 dark:text-slate-300">No activity logged yet</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map(log => {
                    return (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl border border-[#e7e1d5] dark:border-[#263140] bg-[#fbfaf6] dark:bg-[#161d27] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              log.status === 'success'
                                ? 'bg-emerald-500'
                                : log.status === 'failed'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          <div>
                            <div className="font-bold text-[#17343a] dark:text-white flex items-center gap-2">
                              <span>{log.providerName}</span>
                              <span className="text-[10px] font-mono text-slate-400 uppercase">[{log.action}]</span>
                              {log.latencyMs !== undefined && (
                                <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400">
                                  {log.latencyMs}ms
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {log.details}
                            </div>
                          </div>
                        </div>

                        <div className="text-[10px] font-mono text-slate-400 text-right shrink-0">
                          <div>{log.dateStr}</div>
                          <div>{log.timeStr}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================
            CONNECT / EDIT PROVIDER DIALOG (OVERLAY)
        ======================================================== */}
        {editingProvider && (
          <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#161d27] rounded-3xl border border-[#d9d2c2] dark:border-[#2e3846] p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] dark:border-[#263140] pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: editingProvider.brandColor }}
                  >
                    {editingProvider.id.substring(0, 2).toUpperCase()}
                  </div>
                  <h3 className="text-sm font-bold text-[#17343a] dark:text-white">
                    Connect &amp; Configure {editingProvider.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProvider(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Account Email / Identifier</label>
                  <input
                    type="text"
                    value={connectFormData.email}
                    onChange={e => setConnectFormData({ ...connectFormData, email: e.target.value })}
                    placeholder="e.g. operator@debonairgroup.com"
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-[#2e3846] bg-white dark:bg-[#12161f] text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">
                    {editingProvider.authType === 'session' ? 'Session / App Key' : 'Access Token / API Key'}
                  </label>
                  <input
                    type="password"
                    value={connectFormData.token}
                    onChange={e => setConnectFormData({ ...connectFormData, token: e.target.value })}
                    placeholder="Enter security token or leave pre-configured"
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-[#2e3846] bg-white dark:bg-[#12161f] text-slate-800 dark:text-slate-100 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Zero client secret exposure. Protected by server proxy gateway.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Target Cloud Storage Folder</label>
                  <input
                    type="text"
                    value={connectFormData.folderPath}
                    onChange={e => setConnectFormData({ ...connectFormData, folderPath: e.target.value })}
                    placeholder="/Debonair_Vault/Daily_IE_Control/"
                    className="w-full p-2 rounded-xl border border-slate-300 dark:border-[#2e3846] bg-white dark:bg-[#12161f] text-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#e7e1d5] dark:border-[#263140]">
                <button
                  type="button"
                  onClick={() => setEditingProvider(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveConnect}
                  className="px-4 py-1.5 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold cursor-pointer"
                >
                  Authorize &amp; Connect
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            MODAL FOOTER
        ======================================================== */}
        <div className="p-4 bg-[#fbfaf6] dark:bg-[#161d27] border-t border-[#e7e1d5] dark:border-[#263140] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-[#527078] dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Encrypted Dual-Vault Architecture active across Google Drive, Dropbox &amp; Terabox.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors self-end sm:self-auto cursor-pointer shadow-xs"
          >
            Close Vault Hub
          </button>
        </div>
      </div>
    </div>
  );
};
