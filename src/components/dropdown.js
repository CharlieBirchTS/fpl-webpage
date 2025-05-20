import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import managersData from '../constants/manager_details.json'

const DropDown = ({ onSelect, managersData }) => {

  const handleSelect = (selectedOption) => {
    // Pass the selected manager to the API or state
    onSelect(selectedOption.value) // Pass the value up to the parent
  };

  return (
    <Select
      id="manager-dropdown"
      options={managersData}
      onChange={handleSelect}
      placeholder="Select Manager"
    />
  );
};

export default DropDown;
