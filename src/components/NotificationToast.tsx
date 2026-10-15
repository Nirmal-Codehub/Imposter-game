import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface Props {
  notification: {
    message: string;
    variant?: 'info' | 'success' | 'warning' | 'error';
  } | null;
  onClose: () => void;
}

export const NotificationToast: React.FC<Props> = ({ notification, onClose }) => {
  if (!notification) return null;

  const variantStyles = {
    info: 'bg-slate-900/95 border-cyan-500/50 text-cyan-200 shadow-cyan-500/20',
    success: 'bg-slate-900/95 border-emerald-500/50 text-emerald-200 shadow-emerald-500/20',
    warning: 'bg-slate-900/95 border-amber-500/50 text-amber-200 shadow-amber-500/20',
    error: 'bg-slate-900/95 border-rose-500/50 text-rose-200 shadow-rose-500/20'
  };

  const icons = {
    info: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
  };

  const style = variantStyles[notification.variant || 'info'];
  const icon = icons[notification.variant || 'info'];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md animate-in fade-in slide-in-from-top-4 duration-200">
      <div className={`flex items-center gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-lg ${style}`}>
        {icon}
        <p className="text-sm font-medium flex-1 text-slate-100">{notification.message}</p>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
