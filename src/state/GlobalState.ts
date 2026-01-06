import { create } from 'zustand'
import type { Player, PlayersData, NationInfo, Squad } from '../types/rosterManager'
import playersData from '../config/players.json'
import nationInfo from '../config/nation_info.json'
import { generateAllSquads, getPlayerAtPosition } from '../utils/squadGenerator'

interface PlayersState {
  // Raw data
  playersData: PlayersData
  nationInfo: NationInfo
  
  // Processed data structures
  allPlayers: Player[]
  playersByNation: { [nation: string]: Player[] }
  playersByPosition: { [position: string]: Player[] }
  squads: { [nation: string]: Squad }
  
  // Actions
  loadPlayersData: () => void
  loadNationInfo: () => void
  generateSquads: () => void
  getPlayerById: (id: string) => Player | undefined
  getPlayersByNation: (nation: string) => Player[]
  getPlayersByPosition: (position: string) => Player[]
  searchPlayers: (query: string) => Player[]
  getNationFlagCode: (nation: string) => string
  getAllNationalities: () => string[]
  getSquad: (nation: string) => Squad | undefined
  getPlayerAtPosition: (nation: string, position: string) => any
}

export const useGlobalStore = create<PlayersState>((set, get) => ({
  // Initialize with empty data
  playersData: {},
  nationInfo: {},
  allPlayers: [],
  playersByNation: {},
  playersByPosition: {},
  squads: {},
  
  // Load players data from JSON
  loadPlayersData: () => {
    const data = playersData as unknown as PlayersData
    
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
  
  // Generate squads for all nations
  generateSquads: () => {
    const { playersByNation } = get()
    const squads = generateAllSquads(playersByNation)
    set({ squads })
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
      const commonName = player.commonName.toLowerCase()
      return fullName.includes(lowercaseQuery) || commonName.includes(lowercaseQuery)
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
  },
  
  // Get squad for a nation
  getSquad: (nation: string) => {
    const { squads } = get()
    return squads[nation]
  },
  
  // Get player at specific position in nation's squad
  getPlayerAtPosition: (nation: string, position: string) => {
    const { squads } = get()
    const squad = squads[nation]
    if (!squad) return null
    return getPlayerAtPosition(squad, position)
  }
}))
