import React, { useEffect, useState } from 'react';
import { ToastType } from '../types';

interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Delay dismissal to allow for fade-out animation
      setTimeout(onDismiss, 300); // Corresponds to transition duration
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const baseClasses = "p-4 rounded-lg shadow-lg border-l-4 w-full max-w-sm transition-all duration-300 ease-in-out transform";
  let typeClasses = "";
  let iconSvg: React.ReactNode = null;

  switch (type) {
    case 'error':
      typeClasses = "bg-red-100 dark:bg-red-900/80 border-red-500 text-red-700 dark:text-red-100";
      iconSvg = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 text-red-500 dark:text-red-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      );
      break;
    case 'warning':
      typeClasses = "bg-yellow-100 dark:bg-yellow-900/80 border-yellow-500 text-yellow-700 dark:text-yellow-100";
      iconSvg = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 text-yellow-500 dark:text-yellow-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
      );
      break;
    case 'info':
      typeClasses = "bg-sky-100 dark:bg-sky-900/80 border-sky-500 text-sky-700 dark:text-sky-100";
      iconSvg = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 text-sky-500 dark:text-sky-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
      );
      break;
    case 'success':
      typeClasses = "bg-green-100 dark:bg-green-900/80 border-green-500 text-green-700 dark:text-green-100";
      iconSvg = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 text-green-500 dark:text-green-300">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
      break;
  }

  const visibilityClasses = isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full";

  return (
    <div
      className={`${baseClasses} ${typeClasses} ${visibilityClasses} flex items-start`}
      role="status" 
      aria-live="assertive" 
      aria-atomic="true"
    >
      {iconSvg}
      <div className="flex-grow text-sm">{message}</div>
      <button
        onClick={() => { setIsVisible(false); setTimeout(onDismiss, 300); }}
        className="ml-4 p-1 text-current hover:opacity-75"
        aria-label="Dismiss notification"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;