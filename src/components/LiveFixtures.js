import React, { useState, useEffect } from 'react';
import managersData from '../constants/manager_details.json';

const LiveFixtures = () => {
  const [currentGW, setCurrentGW] = useState(null);
  const [livePoints, setLivePoints] = useState({});
  const [fixtures, setFixtures] = useState([]);

  // Fetch gameweek
  useEffect(() => {
    const fetchGameweek = async () => {
      const res = await fetch('/api/proxy/game');
      const json = await res.json();
      setCurrentGW(json.current_event);
      console.log("The current GW is:", currentGW)
    };
    fetchGameweek();
  }, []);



  // Fetch live points
  useEffect(() => {
    if (!currentGW) return;

    const fetchLivePoints = async () => {
      const res = await fetch(`/api/proxy/event/${currentGW}/live`);
      const json = await res.json();
      const live = {};
      json.elements.forEach(player => {
        live[player.id] = player.stats.total_points;
      });
      setLivePoints(live);
    };

    fetchLivePoints();
  }, [currentGW]);

  // Build fixtures
  useEffect(() => {
    if (!currentGW || Object.keys(livePoints).length === 0) return;

    const managerList = managersData.league_entries;
    const fixturesList = [];

    for (let i = 0; i < managerList.length; i += 2) {
      const managerA = managerList[i];
      const managerB = managerList[i + 1];

      fixturesList.push({
        home: {
          name: managerA.entry_name,
          points: livePoints[managerA.entry_id] || 0,
        },
        away: {
          name: managerB.entry_name,
          points: livePoints[managerB.entry_id] || 0,
        }
      });
    }

    setFixtures(fixturesList);
  }, [currentGW, livePoints]);

  return (
    <div>
      <h3>Live Matchups</h3>
      {fixtures.length === 0 ? (
        <p>Loading fixtures...</p>
      ) : (
        <ul>
          {fixtures.map((fixture, index) => (
            <li key={index}>
              {fixture.home.name} ({fixture.home.points}) vs {fixture.away.name} ({fixture.away.points})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LiveFixtures;
