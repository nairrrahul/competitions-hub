import React from 'react';
import GroupKOSimulator from './GROUPKO/GroupKOSimulator';
import HomeAwaySimulator from './HOMEAWAY/HomeAwaySimulator';
import KOSimulator from './KNOCKOUT/KOSimulator';
import type { CompetitionSchedule, Match, HomeAwaySchedule } from '../../utils/SchedulerUtils';
import { useGlobalStore } from '../../state/GlobalState';
import type { Squad } from '../../types/rosterManager';
import { simulateKnockoutRound, simulateMatchesForRound, type RoundType } from '../../utils/MatchEngine';
import { generateKnockout24, generateKnockout48, generateKnockoutPO2 } from '../../utils/BracketGeneration';
import { isPowerOfTwo } from '../../utils/playerAging';
import RoundRobinSimulator from './ROUNDROBIN/RoundRobinSimulator';
import { formatDateTimeStamp } from '../../utils/MathUtils';

interface ImportedCompetition {
  compName: string;
  numTeams: number;
  numThrough: number;
  compType: string;
  isHA?: boolean;
  groups?: { [key: string]: string[] };
  pairs?: { home: string; away: string }[];
  bracket?: Record<number, Record<number, (string | number)[]>>;
}

interface SimulatorTabProps {
  hasData: boolean;
  importedCompetition: ImportedCompetition | null;
  matchSchedule: CompetitionSchedule | HomeAwaySchedule | null;
  simulatorSchedule: RearrangedSchedule;
  setSimulatorSchedule: React.Dispatch<React.SetStateAction<RearrangedSchedule>>;
  transformedGroups: TransformedGroups;
  setTransformedGroups: React.Dispatch<React.SetStateAction<TransformedGroups>>;
  currentMatchday: number;
  setCurrentMatchday: React.Dispatch<React.SetStateAction<number>>;
  viewMatchday: number;
  setViewMatchday: React.Dispatch<React.SetStateAction<number>>;
}

export interface GroupTeamStats {
  countryName: string;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface PairTeamStats {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  homeLegPlayed: boolean;
  awayLegPlayed: boolean;
  firstLegHomeGoals: number;
  firstLegAwayGoals: number;
  secondLegHomeGoals: number;
  secondLegAwayGoals: number;
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

const SimulatorTab: React.FC<SimulatorTabProps> = ({ hasData, importedCompetition, matchSchedule, simulatorSchedule, setSimulatorSchedule, transformedGroups, setTransformedGroups, currentMatchday, setCurrentMatchday, viewMatchday, setViewMatchday }) => {
  const { getSquad } = useGlobalStore();
  const getRoundInfo = useGlobalStore(state => state.getRoundInfo);
  const getThirdPlacings = useGlobalStore(state => state.getThirdPlaceFor24);
  const getThirdPlacings48 = useGlobalStore(state => state.getThirdPlaceFor48);
  const compRoundInfo = getRoundInfo(importedCompetition?.compName || '');

  // Load squad information for all nations in the competition
  const getCompetitionSquads = () => {
    if (!importedCompetition) return {};
    
    const squads: { [nation: string]: Squad } = {};
    
    // Get all nations from all groups, pairs, or bracket
    let allNations: string[] = [];
    if (importedCompetition.groups) {
      allNations = Object.values(importedCompetition.groups).flat();
    } else if (importedCompetition.pairs) {
      allNations = importedCompetition.pairs.flatMap(pair => [pair.home, pair.away]);
    } else if (importedCompetition.bracket) {
      // Extract team names from bracket format
      Object.values(importedCompetition.bracket).forEach((roundMatches: Record<number, (string | number)[]>) => {
        Object.values(roundMatches).forEach((teams: (string | number)[]) => {
          teams.forEach((team: string | number) => {
            if (typeof team === 'string') {
              allNations.push(team);
            }
          });
        });
      });
    }
    
    // Load squad for each nation
    allNations.forEach(nation => {
      const squad = getSquad(nation);
      if (squad) {
        squads[nation] = squad;
      }
    });
    
    return squads;
  };

  const convertToMatchdayList = (input: CompetitionSchedule | HomeAwaySchedule): RearrangedSchedule => {
    const result: RearrangedSchedule = {};

    // Check if it's a HomeAwaySchedule (has numeric keys directly)
    const firstKey = Object.keys(input)[0];
    const isHomeAway = firstKey && !isNaN(Number(firstKey));

    if (isHomeAway) {
      // Handle HomeAwaySchedule structure
      const homeAwaySchedule = input as HomeAwaySchedule;
      for (const [numKeyStr, arr] of Object.entries(homeAwaySchedule)) {
        const numKey = Number(numKeyStr);

        if (!result[numKey]) {
          result[numKey] = [];
        }

        for (const item of arr) {
          result[numKey].push({
            stage: "HOMEAWAY",
            group: null,
            match: item,
          });
        }
      }
    } else {
      // Handle CompetitionSchedule structure (groups)
      const competitionSchedule = input as CompetitionSchedule;
      for (const [outerKey, innerObj] of Object.entries(competitionSchedule)) {
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
    }

    return result;
  }

  const transformGroupsData = (): TransformedGroups => {
    if (!importedCompetition) return {};
    const transformed: TransformedGroups = {};
    
    if (importedCompetition.groups) {
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
    }
    
    return transformed;
  };

  const competitionSquads = getCompetitionSquads();
  React.useEffect(() => {
    if (importedCompetition && matchSchedule) {
      // Only initialize if simulatorSchedule is empty (first load)
      if (Object.keys(simulatorSchedule).length === 0) {
        if (importedCompetition.compType === 'HOMEAWAY') {
          const converted = convertToMatchdayList(matchSchedule);
          setSimulatorSchedule(converted);
          setCurrentMatchday(1);
        } else {
          setTransformedGroups(transformGroupsData());
          const converted = convertToMatchdayList(matchSchedule);
          setSimulatorSchedule(converted);
        }
      }
    }
  }, [importedCompetition, matchSchedule, setSimulatorSchedule, setTransformedGroups, setCurrentMatchday, simulatorSchedule]);

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
      case 'GROUP':
      case 'GROUPHA':
        return (
          <RoundRobinSimulator 
            importedCompetition={importedCompetition} 
            matchSchedule={simulatorSchedule}
            competitionSquads={competitionSquads}
            transformedStandings={transformedGroups}
          />
        );
      case 'HOMEAWAY':
        return (
          <HomeAwaySimulator
            importedCompetition={importedCompetition}
            matchSchedule={simulatorSchedule}
            competitionSquads={competitionSquads}
            viewMatchday={viewMatchday}
            setViewMatchday={setViewMatchday}
          />
        );
      case 'KO':
        return (
          <KOSimulator
            importedCompetition={importedCompetition}
            matchSchedule={simulatorSchedule}
            competitionSquads={competitionSquads}
            viewMatchday={viewMatchday}
            setViewMatchday={setViewMatchday}
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

  const onNextRoundGroup = () => {
    const roundMatches = simulatorSchedule[currentMatchday];
    if (!roundMatches) return;

    const result = simulateMatchesForRound(
      roundMatches,
      competitionSquads,
      transformedGroups,
      currentMatchday,
      importedCompetition?.compType || '',
      importedCompetition?.compName || ''
    );

    const updatedSchedule = {
      ...simulatorSchedule,
      [currentMatchday]: result.matches
    };

    setSimulatorSchedule(updatedSchedule);
    setTransformedGroups(result.standings);
    const newMatchday = currentMatchday + 1;
    setCurrentMatchday(newMatchday);
    setViewMatchday(newMatchday);
  }

  const onNextRoundHomeAway = () => {
    const roundMatches = simulatorSchedule[currentMatchday];
    if (!roundMatches) return;

    const result = simulateMatchesForRound(
      roundMatches,
      competitionSquads,
      {}, // Empty standings since HOMEAWAY uses different structure
      currentMatchday,
      importedCompetition?.compType || '',
      importedCompetition?.compName || ''
    );

    const updatedSchedule = {
      ...simulatorSchedule,
      [currentMatchday]: result.matches
    };

    setSimulatorSchedule(updatedSchedule);
    const newMatchday = currentMatchday + 1;
    setCurrentMatchday(newMatchday);
    setViewMatchday(newMatchday);
  }

  const onNextRoundKO = () => {
    const roundMatches = simulatorSchedule[currentMatchday];
    if (!roundMatches) return;

    // Set stage to 'KO' for all matches to enable knockout simulation logic (extra time and penalties)
    const koRoundMatches = roundMatches.map(matchInfo => ({
      ...matchInfo,
      stage: 'KO' as RoundType
    }));

    // Simulate matches with knockout format (extra time and penalties)
    const result = simulateMatchesForRound(
      koRoundMatches,
      competitionSquads,
      {}, // Empty standings since KO doesn't use group standings
      currentMatchday,
      'KO', // Force KO round type for knockout format
      importedCompetition?.compName || ''
    );

    const updatedSchedule = {
      ...simulatorSchedule,
      [currentMatchday]: result.matches
    };

    // Build a complete mapping of global match numbers to winners across all simulated rounds
    const matchNumToWinner: Record<number, string> = {};
    
    for (let matchday = 1; matchday <= currentMatchday; matchday++) {
      const matches = updatedSchedule[matchday];
      if (matches) {
        matches.forEach((matchInfo) => {
          const matchResult = matchInfo.match.result;
          const originalMatchNum = matchInfo.match.matchRiggedOptions.originalBracketMatchNum;
          
          if (matchResult && originalMatchNum !== undefined) {
            let winner: string;
            if (matchResult.team1Goals > matchResult.team2Goals) {
              winner = matchInfo.match.homeTeam;
            } else if (matchResult.team2Goals > matchResult.team1Goals) {
              winner = matchInfo.match.awayTeam;
            } else {
              // Penalty shootout
              if (matchResult.penalties) {
                const team1Pens = matchResult.penalties.team1Results.filter(p => p === 'O').length;
                const team2Pens = matchResult.penalties.team2Results.filter(p => p === 'O').length;
                winner = team1Pens > team2Pens ? matchInfo.match.homeTeam : matchInfo.match.awayTeam;
              } else {
                winner = matchInfo.match.homeTeam; // fallback
              }
            }
            matchNumToWinner[originalMatchNum] = winner;
          }
        });
      }
    }

    // Resolve match number references in all future rounds
    for (let futureMatchday = currentMatchday + 1; futureMatchday <= Object.keys(simulatorSchedule).length; futureMatchday++) {
      if (updatedSchedule[futureMatchday]) {
        const futureRoundMatches = updatedSchedule[futureMatchday];
        
        const resolvedFutureRound = futureRoundMatches.map(matchInfo => {
          const resolveTeam = (team: string | number): string => {
            if (typeof team === 'number') {
              // This is a match number reference
              return matchNumToWinner[team] || `Winner of Match ${team}`;
            } else if (typeof team === 'string' && team.startsWith('Winner of Match ')) {
              // This is a string-based match number reference
              const matchNum = parseInt(team.replace('Winner of Match ', ''));
              return matchNumToWinner[matchNum] || team;
            }
            return team;
          };

          return {
            ...matchInfo,
            match: {
              ...matchInfo.match,
              homeTeam: resolveTeam(matchInfo.match.homeTeam),
              awayTeam: resolveTeam(matchInfo.match.awayTeam)
            }
          };
        });

        updatedSchedule[futureMatchday] = resolvedFutureRound;
      }
    }

    // Generate next round if current round has more than 1 match (not final) and next round doesn't exist
    if (result.matches.length > 1 && !updatedSchedule[currentMatchday + 1]) {
      const winners: string[] = [];
      result.matches.forEach((matchInfo) => {
        const matchResult = matchInfo.match.result;
        if (matchResult) {
          let winner: string;
          if (matchResult.team1Goals > matchResult.team2Goals) {
            winner = matchInfo.match.homeTeam;
          } else if (matchResult.team2Goals > matchResult.team1Goals) {
            winner = matchInfo.match.awayTeam;
          } else {
            // Penalty shootout
            if (matchResult.penalties) {
              const team1Pens = matchResult.penalties.team1Results.filter(p => p === 'O').length;
              const team2Pens = matchResult.penalties.team2Results.filter(p => p === 'O').length;
              winner = team1Pens > team2Pens ? matchInfo.match.homeTeam : matchInfo.match.awayTeam;
            } else {
              winner = matchInfo.match.homeTeam; // fallback
            }
          }
          winners.push(winner);
        }
      });

      // Create next round matches by pairing winners
      const nextRoundMatches: MatchInformation[] = [];
      let nextGlobalMatchNum = 1;
      
      // Get the highest global match number used so far
      let maxGlobalMatchNum = 0;
      for (let md = 1; md <= currentMatchday; md++) {
        if (updatedSchedule[md]) {
          updatedSchedule[md].forEach((matchInfo) => {
            const matchNum = matchInfo.match.matchRiggedOptions.originalBracketMatchNum || 0;
            if (matchNum > maxGlobalMatchNum) {
              maxGlobalMatchNum = matchNum;
            }
          });
        }
      }
      
      for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
          nextRoundMatches.push({
            stage: 'KO' as RoundType,
            group: null,
            match: {
              homeTeam: winners[i],
              awayTeam: winners[i + 1],
              result: null,
              matchRiggedOptions: {
                isRigged: false,
                homeGoals: -1,
                awayGoals: -1,
                originalBracketMatchNum: maxGlobalMatchNum + nextGlobalMatchNum,
                originalBracketRound: currentMatchday + 1
              }
            }
          });
          nextGlobalMatchNum++;
        }
      }

      if (nextRoundMatches.length > 0) {
        updatedSchedule[currentMatchday + 1] = nextRoundMatches;
      }
    }

    setSimulatorSchedule(updatedSchedule);
    const newMatchday = currentMatchday + 1;
    setCurrentMatchday(newMatchday);
    setViewMatchday(newMatchday);
  }

  const onNextRoundGroupKO = () => { 
    const roundMatches = simulatorSchedule[currentMatchday];
    const numGSMatches = compRoundInfo.rounds[0].numMatchdays;
    console.log
    let transferStandings = {};
    if (!roundMatches) return;

    if(currentMatchday <= numGSMatches) {
      const result = simulateMatchesForRound(
        roundMatches,
        competitionSquads,
        transformedGroups,
        currentMatchday,
        importedCompetition?.compType || '',
        importedCompetition?.compName || ''
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
      const {oldMatches, newRound, loserInfo} = simulateKnockoutRound(roundMatches, competitionSquads, currentMatchday, importedCompetition?.compType || '', importedCompetition?.compName || '');
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
      case 'GROUP':
      case 'GROUPHA':
        onNextRoundGroup();
        break;
      case 'HOMEAWAY':
        onNextRoundHomeAway();
        break;
      case 'KO':
        onNextRoundKO();
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

                  const now = new Date();
                  const timestamp = formatDateTimeStamp(now);
                      
                  const rankingData = totalMatchDeltas();
                  const jsonString = JSON.stringify(rankingData, null, 2);
                  const blob = new Blob([jsonString], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${timestamp}-${importedCompetition?.compName || 'competition'}_ranking_deltas.delta.json`;
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
