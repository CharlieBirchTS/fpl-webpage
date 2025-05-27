import React, { useState, useEffect } from 'react';
import './css/App.css';
// import logo from './logo.png'; // Import logo
import logo from './fpl-webpage-logo.png';
import managersJSON from './constants/manager_details.json'
import Dropdown from './components/dropdown'
import Homepage from './components/homepage'
import H2H from './components/H2H';

const App = () => {
  const leagueId = '10866'
  const [activeSection, setActiveSection] = useState('home'); // Default section is 'home'
  const [selectedManagerId, setSelectedManagerId] = useState(null);
  const [currentGW, setCurrentGW] = useState(null);
  const [gameweekFinished, setGameweekFinished] = useState(null);
  const [fixtures, setFixtures] = useState([]);
  const [managersData, setManagersData] = useState([]);
  const [playersData, setPlayersData] = useState([]);

  // get a list of all players at loadtime to then be reused throughout the app
  useEffect(() => {
    const fetchPlayersData = async () => {
      const res = await fetch('/api/proxy/bootstrap-static');
      const json = await res.json();
      setPlayersData(json.elements); // store player list only
    };

    fetchPlayersData();
  }, []);

  // get the current GW and status then pass it down to components
  useEffect(() => {
    const fetchGameweek = async () => {
      try {
        const res = await fetch('/api/proxy/game');
        const json = await res.json();

        setCurrentGW(json.current_event);
        setGameweekFinished(json.current_event_finished)
      }
      catch (error) {
        console.error('Error fetching gameweek:', error);
      }
    };
    fetchGameweek();
  }, []);

  // get the manager fixtures and pass that object down to be used in multiple ways
  useEffect(() => {
    if (!currentGW) return;

    const fetchCurrentManagerFixtures = async () => {
      try {
        const res = await fetch(`/api/proxy/league/${leagueId}/details`);
        const json = await res.json();

        const currentWeekFixtures = json.matches.filter(
          match => match.event === currentGW
        );

        setFixtures(currentWeekFixtures);
      } catch (error) {
        console.error('Error fetching fixtures:', error);
      }
    };

    fetchCurrentManagerFixtures();
  }, [currentGW]);

  // generate an easier to use global object with all the managers key system data
  useEffect(() => {
    // Process the imported JSON data and map entry_id to manager for manager API
    const managerOptions = managersJSON.league_entries.map(manager => ({
      value: manager.id, // id used to get team selection
      label: `${manager.player_first_name} ${manager.player_last_name}`,
      id: manager.id, // id required to find position in table, total points etc.
      entry_id: manager.entry_id, // explicit
      managerName: `${manager.player_first_name} ${manager.player_last_name}`,
      teamName: manager.entry_name
    }));
    setManagersData(managerOptions); // Set the options in the state
  }, []);

  const handleMenuClick = (section) => {
    setActiveSection(section);
  };

  return (
    <div className="app-container flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="sidebar bg-gray-800 w-64 min-h-screen flex flex-col items-center py-6 fixed left-0">
        <div className="logo-container mb-8 w-full px-4">
          <img
            src={logo}
            alt="Logo"
            className="w-full h-auto object-contain max-w-[150px] mx-auto"
          />
        </div>
        {/* Navigation Links */}
        <div className="menu flex flex-col w-full px-4 space-y-4">
          <button
            onClick={() => handleMenuClick('home')}
            className={`w-full py-2 px-4 rounded-lg transition-colors duration-200 ${activeSection === 'home'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
              }`}
          >
            Home
          </button>
          <button
            onClick={() => handleMenuClick('h2h')}
            className={`w-full py-2 px-4 rounded-lg transition-colors duration-200 ${activeSection === 'h2h'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
              }`}
          >
            H2H
          </button>
        </div>
      </div>
      {!selectedManagerId ? (
        <div className="flex flex-col items-center justify-center h-screen ml-64 flex-grow bg-gray-100">
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-700 mb-3">👋 Welcome!</p>
            <p className="text-lg text-gray-600 pb-2">Select a manager to continue</p>
            <Dropdown onSelect={setSelectedManagerId} managersData={managersData} />
          </div>
        </div>
      ) : (
        <div className="content ml-64 p-8 bg-gray-100 min-h-screen">
          {activeSection === 'home' && (<Homepage selectedManagerId={Number(selectedManagerId)}
            currentGW={currentGW}
            gameweekFinished={gameweekFinished}
            fixtures={fixtures} />)}
          {activeSection === 'h2h' && (<H2H currentGW={currentGW}
            gameweekFinished={gameweekFinished}
            fixtures={fixtures}
            selectedManagerId={selectedManagerId}
            managersData={managersData}
            playersData={playersData} />)}
        </div>
      )}
    </div>
  );
};

export default App;
