import React from 'react';

interface AlertProps {
  message: string | React.ReactNode;
  type: 'error' | 'warning' | 'info' | 'success';
  title?: string;
}

const Alert: React.FC<AlertProps> = ({ message, type, title }) => {
  const baseClasses = "p-4 rounded-lg shadow-lg border-l-4";
  let typeClasses = "";
  let iconSvg: React.ReactNode = null;

  switch (type) {
    case 'error':
      typeClasses = "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-200";
      iconSvg = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 text-red-500 dark:text-red-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      );
      break;
    case 'warning':
      typeClasses = "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500 text-yellow-700 dark:text-yellow-200";
      iconSvg = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 text-yellow-500 dark:text-yellow-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
      );
      break;
    case 'info':
      typeClasses = "bg-sky-100 dark:bg-sky-900/30 border-sky-500 text-sky-700 dark:text-sky-200";
      iconSvg = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 text-sky-500 dark:text-sky-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
      );
      break;
    case 'success':
      typeClasses = "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-200";
      iconSvg = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-3 text-green-500 dark:text-green-400">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
      break;
  }

  return (
    <div className={`${baseClasses} ${typeClasses} flex items-start`} role="alert">
      {iconSvg}
      <div>
        {title && <h3 className="font-semibold mb-1">{title}</h3>}
        <div className="text-sm">{message}</div>
      </div>
    </div>
  );
};

export default Alert;