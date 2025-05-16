import '../css/HomePage.css';
import React, { useState, useEffect } from 'react';

const HomePage = () => {
  const [data, setData] = useState({ square1: 0, square2: 0, square3: 0 }); // Initial state for the squares

  const base_url = 'https://draft.premierleague.com/'
  const league_id = '10866'

  useEffect(() => {
    // Fetch data from API and update the state
    const fetchData = async () => {
      
      try {
        const response = await fetch('https://draft.premierleague.com/api/league/10866/details', { cache: 'no-store' }); // Replace with your actual API URL
        const result = await response.json();
        console.log("result")
        

        // Update the state with data from the API
        setData({
          square1: result.square1,  // Update based on actual data structure
          square2: result.square2,
          square3: result.square3
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData(); // Fetch data when the component mounts
  }, []); // Empty dependency array to run only once when the component mounts

  return (
    <div className="homepage">
      <div className="grid-container">
        <div className="square">{data.square1}</div>
        <div className="square">{data.square2}</div>
        <div className="square">{data.square3}</div>
        <div className="large-box">Large Box Content</div>
      </div>
    </div>
  );
};

export default HomePage;
