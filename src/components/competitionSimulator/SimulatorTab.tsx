import React from 'react';

interface SimulatorTabProps {
  hasData: boolean;
}

const SimulatorTab: React.FC<SimulatorTabProps> = ({ hasData }) => {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <h2 className="text-2xl font-bold text-green-400 mb-4">Simulator</h2>
          <p className="text-gray-400">
            {hasData 
              ? "Under Construction."
              : "Under Construction, but import first!"
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimulatorTab;
