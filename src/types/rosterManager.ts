export interface Player {
  playerid: number
  firstName: string
  lastName: string
  commonName: string
  age: number
  overall: number
  potential: number
  position: string
  nationality: string
}

export interface NationInfo {
  [key: string]: {
    rankingPts: number
    confederationID: string
    flagCode: string
  }
}

export interface PlayersData {
  [nation: string]: {
    players: Player[]
  }
}

export interface SquadPlayer {
  player: Player
}

export interface Squad {
  starters: {
    gk: SquadPlayer
    defenders: [SquadPlayer, SquadPlayer, SquadPlayer, SquadPlayer] // RB, CB, CB, LB
    midfielders: [SquadPlayer, SquadPlayer, SquadPlayer] // CDM/CM, CAM/CM/CDM, CAM/CM
    forwards: [SquadPlayer, SquadPlayer, SquadPlayer] // RW/RM, LW/LM, ST
  }
  substitutes: {
    gk: SquadPlayer
    defenders: [SquadPlayer, SquadPlayer]
    midfielders: [SquadPlayer, SquadPlayer, SquadPlayer]
    forwards: [SquadPlayer, SquadPlayer]
  }
}

export type SquadPosition = 
  | 'gk'
  | 'rb' | 'cb' | 'lb'
  | 'cdm' | 'cm' | 'cam'
  | 'rw' | 'rm' | 'lw' | 'lm'
  | 'st'

export interface PositionRequirement {
  position: string
  eligiblePositions: string[]
  count: number
}
