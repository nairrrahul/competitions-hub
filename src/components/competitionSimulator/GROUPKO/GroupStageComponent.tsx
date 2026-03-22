import React from 'react';
import { useGlobalStore } from '../../../state/GlobalState';
import { calculateNthPlaceTeams, calculateStats, getBestNthPlaceCount, getNthPlaceSuffix, sortTeams } from '../../../utils/GroupSort';

interface GroupTeamStats {
  countryName: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

interface TransformedGroups {
  [groupName: string]: GroupTeamStats[];
}

interface GroupStageComponentProps {
  transformedGroups: TransformedGroups;
  importedCompetition: any; // Add competition prop to access round info
}

const GroupStageComponent: React.FC<GroupStageComponentProps> = ({ transformedGroups, importedCompetition }) => {
  const getNationFlagCode = useGlobalStore(state => state.getNationFlagCode);
  const getRoundInfo = useGlobalStore(state => state.getRoundInfo);
  const totalGroups = Object.keys(transformedGroups).length; 
  const groupStageRound = getRoundInfo(importedCompetition.compName)?.rounds?.find((round: any) => round.type === 'GROUP');


  const TeamFlag: React.FC<{ countryName: string }> = ({ countryName }) => {
    const flagCode = getNationFlagCode(countryName);
    
    return (
      <div className="relative w-5 h-4 overflow-hidden rounded flex items-center justify-center bg-gray-600">
        {flagCode && (
          <span
            className={`fi fi-${flagCode} absolute inset-0`}
            style={{
              fontSize: '0.8rem',
              lineHeight: '1',
              transform: 'scale(1.2)',
            }}
          ></span>
        )}
      </div>
    );
  };

  const shouldShowBestNthPlaceTable = () => {
    // Check if we need to show Nth place teams
    // This would be true when numIn % numThrough != 0 (not all teams advance)
    const totalTeams = Object.values(transformedGroups).reduce((sum, teams) => sum + teams.length, 0);
    const totalGroups = Object.keys(transformedGroups).length;
    
    // Get numThrough from competition round info
    const groupStageRound = getRoundInfo(importedCompetition.compName)?.rounds?.find((round: any) => round.type === 'GROUP');
    const totalTeamsAdvancing = groupStageRound?.numThrough || totalGroups * 2;
    
    return totalTeams % totalTeamsAdvancing !== 0;
  };

  return (
    <div className="h-full overflow-y-auto space-y-4">
      {Object.entries(transformedGroups).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, teams]) => (
        <div key={groupName} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {/* Group Header */}
          <div className="bg-gray-750 px-4 py-3 border-b border-gray-700">
            <h3 className="font-semibold text-green-400">Group {groupName}</h3>
          </div>
          
          {/* Column Headers */}
          <div className="px-4 py-2 border-b border-gray-700 bg-gray-750">
            <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 font-medium">
              <div className="col-span-4">Country</div>
              <div className="col-span-8 flex justify-end gap-2">
                <div className="flex-1 text-center">GP</div>
                <div className="flex-1 text-center">PTS</div>
                <div className="flex-1 text-center">W</div>
                <div className="flex-1 text-center">D</div>
                <div className="flex-1 text-center">L</div>
                <div className="flex-1 text-center">GD</div>
              </div>
            </div>
          </div>
          
          {/* Teams */}
          <div className="p-2 space-y-1">
            {sortTeams(teams).map((team) => {
              const stats = calculateStats(team);
              
              return (
                <div key={team.countryName} className="bg-gray-700 rounded px-3 py-2">
                  <div className="grid grid-cols-12 gap-2 items-center text-sm">
                    <div className="col-span-4 flex items-center gap-2">
                      <TeamFlag countryName={team.countryName} />
                      <span className="text-white font-medium truncate">{team.countryName}</span>
                    </div>
                    <div className="col-span-8 flex justify-end gap-2">
                      <div className="flex-1 text-center text-gray-300">{stats.gamesPlayed}</div>
                      <div className="flex-1 text-center text-green-400 font-medium">{stats.points}</div>
                      <div className="flex-1 text-center text-gray-300">{team.wins}</div>
                      <div className="flex-1 text-center text-gray-300">{team.draws}</div>
                      <div className="flex-1 text-center text-gray-300">{team.losses}</div>
                      <div className="flex-1 text-center text-gray-300">
                        {stats.goalDifference > 0 ? '+' : ''}{stats.goalDifference}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      {/* Nth Place Teams Table */}
      {shouldShowBestNthPlaceTable() && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-750 px-4 py-3 border-b border-gray-700">
            <h3 className="font-semibold text-green-400">{getBestNthPlaceCount(totalGroups, groupStageRound?.numThrough || totalGroups * 2)}{getNthPlaceSuffix(getBestNthPlaceCount(totalGroups, groupStageRound?.numThrough || totalGroups * 2))} place teams</h3>
          </div>
          
          {/* Column Headers */}
          <div className="px-4 py-2 border-b border-gray-700 bg-gray-750">
            <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 font-medium">
              <div className="col-span-4">Country</div>
              <div className="col-span-8 flex justify-end gap-2">
                <div className="flex-1 text-center">GP</div>
                <div className="flex-1 text-center">PTS</div>
                <div className="flex-1 text-center">W</div>
                <div className="flex-1 text-center">D</div>
                <div className="flex-1 text-center">L</div>
                <div className="flex-1 text-center">GD</div>
              </div>
            </div>
          </div>
          
          {/* Nth Place Teams */}
          <div className="p-2 space-y-1">
            {calculateNthPlaceTeams(transformedGroups, groupStageRound?.numThrough || totalGroups * 2).map((team: GroupTeamStats) => {
              const stats = calculateStats(team);
              
              return (
                <div key={team.countryName} className="bg-gray-700 rounded px-3 py-2">
                  <div className="grid grid-cols-12 gap-2 items-center text-sm">
                    <div className="col-span-4 flex items-center gap-2">
                      <TeamFlag countryName={team.countryName} />
                      <span className="text-white font-medium truncate">{team.countryName}</span>
                    </div>
                    <div className="col-span-8 flex justify-end gap-2">
                      <div className="flex-1 text-center text-gray-300">{stats.gamesPlayed}</div>
                      <div className="flex-1 text-center text-green-400 font-medium">{stats.points}</div>
                      <div className="flex-1 text-center text-gray-300">{team.wins}</div>
                      <div className="flex-1 text-center text-gray-300">{team.draws}</div>
                      <div className="flex-1 text-center text-gray-300">{team.losses}</div>
                      <div className="flex-1 text-center text-gray-300">
                        {stats.goalDifference > 0 ? '+' : ''}{stats.goalDifference}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupStageComponent;
