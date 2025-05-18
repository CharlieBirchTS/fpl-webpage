import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import managersData from '../constants/manager_details.json'

const DropDown = ({ onSelect }) => {
  const [managers, setManagers] = useState([]); // State to hold the dropdown options

  useEffect(() => {
    // Process the imported JSON data and format it for react-select
    const managerOptions = managersData.league_entries.map(manager => ({
      value: manager.id,
      label: `${manager.player_first_name} ${manager.player_last_name}`
      ,
    }));
    setManagers(managerOptions); // Set the options in the state
  }, []);

  const handleSelect = (selectedOption) => {
    // Pass the selected manager to the API or state
    onSelect(selectedOption.value) // Pass the value up to the parent
  };

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
