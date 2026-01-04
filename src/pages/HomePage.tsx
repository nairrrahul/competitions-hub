import React from 'react';

interface App {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
}

const HomePage: React.FC = () => {
  const apps: App[] = [
    {
      id: 'draw-maker',
      name: 'Draw Maker',
      description: 'Soccer competition draw simulator',
      icon: '⚽',
      route: '/draw-maker'
    },
    {
      id: 'competition-simulator',
      name: 'Competition Simulator',
      description: 'Competition management tool',
      icon: '🏆',
      route: '/competition-simulator'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 w-full">
        <div className="w-full px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-green-400">App Hub</h1>
              <span className="ml-3 text-sm text-gray-400">Application Center</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-200 mb-8">Available Applications</h2>
          
          {/* App Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {apps.map((app) => (
              <button
                key={app.id}
                onClick={() => window.location.href = app.route}
                className="group flex flex-col items-center p-6 bg-gray-800 rounded-lg border border-gray-700 hover:border-green-400 transition-all duration-200 hover:bg-gray-750 hover:shadow-lg"
              >
                {/* App Icon */}
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-200">
                  {app.icon}
                </div>
                
                {/* App Name */}
                <h3 className="text-lg font-semibold text-green-400 mb-2 group-hover:text-green-300 transition-colors">
                  {app.name}
                </h3>
                
                {/* App Description */}
                <p className="text-sm text-gray-400 text-center group-hover:text-gray-300 transition-colors">
                  {app.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
