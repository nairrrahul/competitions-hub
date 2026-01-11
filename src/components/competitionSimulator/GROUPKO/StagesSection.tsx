import React, { useState } from 'react';
import { useGlobalStore } from '../../../state/GlobalState';
import type { CompetitionSchedule } from '../../../utils/SchedulerUtils';
import GroupStageComponent from './GroupStageComponent';
import KnockoutStageComponent from './KnockoutStageComponent';

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

interface StagesSectionProps {
  importedCompetition: ImportedCompetition;
  matchSchedule: CompetitionSchedule | null;
  transformedGroups: TransformedGroups;
}

const StagesSection: React.FC<StagesSectionProps> = ({ importedCompetition, matchSchedule, transformedGroups }) => {
  const getRoundInfo = useGlobalStore(state => state.getRoundInfo);
  const [selectedStage, setSelectedStage] = useState<string>('');

  const getAvailableStages = () => {
    const roundInfo = getRoundInfo(importedCompetition.compName);
    if (!roundInfo?.rounds) return [];

    // Filter stages to only include those with scheduled matches
    return roundInfo.rounds.filter((round: any) => {
      // For group stage, check if matchSchedule has group data
      if (round.type === 'GROUP') {
        return matchSchedule && Object.keys(matchSchedule).length > 0;
      }
      
      // For knockout rounds, check if matchSchedule exists (non-group data)
      return matchSchedule && !Object.keys(matchSchedule).some(key => 
        importedCompetition.groups[key]
      );
    }).map((round: any) => round.roundName || round.type);
  };

  const getStageType = (stageName: string) => {
    const roundInfo = getRoundInfo(importedCompetition.compName);
    if (!roundInfo?.rounds) return null;
    
    const round = roundInfo.rounds.find((r: any) => 
      (r.roundName || r.type) === stageName
    );
    
    return round?.type || null;
  };

  const availableStages = getAvailableStages();
  const stageType = selectedStage ? getStageType(selectedStage) : null;

  const renderStageContent = () => {
    if (!selectedStage) {
      return (
        <div className="text-gray-400">
          <p>Select a stage to view details</p>
        </div>
      );
    }

    if (stageType === 'GROUP') {
      return <GroupStageComponent transformedGroups={transformedGroups} importedCompetition={importedCompetition} />;
    } else if (stageType === 'KO' || stageType === 'P3') {
      return <KnockoutStageComponent />;
    } else {
      return (
        <div className="text-gray-400">
          <p>Unknown stage type: {stageType}</p>
        </div>
      );
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 h-full relative flex flex-col">
      {/* Header with dropdown */}
      <div className="flex justify-between items-start mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-green-400">STAGES</h2>
        
        {/* Stage Dropdown */}
        <div className="relative">
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
          >
            <option value="">Select Stage</option>
            {availableStages.map((stage: string, index: number) => (
              <option key={index} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stage Content */}
      <div className="flex-1 overflow-y-auto">
        {renderStageContent()}
      </div>
    </div>
  );
};

export default StagesSection;
