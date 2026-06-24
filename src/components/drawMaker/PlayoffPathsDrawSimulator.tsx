import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '../../state/GlobalState';
import PotsDisplay from './PotsDisplay';
import PathAssignmentsPanel from './PathAssignmentsPanel';
import PathMatchupsPanel from './PathMatchupsPanel';
import { generateBracketPositions, roundInfoFromBracket } from '../../utils/BracketGeneration';
import { formatDateTimeStamp } from '../../utils/MathUtils';
import type { TeamSlot } from '../../types/DrawMakerTypes';

type MatchEntry = string | number;

interface PlayoffPathsDrawSimulatorProps {
  teamSlots: TeamSlot[];
  playoffPaths: number;
}

interface PathAssignment {
  pathNumber: number;
  teams: TeamSlot[];
}

const PlayoffPathsDrawSimulator: React.FC<PlayoffPathsDrawSimulatorProps> = ({ teamSlots, playoffPaths }) => {
  const getNationInfo = useGlobalStore(state => state.getNationInfo);
  
  const [pots, setPots] = useState<{ [key: string]: TeamSlot[] }>({});
  const [expandedPots, setExpandedPots] = useState<{ [key: string]: boolean }>({});
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [pathAssignments, setPathAssignments] = useState<PathAssignment[]>([]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [pathMatchups, setPathMatchups] = useState<Record<number, Record<number, Record<number, MatchEntry[]>>>>({});
  const [revealedMatches, setRevealedMatches] = useState<Set<string>>(new Set());

  // Seed teams into pots of size N (where N = number of paths)
  useEffect(() => {
    const filledTeams = teamSlots.filter(slot => slot.name.trim() !== '');
    
    // Separate highlighted and non-highlighted teams
    const nonHighlighted = filledTeams.filter(t => !t.isHighlighted);
    const highlighted = filledTeams.filter(t => t.isHighlighted);
    
    // Sort each group by ranking points (descending)
    const sortFn = (a: TeamSlot, b: TeamSlot) => {
      const aRanking = getNationInfo(a.name)?.rankingPts || 0;
      const bRanking = getNationInfo(b.name)?.rankingPts || 0;
      return bRanking - aRanking;
    };
    
    nonHighlighted.sort(sortFn);
    highlighted.sort(sortFn);
    
    // Combine: non-highlighted first, then highlighted
    const sortedTeams = [...nonHighlighted, ...highlighted];

    // Allocate teams to pots of size N
    const newPots: { [key: string]: TeamSlot[] } = {};
    let potIndex = 0;
    
    for (let i = 0; i < sortedTeams.length; i++) {
      const potKey = `Pot ${potIndex + 1}`;
      if (!newPots[potKey]) {
        newPots[potKey] = [];
      }
      newPots[potKey].push(sortedTeams[i]);
      
      // Move to next pot after adding N teams
      if ((i + 1) % playoffPaths === 0) {
        potIndex++;
      }
    }

    setPots(newPots);
    
    // Initialize expanded state
    Object.keys(newPots).forEach(potKey => {
      setExpandedPots(prev => ({ ...prev, [potKey]: true }));
    });

    // Reset simulation state
    setPathAssignments([]);
    setSimulationComplete(false);
    setIsSimulating(false);
    setPathMatchups({});
    setRevealedMatches(new Set());
    setCurrentPathIndex(0);
  }, [teamSlots, playoffPaths, getNationInfo]);

  // Auto-reveal first path matchups when simulation completes
  useEffect(() => {
    if (simulationComplete && Object.keys(pathMatchups).length > 0 && revealedMatches.size === 0) {
      handlePathSelect(1);
    }
  }, [simulationComplete, pathMatchups]);

  // Simulate draw: randomly draw teams into playoff paths
  const simulateDraw = () => {
    if (simulationComplete) {
      // Reset
      setPathAssignments([]);
      setSimulationComplete(false);
      setPathMatchups({});
      setRevealedMatches(new Set());
      setCurrentPathIndex(0);
    }

    setIsSimulating(true);

    // Initialize path assignments
    const assignments: PathAssignment[] = [];
    for (let i = 0; i < playoffPaths; i++) {
      assignments.push({ pathNumber: i + 1, teams: [] });
    }

    // Shuffle teams within each pot and assign to paths
    const potKeys = Object.keys(pots);
    const allAssignments: { team: TeamSlot; pathNumber: number; order: number }[] = [];
    let orderCounter = 0;

    potKeys.forEach((potKey, potIndex) => {
      const potTeams = [...pots[potKey]];
      
      // Shuffle teams within this pot
      for (let i = potTeams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [potTeams[i], potTeams[j]] = [potTeams[j], potTeams[i]];
      }

      // Assign each team to a path (round-robin through paths)
      potTeams.forEach((team, teamIndex) => {
        const pathNumber = (potIndex + teamIndex) % playoffPaths + 1;
        allAssignments.push({ team, pathNumber, order: orderCounter++ });
      });
    });

    // Sort assignments by order for animation
    allAssignments.sort((a, b) => a.order - b.order);

    // Animate assignments
    let assignmentIndex = 0;
    const animateAssignments = () => {
      if (assignmentIndex >= allAssignments.length) {
        // All teams assigned, generate matchups for each path
        generateMatchups(assignments);
        setSimulationComplete(true);
        setIsSimulating(false);
        return;
      }

      const assignment = allAssignments[assignmentIndex];
      
      // Update both local assignments and state
      const pathIndex = assignments.findIndex(p => p.pathNumber === assignment.pathNumber);
      if (pathIndex !== -1) {
        assignments[pathIndex] = {
          ...assignments[pathIndex],
          teams: [...assignments[pathIndex].teams, assignment.team]
        };
      }
      
      setPathAssignments([...assignments]);

      assignmentIndex++;
      setTimeout(animateAssignments, 100);
    };

    animateAssignments();
  };

  // Generate matchups for each path using bracket generation logic
  const generateMatchups = (assignments: PathAssignment[]) => {
    const matchups: Record<number, Record<number, Record<number, MatchEntry[]>>> = {};

    assignments.forEach(assignment => {
      if (assignment.teams.length < 2) return;

      const teamNames = assignment.teams.map(t => t.name);
      const bracketPositions = generateBracketPositions(teamNames.length);
      
      // Place teams in bracket positions
      const placedSeeds = bracketPositions.map((seed) => {
        if (seed === null) return null;
        return teamNames[seed - 1];
      });

      const matchInfo = roundInfoFromBracket(placedSeeds);
      matchups[assignment.pathNumber] = matchInfo;
    });

    setPathMatchups(matchups);
  };

  // Render team display with flag
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
      return (
        <>
          <div className="font-medium text-gray-400">Winner of Match {entry}</div>
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center font-bold text-sm">
            ?
          </div>
        </>
      );
    }

    const team = teamSlots.find(t => t.name === entry);
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

  // Check if team is a playoff team (not applicable for playoff paths)
  const isPlayoffTeam = (_team: TeamSlot): boolean => false;

  // Toggle pot expansion
  const togglePotExpansion = (potKey: string) => {
    setExpandedPots(prev => ({ ...prev, [potKey]: !prev[potKey] }));
  };

  // Handle path selection for viewing matchups
  const handlePathSelect = (pathNumber: number) => {
    setCurrentPathIndex(pathNumber - 1);
    
    // Reveal matches for this path
    if (pathMatchups[pathNumber]) {
      const allMatches: { round: number; matchNum: number }[] = [];
      Object.entries(pathMatchups[pathNumber]).forEach(([round, matches]) => {
        Object.keys(matches).forEach(matchNum => {
          allMatches.push({ round: parseInt(round), matchNum: parseInt(matchNum) });
        });
      });

      allMatches.forEach((match, index) => {
        setTimeout(() => {
          setRevealedMatches(prev => {
            const newSet = new Set(prev);
            newSet.add(`${pathNumber}-${match.round}-${match.matchNum}`);
            return newSet;
          });
        }, index * 100);
      });
    }
  };

  // Export playoffs to JSON file
  const exportPlayoffs = () => {
    if (!simulationComplete || Object.keys(pathMatchups).length === 0) {
      return;
    }

    const numTeams = pathAssignments.reduce((acc, p) => acc + (p.teams?.length || 0), 0);

    const exportData = {
      compName: "Playoffs",
      numTeams,
      numThrough: -1,
      compType: "PLAYOFF",
      isHA: false,
      playoffs: pathMatchups
    } as any;

    const now = new Date();
    const timestamp = formatDateTimeStamp(now);
    const filename = `${timestamp}-Playoffs.comp.json`;

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

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-green-400 mb-2">Playoff Paths Draw</h1>
            <p className="text-gray-400">Simulate the playoff paths draw</p>
          </div>
          <div className="flex gap-3">
            {simulationComplete && Object.keys(pathMatchups).length > 0 && (
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                onClick={() => exportPlayoffs()}
              >
                Export
              </button>
            )}

            <button
              className={`font-bold py-3 px-8 rounded-lg transition-colors ${
                isSimulating
                  ? 'bg-yellow-600 text-white'
                  : simulationComplete
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              onClick={simulateDraw}
              disabled={isSimulating}
            >
              {isSimulating ? 'Simulating...' : simulationComplete ? 'Resimulate' : 'Simulate'}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          {/* Left Panel: Pots */}
          <PotsDisplay
            pots={pots}
            expandedPots={expandedPots}
            togglePotExpansion={togglePotExpansion}
            isPlayoffTeam={isPlayoffTeam}
          />

          {/* Right Panel */}
          <div className="flex-1 flex flex-col gap-6">
            {/* Top Panel: Path Assignments */}
            <PathAssignmentsPanel
              pathAssignments={pathAssignments}
              currentPathIndex={currentPathIndex}
              onPathSelect={handlePathSelect}
            />

            {/* Bottom Panel: Matchups */}
            {simulationComplete && pathAssignments.length > 0 && (
              <PathMatchupsPanel
                pathAssignments={pathAssignments}
                currentPathIndex={currentPathIndex}
                pathMatchups={pathMatchups}
                revealedMatches={revealedMatches}
                renderTeamDisplay={renderTeamDisplay}
                onPathSelect={handlePathSelect}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayoffPathsDrawSimulator;
