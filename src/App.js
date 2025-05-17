import React, { useState } from 'react';
import './css/App.css';
import logo from './logo.png'; // Import logo
import Dropdown from './components/dropdown'
import Homepage from './components/homepage'
import DashboardEmbed from './components/dashboard';
import AgenticEmbed from './components/agentic';
import LearningCentre from './components/learning';


import {
  AuthType,
  init
}
from '@thoughtspot/visual-embed-sdk';

init({
  thoughtSpotHost: "https://thoughtspotpmm.thoughtspot.cloud/",
  authType: AuthType.Basic,
  username: "retailapparelanalyst",
  password: "PMM$.data",
  callPrefetch: true 
});

const App = () => {
  const [activeSection, setActiveSection] = useState('home'); // Default section is 'home'

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
          <Dropdown />
          {/* Navigation Links */}
          <div className="menu">
            <button onClick={() => handleMenuClick('home')}>Home</button>
            <button onClick={() => handleMenuClick('learning')}>Learning Centre</button>
            <button onClick={() => handleMenuClick('dashboard')}>Dashboard</button>
            <button onClick={() => handleMenuClick('fplAgent')}>FPL Agent</button>
          </div>
      </div>

      {/* Main Content Area */}
      <div className="content">
        {activeSection === 'home' && <Homepage />}
        {activeSection === 'learning' && <LearningCentre />}
        {activeSection === 'dashboard' && <DashboardEmbed />}
        {activeSection === 'fplAgent' && <AgenticEmbed />}
      </div>
    </div>
  );
};

export default App;
