import React from 'react';

export const SkeletonCard: React.FC<{ rows?: number; className?: string }> = ({
  rows = 3,
  className = '',
}) => (
  <div
    role="status"
    aria-label="Loading..."
    className={`bg-white rounded-2xl border border-[#7A553A]/15 p-6 animate-pulse shadow-sm ${className}`}
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-[#EDE5DC]" />
      <div className="space-y-2 flex-1">
        <div className="h-4 w-1/3 bg-[#EDE5DC] rounded" />
        <div className="h-3 w-1/2 bg-[#EDE5DC]/60 rounded" />
      </div>
    </div>
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-3.5 bg-[#EDE5DC]/80 rounded" style={{ width: `${85 - idx * 15}%` }} />
      ))}
    </div>
  </div>
);

export const SkeletonStat: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    role="status"
    aria-label="Loading stat..."
    className={`bg-white rounded-2xl border border-[#7A553A]/15 p-5 animate-pulse shadow-sm ${className}`}
  >
    <div className="h-3 w-24 bg-[#EDE5DC] rounded mb-3" />
    <div className="h-7 w-32 bg-[#DA9A4C]/30 rounded mb-2" />
    <div className="h-3 w-40 bg-[#EDE5DC]/70 rounded" />
  </div>
);
