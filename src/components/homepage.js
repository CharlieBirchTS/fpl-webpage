import '../css/HomePage.css';
import LiveFixtures from './LiveFixtures';
import React, { useState, useEffect } from 'react';

const HomePage = ({ selectedManager }) => {
  const [data, setData] = useState({ square1: 0, square2: 0, square3: 0 }); // Initial state for the squares

  const league_id = '10866'

  useEffect(() => {
    if (!selectedManager) return; // Don’t fetch until we have a manager ID

    // Fetch data from API and update the state
    const fetchData = async () => {

      try {
        // have to use a proxy to bypass CORS, proxy added to package.json file
        // This will need amending when hosting on Vercel, this only works for localhost right now
        const response = await fetch(`/api/proxy/league/${league_id}/details`);
        const result = await response.json();
        const standings = result.standings;

        const team = standings.find(team => team.league_entry === selectedManager);

        if (!team) {
          console.warn("Manager not found");
          return;
        }

        const league_position = team.last_rank
        const league_points = team.total
        const league_total_points = team.points_for

        // Update the state with data from the API
        setData({
          square1: league_position,  // Update based on actual data structure
          square2: league_points,
          square3: league_total_points
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData(); // Fetch data when the component mounts
  }, [selectedManager]); // Empty dependency array to run only once when the component mounts

  return (
    <div className="homepage">
      <div className="grid-container">
        <div className="square">{data.square1}</div>
        <div className="square">{data.square2}</div>
        <div className="square">{data.square3}</div>
        <div className="large-box">
          <LiveFixtures />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
