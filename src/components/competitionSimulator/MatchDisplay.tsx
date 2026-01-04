import React from 'react';
import nationInfo from '../../config/nation_info.json';
import type { Match } from '../../utils/SchedulerUtils';

interface MatchDisplayProps {
  match: Match;
  className?: string;
}

const MatchDisplay: React.FC<MatchDisplayProps> = ({ match, className = "flex items-center justify-between relative" }) => {
  return (
    <div className={className}>
      {/* Home Team with Flag */}
      <div className="flex items-center space-x-3">
        <div className="relative w-6 h-4 overflow-hidden rounded flex items-center justify-center bg-gray-600">
          {(() => {
            const nationData = nationInfo[match.homeTeam as keyof typeof nationInfo];
            const flagCode = nationData?.flagCode;
            return flagCode && (
              <span
                className={`fi fi-${flagCode} absolute inset-0`}
                style={{
                  fontSize: '1.2rem',
                  lineHeight: '1',
                }}
              ></span>
            );
          })()}
        </div>
        <span className="text-white font-medium">{match.homeTeam}</span>
      </div>
      
      {/* Absolute Centered VS */}
      <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 font-medium">vs</span>
      
      {/* Away Team with Flag */}
      <div className="flex items-center space-x-3">
        <span className="text-white font-medium">{match.awayTeam}</span>
        <div className="relative w-6 h-4 overflow-hidden rounded flex items-center justify-center bg-gray-600">
          {(() => {
            const nationData = nationInfo[match.awayTeam as keyof typeof nationInfo];
            const flagCode = nationData?.flagCode;
            return flagCode && (
              <span
                className={`fi fi-${flagCode} absolute inset-0`}
                style={{
                  fontSize: '1.2rem',
                  lineHeight: '1',
                }}
              ></span>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default MatchDisplay;
