/**
 * Electron API Hook
 */
export function useElectronAPI() {
  if (typeof window === 'undefined' || !window.electronAPI) {
    throw new Error('Electron API not available');
  }

  return window.electronAPI;
}
