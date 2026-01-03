import React, { useState, useEffect } from 'react';
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
      finalGroups = performWorldCupDraw(groups, groupStructure);
    } else {
      // Use standard draw algorithm for other competitions
      finalGroups = performStandardDraw(groups);
    }

    // Animate the results after-the-fact
    animateDrawResults(finalGroups);
  };

  // World Cup draw with backtracking and confederation constraints
  const performWorldCupDraw = (initialGroups: { [key: string]: (TeamSlot | null)[] }, groupStructure: { [key: string]: number }): { [key: string]: (TeamSlot | null)[] } => {
    const groups = JSON.parse(JSON.stringify(initialGroups)); // Deep copy
    const potKeys = Object.keys(pots);
    
    console.log('Available pots:', potKeys);
    console.log('Pots contents:', pots);
    
    // Step 1: Assign hosts first (no restrictions)
    const hosts = sortedTeams.filter(team => team.isHost);
    const hostAssignments = getHostGroupAssignments(hosts.length);
    
    hosts.forEach((host: TeamSlot, index: number) => {
      if (index < hostAssignments.length) {
        const groupName = hostAssignments[index];
        const firstNullIndex = groups[groupName].findIndex((team: TeamSlot | null) => team === null);
        if (firstNullIndex !== -1) {
          groups[groupName][firstNullIndex] = host;
        }
      }
    });

    // Step 2: Assign Pot 1 teams (no restrictions)
    if (potKeys.length > 0) {
      const pot1Teams = pots['Pot 1']?.filter(team => !team.isHost) || [];
      const shuffledPot1Teams = shuffleArray(pot1Teams);
      
      console.log('Pot 1 teams (non-hosts):', shuffledPot1Teams.map(t => t.name));
      
      // Get groups that need Pot 1 teams (position 0)
      const groupsNeedingPot1: string[] = [];
      Object.keys(groups).forEach((groupName: string) => {
        if (groups[groupName][0] === null) {
          groupsNeedingPot1.push(groupName);
        }
      });

      console.log('Groups needing Pot 1 teams:', groupsNeedingPot1);

      // Assign Pot 1 teams randomly to available groups
      shuffledPot1Teams.forEach((team: TeamSlot, index: number) => {
        if (index < groupsNeedingPot1.length) {
          const groupName = groupsNeedingPot1[index];
          groups[groupName][0] = team;
        }
      });
    }

    // Step 3: Process remaining pots with backtracking and constraints
    const remainingPots = potKeys.slice(1); // Skip Pot 1 - it was already assigned
    console.log('Remaining pots to process:', remainingPots);
    const result = assignPotsWithBacktracking(remainingPots, groups, groupStructure, 0); // Start from position 1 (Pot 2 goes to position 1)
    
    if (!result.success) {
      console.error('Failed to find valid draw assignment for remaining pots');
      return groups; // Return what we have (hosts + Pot 1) if failed
    }

    return result.groups;
  };

  // Standard draw for non-World Cup competitions
  const performStandardDraw = (initialGroups: { [key: string]: (TeamSlot | null)[] }): { [key: string]: (TeamSlot | null)[] } => {
    const groups = JSON.parse(JSON.stringify(initialGroups)); // Deep copy
    
    // Assign hosts first
    const hosts = sortedTeams.filter(team => team.isHost);
    const hostAssignments = getHostGroupAssignments(hosts.length);
    
    hosts.forEach((host: TeamSlot, index: number) => {
      if (index < hostAssignments.length) {
        const groupName = hostAssignments[index];
        const firstNullIndex = groups[groupName].findIndex((team: TeamSlot | null) => team === null);
        if (firstNullIndex !== -1) {
          groups[groupName][firstNullIndex] = host;
        }
      }
    });

    // Process pots one by one (standard algorithm)
    const potKeys = Object.keys(pots);
    for (let potIndex = 0; potIndex < potKeys.length; potIndex++) {
      const potKey = potKeys[potIndex];
      const potTeams = pots[potKey].filter(team => !team.isHost);
      const shuffledTeams = shuffleArray(potTeams);
      
      // Get groups that need teams from this pot
      const groupsNeedingTeams: string[] = [];
      
      if (shuffledTeams.length >= numberOfGroups) {
        Object.keys(groups).forEach((groupName: string) => {
          if (groups[groupName].some((team: TeamSlot | null) => team === null)) {
            groupsNeedingTeams.push(groupName);
          }
        });
      } else {
        const potHosts = pots[potKey].filter((team: TeamSlot) => team.isHost);
        const hostGroups = new Set<string>();
        
        potHosts.forEach((host: TeamSlot) => {
          Object.keys(groups).forEach((groupName: string) => {
            if (groups[groupName].some((team: TeamSlot | null) => team?.id === host.id)) {
              hostGroups.add(groupName);
            }
          });
        });
        
        const availableGroups = Object.keys(groups).filter((groupName: string) => 
          !hostGroups.has(groupName) && groups[groupName].some((team: TeamSlot | null) => team === null)
        );
        
        const groupsNeeded = shuffledTeams.length;
        if (availableGroups.length >= groupsNeeded) {
          groupsNeedingTeams.push(...availableGroups.slice(0, groupsNeeded));
        } else {
          groupsNeedingTeams.push(...availableGroups);
          const remainingNeeded = groupsNeeded - availableGroups.length;
          const allGroups = Object.keys(groups);
          const startIndex = numberOfGroups - remainingNeeded;
          for (let i = startIndex; i < numberOfGroups; i++) {
            const groupName = allGroups[i];
            if (!groupsNeedingTeams.includes(groupName) && groups[groupName].some((t: TeamSlot | null) => t === null)) {
              groupsNeedingTeams.push(groupName);
            }
          }
        }
      }

      // Assign teams to groups
      shuffledTeams.forEach((team: TeamSlot, teamIndex: number) => {
        if (teamIndex < groupsNeedingTeams.length) {
          const groupName = groupsNeedingTeams[teamIndex];
          const nextNullIndex = groups[groupName].findIndex((t: TeamSlot | null) => t === null);
          if (nextNullIndex !== -1) {
            groups[groupName][nextNullIndex] = team;
          }
        }
      });
    }

    return groups;
  };

  // Backtracking algorithm for pot assignment with confederation constraints
  const assignPotsWithBacktracking = (potKeys: string[], groups: { [key: string]: (TeamSlot | null)[] }, groupStructure: { [key: string]: number }, potIndex: number): { success: boolean; groups: { [key: string]: (TeamSlot | null)[] } } => {
    if (potIndex >= potKeys.length) {
      return { success: true, groups };
    }

    const potKey = potKeys[potIndex];
    const potTeams = pots[potKey]?.filter(team => !team.isHost) || [];
    
    console.log(`Processing pot ${potKey} with ${potTeams.length} teams:`, potTeams.map(t => t.name));
    
    if (potTeams.length === 0) {
      // Skip empty pots
      console.log(`Skipping empty pot ${potKey}`);
      return assignPotsWithBacktracking(potKeys, groups, groupStructure, potIndex + 1);
    }
    
    // Try different team orders for this pot
    const teamOrders = generatePermutations(potTeams);
    console.log(`Generated ${teamOrders.length} permutations for pot ${potKey}`);
    
    for (const teamOrder of teamOrders) {
      // Map pot index to correct position: Pot 2 (index 0) -> position 1, Pot 3 (index 1) -> position 2, etc.
      const position = potIndex + 1;
      const result = assignPotTeamsToGroups(teamOrder, groups, position);
      
      if (result.success) {
        console.log(`Successfully assigned pot ${potKey} to position ${position}`);
        // Recursively assign next pot
        const nextResult = assignPotsWithBacktracking(potKeys, result.groups, groupStructure, potIndex + 1);
        
        if (nextResult.success) {
          return nextResult;
        }
      } else {
        console.log(`Failed to assign pot ${potKey} with team order:`, teamOrder.map(t => t.name));
      }
    }

    console.log(`No valid assignment found for pot ${potKey}`);
    return { success: false, groups };
  };

  // Assign all teams from a pot to groups with constraints
  const assignPotTeamsToGroups = (teams: TeamSlot[], groups: { [key: string]: (TeamSlot | null)[] }, potPosition: number): { success: boolean; groups: { [key: string]: (TeamSlot | null)[] } } => {
    const groupsCopy = JSON.parse(JSON.stringify(groups));
    
    // Get groups that need teams at this pot position
    const availableGroups: string[] = [];
    Object.keys(groupsCopy).forEach((groupName: string) => {
      if (potPosition < groupsCopy[groupName].length && groupsCopy[groupName][potPosition] === null) {
        availableGroups.push(groupName);
      }
    });

    console.log(`Pot position ${potPosition}: Available groups: ${availableGroups.join(', ')}, Teams to assign: ${teams.map(t => t.name).join(', ')}`);

    if (availableGroups.length < teams.length) {
      console.log(`Not enough available groups (${availableGroups.length}) for teams (${teams.length})`);
      return { success: false, groups: groupsCopy };
    }

    // Try to assign each team to a valid group
    const assignTeamRecursive = (teamIndex: number, usedGroups: Set<string>): boolean => {
      if (teamIndex >= teams.length) {
        console.log(`Successfully assigned all ${teams.length} teams for pot position ${potPosition}`);
        return true; // All teams assigned successfully
      }

      const team = teams[teamIndex];
      
      // Try each available group for this team
      for (const groupName of availableGroups) {
        if (!usedGroups.has(groupName)) {
          const canPlace = canPlaceTeamInGroup(team, groupName, groupsCopy, potPosition);
          console.log(`Trying to place ${team.name} in group ${groupName}: ${canPlace ? 'ALLOWED' : 'BLOCKED'}`);
          
          if (canPlace) {
            // Temporarily assign team
            const originalValue = groupsCopy[groupName][potPosition];
            groupsCopy[groupName][potPosition] = team;
            usedGroups.add(groupName);
            
            // Recursively assign next team
            if (assignTeamRecursive(teamIndex + 1, usedGroups)) {
              return true;
            }
            
            // Backtrack
            groupsCopy[groupName][potPosition] = originalValue;
            usedGroups.delete(groupName);
          }
        }
      }
      
      console.log(`Failed to assign ${team.name} to any available group`);
      return false; // No valid assignment found for this team
    };

    const success = assignTeamRecursive(0, new Set<string>());
    return { success, groups: groupsCopy };
  };

  // Check if a team can be placed in a specific group
  const canPlaceTeamInGroup = (team: TeamSlot, groupName: string, groups: { [key: string]: (TeamSlot | null)[] }, potPosition: number): boolean => {
    const teamConfederation = getTeamConfederation(team);
    const isUEFA = teamConfederation === 'UEFA';
    
    // Check all teams already in the group (up to current pot position)
    const groupTeams: TeamSlot[] = [];
    for (let i = 0; i <= potPosition; i++) {
      const teamAtPosition = groups[groupName][i];
      if (teamAtPosition) {
        groupTeams.push(teamAtPosition);
      }
    }
    
    // Check confederation constraints
    let uefaCount = 0;
    for (const groupTeam of groupTeams) {
      const groupTeamConfederation = getTeamConfederation(groupTeam);
      
      // Check for same confederation conflict (except UEFA)
      if (!isUEFA && groupTeamConfederation === teamConfederation) {
        return false;
      }
      
      // Count UEFA teams
      if (groupTeamConfederation === 'UEFA') {
        uefaCount++;
      }
    }
    
    // Check UEFA limit (max 2 per group)
    if (isUEFA && uefaCount >= 2) {
      return false;
    }
    
    return true;
  };

  // Generate permutations of teams (simplified - just shuffle multiple times)
  const generatePermutations = (teams: TeamSlot[]): TeamSlot[][] => {
    const permutations: TeamSlot[][] = [];
    
    // Generate several different orders to try
    for (let i = 0; i < Math.min(20, teams.length * 3); i++) {
      permutations.push(shuffleArray(teams));
    }
    
    return permutations;
  };

  // Export groups to JSON file
  const exportGroups = () => {
    if (!simulationComplete || Object.keys(simulatedGroups).length === 0) {
      return;
    }

    // Convert groups to the required format
    const exportData: { [key: string]: string[] } = {};
    
    Object.keys(simulatedGroups).forEach(groupName => {
      const teams = simulatedGroups[groupName];
      const teamNames: string[] = [];
      
      teams.forEach(team => {
        if (team) {
          teamNames.push(team.name);
        }
      });
      
      exportData[groupName] = teamNames;
    });

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
    const competitionName = teamData?.selectedCompetition || 'draw';
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

  // Get team confederation from nation info
  const getTeamConfederation = (team: TeamSlot): string => {
    const nationData = nationInfo[team.name as keyof typeof nationInfo];
    return nationData?.confederationID || '';
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
