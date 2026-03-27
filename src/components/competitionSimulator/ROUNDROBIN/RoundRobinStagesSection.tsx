import React from 'react';
import GroupStageComponent from '../GROUPKO/GroupStageComponent';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  groups: { [key: string]: string[] };
}

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

interface RoundRobinStagesSectionProps {
  importedCompetition: ImportedCompetition;
  transformedGroups: TransformedGroups;
}

const StagesSection: React.FC<RoundRobinStagesSectionProps> = ({ importedCompetition, transformedGroups}) => {

  const renderStageContent = () => {
    if (!importedCompetition.compType) {
      return (
        <div className="text-gray-400">
          <p>Select a stage to view details</p>
        </div>
      );
    }

    return (<GroupStageComponent 
      transformedGroups={transformedGroups} 
      importedCompetition={importedCompetition}
      needNthPlace={false} />);
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 h-full relative flex flex-col">
      {/* Header with dropdown */}
      <div className="flex justify-between items-start mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-green-400">STAGES</h2>
      </div>

      {/* Stage Content */}
      <div className="flex-1 overflow-y-auto">
        {renderStageContent()}
      </div>
    </div>
  );
};

export default StagesSection;
