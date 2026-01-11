import React from 'react';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  groups: { [key: string]: string[] };
}

interface StagesSectionProps {
  importedCompetition: ImportedCompetition;
}

const StagesSection: React.FC<StagesSectionProps> = ({ importedCompetition }) => {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 h-full">
      <h2 className="text-xl font-bold text-green-400 mb-4">STAGES</h2>
      {/* TODO: Implement stages display logic */}
      <div className="text-gray-400">
        <p>Competition: {importedCompetition.compName}</p>
        <p>Type: {importedCompetition.compType}</p>
        <p>Teams: {importedCompetition.numTeams}</p>
        <p>Stages content will be displayed here</p>
      </div>
    </div>
  );
};

export default StagesSection;
