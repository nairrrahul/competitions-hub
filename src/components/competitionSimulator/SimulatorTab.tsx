import React from 'react';
import GroupKOSimulator from './GROUPKO/GroupKOSimulator';
import type { CompetitionSchedule, Match } from '../../utils/SchedulerUtils';
import { useGlobalStore } from '../../state/GlobalState';
import type { Squad } from '../../types/rosterManager';
import { simulateKnockoutRound, simulateMatchesForRound, type RoundType } from '../../utils/MatchEngine';
import { generateKnockout24, generateKnockout48, generateKnockoutPO2 } from '../../utils/BracketGeneration';
import { isPowerOfTwo } from '../../utils/playerAging';

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
  simulatorSchedule: RearrangedSchedule;
  setSimulatorSchedule: React.Dispatch<React.SetStateAction<RearrangedSchedule>>;
  transformedGroups: TransformedGroups;
  setTransformedGroups: React.Dispatch<React.SetStateAction<TransformedGroups>>;
  currentMatchday: number;
  setCurrentMatchday: React.Dispatch<React.SetStateAction<number>>;
}

export interface GroupTeamStats {
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

export interface MatchInformation {
  stage: RoundType;
  group: string | null;
  match: Match;
}

export interface RearrangedSchedule {
  [matchday: number]: MatchInformation[];
}

const SimulatorTab: React.FC<SimulatorTabProps> = ({ hasData, importedCompetition, matchSchedule, simulatorSchedule, setSimulatorSchedule, transformedGroups, setTransformedGroups, currentMatchday, setCurrentMatchday }) => {
  const { getSquad } = useGlobalStore();
  const getRoundInfo = useGlobalStore(state => state.getRoundInfo);
  const getThirdPlacings = useGlobalStore(state => state.getThirdPlaceFor24);
  const getThirdPlacings48 = useGlobalStore(state => state.getThirdPlaceFor48);
  const compRoundInfo = getRoundInfo(importedCompetition?.compName || '');

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

  const convertToMatchdayList = (input: CompetitionSchedule): RearrangedSchedule => {
    const result: RearrangedSchedule = {};

    for (const [outerKey, innerObj] of Object.entries(input)) {
      for (const [numKeyStr, arr] of Object.entries(innerObj)) {
        const numKey = Number(numKeyStr);

        if (!result[numKey]) {
          result[numKey] = [];
        }

        for (const item of arr) {
          result[numKey].push({
            stage: "GROUP",
            group: outerKey,
            match: item,
          });
        }
      }
    }

    return result;
  }

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
  React.useEffect(() => {
    if (importedCompetition && matchSchedule && Object.keys(transformedGroups).length === 0) {
      setTransformedGroups(transformGroupsData());
      const converted = convertToMatchdayList(matchSchedule);
      setSimulatorSchedule(converted);
    }
  }, [importedCompetition, matchSchedule, transformedGroups, setSimulatorSchedule, setTransformedGroups]);

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
            matchSchedule={simulatorSchedule}
            competitionSquads={competitionSquads}
            transformedStandings={transformedGroups}
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

  const onNextRoundGroupKO = () => { 
    const roundMatches = simulatorSchedule[currentMatchday];
    const numGSMatches = compRoundInfo.rounds[0].numMatchdays;
    let transferStandings = {};
    if (!roundMatches) return;

    if(currentMatchday <= numGSMatches) {
      const result = simulateMatchesForRound(
        roundMatches,
        competitionSquads,
        transformedGroups
      );

      transferStandings = result.standings;

      const updatedSchedule = {
        ...simulatorSchedule,
        [currentMatchday]: result.matches
      };

      setSimulatorSchedule(updatedSchedule);
      setTransformedGroups(result.standings);
    } else {
      //check if we are in F or P3 or not
      const {oldMatches, newRound, loserInfo} = simulateKnockoutRound(roundMatches, competitionSquads);
      if(roundMatches.length == 1) {
        const updatedSchedule = {
          ...simulatorSchedule,
          [currentMatchday]: oldMatches
        };
        setSimulatorSchedule(updatedSchedule);
      } else {
        if(roundMatches.length == 2 && compRoundInfo.hasP3) {
          const updatedSchedule = {
            ...simulatorSchedule,
            [currentMatchday]: oldMatches,
            [currentMatchday + 1]: loserInfo,
            [currentMatchday + 2]: newRound
          };
          setSimulatorSchedule(updatedSchedule);
        } else {
          const updatedSchedule = {
            ...simulatorSchedule,
            [currentMatchday]: oldMatches,
            [currentMatchday + 1]: newRound
          };
          setSimulatorSchedule(updatedSchedule);
        }
      }
    }

    const newMatchday = currentMatchday + 1;
    console.log(newMatchday, numGSMatches);
    setCurrentMatchday(newMatchday);

    if(newMatchday === numGSMatches + 1) {
      if(importedCompetition?.numTeams == 24) {

        const knockoutMatches = generateKnockout24(transferStandings, getThirdPlacings);
        setSimulatorSchedule(prev => ({
          ...prev,
          [newMatchday]: knockoutMatches
        }));

      }else if(importedCompetition?.numTeams == 48) {

        const knockoutMatches = generateKnockout48(transferStandings, getThirdPlacings48);
        setSimulatorSchedule(prev => ({
          ...prev,
          [newMatchday]: knockoutMatches
        }));    

      } else if(isPowerOfTwo(importedCompetition?.numTeams || 0)) {

        const knockoutMatches = generateKnockoutPO2(transferStandings);
        setSimulatorSchedule(prev => ({
          ...prev,
          [newMatchday]: knockoutMatches
        }));

      }
    }
  }

  const onNextRound = (compType: string) => {
    switch (compType) {
      case 'GROUPKO':
        onNextRoundGroupKO();
        break;
      default:
        console.log(`No simulation logic for competition type: ${compType}`);
    }
  }

  const maxMatchday = Math.max(0, ...Object.keys(simulatorSchedule).map(Number));

  const totalMatchDeltas = () => {
    const deltas: { [nation: string]: number } = {};
    for (const matchday of Object.values(simulatorSchedule)) {
      for (const matchInfo of matchday) {
        const match = matchInfo.match;
        if (match.result) {
          const homeDelta = match.result.rankingDelta ? match.result.rankingDelta[match.homeTeam] || 0 : 0;
          const awayDelta = match.result.rankingDelta ? match.result.rankingDelta[match.awayTeam] || 0 : 0;
          deltas[match.homeTeam] = (deltas[match.homeTeam] || 0) + homeDelta;
          deltas[match.awayTeam] = (deltas[match.awayTeam] || 0) + awayDelta;
        }
      }
    }
    return deltas;
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      {/* Header Row with Simulate Button */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between mt-2">
        <h1 className="text-xl font-bold text-green-400">{importedCompetition?.compName}</h1>
        <div className="flex items-center gap-2">
          {currentMatchday > maxMatchday && (
            <>
              <button
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                onClick={() => {
                  // TODO: implement history view action
                  console.log('History clicked');
                }}
              >
                History
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium"
                onClick={() => {
                  const rankingData = totalMatchDeltas();
                  const jsonString = JSON.stringify(rankingData, null, 2);
                  const blob = new Blob([jsonString], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${importedCompetition?.compName || 'competition'}_ranking_deltas.json`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  
                  URL.revokeObjectURL(url);
                }}
              >
                Export Ranking Info
              </button>
            </>
          )}

          <button
            className={`px-4 py-2 rounded-lg transition-colors font-medium
              ${currentMatchday > maxMatchday
                ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
            onClick={() => onNextRound(importedCompetition?.compType || 'NA')}
          >
            Simulate
          </button>
        </div>
      </div>
      
      {/* Simulator Content */}
      <div className="h-[calc(100%-4rem)]">
        {renderSimulatorContent()}
      </div>
    </div>
  );
};

export default SimulatorTab;
