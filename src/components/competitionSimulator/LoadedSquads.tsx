import React, { useState } from 'react';
import type { Squad } from '../../types/rosterManager';
import type { Player } from '../../types/rosterManager';
import { useGlobalStore } from '../../state/GlobalState';

interface LoadedSquadsProps {
  squads: { [nation: string]: Squad };
  competitionType?: string;
  groups?: { [key: string]: string[] };
}

interface SquadPlayerDisplayProps {
  player: Player;
  isStarter: boolean;
}

const SquadPlayerDisplay: React.FC<SquadPlayerDisplayProps> = ({ player, isStarter }) => {
  const playerName = `${player.firstName} ${player.lastName}`;
  return (
    <div className={`flex items-center justify-between p-1 rounded ${isStarter ? 'bg-gray-700/50' : 'bg-gray-600/30'}`}>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 font-mono text-sm w-8">
          [{player.position}]
        </span>
        <span className="text-white font-medium">
          {playerName.padEnd(20)}
        </span>
      </div>
      <span className="text-green-400 font-bold">
        {player.overall}
      </span>
    </div>
  );
};

const LoadedSquads: React.FC<LoadedSquadsProps> = ({ squads, competitionType, groups }) => {
  const [expandedNations, setExpandedNations] = useState<Set<string>>(new Set());
  const getNationFlagCode = useGlobalStore(state => state.getNationFlagCode);

  const toggleNationExpansion = (nation: string) => {
    const newExpanded = new Set(expandedNations);
    if (newExpanded.has(nation)) {
      newExpanded.delete(nation);
    } else {
      newExpanded.add(nation);
    }
    setExpandedNations(newExpanded);
  };

  const renderSquadContainer = (nation: string, squad: Squad) => {
    const flagCode = getNationFlagCode(nation);
    
    return (
      <div key={nation} className="bg-gray-800 rounded-lg border border-gray-700">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700 transition-colors"
          onClick={() => toggleNationExpansion(nation)}
        >
          <div className="flex items-center gap-3">
            {/* Flag Box with rectangular mask */}
            <div className="relative w-7 h-5 overflow-hidden rounded flex items-center justify-center bg-gray-600">
              {flagCode && (
                <span
                  className={`fi fi-${flagCode} absolute inset-0`}
                  style={{
                    fontSize: '1.5rem',
                    lineHeight: '1',
                  }}
                ></span>
              )}
            </div>
            <span className="text-green-400 font-bold text-lg">{nation}</span>
          </div>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${
              expandedNations.has(nation) ? 'rotate-180' : ''
            }`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {expandedNations.has(nation) && (
          <div className="border-t border-gray-700">
            {/* Starters */}
            <div className="p-4 border-b border-gray-700/50">
              <h4 className="text-green-300 font-semibold mb-3">Starters</h4>
              <div className="space-y-1">
                <div className="text-gray-400 mb-2">Goalkeeper</div>
                <SquadPlayerDisplay 
                  key={squad.starters.gk.player.playerid} 
                  player={squad.starters.gk.player} 
                  isStarter={true}
                />
                <div className="text-gray-400 mb-2 mt-3">Defenders</div>
                {squad.starters.defenders.map((squadPlayer) => (
                  <SquadPlayerDisplay 
                    key={squadPlayer.player.playerid} 
                    player={squadPlayer.player} 
                    isStarter={true}
                  />
                ))}
                <div className="text-gray-400 mb-2 mt-3">Midfielders</div>
                {squad.starters.midfielders.map((squadPlayer) => (
                  <SquadPlayerDisplay 
                    key={squadPlayer.player.playerid} 
                    player={squadPlayer.player} 
                    isStarter={true}
                  />
                ))}
                <div className="text-gray-400 mb-2 mt-3">Forwards</div>
                {squad.starters.forwards.map((squadPlayer) => (
                  <SquadPlayerDisplay 
                    key={squadPlayer.player.playerid} 
                    player={squadPlayer.player} 
                    isStarter={true}
                  />
                ))}
              </div>
            </div>
            
            {/* Substitutes */}
            <div className="p-4">
              <h4 className="text-green-300 font-semibold mb-3">Substitutes</h4>
              <div className="space-y-1">
                <div className="text-gray-400 mb-2">Goalkeeper</div>
                <SquadPlayerDisplay 
                  key={squad.substitutes.gk.player.playerid} 
                  player={squad.substitutes.gk.player} 
                  isStarter={false}
                />
                <div className="text-gray-400 mb-2 mt-3">Defenders</div>
                {squad.substitutes.defenders.map((squadPlayer) => (
                  <SquadPlayerDisplay 
                    key={squadPlayer.player.playerid} 
                    player={squadPlayer.player} 
                    isStarter={false}
                  />
                ))}
                <div className="text-gray-400 mb-2 mt-3">Midfielders</div>
                {squad.substitutes.midfielders.map((squadPlayer) => (
                  <SquadPlayerDisplay 
                    key={squadPlayer.player.playerid} 
                    player={squadPlayer.player} 
                    isStarter={false}
                  />
                ))}
                <div className="text-gray-400 mb-2 mt-3">Forwards</div>
                {squad.substitutes.forwards.map((squadPlayer) => (
                  <SquadPlayerDisplay 
                    key={squadPlayer.player.playerid} 
                    player={squadPlayer.player} 
                    isStarter={false}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // For GROUPKO competitions, organize by groups
  if (competitionType === 'GROUPKO' && groups) {
    return (
      <div className="space-y-6">
        {Object.entries(groups).map(([groupName, nations]) => (
          <div key={groupName}>
            <h3 className="text-xl font-bold text-green-400 mb-4">Group {groupName}</h3>
            <div className="flex flex-wrap gap-4 w-full">
              {nations.map(nation => {
                const squad = squads[nation];
                return squad ? (
                  <div key={nation} className="flex-1 min-w-0">
                    {renderSquadContainer(nation, squad)}
                  </div>
                ) : null;
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // For non-GROUPKO competitions, show all squads in a single column
  return (
    <div className="space-y-4">
      {Object.entries(squads).map(([nation, squad]) => 
        renderSquadContainer(nation, squad)
      )}
    </div>
  );
};

export default LoadedSquads;
