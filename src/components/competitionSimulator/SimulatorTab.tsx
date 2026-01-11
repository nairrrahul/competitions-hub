import React from 'react';
import GroupKOSimulator from './GROUPKO/GroupKOSimulator';
import type { CompetitionSchedule } from '../../utils/SchedulerUtils';
import { useGlobalStore } from '../../state/GlobalState';
import type { Squad } from '../../types/rosterManager';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  groups: { [key: string]: string[] };
}

interface SimulatorTabProps {
  hasData: boolean;
  importedCompetition: ImportedCompetition | null;
  matchSchedule: CompetitionSchedule | null;
}

const SimulatorTab: React.FC<SimulatorTabProps> = ({ hasData, importedCompetition, matchSchedule }) => {
  const { getSquad } = useGlobalStore();

  // Load squad information for all nations in the competition
  const getCompetitionSquads = () => {
    if (!importedCompetition) return {};
    
    const squads: { [nation: string]: Squad } = {};
    
    // Get all nations from all groups
    const allNations = Object.values(importedCompetition.groups).flat();
    
    // Load squad for each nation
    allNations.forEach(nation => {
      const squad = getSquad(nation);
      if (squad) {
        squads[nation] = squad;
      }
    });
    
    return squads;
  };

  const competitionSquads = getCompetitionSquads();
  const renderSimulatorContent = () => {
    if (!hasData || !importedCompetition) {
      return (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <h2 className="text-2xl font-bold text-green-400 mb-4">Simulator</h2>
          <p className="text-gray-400">
            Under Construction, but import first!
          </p>
        </div>
      );
    }

    // Render different simulators based on competition type
    switch (importedCompetition.compType) {
      case 'GROUPKO':
        return (
          <GroupKOSimulator 
            importedCompetition={importedCompetition} 
            matchSchedule={matchSchedule}
            competitionSquads={competitionSquads}
          />
        );
      default:
        return (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
            <h2 className="text-2xl font-bold text-green-400 mb-4">Simulator</h2>
            <p className="text-gray-400">
              Competition type "{importedCompetition.compType}" not yet supported.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      {renderSimulatorContent()}
    </div>
  );
};

export default SimulatorTab;
