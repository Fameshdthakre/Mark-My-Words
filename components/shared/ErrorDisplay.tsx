
import React from 'react';
import { ERROR_DISPLAY_PREFIX } from '../../constants';

interface ErrorDisplayProps {
  message: string;
  details?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, details }) => {
  return (
    <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg relative shadow-md" role="alert">
      <strong className="font-bold block sm:inline">{ERROR_DISPLAY_PREFIX}{message}</strong>
      {details && <span className="block sm:inline mt-1 sm:mt-0 sm:ml-2">{details}</span>}
    </div>
  );
};

export default ErrorDisplay;
