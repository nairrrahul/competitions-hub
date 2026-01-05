import React from 'react';
import drawPresets from '../../config/draw_presets.json';

type PresetType = 'manual' | 'confederation' | 'competition';
type Confederation = 'AFC' | 'CAF' | 'OFC' | 'UEFA' | 'CONCACAF' | 'CONMEBOL';

interface PresetSelectionProps {
  presetType: PresetType;
  setPresetType: React.Dispatch<React.SetStateAction<PresetType>>;
  selectedCompetition: string;
  setSelectedCompetition: React.Dispatch<React.SetStateAction<string>>;
  selectedConfederation: Confederation;
  setSelectedConfederation: React.Dispatch<React.SetStateAction<Confederation>>;
  manualTeams: number;
  setManualTeams: React.Dispatch<React.SetStateAction<number>>;
  manualGroups: number;
  setManualGroups: React.Dispatch<React.SetStateAction<number>>;
  confederationGroups: number;
  setConfederationGroups: React.Dispatch<React.SetStateAction<number>>;
  onCompetitionPresetSelect: () => void;
}

const PresetSelection: React.FC<PresetSelectionProps> = ({
  presetType,
  setPresetType,
  selectedCompetition,
  setSelectedCompetition,
  selectedConfederation,
  setSelectedConfederation,
  manualTeams,
  setManualTeams,
  manualGroups,
  setManualGroups,
  confederationGroups,
  setConfederationGroups,
  onCompetitionPresetSelect
}) => {
  return (
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
                onChange={(e) => {
                  const newValue = Math.max(1, parseInt(e.target.value) || 1);
                  setManualGroups(Math.min(newValue, manualTeams));
                }}
                max={manualTeams}
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
            onChange={onCompetitionPresetSelect}
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
  );
};

export default PresetSelection;
