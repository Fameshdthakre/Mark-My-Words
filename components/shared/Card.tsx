
import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = "", titleClassName = "" }) => {
  return (
    <div className={`bg-gray-800 rounded-xl shadow-2xl p-6 ${className}`}>
      {title && (
        <h3 className={`text-xl font-semibold text-emerald-400 mb-4 pb-2 border-b border-gray-700 ${titleClassName}`}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

export default Card;
