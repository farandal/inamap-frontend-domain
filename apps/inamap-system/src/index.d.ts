/// <reference types="vite/client" />

declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';
declare module '*.ttf';
declare module '*.woff';
declare module '*.woff2';

interface Window {
    electronStore?: {
        syncToLocalStorage: () => Promise<Record<string, any>>;
        set: (key: string, value: any) => Promise<void>;
        get: (key: string) => Promise<any>;
        delete: (key: string) => Promise<void>;
    };
    DashIPCService?: {
        action: (action: string, payload?: any) => void;
        speak: (text: string | { message: string; lang?: string }) => void;
        
        // Auto-update methods
        checkUpdate: () => Promise<any>;
        startDownload: () => Promise<any>;
        quitAndInstall: () => Promise<void>;
        onUpdateAvailable: (callback: (arg: any) => void) => void;
        onDownloadProgress: (callback: (info: any) => void) => void;
        onUpdateDownloaded: (callback: (info: any) => void) => void;
        onUpdateError: (callback: (error: any) => void) => void;
    };
}
