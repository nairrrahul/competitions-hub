import React from 'react';
import type { TeamSlot } from '../../types/DrawMakerTypes';

interface PathAssignment {
  pathNumber: number;
  teams: TeamSlot[];
}

interface PathAssignmentsPanelProps {
  pathAssignments: PathAssignment[];
  currentPathIndex: number;
  onPathSelect: (pathNumber: number) => void;
}

const PathAssignmentsPanel: React.FC<PathAssignmentsPanelProps> = ({
  pathAssignments,
  currentPathIndex,
  onPathSelect
}) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 flex-shrink-0">
      <div className="bg-gray-750 px-4 py-3 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-green-400">Path Assignments</h2>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pathAssignments.length > 0 ? (
            pathAssignments.map((assignment) => (
              <div
                key={assignment.pathNumber}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  currentPathIndex === assignment.pathNumber - 1
                    ? 'border-green-500 bg-gray-700'
                    : 'border-gray-600 bg-gray-800 hover:bg-gray-700'
                }`}
                onClick={() => onPathSelect(assignment.pathNumber)}
              >
                <h3 className="font-semibold text-green-400 mb-2">Path {assignment.pathNumber}</h3>
                <div className="space-y-1">
                  {assignment.teams.map((team) => (
                    <div key={team.id} className="flex items-center gap-2 text-sm">
                      {team.flagCode && (
                        <span className={`fi fi-${team.flagCode} w-5 h-4 rounded`} />
                      )}
                      <span>{team.name}</span>
                    </div>
                  ))}
                  {assignment.teams.length === 0 && (
                    <div className="text-gray-500 text-sm">No teams assigned yet</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-gray-500 text-center py-8">
              Press "Simulate" to draw teams into paths
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PathAssignmentsPanel;
