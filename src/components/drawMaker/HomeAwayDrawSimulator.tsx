import React, { useState, useEffect } from 'react';
import type { TeamSlot } from '../../types/DrawMakerTypes';
import { useGlobalStore } from '../../state/GlobalState';
import MatchFlag from '../competitionSimulator/MatchFlag';
import { formatDateTimeStamp } from '../../utils/MathUtils';

interface HomeAwayDrawSimulatorProps {
  teamSlots: TeamSlot[];
}

interface Pairing {
  seededTeam: TeamSlot | null;
  unseededTeam: TeamSlot | null;
  isSeededAssigned: boolean;
  isUnseededAssigned: boolean;
}

const HomeAwayDrawSimulator: React.FC<HomeAwayDrawSimulatorProps> = ({ teamSlots }) => {
  const getNationInfo = useGlobalStore(state => state.getNationInfo);
  
  // State for simulation
  const [isSimulating, setIsSimulating] = useState(false);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [currentAssignmentIndex, setCurrentAssignmentIndex] = useState(-1);
  const [simulationPhase, setSimulationPhase] = useState<'seeded' | 'unseeded' | 'complete'>('seeded');
  const [simulationComplete, setSimulationComplete] = useState(false);

  // Separate teams into seeded and unseeded
  const { seededTeams, unseededTeams } = React.useMemo(() => {
    const teamsWithRanking = teamSlots.map(team => ({
      team,
      ranking: getNationInfo(team.name)?.rankingPts || 0
    }));

    // Sort by ranking points (descending)
    teamsWithRanking.sort((a, b) => b.ranking - a.ranking);

    const midpoint = Math.floor(teamsWithRanking.length / 2);
    const seeded = teamsWithRanking.slice(0, midpoint).map(item => item.team);
    const unseeded = teamsWithRanking.slice(midpoint).map(item => item.team);

    return { seededTeams: seeded, unseededTeams: unseeded };
  }, [teamSlots, getNationInfo]);

  // Initialize pairings when teams change
  useEffect(() => {
    if (teamSlots.length > 0 && teamSlots.every(slot => slot.name.trim() !== '')) {
      resetSimulation();
    }
  }, [teamSlots]);

  const resetSimulation = () => {
    const newPairings: Pairing[] = [];
    
    // Create empty pairings for the number of pairs
    for (let i = 0; i < Math.min(seededTeams.length, unseededTeams.length); i++) {
      newPairings.push({
        seededTeam: null,
        unseededTeam: null,
        isSeededAssigned: false,
        isUnseededAssigned: false
      });
    }

    setPairings(newPairings);
    setCurrentAssignmentIndex(-1);
    setSimulationPhase('seeded');
    setSimulationComplete(false);
    setIsSimulating(false);
  };

  const simulateDraw = () => {
    if (pairings.length === 0) return;

    setIsSimulating(true);
    setSimulationPhase('seeded');
    
    // Create shuffled arrays for random assignment
    const shuffledSeeded = [...seededTeams].sort(() => Math.random() - 0.5);
    const shuffledUnseeded = [...unseededTeams].sort(() => Math.random() - 0.5);
    
    // Phase 1: Assign seeded teams
    shuffledSeeded.forEach((team, index) => {
      setTimeout(() => {
        setCurrentAssignmentIndex(index);
        setPairings(prev => 
          prev.map((p, i) => 
            i === index ? { ...p, seededTeam: team, isSeededAssigned: true } : p
          )
        );
        
        // Start unseeded phase after seeded phase is complete
        if (index === shuffledSeeded.length - 1) {
          setTimeout(() => {
            setSimulationPhase('unseeded');
            setCurrentAssignmentIndex(-1);
            
            // Phase 2: Assign unseeded teams
            shuffledUnseeded.forEach((team, unseededIndex) => {
              setTimeout(() => {
                setCurrentAssignmentIndex(unseededIndex);
                setPairings(prev => 
                  prev.map((p, i) => 
                    i === unseededIndex ? { ...p, unseededTeam: team, isUnseededAssigned: true } : p
                  )
                );
                
                // Complete simulation after all assignments
                if (unseededIndex === shuffledUnseeded.length - 1) {
                  setTimeout(() => {
                    setSimulationPhase('complete');
                    setCurrentAssignmentIndex(-1);
                    setSimulationComplete(true);
                    setIsSimulating(false);
                  }, 100);
                }
              }, unseededIndex * 100);
            });
          }, 100);
        }
      }, index * 100);
    });
  };

  const restartSimulation = () => {
    resetSimulation();
    // Automatically start simulation after reset
    setTimeout(() => {
      simulateDraw();
    }, 100);
  };

  const exportPairs = () => {
    // Convert pairings to export format
    const pairs = pairings
      .filter(pairing => pairing.seededTeam && pairing.unseededTeam)
      .map(pairing => ({
        home: pairing.seededTeam!.name,
        away: pairing.unseededTeam!.name
      }));

    const totalTeams = pairs.length * 2;
    
    const exportData = {
      compName: "Home-Away Tournament",
      numTeams: totalTeams,
      numThrough: totalTeams / 2,
      compType: "HOMEAWAY",
      isHA: false,
      pairs: pairs
    };

    // Generate timestamp in YYYYMMDDHHMMSS format
    const now = new Date();
    const timestamp = formatDateTimeStamp(now);

    // Create filename
    const filename = `${timestamp}-HomeAway.comp.json`;

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

  // Simple team display component
  const TeamDisplay: React.FC<{ team: TeamSlot; rank: number }> = ({ team, rank }) => (
    <div className="flex items-center gap-3">
      <span className="text-gray-400 w-8">{rank}.</span>
      <MatchFlag countryName={team.name} w={7} h={5} s={1.4} />
      <span className="text-white font-medium">{team.name}</span>
      <span className="text-gray-300 text-sm">
        ({getNationInfo(team.name)?.rankingPts || 0} pts)
      </span>
    </div>
  );

  // Empty cell display component
  const EmptyCell: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <div className={`relative w-7 h-5 overflow-hidden rounded flex items-center justify-center ${
      isActive ? 'bg-gray-500 animate-pulse' : 'bg-gray-600'
    }`} />
  );

  // Team cell display component for pairings
  const TeamCell: React.FC<{ team: TeamSlot | null; isActive: boolean }> = ({ team, isActive }) => {
    if (!team) {
      return <EmptyCell isActive={isActive} />;
    }

    return (
      <div className="flex items-center gap-2">
        <MatchFlag countryName={team.name} w={8} h={6} s={1.5} />
        <span className="text-white font-medium text-lg">{team.name}</span>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-green-400 mb-2">Home & Away Draw</h1>
            <p className="text-gray-400">Pair seeded teams with unseeded teams</p>
          </div>
          <div className="flex gap-3">
            {simulationComplete && (
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                onClick={exportPairs}
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
              onClick={isSimulating ? undefined : (simulationComplete ? restartSimulation : simulateDraw)}
              disabled={isSimulating}
            >
              {isSimulating ? 'Simulating...' : simulationComplete ? 'Restart' : 'Simulate'}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex gap-6 w-full">
          {/* Seeded Teams */}
          <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h2 className="text-lg font-bold mb-4 text-green-400">Seeded</h2>
            <div className="space-y-2">
              {seededTeams.map((team, index) => (
                <TeamDisplay key={team.id} team={team} rank={index + 1} />
              ))}
            </div>
          </div>

          {/* Unseeded Teams */}
          <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h2 className="text-lg font-bold mb-4 text-green-400">Unseeded</h2>
            <div className="space-y-2">
              {unseededTeams.map((team, index) => (
                <TeamDisplay key={team.id} team={team} rank={seededTeams.length + index + 1} />
              ))}
            </div>
          </div>
        </div>

        {/* Pairings Results */}
        {pairings.length > 0 && (
          <div className="mt-8 bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h2 className="text-lg font-bold mb-4 text-green-400">Pairings</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-center font-semibold text-green-300 mb-2">Seeded</h3>
                </div>
                <div className="flex-1">
                  <h3 className="text-center font-semibold text-green-300 mb-2">Unseeded</h3>
                </div>
              </div>
              {pairings.map((pairing, index) => (
                <div 
                  key={`pairing-${index}`}
                  className="flex items-center gap-4 p-3 border border-gray-500 rounded-lg transition-all duration-300"
                >
                  <div className="flex-1 flex justify-center">
                    <TeamCell 
                      team={pairing.seededTeam} 
                      isActive={simulationPhase === 'seeded' && index === currentAssignmentIndex}
                    />
                  </div>
                  <div className="text-gray-400 font-medium">vs</div>
                  <div className="flex-1 flex justify-center">
                    <TeamCell 
                      team={pairing.unseededTeam} 
                      isActive={simulationPhase === 'unseeded' && index === currentAssignmentIndex}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeAwayDrawSimulator;
