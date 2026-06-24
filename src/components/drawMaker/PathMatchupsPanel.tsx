import React from 'react';
import DrawMatchupRow from './DrawMatchupRow';

type MatchEntry = string | number;

interface PathAssignment {
  pathNumber: number;
  teams: any[];
}

interface PathMatchupsPanelProps {
  pathAssignments: PathAssignment[];
  currentPathIndex: number;
  pathMatchups: Record<number, Record<number, Record<number, MatchEntry[]>>>;
  revealedMatches: Set<string>;
  renderTeamDisplay: (entry: string | number, isRevealed: boolean) => React.ReactNode;
  onPathSelect: (pathNumber: number) => void;
}

const PathMatchupsPanel: React.FC<PathMatchupsPanelProps> = ({
  pathAssignments,
  currentPathIndex,
  pathMatchups,
  revealedMatches,
  renderTeamDisplay,
  onPathSelect
}) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex-shrink-0">
      <div className="bg-gray-750 px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-green-400">Path {pathAssignments[currentPathIndex]?.pathNumber} Matchups</h2>
        {pathAssignments.length > 1 && (
          <div className="flex gap-2">
            {pathAssignments.map((assignment) => (
              <button
                key={assignment.pathNumber}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  currentPathIndex === assignment.pathNumber - 1
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                onClick={() => onPathSelect(assignment.pathNumber)}
              >
                Path {assignment.pathNumber}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="p-4">
        {pathMatchups[pathAssignments[currentPathIndex]?.pathNumber] ? (
          <div className="space-y-4">
            {Object.entries(pathMatchups[pathAssignments[currentPathIndex].pathNumber]).map(([round, matches]) => (
              <div key={round}>
                <h3 className="text-lg font-bold text-gray-300 mb-3">
                  {round === '1' ? 'First Round' : `Round ${round}`}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(matches as Record<number, MatchEntry[]>).map(([matchNum, teams]) => {
                    const matchKey = `${pathAssignments[currentPathIndex].pathNumber}-${round}-${matchNum}`;
                    const isRevealed = revealedMatches.has(matchKey);
                    const teamsArray = teams as MatchEntry[];
                    
                    return (
                      <DrawMatchupRow
                        key={matchNum}
                        homeTeam={renderTeamDisplay(teamsArray[0], isRevealed)}
                        awayTeam={renderTeamDisplay(teamsArray[1], isRevealed)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            Not enough teams in this path for matchups
          </div>
        )}
      </div>
    </div>
  );
};

export default PathMatchupsPanel;
