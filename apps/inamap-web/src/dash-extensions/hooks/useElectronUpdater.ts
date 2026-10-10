
import { useState, useEffect, useCallback } from 'react';

// Define types for update info
export interface UpdateInfo {
  version: string;
  files: Array<{
    url: string;
    sha512: string;
    size: number;
  }>;
  path: string;
  sha512: string;
  releaseName: string;
  releaseNotes: string;
  releaseDate: string;
}

export interface ProgressInfo {
  total: number;
  delta: number;
  transferred: number;
  percent: number;
  bytesPerSecond: number;
}

export interface ElectronUpdateState {
  available: boolean;
  checking: boolean;
  downloading: boolean;
  downloaded: boolean;
  error: string | null;
  updateInfo: UpdateInfo | null;
  progress: ProgressInfo | null;
  version?: string;
  newVersion?: string;
}

export const useElectronUpdater = () => {
  const [updateState, setUpdateState] = useState<ElectronUpdateState>({
    available: false,
    checking: false,
    downloading: false,
    downloaded: false,
    error: null,
    updateInfo: null,
    progress: null,
  });

  const checkUpdate = useCallback(async () => {
    if (!window.DashIPCService?.checkUpdate) return;
    
    setUpdateState(prev => ({ ...prev, checking: true, error: null }));
    try {
      await window.DashIPCService.checkUpdate();
    } catch (err: any) {
      setUpdateState(prev => ({ ...prev, checking: false, error: err.message }));
    }
  }, []);

  const startDownload = useCallback(async () => {
    if (!window.DashIPCService?.startDownload) return;
    
    setUpdateState(prev => ({ ...prev, downloading: true, error: null }));
    try {
      await window.DashIPCService.startDownload();
    } catch (err: any) {
      setUpdateState(prev => ({ ...prev, downloading: false, error: err.message }));
    }
  }, []);

  const quitAndInstall = useCallback(async () => {
    if (!window.DashIPCService?.quitAndInstall) return;
    await window.DashIPCService.quitAndInstall();
  }, []);

  useEffect(() => {
    if (!window.DashIPCService) return;

    // Listen for update available results
    window.DashIPCService.onUpdateAvailable?.((arg: any) => {
      console.log('Update available event:', arg);
      // arg structure depends on update.ts: { update: boolean, version: string, newVersion: string }
      if (arg.update) {
        setUpdateState(prev => ({
          ...prev,
          checking: false,
          available: true,
          version: arg.version,
          newVersion: arg.newVersion
        }));
      } else {
        setUpdateState(prev => ({
          ...prev,
          checking: false,
          available: false,
          version: arg.version
        }));
      }
    });

    // Listen for download progress
    window.DashIPCService.onDownloadProgress?.((info: ProgressInfo) => {
      setUpdateState(prev => ({
        ...prev,
        downloading: true,
        progress: info
      }));
    });

    // Listen for update downloaded
    window.DashIPCService.onUpdateDownloaded?.((info: any) => {
      setUpdateState(prev => ({
        ...prev,
        downloading: false,
        downloaded: true,
        progress: null
      }));
    });

    // Listen for errors
    window.DashIPCService.onUpdateError?.((err: any) => {
      console.error('Update error:', err);
      setUpdateState(prev => ({
        ...prev,
        checking: false,
        downloading: false,
        error: err.message || 'Unknown update error'
      }));
    });

    // Initial check (optional, or trigger manually)
    // checkUpdate(); 

  }, [checkUpdate]);

  return {
    ...updateState,
    checkUpdate,
    startDownload,
    quitAndInstall
  };
};
