import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import managersData from '../constants/manager_details.json'

const DropDown = () => {
  const [managers, setManagers] = useState([]);

  useEffect(() => {
    // Process the imported JSON data and format it for react-select
    const managerOptions = managersData.league_entries.map(manager => ({
        value: manager.entry_name,
        label: manager.player_last_name,
      }));
      setManagers(managerOptions); // Set the options in the state
  }, []);

  const handleSelect = (selectedOption) => {
    // Pass the selected manager to the API or state
    console.log('Selected manager:', selectedOption.value); // This value can be used in API calls
  };

  const managerOptions = managers.map(manager => ({
    value: manager, label: manager
  }));

  return (
      <Select 
        id="manager-dropdown"
        options={managers} 
        onChange={handleSelect} 
        placeholder="Select Manager"
      />
  );
};

export default DropDown;
