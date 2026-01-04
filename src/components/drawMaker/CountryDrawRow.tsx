import React from 'react';
import nationInfo from '../../config/nation_info.json';

type CountryStatus = 'none' | 'host' | 'playoff';

interface CountryDrawRowProps {
  countryName: string;
  status: CountryStatus;
  showRankingPts: boolean;
}

const CountryDrawRow: React.FC<CountryDrawRowProps> = ({
  countryName,
  status,
  showRankingPts
}) => {
  // Get flag code and ranking points from nation_info.json
  const nationData = nationInfo[countryName as keyof typeof nationInfo];
  const flagCode = nationData?.flagCode || '';
  const rankingPoints = nationData?.rankingPts || 'N/A';

  // Render status badge based on status prop
  const renderStatusBadge = () => {
    switch (status) {
      case 'host':
        return <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">HOST</span>;
      case 'playoff':
        return <span className="text-xs bg-red-700 text-white px-2 py-1 rounded">PLAYOFF</span>;
      case 'none':
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center space-x-3 bg-gray-700 rounded p-2 w-full">
      {/* Flag Box with rectangular mask */}
      <div className="relative w-7 h-5 overflow-hidden rounded flex items-center justify-center bg-gray-600 flex-shrink-0">
        {flagCode && (
          <span
            className={`fi fi-${flagCode} absolute inset-0`}
            style={{
              fontSize: '1.5rem',
              lineHeight: '1',
            }}
          ></span>
        )}
      </div>
      <span className="text-white font-medium flex-grow">{countryName}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        {renderStatusBadge()}
        {showRankingPts && (
          <span className="text-xs text-gray-400">
            {rankingPoints} pts
          </span>
        )}
      </div>
    </div>
  );
};

export default CountryDrawRow;
