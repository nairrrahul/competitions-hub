import React, { useState } from 'react';
import nationInfo from '../config/nation_info.json';
import groupPresets from '../config/group_presets.json';

interface TeamSlot {
  id: string;
  name: string;
  flagCode: string;
  isSelected?: boolean;
  isHost?: boolean;
}

interface TeamData {
  presetType: 'manual' | 'confederation' | 'competition';
  selectedCompetition: string;
  selectedConfederation: string;
  manualTeams: number;
  manualGroups: number;
  confederationGroups: number;
  teamSlots: TeamSlot[];
}

interface DrawSimulationTabProps {
  teamData: TeamData | null;
}

const DrawSimulationTab: React.FC<DrawSimulationTabProps> = ({ teamData }) => {
  // State for collapsible pots (all expanded by default)
  const [expandedPots, setExpandedPots] = useState<{ [key: string]: boolean }>({});
  
  // State for simulation
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedGroups, setSimulatedGroups] = useState<{ [key: string]: (TeamSlot | null)[] }>({});
  const [simulationComplete, setSimulationComplete] = useState(false);

  // Get number of groups based on preset type
  const getNumberOfGroups = (): number => {
    if (!teamData) return 0;

    switch (teamData.presetType) {
      case 'manual':
        return teamData.manualGroups;
      case 'confederation':
        return teamData.confederationGroups;
      case 'competition':
        const competition = groupPresets[teamData.selectedCompetition as keyof typeof groupPresets];
        return competition?.numGroups || 0;
      default:
        return 0;
    }
  };

  // Sort teams according to the specified order: hosts, non-playoff, playoff
  const sortTeamsByRanking = (teams: TeamSlot[]): TeamSlot[] => {
    // Separate teams into categories
    const hosts: TeamSlot[] = [];
    const nonPlayoffTeams: TeamSlot[] = [];
    const playoffTeams: TeamSlot[] = [];

    teams.forEach(team => {
      if (team.isHost) {
        hosts.push(team);
      } else if (teamData?.presetType === 'competition') {
        // Check if this is a playoff slot
        const parts = team.id.split('-');
        const sectionId = parts[0]; // e.g., "WorldCup" from "WorldCup-UEFA-0"
        const isIntlPlayoff = sectionId === 'intl';
        const isUEFAPlayoff = sectionId === 'euro';
        
        if (isIntlPlayoff || isUEFAPlayoff) {
          playoffTeams.push(team);
        } else {
          nonPlayoffTeams.push(team);
        }
      } else {
        // Manual or confederation mode - all non-host teams go to non-playoff
        nonPlayoffTeams.push(team);
      }
    });

    // Sort each category by ranking points
    const sortByRanking = (a: TeamSlot, b: TeamSlot) => {
      const aRanking = nationInfo[a.name as keyof typeof nationInfo]?.rankingPts || 0;
      const bRanking = nationInfo[b.name as keyof typeof nationInfo]?.rankingPts || 0;
      return bRanking - aRanking; // Descending order (highest first)
    };

    hosts.sort(sortByRanking);
    nonPlayoffTeams.sort(sortByRanking);
    playoffTeams.sort(sortByRanking);

    // Combine in the correct order
    return [...hosts, ...nonPlayoffTeams, ...playoffTeams];
  };

  // Allocate teams to pots based on number of groups
  const allocateTeamsToPots = (teams: TeamSlot[], numGroups: number): { [key: string]: TeamSlot[] } => {
    const pots: { [key: string]: TeamSlot[] } = {};
    
    if (numGroups === 0 || teams.length === 0) return pots;

    // Calculate number of pots needed
    const numPots = Math.ceil(teams.length / numGroups);
    
    // Allocate teams to pots
    for (let potIndex = 0; potIndex < numPots; potIndex++) {
      const potKey = `Pot ${potIndex + 1}`;
      pots[potKey] = [];
      
      // Calculate how many teams should be in this pot
      const teamsInThisPot = potIndex < numPots - 1 ? numGroups : teams.length - (numGroups * (numPots - 1));
      
      // Add teams to this pot
      for (let teamIndex = 0; teamIndex < teamsInThisPot; teamIndex++) {
        const globalTeamIndex = potIndex * numGroups + teamIndex;
        if (globalTeamIndex < teams.length) {
          pots[potKey].push(teams[globalTeamIndex]);
        }
      }
      
      // Initialize expanded state (default to expanded)
      if (!(potKey in expandedPots)) {
        setExpandedPots(prev => ({ ...prev, [potKey]: true }));
      }
    }
    
    return pots;
  };

  // Toggle pot expansion
  const togglePotExpansion = (potKey: string) => {
    setExpandedPots(prev => ({ ...prev, [potKey]: !prev[potKey] }));
  };

  // Get host group assignments based on number of hosts
  const getHostGroupAssignments = (numHosts: number): string[] => {
    const availableGroups = Object.keys(calculateGroupStructure());
    
    switch (numHosts) {
      case 1:
        return ['A'];
      case 2:
        return ['A', 'B'];
      case 3:
        return ['A', 'B', availableGroups.includes('D') ? 'D' : 'C'];
      case 4:
        return ['A', 'B', 'D', availableGroups.includes('F') ? 'F' : 'C'];
      case 5:
        return ['A', 'B', 'D', availableGroups.includes('I') ? 'I' : 'C'];
      case 6:
        return [
          'A', 'B', 'D', 
          availableGroups.includes('I') ? 'I' : 'C',
          availableGroups.includes('J') ? 'J' : 'E'
        ];
      default:
        return [];
    }
  };

  // Shuffle array randomly
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Main simulation function
  const simulateDraw = () => {
    // Reset if already simulating
    if (simulationComplete) {
      setSimulatedGroups({});
      setSimulationComplete(false);
    }

    setIsSimulating(true);
    const groups: { [key: string]: (TeamSlot | null)[] } = {};
    const groupStructure = calculateGroupStructure();
    
    // Initialize empty groups with null placeholders for each position
    Object.keys(groupStructure).forEach(groupName => {
      groups[groupName] = Array(groupStructure[groupName]).fill(null);
    });

    // Assign hosts first (they go to position 0)
    const hosts = sortedTeams.filter(team => team.isHost);
    const hostAssignments = getHostGroupAssignments(hosts.length);
    
    let hostIndex = 0;
    const assignNextHost = () => {
      if (hostIndex >= hosts.length || hostIndex >= hostAssignments.length) {
        // Start processing pots after all hosts are assigned
        setTimeout(() => {
          potIndex = 0;
          processNextPot();
        }, 0); // Delay before starting first pot
        return;
      }

      const host = hosts[hostIndex];
      const groupName = hostAssignments[hostIndex];
      
      // Find first available position in the group
      const firstNullIndex = groups[groupName].findIndex(team => team === null);
      if (firstNullIndex !== -1) {
        groups[groupName][firstNullIndex] = host;
      }

      setSimulatedGroups({ ...groups });
      hostIndex++;
      setTimeout(assignNextHost, 30); // Delay before assigning next host
    };

    // Start assigning hosts
    setTimeout(assignNextHost, 500);

    // Process pots one by one
    const potKeys = Object.keys(pots);
    let potIndex = 0;

    const processNextPot = () => {
      if (potIndex >= potKeys.length) {
        setSimulationComplete(true);
        setIsSimulating(false);
        return;
      }

      const potKey = potKeys[potIndex];
      const potTeams = pots[potKey].filter(team => !team.isHost); // Exclude hosts already assigned
      const shuffledTeams = shuffleArray(potTeams);
      
      // Get groups that need teams from this pot
      const groupsNeedingTeams: string[] = [];
      
      if (shuffledTeams.length >= numberOfGroups) {
        // Full pot: all groups get one team
        Object.keys(groups).forEach(groupName => {
          if (groups[groupName].some(team => team === null)) {
            groupsNeedingTeams.push(groupName);
          }
        });
      } else {
        // Partial pot: assign to groups that don't have hosts from this pot
        const potHosts = pots[potKey].filter(team => team.isHost);
        const hostGroups = new Set<string>();
        
        // Find which groups have hosts from this pot
        potHosts.forEach(host => {
          Object.keys(groups).forEach(groupName => {
            if (groups[groupName].some(team => team?.id === host.id)) {
              hostGroups.add(groupName);
            }
          });
        });
        
        // Get groups that don't have hosts from this pot and still need teams
        const availableGroups = Object.keys(groups).filter(groupName => 
          !hostGroups.has(groupName) && groups[groupName].some(team => team === null)
        );
        
        // If we need more groups than available, take from the end
        const groupsNeeded = shuffledTeams.length;
        if (availableGroups.length >= groupsNeeded) {
          // Take the first available groups
          groupsNeedingTeams.push(...availableGroups.slice(0, groupsNeeded));
        } else {
          // Take all available groups, then fill from the end
          groupsNeedingTeams.push(...availableGroups);
          const remainingNeeded = groupsNeeded - availableGroups.length;
          const allGroups = Object.keys(groups);
          const startIndex = numberOfGroups - remainingNeeded;
          for (let i = startIndex; i < numberOfGroups; i++) {
            const groupName = allGroups[i];
            if (!groupsNeedingTeams.includes(groupName) && groups[groupName].some(team => team === null)) {
              groupsNeedingTeams.push(groupName);
            }
          }
        }
      }

      let teamInPotIndex = 0;

      const assignNextTeamInPot = () => {
        if (teamInPotIndex >= shuffledTeams.length || teamInPotIndex >= groupsNeedingTeams.length) {
          potIndex++;
          setTimeout(processNextPot, 1000); // Delay before processing next pot
          return;
        }

        const team = shuffledTeams[teamInPotIndex];
        const groupName = groupsNeedingTeams[teamInPotIndex];
        
        // Find the next available position (this maintains pot order)
        const nextNullIndex = groups[groupName].findIndex(t => t === null);
        if (nextNullIndex !== -1) {
          groups[groupName][nextNullIndex] = team;
        }

        setSimulatedGroups({ ...groups });
        teamInPotIndex++;
        setTimeout(assignNextTeamInPot, 30); // Delay before assigning next team in pot
      };

      assignNextTeamInPot(); // Start assigning teams for the current pot
    };
  };

  // Check if a team is a playoff team (only applicable for competition mode)
  const isPlayoffTeam = (team: TeamSlot): boolean => {
    if (teamData?.presetType !== 'competition') return false;
    
    const parts = team.id.split('-');
    const sectionId = parts[0]; // e.g., "WorldCup" from "WorldCup-UEFA-0"
    const isIntlPlayoff = sectionId === 'intl';
    const isUEFAPlayoff = sectionId === 'euro';
    
    return isIntlPlayoff || isUEFAPlayoff;
  };

  // Get teams to display based on preset type
  const getDisplayTeams = (): TeamSlot[] => {
    if (!teamData) return [];

    switch (teamData.presetType) {
      case 'manual':
        // Show all filled out teams
        return teamData.teamSlots.filter(slot => slot.name.trim() !== '');
      
      case 'confederation':
        // Show only selected teams (not deselected)
        return teamData.teamSlots.filter(slot => slot.isSelected);
      
      case 'competition':
        // Show all filled out teams
        return teamData.teamSlots.filter(slot => slot.name.trim() !== '');
      
      default:
        return [];
    }
  };

  // Calculate pots for display
  const displayTeams = getDisplayTeams();
  const numberOfGroups = getNumberOfGroups();
  const sortedTeams = sortTeamsByRanking(displayTeams);
  const pots = allocateTeamsToPots(sortedTeams, numberOfGroups);

  // Calculate group structure based on pots
  const calculateGroupStructure = (): { [key: string]: number } => {
    const groups: { [key: string]: number } = {};
    const potKeys = Object.keys(pots);
    
    if (potKeys.length === 0) return groups;
    
    // Initialize all groups with 0 teams
    for (let i = 0; i < numberOfGroups; i++) {
      const groupName = String.fromCharCode(65 + i); // A, B, C, ...
      groups[groupName] = 0;
    }
    
    // Distribute teams from each pot to groups
    potKeys.forEach((potKey) => {
      const potTeams = pots[potKey];
      const teamsInPot = potTeams.length;
      
      if (teamsInPot >= numberOfGroups) {
        // Full pot: distribute 1 team to each group
        Object.keys(groups).forEach(groupName => {
          groups[groupName]++;
        });
      } else {
        // Partial pot: distribute to last K groups
        const groupNames = Object.keys(groups);
        const startIndex = numberOfGroups - teamsInPot;
        
        for (let i = 0; i < teamsInPot; i++) {
          const groupName = groupNames[startIndex + i];
          groups[groupName]++;
        }
      }
    });
    
    return groups;
  };

  // Generate groups for display (either placeholder or simulated)
  const generateDisplayGroups = () => {
    const groupStructure = calculateGroupStructure();
    const groupNames = Object.keys(groupStructure);
    
    return groupNames.map(groupName => ({
      name: groupName,
      teams: (isSimulating || simulationComplete) && simulatedGroups[groupName] 
        ? simulatedGroups[groupName] 
        : Array(groupStructure[groupName]).fill(null),
      maxTeams: Math.max(...Object.values(groupStructure))
    }));
  };

  const displayGroups = generateDisplayGroups();

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-green-400 mb-2">Draw Simulation</h1>
            <p className="text-gray-400">Simulate the competition draw</p>
          </div>
          <button 
            className={`font-bold py-3 px-8 rounded-lg transition-colors ${
              teamData?.presetType === 'competition' && teamData?.selectedCompetition === 'World Cup'
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : isSimulating
                ? 'bg-yellow-600 text-white'
                : simulationComplete
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            disabled={teamData?.presetType === 'competition' && teamData?.selectedCompetition === 'World Cup'}
            onClick={simulateDraw}
          >
            {isSimulating ? 'Simulating...' : simulationComplete ? 'Restart' : 'Simulate'}
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          {/* Pots Section */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 flex-shrink-0 w-120">
            <div className="bg-gray-750 px-4 py-3 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-green-400">Pots</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {Object.keys(pots).length > 0 ? (
                  Object.entries(pots).map(([potKey, potTeams]) => (
                    <div key={potKey} className="border border-gray-600 rounded-lg overflow-hidden">
                      {/* Pot Header - Clickable to toggle */}
                      <div 
                        className="bg-gray-700 px-4 py-3 cursor-pointer hover:bg-gray-650 transition-colors flex items-center justify-between"
                        onClick={() => togglePotExpansion(potKey)}
                      >
                        <h3 className="font-semibold text-green-400">{potKey}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">{potTeams.length} teams</span>
                          <span className="text-gray-400">
                            {expandedPots[potKey] ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Pot Content - Collapsible */}
                      {expandedPots[potKey] && (
                        <div className="p-3 space-y-2">
                          {potTeams.map((team) => (
                            <div key={team.id} className="flex items-center space-x-3 bg-gray-700 rounded p-2">
                              {/* Flag Box with rectangular mask */}
                              <div className="relative w-7 h-5 overflow-hidden rounded flex items-center justify-center bg-gray-600">
                                {team.flagCode && (
                                  <span
                                    className={`fi fi-${team.flagCode} absolute inset-0`}
                                    style={{
                                      fontSize: '1.5rem',
                                      lineHeight: '1',
                                    }}
                                  ></span>
                                )}
                              </div>
                              <span className="text-white font-medium">{team.name}</span>
                              <div className="ml-auto flex items-center gap-2">
                                {team.isHost && (
                                  <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">HOST</span>
                                )}
                                {isPlayoffTeam(team) && (
                                  <span className="text-xs bg-red-700 text-white px-2 py-1 rounded">PLAYOFF</span>
                                )}
                                <span className="text-xs text-gray-400">
                                  {nationInfo[team.name as keyof typeof nationInfo]?.rankingPts || 'N/A'} pts
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    {displayTeams.length > 0 ? 'No groups configured' : 'No teams selected'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Groups Section */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 flex-grow min-w-0">
            <div className="bg-gray-750 px-4 py-3 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-green-400">Groups</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {displayGroups.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {displayGroups.map((group) => (
                      <div key={group.name} className="border border-gray-600 rounded-lg overflow-hidden flex-shrink-0 w-80">
                        {/* Group Header */}
                        <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
                          <h3 className="font-semibold text-green-400">Group {group.name}</h3>
                        </div>
                        
                        {/* Group Teams */}
                        <div className="p-3 space-y-2">
                          {Array.from({ length: group.maxTeams }).map((_, index) => {
                            const hasTeam = index < group.teams.length && group.teams[index] !== null;
                            const team = hasTeam ? group.teams[index] : null;
                            return (
                              <div 
                                key={index} 
                                className={`flex items-center space-x-3 p-2 rounded ${
                                  hasTeam ? 'bg-gray-700' : 'bg-gray-800'
                                }`}
                              >
                                {hasTeam && team ? (
                                  <>
                                    {/* Flag Box */}
                                    <div className="relative w-7 h-5 overflow-hidden rounded flex items-center justify-center bg-gray-600">
                                      {team.flagCode && (
                                        <span
                                          className={`fi fi-${team.flagCode} absolute inset-0`}
                                          style={{
                                            fontSize: '1.5rem',
                                            lineHeight: '1',
                                          }}
                                        ></span>
                                      )}
                                    </div>
                                    <span className="text-white font-medium">{team.name}</span>
                                    {team.isHost && (
                                      <span className="ml-auto text-xs bg-yellow-600 text-white px-2 py-1 rounded">HOST</span>
                                    )}
                                    {isPlayoffTeam(team) && (
                                      <span className="text-xs bg-red-700 text-white px-2 py-1 rounded">PLAYOFF</span>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex items-center justify-center w-full h-5 text-gray-500 text-sm">
                                    
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    {displayTeams.length > 0 ? 'No groups configured' : 'No teams selected'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawSimulationTab;
