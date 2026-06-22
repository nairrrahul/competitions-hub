import React from 'react';

interface DrawSeedCellProps {
  seed: number;
  teamName: string;
  flagCode: string;
  rankingPoints: number;
}

const DrawSeedCell: React.FC<DrawSeedCellProps> = ({
  seed,
  teamName,
  flagCode,
  rankingPoints
}) => {
  return (
    <div className="w-1/5 bg-gray-700 rounded-lg p-3 flex items-center gap-3">
      {/* Seed Number */}
      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
        {seed}
      </div>
      
      {/* Country Flag */}
      <div className="relative w-7 h-5 overflow-hidden rounded flex items-center justify-center bg-gray-600 flex-shrink-0">
        {flagCode && (
          <span
            className={`fi fi-${flagCode} absolute inset-0`}
            style={{
              fontSize: '1.5rem',
              lineHeight: '1',
              transform: 'scale(1.2)',
            }}
          />
        )}
      </div>
      
      {/* Team Name and Ranking Points */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{teamName}</div>
        <div className="text-xs text-gray-400">
          {rankingPoints.toFixed(2)} pts
        </div>
      </div>
    </div>
  );
};

export default DrawSeedCell;
