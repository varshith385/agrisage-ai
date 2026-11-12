import React from 'react';

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  lines = 3,
  className = '',
}) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      <div className="h-6 bg-agri-cream-200/80 rounded-xl w-3/4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-agri-cream-200/50 rounded-lg"
          style={{ width: `${Math.max(40, 95 - i * 15)}%` }}
        />
      ))}
    </div>
  );
};

