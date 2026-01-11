import React from 'react';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  groups: { [key: string]: string[] };
}

interface PlayerStatsSectionProps {
  importedCompetition: ImportedCompetition;
}

const PlayerStatsSection: React.FC<PlayerStatsSectionProps> = ({ importedCompetition }) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 h-full flex flex-col">
      <h2 className="text-xl font-bold text-green-400 mb-4">PLAYER STATS</h2>
      
      {/* Stats Grid */}
      <div className="flex-1 grid grid-cols-3 gap-4">
        {/* Most Goals */}
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-300 mb-3 border-b border-gray-600/50 pb-2">Most Goals</h3>
          <div className="space-y-2">
            {[1, 2, 3].map((position) => (
              <div key={position} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">#{position}</span>
                  <span className="text-white">Player Name</span>
                </div>
                <span className="text-green-400 font-bold">0</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Assists */}
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-300 mb-3 border-b border-gray-600/50 pb-2">Most Assists</h3>
          <div className="space-y-2">
            {[1, 2, 3].map((position) => (
              <div key={position} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">#{position}</span>
                  <span className="text-white">Player Name</span>
                </div>
                <span className="text-green-400 font-bold">0</span>
              </div>
            ))}
          </div>
        </div>

        {/* Most Clean Sheets */}
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-300 mb-3 border-b border-gray-600/50 pb-2">Most Clean Sheets</h3>
          <div className="space-y-2">
            {[1, 2, 3].map((position) => (
              <div key={position} className="flex items-center justify-between p-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">#{position}</span>
                  <span className="text-white">Player Name</span>
                </div>
                <span className="text-green-400 font-bold">0</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsSection;
