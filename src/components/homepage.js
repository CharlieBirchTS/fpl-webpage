import '../css/HomePage.css';
import LiveFixtures from './LiveFixtures';
import React, { useState, useEffect } from 'react';

const HomePage = ({ selectedManagerId, gameweekFinished, fixtures }) => {
  const [data, setData] = useState({ square1: 0, square2: 0, square3: 0 }); // Initial state for the squares

  const league_id = '10866'

  useEffect(() => {
    if (!selectedManagerId) return; // Don’t fetch until we have a manager ID

    // Fetch data from API and update the state
    const fetchData = async () => {

      try {
        // have to use a proxy to bypass CORS, proxy added to package.json file
        // This will need amending when hosting on Vercel, this only works for localhost right now
        const response = await fetch(`/api/proxy/league/${league_id}/details`);
        const result = await response.json();
        const standings = result.standings;

        const team = standings.find(team => team.league_entry === selectedManagerId);

        if (!team) {
          console.warn("Manager not found");
          return;
        }

        const league_position = team.rank
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
  }, [selectedManagerId]); // Empty dependency array to run only once when the component mounts

  return (
    <div className="homepage min-h-screen w-full p-6 bg-gray-50">
      {!selectedManagerId ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500 text-lg">
          <p className="mb-2">👋 Welcome!</p>
          <p>Select a manager to continue</p>
        </div>
      ) : (
        <div className="w-full max-w-7xl mx-auto space-y-8">
          {/* Stat Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <h4 className="text-sm text-gray-500">League Position</h4>
              <p className="text-3xl font-bold text-indigo-700">{data.square1}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <h4 className="text-sm text-gray-500">League Points</h4>
              <p className="text-3xl font-bold text-indigo-700">{data.square2}</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow text-center">
              <h4 className="text-sm text-gray-500">Total Points</h4>
              <p className="text-3xl font-bold text-indigo-700">{data.square3}</p>
            </div>
          </div>

          {/* Live Fixtures */}
          <div className="bg-white p-6 rounded-xl shadow">
            <LiveFixtures gameweekFinished={gameweekFinished} fixtures={fixtures} />
          </div>
        </div>
      )}
    </div>

  );
};

export default HomePage;
