import '../css/HomePage.css';
import React, { useState, useEffect } from 'react';

const HomePage = () => {
  const [data, setData] = useState({ square1: 0, square2: 0, square3: 0 }); // Initial state for the squares

  // const base_url = 'https://draft.premierleague.com/'
  // const league_id = '10866'
  // const manager_id = '404454'

  useEffect(() => {
    console.log("HOMEPAGE LOADED AGAIN")
    // Fetch data from API and update the state
    const fetchData = async () => {
      
      try {
        // have to use a proxy to bypass CORS, proxy added to package.json file
        // This will need amending when hosting on Vercel, this only works for localhost right now
        const response = await fetch('/api/league/10866/details');
        const result = await response.json();
        const standings = result.standings;

        const team = standings.find(team => team.league_entry === 404454);

        const league_position = team.last_rank
        const league_points = team.total
        const league_total_points = team.points_for
        
        console.log("This is your team:", team);
        console.log("This is your league position:", league_position)
        console.log("This is your league points:", league_points)
        console.log("This is your league total points:", league_total_points)

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
