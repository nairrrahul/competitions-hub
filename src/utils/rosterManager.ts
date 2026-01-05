import type { Player } from '../types/rosterManager'

export const getRatingColor = (rating: number): { bg: string; text: string } => {
  if (rating >= 91) return { bg: 'bg-green-700', text: 'text-white' }
  if (rating >= 81) return { bg: 'bg-green-500', text: 'text-black' }
  if (rating >= 71) return { bg: 'bg-green-400', text: 'text-black' }
  if (rating >= 61) return { bg: 'bg-yellow-500', text: 'text-black' }
  if (rating >= 51) return { bg: 'bg-orange-500', text: 'text-white' }
  return { bg: 'bg-red-700', text: 'text-white' }
}

export const getAllPositions = (): string[] => {
  return ['GK', 'LB', 'RB', 'CB', 'LM', 'RM', 'CM', 'CAM', 'CDM', 'ST', 'RW', 'LW']
}

export const getPositionGroups = (): { [key: string]: string[] } => {
  return {
    'GK': ['GK'],
    'Defenders': ['LB', 'RB', 'CB'],
    'Midfielders': ['LM', 'RM', 'CM', 'CAM', 'CDM'],
    'Forwards': ['ST', 'RW', 'LW']
  }
}

export const filterPlayers = (
  players: Player[],
  searchTerm: string,
  selectedNationality: string,
  ageRange: [number, number],
  overallRange: [number, number],
  potentialRange: [number, number],
  selectedPosition: string
): Player[] => {
  return players.filter(player => {
    // Name filter
    const fullName = `${player.firstName} ${player.lastName}`.toLowerCase()
    if (searchTerm && !fullName.includes(searchTerm.toLowerCase())) {
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
    if (selectedPosition !== 'All') {
      const positionGroups = getPositionGroups()
      if (positionGroups[selectedPosition]) {
        // It's a position group
        if (!positionGroups[selectedPosition].includes(player.position)) {
          return false
        }
      } else {
        // It's an individual position
        if (player.position !== selectedPosition) {
          return false
        }
      }
    }

    return true
  })
}

export const sortPlayersByOverall = (players: Player[]): Player[] => {
  return [...players].sort((a, b) => b.overall - a.overall)
}
