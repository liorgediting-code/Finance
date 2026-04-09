import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  colorClass?: string;
  accentColor?: string;
  icon?: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  subtitle,
  colorClass = 'bg-white',
  accentColor,
  icon,
}: StatCardProps) {
  return (
    <div className={`${colorClass} rounded-xl shadow-sm overflow-hidden`}>
      {accentColor && (
        <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />
      )}
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#6B6B8A]">{title}</span>
          {icon && (
            <span className="text-[#9090A8] opacity-70">{icon}</span>
          )}
        </div>
        <div className="text-2xl font-bold text-[#1E1E2E] tracking-tight">{value}</div>
        {subtitle && (
          <div className="text-xs text-[#9090A8] mt-1">{subtitle}</div>
        )}
      </div>
    </div>
  );
}
