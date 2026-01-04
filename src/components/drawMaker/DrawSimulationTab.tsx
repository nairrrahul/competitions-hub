import React, { useState, useEffect } from 'react';
import nationInfo from '../../config/nation_info.json';
import groupPresets from '../../config/group_presets.json';
import PotsDisplay from './PotsDisplay';
import GroupsDisplay from './GroupsDisplay';
import {
  performWorldCupDraw,
  performStandardDraw
} from '../../utils/DrawLogic';
import {
  type TeamSlot,
  type TeamData,
  type DisplayGroup
} from '../../types/DrawMakerTypes';


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
  
  // State for calculated teams and pots (to reset properly when teamData changes)
  const [sortedTeams, setSortedTeams] = useState<TeamSlot[]>([]);
  const [pots, setPots] = useState<{ [key: string]: TeamSlot[] }>({});

  // Recalculate sorted teams and pots when teamData changes
  useEffect(() => {
    if (teamData) {
      const displayTeams = getDisplayTeams();
      const numberOfGroups = getNumberOfGroups();
      const newSortedTeams = sortTeamsByRanking(displayTeams);
      const newPots = allocateTeamsToPots(newSortedTeams, numberOfGroups);
      
      setSortedTeams(newSortedTeams);
      setPots(newPots);
      
      // Reset simulation state when teamData changes
      setSimulatedGroups({});
      setSimulationComplete(false);
      setIsSimulating(false);
    } else {
      setSortedTeams([]);
      setPots({});
      setSimulatedGroups({});
      setSimulationComplete(false);
      setIsSimulating(false);
    }
  }, [teamData]);

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
        return ['A', 'B', 'D', 'F', availableGroups.includes('I') ? 'I' : 'C'];
      case 6:
        return [
          'A', 'B', 'D', 'F',
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

    // Check if this is World Cup draw
    const isWorldCup = teamData?.presetType === 'competition' && teamData?.selectedCompetition === 'World Cup';
    
    let finalGroups: { [key: string]: (TeamSlot | null)[] } = {};

    if (isWorldCup) {
      // Use backtracking algorithm for World Cup
      const result = performWorldCupDraw(pots, sortedTeams, groups, groupStructure);
      finalGroups = result.groups;
    } else {
      // Use standard draw algorithm for other competitions
      const result = performStandardDraw(pots, sortedTeams, groups, numberOfGroups);
      finalGroups = result.groups;
    }

    // Animate the results after-the-fact
    animateDrawResults(finalGroups);
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

  // Export groups to JSON file
  const exportGroups = () => {
    if (!simulationComplete || Object.keys(simulatedGroups).length === 0) {
      return;
    }
    
    // Get competition information
    const competitionName = teamData?.selectedCompetition || 'draw';
    const numThrough = groupPresets[competitionName as keyof typeof groupPresets]?.numTotalThrough || 0;
    
    // Count total teams
    let totalTeams = 0;
    Object.keys(simulatedGroups).forEach(groupName => {
      const teams = simulatedGroups[groupName];
      teams.forEach(team => {
        if (team) {
          totalTeams++;
        }
      });
    });

    // Convert groups to the required format
    const groups: { [key: string]: string[] } = {};
    
    Object.keys(simulatedGroups).forEach(groupName => {
      const teams = simulatedGroups[groupName];
      const teamNames: string[] = [];
      
      teams.forEach(team => {
        if (team) {
          teamNames.push(team.name);
        }
      });
      
      groups[groupName] = teamNames;
    });

    // Create export data structure
    const exportData = {
      compName: competitionName,
      numTeams: totalTeams,
      numThrough: numThrough,
      compType: "GROUPKO",
      groups: groups
    };

    // Generate timestamp in YYYYMMDDHHMMSS format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

    // Get competition name for filename
    const filename = `${timestamp}-${competitionName}.json`;

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

  // Animate draw results after-the-fact
  const animateDrawResults = (finalGroups: { [key: string]: (TeamSlot | null)[] }) => {
    const groups: { [key: string]: (TeamSlot | null)[] } = {};
    const groupStructure = calculateGroupStructure();
    
    // Initialize empty groups
    Object.keys(groupStructure).forEach(groupName => {
      groups[groupName] = Array(groupStructure[groupName]).fill(null);
    });

    setSimulatedGroups({ ...groups });

    // Animate team assignments
    const allAssignments: { team: TeamSlot; groupName: string; position: number }[] = [];
    
    Object.keys(finalGroups).forEach(groupName => {
      finalGroups[groupName].forEach((team, position) => {
        if (team) {
          allAssignments.push({ team, groupName, position });
        }
      });
    });

    // Sort assignments by position (pot order)
    allAssignments.sort((a, b) => a.position - b.position);

    let assignmentIndex = 0;
    const assignNextTeam = () => {
      if (assignmentIndex >= allAssignments.length) {
        setSimulationComplete(true);
        setIsSimulating(false);
        return;
      }

      const assignment = allAssignments[assignmentIndex];
      groups[assignment.groupName][assignment.position] = assignment.team;
      
      setSimulatedGroups({ ...groups });
      assignmentIndex++;
      setTimeout(assignNextTeam, 30); // 30ms delay between assignments
    };

    // Start animation after a short delay
    setTimeout(assignNextTeam, 500);
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

  // Calculate group structure based on pots
  const numberOfGroups = getNumberOfGroups();
  const displayTeams = getDisplayTeams();
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
          <div className="flex gap-3">
            {simulationComplete && teamData?.presetType === 'competition' && (
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                onClick={exportGroups}
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
            >
              {isSimulating ? 'Simulating...' : simulationComplete ? 'Restart' : 'Simulate'}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          <PotsDisplay
            pots={pots}
            expandedPots={expandedPots}
            togglePotExpansion={togglePotExpansion}
            isPlayoffTeam={isPlayoffTeam}
          />
          
          <GroupsDisplay
            displayGroups={displayGroups}
            isPlayoffTeam={isPlayoffTeam}
          />
        </div>
      </div>
    </div>
  );
};

export default DrawSimulationTab;
