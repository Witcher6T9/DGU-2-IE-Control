/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StorageProviderId = 'dropbox' | 'terabox' | 'googledrive' | 'onedrive' | 's3' | 'nas';

export interface StorageProviderQuota {
  usedBytes: number;
  totalBytes: number;
  formattedUsed: string;
  formattedTotal: string;
  percentUsed: number;
}

export interface StorageProviderConfig {
  id: StorageProviderId;
  name: string;
  description: string;
  category: 'cloud' | 'enterprise' | 'on_premise';
  iconName: string;
  brandColor: string;
  bgLightColor: string;
  isConnected: boolean;
  authType: 'oauth' | 'token' | 'session' | 'key_secret' | 'url';
  accountEmail?: string;
  accountName?: string;
  targetFolderPath: string;
  quota?: StorageProviderQuota;
  lastSyncTimestamp?: number;
  lastSyncStatus?: 'success' | 'failed' | 'in_progress' | null;
  lastSyncMessage?: string;
  autoSyncEnabled: boolean;
  syncFrequency: 'shift_end' | 'hourly' | 'manual' | 'daily';
  credentials: {
    accessToken?: string;
    refreshToken?: string;
    apiKey?: string;
    sessionToken?: string;
    bucketName?: string;
    endpoint?: string;
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    nasUrl?: string;
    nasUsername?: string;
    driveFolderId?: string;
    targetFolderPath?: string;
  };
}

export interface RemoteVaultFile {
  id: string;
  providerId: StorageProviderId;
  providerName: string;
  fileName: string;
  filePath: string;
  sizeBytes: number;
  sizeFormatted: string;
  uploadedAt: string;
  timestamp: number;
  appVersion: string;
  checksum: string;
  encrypted: boolean;
  metadata: {
    linesCount: number;
    activeDate: string;
    checklistsCount: number;
    todosCount: number;
    factoryName: string;
    exportedBy?: string;
  };
  downloadUrl?: string;
  rawData?: any;
}

export interface VaultSyncLog {
  id: string;
  providerId: StorageProviderId;
  providerName: string;
  action: 'push_snapshot' | 'pull_restore' | 'file_delete' | 'sync_test' | 'connect' | 'disconnect';
  status: 'success' | 'failed' | 'warning';
  timestamp: number;
  timeStr: string;
  dateStr: string;
  details: string;
  fileName?: string;
  latencyMs?: number;
}

export interface VaultEncryptionConfig {
  enabled: boolean;
  passphraseHint?: string;
  cipher: 'AES-GCM-256';
  autoDecryptSavedKey: boolean;
}

export interface VaultMirroringPolicy {
  primaryProvider: StorageProviderId;
  mirrorToSecondary: boolean;
  secondaryProviders: StorageProviderId[];
  syncOnShiftEnd: boolean;
  conflictResolution: 'cloud_wins' | 'local_wins' | 'manual';
}
