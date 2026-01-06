import type { Player } from '../types/rosterManager'

export const getRatingColor = (rating: number): { bg: string; text: string } => {
  if (rating >= 91) return { bg: 'bg-green-700', text: 'text-white' }
  if (rating >= 81) return { bg: 'bg-green-500', text: 'text-black' }
  if (rating >= 71) return { bg: 'bg-green-400', text: 'text-black' }
  if (rating >= 61) return { bg: 'bg-yellow-500', text: 'text-black' }
  if (rating >= 51) return { bg: 'bg-orange-500', text: 'text-white' }
  return { bg: 'bg-red-700', text: 'text-white' }
}

export const getPositionGroups = (): { [key: string]: string[] } => {
  return {
    'Goalkeeper': ['GK'],
    'Defenders': ['CB', 'LB', 'RB'],
    'Midfielders': ['CDM', 'CM', 'CAM', 'LM', 'RM'],
    'Forwards': ['ST', 'LW', 'RW'],
  }
}

export const getAllPositions = (): string[] => {
  const groups = getPositionGroups()
  return Object.values(groups).flat()
}

export const getPositionOptions = (): { group: string; positions: string[] }[] => {
  const groups = getPositionGroups()
  return Object.entries(groups).map(([group, positions]) => ({
    group,
    positions
  }))
}

export const getExpandedSelectedPositions = (selectedItems: string[]): string[] => {
  const groups = getPositionGroups()
  const expandedPositions: string[] = []
  
  selectedItems.forEach(item => {
    if (groups[item]) {
      // It's a group, add all positions in that group
      expandedPositions.push(...groups[item])
    } else {
      // It's an individual position
      expandedPositions.push(item)
    }
  })
  
  return [...new Set(expandedPositions)] // Remove duplicates
}

export const getSelectedPositionsFromExpanded = (expandedPositions: string[]): { groups: string[]; individuals: string[] } => {
  const groups = getPositionGroups()
  const selectedGroups: string[] = []
  const selectedIndividuals: string[] = []
  
  Object.entries(groups).forEach(([groupName, positions]) => {
    const allPositionsInGroupSelected = positions.every(pos => expandedPositions.includes(pos))
    if (allPositionsInGroupSelected) {
      selectedGroups.push(groupName)
    } else {
      // Add only the individually selected positions from this group
      positions.forEach(pos => {
        if (expandedPositions.includes(pos)) {
          selectedIndividuals.push(pos)
        }
      })
    }
  })
  
  return { groups: selectedGroups, individuals: selectedIndividuals }
}

export const synchronizePositionSelection = (
  changedItem: string, 
  isChecked: boolean, 
  currentSelection: string[]
): string[] => {
  const groups = getPositionGroups()
  const expandedPositions = getExpandedSelectedPositions(currentSelection)
  
  if (groups[changedItem]) {
    // It's a group being toggled
    if (isChecked) {
      // Add all positions in this group
      const groupPositions = groups[changedItem]
      return [...expandedPositions, ...groupPositions]
    } else {
      // Remove all positions in this group
      const groupPositions = groups[changedItem]
      return expandedPositions.filter(pos => !groupPositions.includes(pos))
    }
  } else {
    // It's an individual position being toggled
    if (isChecked) {
      // Add this position
      return [...expandedPositions, changedItem]
    } else {
      // Remove this position
      return expandedPositions.filter(pos => pos !== changedItem)
    }
  }
}

export const filterPlayers = (
  players: Player[],
  searchTerm: string,
  selectedNationality: string,
  ageRange: [number, number],
  overallRange: [number, number],
  potentialRange: [number, number],
  selectedPositions: string[]
): Player[] => {
  const filtered = players.filter(player => {
    // Name filter - include firstName, lastName, and commonName
    const fullName = `${player.firstName} ${player.lastName}`.toLowerCase()
    const commonName = player.commonName.toLowerCase()
    const searchLower = searchTerm.toLowerCase()
    
    if (searchTerm && !fullName.includes(searchLower) && !commonName.includes(searchLower)) {
      return false
    }

    // Nationality filter
    if (selectedNationality !== 'All' && player.nationality !== selectedNationality) {
      return false
    }

    // Age filter
    if (player.age < ageRange[0] || player.age > ageRange[1]) {
      return false
    }

    // Overall filter
    if (player.overall < overallRange[0] || player.overall > overallRange[1]) {
      return false
    }

    // Potential filter
    if (player.potential < potentialRange[0] || player.potential > potentialRange[1]) {
      return false
    }

    // Position filter
    if (selectedPositions.length > 0) {
      const expandedPositions = getExpandedSelectedPositions(selectedPositions)
      if (!expandedPositions.includes(player.position)) {
        return false
      }
    }

    return true
  })
  
  // Sort by overall rating in descending order
  return sortPlayersByOverall(filtered)
}

export const sortPlayersByOverall = (players: Player[]): Player[] => {
  return [...players].sort((a, b) => b.overall - a.overall)
}
