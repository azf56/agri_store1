import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.js';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#C27E47] px-4 py-2.5 text-xs font-bold text-white shadow-lg border border-[#A96D3C] animate-bounce">
      <WifiOff className="w-4 h-4 text-white" />
      <span>اتصال اینترنت قطع است — ارتباط با سرور برقرار نیست</span>
    </div>
  );
};
