import React  from 'react';
import drawPresets from '../../config/draw_presets.json';
import { useGlobalStore } from '../../state/GlobalState';
import { type Confederation, type PresetType, type TeamSlot } from '../../types/DrawMakerTypes';
import CountryCell from './CountryCell';




interface TeamListProps {
  presetType: PresetType;
  selectedCompetition: string;
  selectedConfederation: Confederation;
  teamSlots: TeamSlot[];
  setTeamSlots: React.Dispatch<React.SetStateAction<TeamSlot[]>>;
  autocompleteStates: { [key: string]: { isOpen: boolean; filteredTeams: string[]; selectedIndex: number } };
  setAutocompleteStates: React.Dispatch<React.SetStateAction<{ [key: string]: { isOpen: boolean; filteredTeams: string[]; selectedIndex: number } }>>;
  onImportJSON?: (data: any) => void;
}

const TeamList: React.FC<TeamListProps> = ({
  presetType,
  selectedCompetition,
  selectedConfederation,
  teamSlots,
  setTeamSlots,
  autocompleteStates,
  setAutocompleteStates,
  onImportJSON
}) => {
  const getCountryFlagCode = useGlobalStore(state => state.getNationFlagCode);
  
  // Get all available team names for autocomplete
  const allTeamNames = useGlobalStore.getState().getAllNationalities();

  // Handle JSON import
  const handleImportJSON = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          if (onImportJSON) {
            onImportJSON(data);
          }
        } catch (error) {
          console.error('Import failed:', error);
          alert('Failed to import JSON file. Please check the file format.');
        }
      };

      reader.readAsText(file);
    };

    fileInput.click();
  };

  // Filter teams for autocomplete
  const filterTeams = (input: string, currentSlotId: string): string[] => {
    if (!input) return [];
    
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
        const nationInfo = useGlobalStore.getState().nationInfo;
        const nationData = nationInfo[team];
        return nationData && allowedConfederations.includes(nationData.confederationID as Confederation);
      }
      
      if (presetType === 'competition' && excludeUEFA) {
        const nationInfo = useGlobalStore.getState().nationInfo;
        const nationData = nationInfo[team];
        return nationData && nationData.confederationID !== 'UEFA';
      }
      
      return true;
    });
  };

  // Handle team name change
  const getNationFlagCode = useGlobalStore(state => state.getNationFlagCode);
  
  const handleTeamNameChange = (slotId: string, value: string) => {
    // Update team slot
    setTeamSlots(prev => prev.map(slot => {
      if (slot.id === slotId) {
        const flagCode = value ? getNationFlagCode(value) : '';
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

  // Toggle all teams selection for confederation mode
  const toggleAllTeamSelection = () => {
    const allCleared = teamSlots.every(slot => !slot.isSelected);
    setTeamSlots(prev => prev.map(slot => 
      ({ ...slot, isSelected: allCleared })
    ));
  };

  // Check if all teams are cleared
  const areAllTeamsCleared = () => {
    return teamSlots.length > 0 && teamSlots.every(slot => !slot.isSelected);
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
        const flagCode = value ? getCountryFlagCode(value) : '';
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
      Object.entries(competition.confederations).forEach(([confed, _]) => {
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
    } else if (presetType === 'homeaway') {
      return [{ title: 'TEAMS', teams: teamSlots }];
    } else if (presetType === 'bracket') {
      return [{ title: 'TEAMS', teams: teamSlots }];
    }

    return [];
  };

  // Split teams into columns (max 10 per column)
  const getColumnsForSection = (teams: TeamSlot[]) => {
    const columns: TeamSlot[][] = [];
    for (let i = 0; i < teams.length; i += 11) {
      columns.push(teams.slice(i, i + 11));
    }
    return columns;
  };

  const teamSections = generateTeamSlots();

  return (
    <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-green-400">TEAMS</h2>
        <div className="flex gap-2">
          {presetType === 'competition' && (
            <button 
              onClick={handleImportJSON}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Import JSON
            </button>
          )}
          {presetType === 'confederation' && (
            <button 
              onClick={toggleAllTeamSelection}
              className={`font-bold py-2 px-4 rounded-lg transition-colors ${
                areAllTeamsCleared()
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {areAllTeamsCleared() ? 'Unclear All' : 'Clear All'}
            </button>
          )}
        </div>
      </div>
      
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
                      <CountryCell
                        key={team.id}
                        team={team}
                        presetType={presetType}
                        autocompleteState={autocompleteStates[team.id] || { isOpen: false, filteredTeams: [], selectedIndex: 0 }}
                        onTeamNameChange={handleTeamNameChange}
                        onCompetitionTeamChange={handleCompetitionTeamChange}
                        onSelectTeam={selectTeam}
                        onToggleTeamSelection={toggleTeamSelection}
                        onClearTeam={clearTeam}
                        onToggleHost={toggleHost}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeamList;
