import React from 'react';
import { useStore } from '../../store/useStore';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', ...props }) => {
  const theme = useStore(s => s.theme);
  const base = `w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-indigo-500/30 ${
    theme === 'dark'
      ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-500'
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-400'
  } ${error ? 'border-red-500' : ''} ${icon ? 'pl-10' : ''} ${className}`;

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium opacity-80">{label}</label>}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50">{icon}</span>
        )}
        <input className={base} {...props} />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ label, error, className = '', children, ...props }) => {
  const theme = useStore(s => s.theme);
  const base = `w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-indigo-500/30 ${
    theme === 'dark'
      ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-indigo-500'
      : 'bg-white border-slate-200 text-slate-800 focus:border-indigo-400'
  } ${error ? 'border-red-500' : ''} ${className}`;

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium opacity-80">{label}</label>}
      <select className={base} {...props}>{children}</select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, error, className = '', ...props }) => {
  const theme = useStore(s => s.theme);
  const base = `w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none ${
    theme === 'dark'
      ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-500'
      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-400'
  } ${error ? 'border-red-500' : ''} ${className}`;

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium opacity-80">{label}</label>}
      <textarea className={base} {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};
