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

  const transformGroupsData = (): TransformedGroups => {
    if (!importedCompetition) return {};
    const transformed: TransformedGroups = {};
    
    Object.entries(importedCompetition.groups).forEach(([groupName, countries]) => {
      transformed[groupName] = countries.map(country => ({
        countryName: country,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0
      }));
    });
    
    return transformed;
  };

  const competitionSquads = getCompetitionSquads();
  const transformedGroups = transformGroupsData();

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
            transformedSquads={transformedGroups}
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
      {/* Header Row with Simulate Button */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between mt-2">
        <h1 className="text-xl font-bold text-green-400">World Cup</h1>
        <button 
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          onClick={() => {console.log(matchSchedule); console.log(importedCompetition);}} // Empty function for now
        >
          Simulate
        </button>
      </div>
      
      {/* Simulator Content */}
      <div className="h-[calc(100%-4rem)]">
        {renderSimulatorContent()}
      </div>
    </div>
  );
};

export default SimulatorTab;
