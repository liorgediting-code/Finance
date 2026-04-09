interface ProgressBarProps {
  value: number;
  max: number;
  colorClass?: string;
  showLabel?: boolean;
}

export default function ProgressBar({
  value,
  max,
  colorClass = 'bg-powder',
  showLabel = false,
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="w-full">
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`${colorClass} h-full rounded-full transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{value.toLocaleString('he-IL')} / {max.toLocaleString('he-IL')}</span>
          <span>{percent.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}
