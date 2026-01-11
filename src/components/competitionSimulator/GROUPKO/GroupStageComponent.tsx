import React from 'react';
import { useGlobalStore } from '../../../state/GlobalState';

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
}

const GroupStageComponent: React.FC<GroupStageComponentProps> = ({ transformedGroups }) => {
  const getNationFlagCode = useGlobalStore(state => state.getNationFlagCode);

  const calculateStats = (team: GroupTeamStats) => {
    const gamesPlayed = team.wins + team.draws + team.losses;
    const points = team.wins * 3 + team.draws;
    const goalDifference = team.goalsFor - team.goalsAgainst;
    
    return {
      gamesPlayed,
      points,
      goalDifference
    };
  };

  const sortTeams = (teams: GroupTeamStats[]) => {
    return [...teams].sort((a, b) => {
      const statsA = calculateStats(a);
      const statsB = calculateStats(b);
      
      // Sort by points
      if (statsB.points !== statsA.points) {
        return statsB.points - statsA.points;
      }
      
      // Sort by goal difference
      if (statsB.goalDifference !== statsA.goalDifference) {
        return statsB.goalDifference - statsA.goalDifference;
      }
      
      // Sort by goals for
      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }
      
      // Sort by alphabetical order
      return a.countryName.localeCompare(b.countryName);
    });
  };

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
              const flagCode = getNationFlagCode(team.countryName);
              
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
    </div>
  );
};

export default GroupStageComponent;
