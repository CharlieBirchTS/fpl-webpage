import React, { useState, useEffect } from 'react';
import managersData from '../constants/manager_details.json';
import '../css/LiveFixtures.css'

const LiveFixtures = ({ gameweekFinished, fixtures }) => {
    const leagueId = '10866'

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
            {!Array.isArray(fixtures) || fixtures.length === 0 ? (
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
