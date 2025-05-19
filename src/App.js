import React, { useState, useEffect } from 'react';
import './css/App.css';
import logo from './logo.png'; // Import logo
import managersJSON from './constants/manager_details.json'
import Dropdown from './components/dropdown'
import Homepage from './components/homepage'
import DashboardEmbed from './components/dashboard';
import AgenticEmbed from './components/agentic';
import H2H from './components/H2H';


// import {
//   AuthType,
//   init
// }
//   from '@thoughtspot/visual-embed-sdk';

// init({
//   thoughtSpotHost: "https://thoughtspotpmm.thoughtspot.cloud/",
//   authType: AuthType.Basic,
//   username: "retailapparelanalyst",
//   password: "PMM$.data",
//   callPrefetch: true
// });

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
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="logo" />
        </div>
        <Dropdown onSelect={setSelectedManagerId} managersData={managersData} />
        {/* Navigation Links */}
        <div className="menu">
          <button onClick={() => handleMenuClick('home')}>Home</button>
          <button onClick={() => handleMenuClick('h2h')}>H2H</button>
          {/* <button onClick={() => handleMenuClick('dashboard')}>Dashboard</button>
          <button onClick={() => handleMenuClick('fplAgent')}>FPL Agent</button> */}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="content">
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
        {/* {activeSection === 'dashboard' && <DashboardEmbed />}
        {activeSection === 'fplAgent' && <AgenticEmbed />} */}
      </div>
    </div>
  );
};

export default App;
