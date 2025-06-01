import React, { useState, useEffect } from 'react';
import managersJSON from './constants/manager_details.json';
import Layout from './components/common/Layout/index';
import Dropdown from './components/common/Dropdown/index';
import Homepage from './pages/Home/index';
import H2H from './pages/H2H/index';
import H2Hv2 from './pages/H2Hv2/index';

const App = () => {
  const leagueId = '10866'
  const [activeSection, setActiveSection] = useState('home'); // Default section is 'home'
  const [selectedManagerId, setSelectedManagerId] = useState(null);
  const [currentGW, setCurrentGW] = useState(null);
  const [gameweekFinished, setGameweekFinished] = useState(null);
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
    <Layout
      activeSection={activeSection}
      handleMenuClick={handleMenuClick}
      selectedManagerId={selectedManagerId}
      managersData={managersData}
      setSelectedManagerId={setSelectedManagerId}
    >
      {!selectedManagerId ? (
        <div className="flex flex-col items-center justify-center h-screen ml-64 flex-grow bg-gray-100">
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-700 mb-3">👋 Welcome!</p>
            <p className="text-lg text-gray-600 pb-2">Select a manager to continue</p>
            <Dropdown onSelect={setSelectedManagerId} managersData={managersData} />
          </div>
        </div>
      ) : (
        <div className="content ml-64 flex-1 bg-gray-100 min-h-screen">
          {activeSection === 'home' && (<Homepage selectedManagerId={Number(selectedManagerId)}
            currentGW={currentGW}
            gameweekFinished={gameweekFinished}
            leagueId={leagueId}
          />)}
          {activeSection === 'h2h' && (<H2H currentGW={currentGW}
            gameweekFinished={gameweekFinished}
            selectedManagerId={selectedManagerId}
            managersData={managersData}
            playersData={playersData}
            leagueId={leagueId} />)}
          {activeSection === 'h2hv2' && (<H2Hv2 currentGW={currentGW}
            gameweekFinished={gameweekFinished}
            selectedManagerId={selectedManagerId}
            managersData={managersData}
            playersData={playersData}
            leagueId={leagueId} />)}
        </div>
      )}
    </Layout>
  );
};

export default App;
