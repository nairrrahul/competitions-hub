import React from 'react';
import type { CompetitionSchedule } from '../../../utils/SchedulerUtils';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  groups: { [key: string]: string[] };
}

interface MatchesSectionProps {
  importedCompetition: ImportedCompetition;
  matchSchedule: CompetitionSchedule | null;
}

const MatchesSection: React.FC<MatchesSectionProps> = ({ importedCompetition, matchSchedule }) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 h-full">
      <h2 className="text-xl font-bold text-green-400 mb-4">MATCHES</h2>
      {/* TODO: Implement matches display logic */}
      <div className="text-gray-400">
        <p>Match content will be displayed here</p>
        <p>Groups: {Object.keys(importedCompetition.groups).length}</p>
        {matchSchedule && <p>Schedule loaded: {Object.keys(matchSchedule).length} groups</p>}
      </div>
    </div>
  );
};

export default MatchesSection;
