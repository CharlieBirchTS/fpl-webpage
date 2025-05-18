import React, { useState, useEffect } from 'react';
import managersData from '../constants/manager_details.json';
import '../css/LiveFixtures.css'

const LiveFixtures = () => {
    const [currentGW, setCurrentGW] = useState(null);
    const [fixtures, setFixtures] = useState([]);
    const [gameweekFinished, setGameweekFinished] = useState(null);
    const leagueId = '10866'

    // Fetch gameweek
    useEffect(() => {
        const fetchGameweek = async () => {
            const res = await fetch('/api/proxy/game');
            const json = await res.json();

            setCurrentGW(json.current_event);
            setGameweekFinished(json.current_event_finished)
        };
        fetchGameweek();
    }, []);

    // Fetch current GW fixtures for managers
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

    // Create a lookup from entry ID to team name
    const entryIdToName = {};
    managersData.league_entries.forEach(manager => {
        entryIdToName[manager.id] = manager.entry_name;
    });

    return (
        <div className="fixtures-section">
            <div className="fixtures-header">
                {gameweekFinished !== null && (
                    <span className={`status ${gameweekFinished ? 'finished' : 'live'}`}>
                        {gameweekFinished ? '🔴 Gameweek Finished' : '🟢 Live Gameweek'}
                    </span>
                )}
                <h3 className="fixtures-title">Live Scores</h3>
            </div>
            {fixtures.length === 0 ? (
                <p>Loading fixtures...</p>
            ) : (
                <div className="fixtures-grid">
                    {fixtures.map((fixture, index) => (
                        <div className="row" key={index}>
                            <span>{entryIdToName[fixture.league_entry_1]}</span>
                            <span>{fixture.league_entry_1_points ?? '-'}</span>
                            <span>{fixture.league_entry_2_points ?? '-'}</span>
                            <span>{entryIdToName[fixture.league_entry_2]}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LiveFixtures;
