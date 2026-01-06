import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import drawPresets from '../../config/draw_presets.json';
import { useGlobalStore } from '../../state/GlobalState';
import PresetSelection from './PresetSelection';
import TeamList from './TeamList';
import { type TeamSlot, type TeamData } from '../../types/DrawMakerTypes';

type PresetType = 'manual' | 'confederation' | 'competition';
type Confederation = 'AFC' | 'CAF' | 'OFC' | 'UEFA' | 'CONCACAF' | 'CONMEBOL';


interface TeamSelectionTabProps {
  onMoveToDrawSimulator: (data: TeamData) => void;
  onValidationUpdate: (canAccess: boolean) => void;
  initialData?: TeamData | null;
}

interface TeamSelectionTabRef {
  getCurrentTeamData: () => TeamData | null;
}

const TeamSelectionTab = forwardRef<TeamSelectionTabRef, TeamSelectionTabProps>((props, ref) => {
  const { onValidationUpdate, initialData } = props;
  const [presetType, setPresetType] = useState<PresetType>((initialData?.presetType as PresetType) || 'manual');
  const [selectedCompetition, setSelectedCompetition] = useState<string>(initialData?.selectedCompetition || '');
  const [selectedConfederation, setSelectedConfederation] = useState<Confederation>((initialData?.selectedConfederation as Confederation) || 'UEFA');
  const [manualTeams, setManualTeams] = useState<number>(initialData?.manualTeams || 16);
  const [manualGroups, setManualGroups] = useState<number>(initialData?.manualGroups || 4);
  const [confederationGroups, setConfederationGroups] = useState<number>(initialData?.confederationGroups || 4);

  // Get global state functions
  const getNationFlagCode = useGlobalStore(state => state.getNationFlagCode);
  const loadNationInfo = useGlobalStore(state => state.loadNationInfo);

  // Load nation info data on component mount
  useEffect(() => {
    loadNationInfo();
  }, [loadNationInfo]);

  // Team management state
  const [teamSlots, setTeamSlots] = useState<TeamSlot[]>(initialData?.teamSlots || []);
  const [autocompleteStates, setAutocompleteStates] = useState<{ [key: string]: { isOpen: boolean; filteredTeams: string[]; selectedIndex: number } }>({});


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

  // Initialize team slots when manual teams count changes (only if no initial data)
  useEffect(() => {
    if (presetType === 'manual' && (!initialData || initialData.presetType !== 'manual' || initialData.manualTeams !== manualTeams)) {
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
  }, [manualTeams, selectedCompetition, presetType, initialData]);

  // Initialize team slots when confederation groups count changes (only if no initial data or switching to confederation with different data)
  useEffect(() => {
    if (presetType === 'confederation') {
      // If we have initial data for confederation, use it
      if (initialData && initialData.presetType === 'confederation' && initialData.selectedConfederation === selectedConfederation) {
        setTeamSlots(initialData.teamSlots);
      } else if (!initialData || initialData.presetType !== 'confederation' || initialData.selectedConfederation !== selectedConfederation) {
        // Only create fresh data if we don't have matching initial data
        const allNationalities = useGlobalStore.getState().getAllNationalities();
        const nationInfo = useGlobalStore.getState().nationInfo;
        const confederationTeams = allNationalities
          .filter(nation => {
            const nationData = nationInfo[nation];
            return nationData && nationData.confederationID === selectedConfederation;
          })
          .map((teamName) => ({
            id: `confed-${teamName}`,
            name: teamName,
            flagCode: getNationFlagCode(teamName),
            isSelected: true // All teams enabled by default
          }));
        
        setTeamSlots(confederationTeams);
      }
    }
  }, [presetType, selectedConfederation, initialData]);

  // Initialize team slots for competition presets (only if no initial data)
  useEffect(() => {
    if (presetType === 'competition' && selectedCompetition && (!initialData || initialData.presetType !== 'competition' || initialData.selectedCompetition !== selectedCompetition)) {
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
  }, [selectedCompetition, presetType, initialData]);


  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen w-full">
      <div className="w-full">
        <div className="flex gap-6 w-full">
          <PresetSelection
            presetType={presetType}
            setPresetType={setPresetType}
            selectedCompetition={selectedCompetition}
            setSelectedCompetition={setSelectedCompetition}
            selectedConfederation={selectedConfederation}
            setSelectedConfederation={setSelectedConfederation}
            manualTeams={manualTeams}
            setManualTeams={setManualTeams}
            manualGroups={manualGroups}
            setManualGroups={setManualGroups}
            confederationGroups={confederationGroups}
            setConfederationGroups={setConfederationGroups}
            onCompetitionPresetSelect={handleCompetitionPresetSelect}
          />
          
          <TeamList
            presetType={presetType}
            selectedCompetition={selectedCompetition}
            selectedConfederation={selectedConfederation}
            teamSlots={teamSlots}
            setTeamSlots={setTeamSlots}
            autocompleteStates={autocompleteStates}
            setAutocompleteStates={setAutocompleteStates}
          />
        </div>
      </div>
    </div>
  );
});

TeamSelectionTab.displayName = 'TeamSelectionTab';

export default TeamSelectionTab;
