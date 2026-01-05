import { create } from 'zustand'
import type { Player, PlayersData, NationInfo } from '../types/rosterManager'
import playersData from '../config/players.json'
import nationInfo from '../config/nation_info.json'

interface PlayersState {
  // Raw data
  playersData: PlayersData
  nationInfo: NationInfo
  
  // Processed data structures
  allPlayers: Player[]
  playersByNation: { [nation: string]: Player[] }
  playersByPosition: { [position: string]: Player[] }
  
  // Actions
  loadPlayersData: () => void
  loadNationInfo: () => void
  getPlayerById: (id: string) => Player | undefined
  getPlayersByNation: (nation: string) => Player[]
  getPlayersByPosition: (position: string) => Player[]
  searchPlayers: (query: string) => Player[]
  getNationFlagCode: (nation: string) => string
  getAllNationalities: () => string[]
}

export const useGlobalStore = create<PlayersState>((set, get) => ({
  // Initialize with empty data
  playersData: {},
  nationInfo: {},
  allPlayers: [],
  playersByNation: {},
  playersByPosition: {},
  
  // Load players data from JSON
  loadPlayersData: () => {
    const data = playersData as PlayersData
    
    // Process all players
    const allPlayers: Player[] = []
    const playersByNation: { [nation: string]: Player[] } = {}
    const playersByPosition: { [position: string]: Player[] } = {}
    
    Object.entries(data).forEach(([nation, nationData]) => {
      const nationPlayers: Player[] = []
      
      nationData.players.forEach(player => {
        const playerWithNation = {
          ...player,
          nationality: nation
        }
        
        allPlayers.push(playerWithNation)
        nationPlayers.push(playerWithNation)
        
        // Group by position
        if (!playersByPosition[player.position]) {
          playersByPosition[player.position] = []
        }
        playersByPosition[player.position].push(playerWithNation)
      })
      
      playersByNation[nation] = nationPlayers
    })
    
    set({
      playersData: data,
      allPlayers,
      playersByNation,
      playersByPosition
    })
  },
  
  // Load nation info data from JSON
  loadNationInfo: () => {
    const data = nationInfo as NationInfo
    set({ nationInfo: data })
  },
  
  // Get player by unique identifier (you may need to add IDs to players)
  getPlayerById: (id: string) => {
    const { allPlayers } = get()
    return allPlayers.find(player => `${player.firstName}-${player.lastName}-${player.nationality}` === id)
  },
  
  // Get players by nationality
  getPlayersByNation: (nation: string) => {
    const { playersByNation } = get()
    return playersByNation[nation] || []
  },
  
  // Get players by position
  getPlayersByPosition: (position: string) => {
    const { playersByPosition } = get()
    return playersByPosition[position] || []
  },
  
  // Search players by name
  searchPlayers: (query: string) => {
    const { allPlayers } = get()
    const lowercaseQuery = query.toLowerCase()
    
    return allPlayers.filter(player => {
      const fullName = `${player.firstName} ${player.lastName}`.toLowerCase()
      return fullName.includes(lowercaseQuery)
    })
  },
  
  // Get nation flag code
  getNationFlagCode: (nationName: string) => {
    const { nationInfo } = get()
    const nation = nationInfo[nationName]
    return nation ? nation.flagCode : ''
  },
  
  // Get all nationalities
  getAllNationalities: () => {
    const { nationInfo } = get()
    return Object.keys(nationInfo).sort()
  }
}))
