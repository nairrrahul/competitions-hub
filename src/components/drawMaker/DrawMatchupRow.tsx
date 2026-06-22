import React from 'react';

interface DrawMatchupRowProps {
  homeTeam: React.ReactNode;
  awayTeam: React.ReactNode;
}

const DrawMatchupRow: React.FC<DrawMatchupRowProps> = ({ homeTeam, awayTeam }) => {
  return (
    <div className="bg-gray-700 rounded-lg p-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {homeTeam}
        </div>
        <div className="flex items-center gap-3">
          {awayTeam}
        </div>
      </div>
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 font-medium">
        vs
      </div>
    </div>
  );
};

export default DrawMatchupRow;
