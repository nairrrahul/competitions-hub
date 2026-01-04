import nationInfo from '../config/nation_info.json';
import {
  type TeamSlot,
  type GroupStructure,
  type DrawResult
} from '../types/DrawMakerTypes';

// Utility functions
export const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getTeamConfederation = (team: TeamSlot): string => {
  const nationData = nationInfo[team.name as keyof typeof nationInfo];
  return nationData?.confederationID || '';
};

export const getHostGroupAssignments = (numHosts: number): string[] => {
  const assignments: string[] = [];
  for (let i = 0; i < numHosts; i++) {
    assignments.push(String.fromCharCode(65 + i)); // A, B, C, ...
  }
  return assignments;
};

// World Cup draw with backtracking and confederation constraints
export const performWorldCupDraw = (
  pots: { [key: string]: TeamSlot[] },
  sortedTeams: TeamSlot[],
  initialGroups: { [key: string]: (TeamSlot | null)[] },
  groupStructure: GroupStructure
): DrawResult => {
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
  const result = assignPotsWithBacktracking(remainingPots, pots, groups, groupStructure, 0); // Start from position 1 (Pot 2 goes to position 1)
  
  if (!result.success) {
    console.error('Failed to find valid draw assignment for remaining pots');
    return { success: false, groups }; // Return what we have (hosts + Pot 1) if failed
  }

  return result;
};

// Standard draw for non-World Cup competitions
export const performStandardDraw = (
  pots: { [key: string]: TeamSlot[] },
  sortedTeams: TeamSlot[],
  initialGroups: { [key: string]: (TeamSlot | null)[] },
  numberOfGroups: number
): DrawResult => {
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

  return { success: true, groups };
};

// Backtracking algorithm for pot assignment with confederation constraints
export const assignPotsWithBacktracking = (
  potKeys: string[],
  pots: { [key: string]: TeamSlot[] },
  groups: { [key: string]: (TeamSlot | null)[] },
  groupStructure: GroupStructure,
  potIndex: number
): DrawResult => {
  if (potIndex >= potKeys.length) {
    return { success: true, groups };
  }

  const potKey = potKeys[potIndex];
  const potTeams = pots[potKey]?.filter(team => !team.isHost) || [];
  
  console.log(`Processing pot ${potKey} with ${potTeams.length} teams:`, potTeams.map(t => t.name));
  
  if (potTeams.length === 0) {
    // Skip empty pots
    console.log(`Skipping empty pot ${potKey}`);
    return assignPotsWithBacktracking(potKeys, pots, groups, groupStructure, potIndex + 1);
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
      const nextResult = assignPotsWithBacktracking(potKeys, pots, result.groups, groupStructure, potIndex + 1);
      
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
export const assignPotTeamsToGroups = (
  teams: TeamSlot[],
  groups: { [key: string]: (TeamSlot | null)[] },
  potPosition: number
): DrawResult => {
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
export const canPlaceTeamInGroup = (
  team: TeamSlot,
  groupName: string,
  groups: { [key: string]: (TeamSlot | null)[] },
  potPosition: number
): boolean => {
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
export const generatePermutations = (teams: TeamSlot[]): TeamSlot[][] => {
  const permutations: TeamSlot[][] = [];
  
  // Generate several different orders to try
  for (let i = 0; i < Math.min(20, teams.length * 3); i++) {
    permutations.push(shuffleArray(teams));
  }
  
  return permutations;
};
