import React, { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../../auth/AuthProvider';
import { API_BASE_URL, SOCKET_URL } from '../../config/api-config';
import { Bug, X, RefreshCw } from 'lucide-react';

export const MobileDebugOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [netConnected, setNetConnected] = useState<boolean>(true);
  const [netConnectionType, setNetConnectionType] = useState<string>('unknown');
  const { user, status, retryBootstrap } = useAuth();

  useEffect(() => {
    let handler: any;

    const checkNet = async () => {
      try {
        const status = await Network.getStatus();
        setNetConnected(status.connected);
        setNetConnectionType(status.connectionType);
      } catch (e) {
        // web fallback
      }
    };

    checkNet();

    Network.addListener('networkStatusChange', (status) => {
      setNetConnected(status.connected);
      setNetConnectionType(status.connectionType);
    }).then((h) => (handler = h));

    return () => {
      if (handler) handler.remove();
    };
  }, []);

  // Only enable on native mobile platforms (Android / iOS)
  if (!Capacitor.isNativePlatform()) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 p-2.5 bg-amber-500 text-slate-950 font-bold rounded-full shadow-lg border border-amber-300 opacity-80 hover:opacity-100 transition-opacity"
        title="Mobile Debug Info"
      >
        <Bug className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl text-xs font-mono text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Mobile Network Debugger
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-slate-400">Platform:</span>{' '}
                <span className="text-emerald-400 font-semibold">
                  {Capacitor.isNativePlatform() ? Capacitor.getPlatform() : 'Web Browser'}
                </span>
              </div>

              <div>
                <span className="text-slate-400">API Base URL:</span>
                <div className="truncate text-amber-300 font-sans mt-0.5 bg-slate-950 p-1.5 rounded border border-slate-800">
                  {API_BASE_URL}
                </div>
              </div>

              <div>
                <span className="text-slate-400">Socket URL:</span>
                <div className="truncate text-amber-300 font-sans mt-0.5 bg-slate-950 p-1.5 rounded border border-slate-800">
                  {SOCKET_URL}
                </div>
              </div>

              <div>
                <span className="text-slate-400">Network Status:</span>{' '}
                <span className={netConnected ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                  {netConnected ? `ONLINE (${netConnectionType})` : 'OFFLINE'}
                </span>
              </div>

              <div>
                <span className="text-slate-400">Auth Status:</span>{' '}
                <span className="text-sky-400 font-semibold">{status}</span>
              </div>

              <div>
                <span className="text-slate-400">User:</span>{' '}
                <span className="text-slate-200">{user ? `${user.firstName} ${user.lastName}` : 'None'}</span>
              </div>

              <div>
                <span className="text-slate-400">Active Role:</span>{' '}
                <span className="text-purple-400 font-semibold">{user?.role || 'None'}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => {
                  retryBootstrap();
                  setIsOpen(false);
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Re-Bootstrap App
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
