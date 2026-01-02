import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import drawPresets from '../config/draw_presets.json';
import nationInfo from '../config/nation_info.json';

type PresetType = 'manual' | 'confederation' | 'competition';
type Confederation = 'AFC' | 'CAF' | 'OFC' | 'UEFA' | 'CONCACAF' | 'CONMEBOL';

interface TeamSlot {
  id: string;
  name: string;
  flagCode: string;
  isSelected?: boolean; // For confederation mode
  isHost?: boolean; // For competition mode
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

interface TeamSelectionTabProps {
  onMoveToDrawSimulator: (data: TeamData) => void;
  onValidationUpdate: (canAccess: boolean) => void;
  initialData?: TeamData | null;
}

const TeamSelectionTab = forwardRef<{ getCurrentTeamData: () => TeamData | null }, TeamSelectionTabProps>(({ onMoveToDrawSimulator, onValidationUpdate, initialData }, ref) => {
  const [presetType, setPresetType] = useState<PresetType>(initialData?.presetType || 'manual');
  const [selectedCompetition, setSelectedCompetition] = useState<string>(initialData?.selectedCompetition || '');
  const [selectedConfederation, setSelectedConfederation] = useState<Confederation>((initialData?.selectedConfederation as Confederation) || 'UEFA');
  const [manualTeams, setManualTeams] = useState<number>(initialData?.manualTeams || 16);
  const [manualGroups, setManualGroups] = useState<number>(initialData?.manualGroups || 4);
  const [confederationGroups, setConfederationGroups] = useState<number>(initialData?.confederationGroups || 4);
  
  // Team management state
  const [teamSlots, setTeamSlots] = useState<TeamSlot[]>(initialData?.teamSlots || []);
  const [autocompleteStates, setAutocompleteStates] = useState<{ [key: string]: { isOpen: boolean; filteredTeams: string[]; selectedIndex: number } }>({});
  
  // Flag to prevent auto-navigation on initial load
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Get all available team names for autocomplete
  const allTeamNames = Object.keys(nationInfo);

  // Update validation state whenever relevant data changes
  useEffect(() => {
    onValidationUpdate(canNavigateToDrawSimulator());
  }, [presetType, teamSlots, manualTeams, manualGroups]);

  // Expose getCurrentTeamData method to parent
  useImperativeHandle(ref, () => ({
    getCurrentTeamData: (): TeamData | null => {
      if (!canNavigateToDrawSimulator()) return null;
      
      return {
        presetType,
        selectedCompetition,
        selectedConfederation,
        manualTeams,
        manualGroups,
        confederationGroups,
        teamSlots: [...teamSlots]
      };
    }
  }), [presetType, selectedCompetition, selectedConfederation, manualTeams, manualGroups, confederationGroups, teamSlots]);

  // Handle switching to competition mode with auto-selection
  const handleCompetitionPresetSelect = () => {
    setPresetType('competition');
    setSelectedCompetition('WorldCup');
  };

  // Validation functions for navigation
  const canNavigateToDrawSimulator = (): boolean => {
    if (presetType === 'manual') {
      // Manual mode: all teams must be filled out, and groups <= teams
      const allTeamsFilled = teamSlots.every(slot => slot.name.trim() !== '');
      const groupsValid = manualGroups <= manualTeams;
      return allTeamsFilled && groupsValid;
    } else if (presetType === 'confederation') {
      // Confederation mode: always allowed
      return true;
    } else if (presetType === 'competition') {
      // Competition mode: all teams must be filled out
      const allTeamsFilled = teamSlots.every(slot => slot.name.trim() !== '');
      return allTeamsFilled;
    }
    return false;
  };

  const getNavigationErrorMessage = (): string => {
    if (presetType === 'manual') {
      const allTeamsFilled = teamSlots.every(slot => slot.name.trim() !== '');
      const groupsValid = manualGroups <= manualTeams;
      
      if (!allTeamsFilled) return 'Please fill out all team names';
      if (!groupsValid) return 'Number of groups cannot exceed number of teams';
    } else if (presetType === 'competition') {
      const allTeamsFilled = teamSlots.every(slot => slot.name.trim() !== '');
      if (!allTeamsFilled) return 'Please fill out all team names';
    }
    return '';
  };

  // Handle navigation to draw simulator
  const handleMoveToDrawSimulator = () => {
    if (!canNavigateToDrawSimulator()) return;

    const teamData: TeamData = {
      presetType,
      selectedCompetition,
      selectedConfederation,
      manualTeams,
      manualGroups,
      confederationGroups,
      teamSlots: [...teamSlots] // Create a copy to avoid reference issues
    };

    onMoveToDrawSimulator(teamData);
  };

  // Initialize team slots when manual teams count changes
  useEffect(() => {
    if (presetType === 'manual') {
      const newSlots: TeamSlot[] = [];
      for (let i = 0; i < manualTeams; i++) {
        newSlots.push({
          id: `manual-${i}`,
          name: '',
          flagCode: ''
        });
      }
      setTeamSlots(newSlots);
    }
  }, [manualTeams, presetType]);

  // Initialize team slots when confederation groups count changes
  useEffect(() => {
    if (presetType === 'confederation') {
      // Get all teams from the selected confederation
      const confederationTeams = Object.entries(nationInfo)
        .filter(([_, nationData]) => nationData.confederationID === selectedConfederation)
        .map(([teamName, nationData]) => ({
          id: `confed-${teamName}`,
          name: teamName,
          flagCode: nationData.flagCode,
          isSelected: true // All teams enabled by default
        }));
      
      // Show ALL teams from the confederation (not limited by group count)
      setTeamSlots(confederationTeams);
    }
  }, [presetType, selectedConfederation]);

  // Initialize team slots for competition presets
  useEffect(() => {
    if (presetType === 'competition' && selectedCompetition) {
      const competition = drawPresets[selectedCompetition as keyof typeof drawPresets];
      if (!competition) return;

      const newSlots: TeamSlot[] = [];
      
      // Add confederation slots
      Object.entries(competition.confederations).forEach(([confed, count]) => {
        for (let i = 0; i < count; i++) {
          newSlots.push({
            id: `${selectedCompetition}-${confed}-${i}`,
            name: '',
            flagCode: ''
          });
        }
      });

      // Add international playoff slots
      for (let i = 0; i < competition.numIntlPlayoff; i++) {
        newSlots.push({
          id: `intl-${i}`,
          name: '',
          flagCode: ''
        });
      }

      // Add UEFA playoff slots
      for (let i = 0; i < competition.numEUROPlayoff; i++) {
        newSlots.push({
          id: `euro-${i}`,
          name: '',
          flagCode: ''
        });
      }

      setTeamSlots(newSlots);
    }
  }, [selectedCompetition, presetType]);

  // Filter teams for autocomplete
  const filterTeams = (input: string, currentSlotId: string): string[] => {
    if (!input) return [];
    console.log(input);
    
    // Get slot info for competition mode constraints
    const slot = teamSlots.find(s => s.id === currentSlotId);
    let allowedConfederations: Confederation[] = [];
    let excludeUEFA = false;
    
    if (slot && presetType === 'competition') {
      const parts = slot.id.split('-');
      const sectionId = parts[0]; // e.g., "WorldCup" from "WorldCup-UEFA-0"
      const slotConfederation = parts[1]; // e.g., "UEFA" from "WorldCup-UEFA-0"
      
      // Check if this is a playoff slot
      const isIntlPlayoff = sectionId === 'intl';
      const isUEFAPlayoff = sectionId === 'euro';
      
      if (isIntlPlayoff) {
        // Intl Playoff: Only non-European nations
        excludeUEFA = true;
      } else if (isUEFAPlayoff) {
        // UEFA Playoff: Only European nations
        allowedConfederations = ['UEFA'];
      } else if (slotConfederation) {
        // Confederation slot: Only nations from this confederation
        allowedConfederations = [slotConfederation as Confederation];
      }
    }
    
    // Get already selected team names
    let selectedTeamNames: string[] = [];
    if (presetType !== 'competition') {
      // Manual mode: prevent duplicates
      selectedTeamNames = teamSlots
        .filter(slot => slot.id !== currentSlotId && slot.name)
        .map(slot => slot.name.toLowerCase());
    } else if (presetType === 'competition') {
      // Competition mode: allow duplicates across different sections
      selectedTeamNames = teamSlots
        .filter(slot => slot.id !== currentSlotId && slot.name)
        .map(slot => slot.name.toLowerCase());
    }
    
    return allTeamNames.filter(team => {
      const teamLower = team.toLowerCase();
      const matchesInput = teamLower.includes(input.toLowerCase());
      const notAlreadySelected = !selectedTeamNames.includes(teamLower);
      
      if (!matchesInput || !notAlreadySelected) return false;
      
      // Apply competition constraints
      if (presetType === 'competition' && allowedConfederations.length > 0) {
        const nationData = nationInfo[team as keyof typeof nationInfo];
        return nationData && allowedConfederations.includes(nationData.confederationID as Confederation);
      }
      
      if (presetType === 'competition' && excludeUEFA) {
        const nationData = nationInfo[team as keyof typeof nationInfo];
        return nationData && nationData.confederationID !== 'UEFA';
      }
      
      return true;
    });
  };

  // Handle team name change
  const handleTeamNameChange = (slotId: string, value: string) => {
    // Update team slot
    setTeamSlots(prev => prev.map(slot => {
      if (slot.id === slotId) {
        const flagCode = value ? nationInfo[value as keyof typeof nationInfo]?.flagCode || '' : '';
        return { ...slot, name: value, flagCode };
      }
      return slot;
    }));

    // Update autocomplete state
    const filtered = filterTeams(value, slotId);
    setAutocompleteStates(prev => ({
      ...prev,
      [slotId]: {
        isOpen: filtered.length > 0,
        filteredTeams: filtered,
        selectedIndex: 0
      }
    }));
  };

  // Handle team selection from autocomplete
  const selectTeam = (slotId: string, teamName: string) => {
    handleTeamNameChange(slotId, teamName);
    setAutocompleteStates(prev => ({
      ...prev,
      [slotId]: {
        isOpen: false,
        filteredTeams: [],
        selectedIndex: 0
      }
    }));
  };

  // Handle team selection/deselection for confederation mode
  const toggleTeamSelection = (slotId: string) => {
    setTeamSlots(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, isSelected: !slot.isSelected } : slot
    ));
  };

  // Clear team selection for manual/competition modes
  const clearTeam = (slotId: string) => {
    setTeamSlots(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, name: '', flagCode: '', isHost: false } : slot
    ));
    setAutocompleteStates(prev => ({
      ...prev,
      [slotId]: {
        isOpen: false,
        filteredTeams: [],
        selectedIndex: 0
      }
    }));
  };

  // Toggle host status for competition and manual cells
  const toggleHost = (slotId: string) => {
    const slot = teamSlots.find(s => s.id === slotId);
    if (!slot) return;

    // For competition mode, check if this is a playoff slot (not allowed)
    if (presetType === 'competition') {
      const parts = slot.id.split('-');
      const sectionId = parts[0]; // e.g., "WorldCup" from "WorldCup-UEFA-0"
      const isIntlPlayoff = sectionId === 'intl';
      const isUEFAPlayoff = sectionId === 'euro';
      
      // Don't allow host toggle for playoff slots
      if (isIntlPlayoff || isUEFAPlayoff) return;
    }

    // Only allow host toggle if there's a team selected
    if (!slot.name) return;

    setTeamSlots(prev => prev.map(slot => 
      slot.id === slotId ? { ...slot, isHost: !slot.isHost } : slot
    ));
  };

  // Handle team selection for competition mode with constraints
  const handleCompetitionTeamChange = (slotId: string, value: string) => {
    const slot = teamSlots.find(s => s.id === slotId);
    if (!slot) return;

    // Always update the input value and autocomplete for typing experience
    const filtered = filterTeams(value, slotId);
    setAutocompleteStates(prev => ({
      ...prev,
      [slotId]: {
        isOpen: filtered.length > 0,
        filteredTeams: filtered,
        selectedIndex: 0
      }
    }));
    
    // Always update the display value for typing experience
    setTeamSlots(prev => prev.map(slot => {
      if (slot.id === slotId) {
        const flagCode = value && nationInfo[value as keyof typeof nationInfo]?.flagCode || '';
        return { ...slot, name: value, flagCode };
      }
      return slot;
    }));
  };

  // Generate team slots based on current selection
  const generateTeamSlots = (): { title: string; teams: TeamSlot[] }[] => {
    if (presetType === 'manual') {
      return [{ title: 'TEAMS', teams: teamSlots }];
    } else if (presetType === 'confederation') {
      return [{ title: selectedConfederation, teams: teamSlots }];
    } else if (presetType === 'competition' && selectedCompetition) {
      const competition = drawPresets[selectedCompetition as keyof typeof drawPresets];
      if (!competition) return [];

      const sections: { title: string; teams: TeamSlot[] }[] = [];
      
      // Group existing teamSlots by their section
      const slotsBySection: { [key: string]: TeamSlot[] } = {};
      
      // Initialize sections with existing slots
      teamSlots.forEach(slot => {
        const parts = slot.id.split('-');
        const sectionId = parts[0]; // e.g., "WorldCup" from "WorldCup-UEFA-0"
        const slotConfederation = parts[1]; // e.g., "UEFA" from "WorldCup-UEFA-0"
        
        // Check if this is a playoff slot
        const isIntlPlayoff = sectionId === 'intl';
        const isUEFAPlayoff = sectionId === 'euro';
        
        let sectionKey = '';
        if (isIntlPlayoff) {
          sectionKey = 'Intl. Playoff';
        } else if (isUEFAPlayoff) {
          sectionKey = 'UEFA Playoff';
        } else {
          sectionKey = slotConfederation;
        }
        
        if (!slotsBySection[sectionKey]) {
          slotsBySection[sectionKey] = [];
        }
        slotsBySection[sectionKey].push(slot);
      });
      
      // Add confederation sections
      Object.entries(competition.confederations).forEach(([confed, count]) => {
        const sectionSlots = slotsBySection[confed] || [];
        sections.push({ title: confed, teams: sectionSlots });
      });

      // Add playoff sections if they exist
      if (competition.numIntlPlayoff > 0) {
        const playoffSlots = slotsBySection['Intl. Playoff'] || [];
        sections.push({ title: 'Intl. Playoff', teams: playoffSlots });
      }

      if (competition.numEUROPlayoff > 0) {
        const playoffSlots = slotsBySection['UEFA Playoff'] || [];
        sections.push({ title: 'UEFA Playoff', teams: playoffSlots });
      }

      return sections;
    }

    return [];
  };

  const teamSections = generateTeamSlots();

  // Split teams into columns (max 10 per column)
  const getColumnsForSection = (teams: TeamSlot[]) => {
    const columns: TeamSlot[][] = [];
    for (let i = 0; i < teams.length; i += 11) {
      columns.push(teams.slice(i, i + 11));
    }
    return columns;
  };

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen w-full">
      <div className="w-full">
        <div className="flex gap-6 w-full">
          {/* PRESET SELECTOR */}
          <div className="w-80 bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h2 className="text-lg font-bold mb-4 text-green-400">SELECT PRESET</h2>
            
            {/* Manual Option */}
            <div className="mb-4">
              <label className="flex items-center mb-3 cursor-pointer">
                <input
                  type="radio"
                  name="preset"
                  checked={presetType === 'manual'}
                  onChange={() => setPresetType('manual')}
                  className="mr-2 text-green-400"
                />
                <span className="font-medium">MANUAL</span>
              </label>
              {presetType === 'manual' && (
                <div className="ml-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-300 w-16">Teams:</label>
                    <input
                      type="number"
                      value={manualTeams}
                      onChange={(e) => setManualTeams(Math.max(1, parseInt(e.target.value) || 1))}
                      className="bg-gray-700 text-white px-2 py-1 rounded w-20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-300 w-16">Groups:</label>
                    <input
                      type="number"
                      value={manualGroups}
                      onChange={(e) => setManualGroups(Math.max(1, parseInt(e.target.value) || 1))}
                      className="bg-gray-700 text-white px-2 py-1 rounded w-20"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Confederation Option */}
            <div className="mb-4">
              <label className="flex items-center mb-3 cursor-pointer">
                <input
                  type="radio"
                  name="preset"
                  checked={presetType === 'confederation'}
                  onChange={() => setPresetType('confederation')}
                  className="mr-2 text-green-400"
                />
                <span className="font-medium">CONFEDERATION</span>
              </label>
              {presetType === 'confederation' && (
                <div className="ml-6 space-y-2">
                  {(['AFC', 'CAF', 'OFC', 'UEFA', 'CONCACAF', 'CONMEBOL'] as Confederation[]).map(conf => (
                    <label key={conf} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="confederation"
                        checked={selectedConfederation === conf}
                        onChange={() => setSelectedConfederation(conf)}
                        className="mr-2"
                      />
                      <span className="text-sm">{conf}</span>
                    </label>
                  ))}
                  <div className="flex items-center gap-2 mt-3">
                    <label className="text-sm text-gray-300 w-16">Groups:</label>
                    <input
                      type="number"
                      value={confederationGroups}
                      onChange={(e) => setConfederationGroups(Math.max(1, parseInt(e.target.value) || 1))}
                      className="bg-gray-700 text-white px-2 py-1 rounded w-20"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Competition Option */}
            <div className="mb-4">
              <label className="flex items-center mb-3 cursor-pointer">
                <input
                  type="radio"
                  name="preset"
                  checked={presetType === 'competition'}
                  onChange={handleCompetitionPresetSelect}
                  className="mr-2 text-green-400"
                />
                <span className="font-medium">COMPETITION</span>
              </label>
              {presetType === 'competition' && (
                <div className="ml-6">
                  <select
                    value={selectedCompetition || 'WorldCup'}
                    onChange={(e) => setSelectedCompetition(e.target.value)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  >
                    {Object.keys(drawPresets).map(competition => (
                      <option key={competition} value={competition}>
                        {competition}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* TEAMS SECTION */}
          <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 p-4">
            <h2 className="text-lg font-bold mb-4 text-green-400">TEAMS</h2>
            
            <div className="flex flex-wrap gap-6 w-full">
              {teamSections.map((section, sectionIndex) => {
                const columns = getColumnsForSection(section.teams);
                
                return (
                  <div key={sectionIndex} className="flex-shrink-0">
                    {/* Section Title */}
                    <div className="text-center mb-3">
                      <h3 className="text-sm font-bold text-gray-300 uppercase">{section.title}</h3>
                    </div>
                    
                    {/* Team Columns - Horizontal layout within section with wrapping */}
                    <div className="flex flex-wrap gap-4">
                      {columns.map((column, colIndex) => (
                        <div key={colIndex} className="flex flex-col gap-2 min-w-0">
                          {column.map((team) => (
                            <div key={team.id} className={`flex items-center gap-2 p-2 relative rounded bg-gray-700`} 
                                 onContextMenu={(e) => {
                                   e.preventDefault();
                                   if (presetType === 'competition' || presetType === 'manual') {
                                     toggleHost(team.id);
                                   }
                                 }}>
                              {/* Flag Box with rectangular mask */}
                              <div className="relative w-7 h-5 overflow-hidden rounded flex items-center justify-center bg-gray-600">
                                {team.flagCode && (
                                  <span
                                    className={`fi fi-${team.flagCode} absolute inset-0`}
                                    style={{
                                      fontSize: '1.5rem',
                                      lineHeight: '1',
                                      transform: 'scale(1.2)',
                                    }}
                                  />
                                )}
                              </div>
                              
                              {/* Team Name Input or Display */}
                              {presetType === 'confederation' ? (
                                // Locked display for confederation mode
                                <div className="flex-1 text-white text-sm px-2 py-1">
                                  {team.name}
                                </div>
                              ) : (
                                // Editable input for manual/competition modes
                                <div className="flex-1 relative">
                                  <input
                                    type="text"
                                    value={team.name}
                                    onChange={(e) => presetType === 'competition' ? handleCompetitionTeamChange(team.id, e.target.value) : handleTeamNameChange(team.id, e.target.value)}
                                    placeholder="Team name"
                                    className="w-full bg-gray-600 text-white px-2 py-1 rounded text-sm min-w-0"
                                  />
                                 
                                  {/* Autocomplete Dropdown */}
                                  {autocompleteStates[team.id]?.isOpen && (
                                    <div className="absolute top-full left-0 right-0 bg-gray-700 border border-gray-600 rounded mt-1 max-h-40 overflow-y-auto z-10">
                                      {autocompleteStates[team.id].filteredTeams.map((teamName) => (
                                        <div
                                          key={teamName}
                                          className="px-2 py-1 hover:bg-gray-600 cursor-pointer text-sm"
                                          onClick={() => selectTeam(team.id, teamName)}
                                        >
                                          {teamName}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Host Overlay for Competition and Manual Modes */}
                              {(presetType === 'competition' || presetType === 'manual') && team.isHost && (
                                <div 
                                  className="absolute inset-0 rounded pointer-events-none"
                                  style={{
                                    backgroundColor: 'rgba(255, 215, 0, 0.2)' // gold with 20% opacity
                                  }}
                                ></div>
                              )}
                              
                              {/* Deselection Overlay for Confederation Mode */}
                              {presetType === 'confederation' && !team.isSelected && (
                                <div 
                                  className="absolute inset-0 rounded"
                                  style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.3)' // red-500 with 30% opacity
                                  }}
                                ></div>
                              )}
                              
                              {/* Remove/Toggle Button */}
                              <button 
                                onClick={() => presetType === 'confederation' ? toggleTeamSelection(team.id) : clearTeam(team.id)}
                                className="text-red-400 hover:text-red-300 text-sm font-bold flex-shrink-0 relative z-20"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

TeamSelectionTab.displayName = 'TeamSelectionTab';

export default TeamSelectionTab;
