import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '../../state/GlobalState';
import { generateBracketPositions, roundInfoFromBracket } from '../../utils/BracketGeneration';
import type { TeamSlot } from '../../types/DrawMakerTypes';
import DrawSeedCell from './DrawSeedCell';
import DrawMatchupRow from './DrawMatchupRow';
import { formatDateTimeStamp } from '../../utils/MathUtils';

interface BracketDrawSimulatorProps {
  teamSlots: TeamSlot[];
}

const BracketDrawSimulator: React.FC<BracketDrawSimulatorProps> = ({ teamSlots }) => {
  const getNationInfo = useGlobalStore(state => state.getNationInfo);
  
  const [seededTeams, setSeededTeams] = useState<(TeamSlot & { seed: number })[]>([]);
  const [matchInfo, setMatchInfo] = useState<Record<number, Record<number, (string | number)[]>>>({});
  const [isSimulated, setIsSimulated] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [revealedMatches, setRevealedMatches] = useState<Set<string>>(new Set());

  // Seed teams based on world ranking points
  useEffect(() => {
    const filledTeams = teamSlots.filter(slot => slot.name.trim() !== '');
    
    // Sort by ranking points (descending)
    const sortedTeams = [...filledTeams].sort((a, b) => {
      const aRanking = getNationInfo(a.name)?.rankingPts || 0;
      const bRanking = getNationInfo(b.name)?.rankingPts || 0;
      return bRanking - aRanking;
    });

    // Assign seeds (1 to N)
    const teamsWithSeeds = sortedTeams.map((team, index) => ({
      ...team,
      seed: index + 1
    }));

    setSeededTeams(teamsWithSeeds);
  }, [teamSlots, getNationInfo]);

  // Render team display with flag or question mark
  const renderTeamDisplay = (entry: string | number, isRevealed: boolean = true) => {
    if (!isRevealed) {
      return (
        <>
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center font-bold text-sm animate-pulse">
            ?
          </div>
          <div className="font-medium text-gray-500">...</div>
        </>
      );
    }

    if (typeof entry === 'number') {
      // This is a reference to a match winner from previous round
      return (
        <>
          <div className="font-medium text-gray-400">Winner of Match {entry}</div>
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center font-bold text-sm">
            ?
          </div>
        </>
      );
    }

    // This is a team name
    const team = seededTeams.find(t => t.name === entry);
    const flagCode = team?.flagCode || '';

    if (flagCode) {
      return (
        <>
          <div className="relative w-7 h-5 overflow-hidden rounded flex items-center justify-center bg-gray-600 flex-shrink-0">
            <span
              className={`fi fi-${flagCode} absolute inset-0`}
              style={{
                fontSize: '1.5rem',
                lineHeight: '1',
                transform: 'scale(1.2)',
              }}
            />
          </div>
          <div className="font-medium">{entry}</div>
        </>
      );
    } else {
      return (
        <>
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center font-bold text-sm">
            ?
          </div>
          <div className="font-medium">{entry}</div>
        </>
      );
    }
  };

  // Export bracket to JSON file
  const exportBracket = () => {
    if (!isSimulated || Object.keys(matchInfo).length === 0) {
      return;
    }

    const exportData = {
      compName: "Knockout Bracket",
      numTeams: seededTeams.length,
      numThrough: -1,
      compType: "KO",
      isHA: false,
      bracket: matchInfo
    };

    // Generate timestamp in YYYYMMDDHHMMSS format
    const now = new Date();
    const timestamp = formatDateTimeStamp(now);

    // Create filename
    const filename = `${timestamp}-KnockoutBracket.comp.json`;

    // Create and download JSON file
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Simulate draw
  const simulateDraw = () => {
    const bracketPositions = generateBracketPositions(seededTeams.length);
    console.log('Bracket positions generated:', bracketPositions);
    console.log('Number of teams:', seededTeams);
    
    // Create placedSeeds array with countries placed in their seed locations
    const placedSeeds = bracketPositions.map((seed) => {
      if (seed === null) {
        return null;
      }
      return seededTeams[seed - 1].name;
    });
    console.log('Placed seeds:', placedSeeds);
    
    const matchInfoData = roundInfoFromBracket(placedSeeds);
    console.log("Match Info:", matchInfoData);
    
    setMatchInfo(matchInfoData);
    setIsSimulating(true);
    setIsSimulated(true);
    setRevealedMatches(new Set());

    // Calculate total number of matches across all rounds
    const allMatches: { round: number; matchNum: number }[] = [];
    Object.entries(matchInfoData).forEach(([round, matches]) => {
      Object.keys(matches).forEach(matchNum => {
        allMatches.push({ round: parseInt(round), matchNum: parseInt(matchNum) });
      });
    });

    // Reveal matches one by one with cascading delay
    allMatches.forEach((match, index) => {
      setTimeout(() => {
        setRevealedMatches(prev => {
          const newSet = new Set(prev);
          newSet.add(`${match.round}-${match.matchNum}`);
          return newSet;
        });

        // Complete simulation after all matches revealed
        if (index === allMatches.length - 1) {
          setTimeout(() => {
            setIsSimulating(false);
          }, 100);
        }
      }, index * 150);
    });
  };

  // Split seeds into columns (max 5 per row)
  const getSeedColumns = () => {
    const columns: (TeamSlot & { seed: number })[][] = [];
    for (let i = 0; i < seededTeams.length; i += 5) {
      columns.push(seededTeams.slice(i, i + 5));
    }
    return columns;
  };

  const seedColumns = getSeedColumns();

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-green-400 mb-2">Knockout Bracket Draw</h1>
            <p className="text-gray-400">Simulate the knockout bracket draw based on seeding</p>
          </div>
          <div className="flex gap-3">
            {isSimulated && (
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                onClick={exportBracket}
              >
                Export
              </button>
            )}
            <button
              className={`font-bold py-3 px-8 rounded-lg transition-colors ${
                isSimulating
                  ? 'bg-yellow-600 text-white'
                  : isSimulated
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              onClick={simulateDraw}
              disabled={isSimulating}
            >
              {isSimulating ? 'Simulating...' : isSimulated ? 'Resimulate' : 'Simulate'}
            </button>
          </div>
        </div>

        {/* Seeds Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-green-400 mb-4">Seeds</h2>
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
            {seedColumns.map((column, colIndex) => (
              <div key={colIndex} className="flex gap-4 mb-4">
                {column.map((team) => (
                  <DrawSeedCell
                    key={team.id}
                    seed={team.seed}
                    teamName={team.name}
                    flagCode={team.flagCode}
                    rankingPoints={getNationInfo(team.name)?.rankingPts || 0}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Draw Section */}
        <div>
          <h2 className="text-xl font-bold text-green-400 mb-4">Draw</h2>
          
          {isSimulated ? (
            <div className="space-y-6">
              {/* First Round */}
              {matchInfo[1] && Object.keys(matchInfo[1]).length > 0 && (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <h3 className="text-lg font-bold text-gray-300 mb-4">First Round</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(matchInfo[1]).map(([matchNum, teams]) => {
                      const matchKey = `1-${matchNum}`;
                      const isRevealed = revealedMatches.has(matchKey);
                      
                      return (
                        <DrawMatchupRow
                          key={matchNum}
                          homeTeam={renderTeamDisplay(teams[0], isRevealed)}
                          awayTeam={renderTeamDisplay(teams[1], isRevealed)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Second Round (if byes exist) */}
              {matchInfo[2] && Object.keys(matchInfo[2]).length > 0 && (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                  <h3 className="text-lg font-bold text-gray-300 mb-4">Second Round (Byes)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(matchInfo[2]).map(([matchNum, teams]) => {
                      const matchKey = `2-${matchNum}`;
                      const isRevealed = revealedMatches.has(matchKey);
                      
                      return (
                        <DrawMatchupRow
                          key={matchNum}
                          homeTeam={renderTeamDisplay(teams[0], isRevealed)}
                          awayTeam={renderTeamDisplay(teams[1], isRevealed)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
              <p className="text-gray-400">Press "Simulate" to generate the bracket draw</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BracketDrawSimulator;
