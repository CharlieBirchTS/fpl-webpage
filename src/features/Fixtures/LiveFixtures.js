import React from 'react';
import useManagerFixtures from '../../hooks/useManagerFixtures';
import FixtureRow from './FixtureRow';

const LiveFixtures = ({ gameweekFinished, leagueId, currentGW, onFixtureClick, playersData, managersData }) => {
    const { managerFixtures, managerFixturesLoading, managerFixturesError } = useManagerFixtures(leagueId, currentGW);

    // // Create a lookup from entry ID to team name
    // const entryIdToName = {};
    // managersData.league_entries.forEach(manager => {
    //     entryIdToName[manager.id] = manager.entry_name;
    // });

    if (managerFixturesLoading) {
        return (
            <div className="fixtures-section bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="fixtures-header bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                    <div className="flex items-center justify-between">
                        <h3 className="fixtures-title text-xl font-bold text-white">Live Scores</h3>
                        {gameweekFinished !== null && (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${gameweekFinished
                                ? 'gameweek-finished bg-red-100 text-red-700'
                                : 'gameweek-live bg-green-100 text-green-700'
                                }`}>
                                {gameweekFinished ? '🔴 Gameweek Finished' : '🟢 Live Gameweek'}
                            </span>
                        )}
                    </div>
                </div>
                <div className="p-8 text-center text-gray-500">
                    <p>Loading Managers Fixtures...</p>
                </div>
            </div>
        );
    }

    if (managerFixturesError) {
        return (
            <div className="fixtures-section bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="fixtures-header bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                    <div className="flex items-center justify-between">
                        <h3 className="fixtures-title text-xl font-bold text-white">Live Scores</h3>
                    </div>
                </div>
                <div className="p-8 text-center text-red-500">
                    <p>Error loading Managers Fixtures. Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixtures-section bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="fixtures-header bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                <div className="flex items-center justify-between">
                    <h3 className="fixtures-title text-xl font-bold text-white">Live Scores</h3>
                    {gameweekFinished !== null && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${gameweekFinished
                            ? 'gameweek-finished bg-red-100 text-red-700'
                            : 'gameweek-live bg-green-100 text-green-700'
                            }`}>
                            {gameweekFinished ? '🔴 Gameweek Finished' : '🟢 Live Gameweek'}
                        </span>
                    )}
                </div>
            </div>
            {!Array.isArray(managerFixtures) || managerFixtures.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    <p>No fixtures available</p>
                </div>
            ) : (
                <div className="fixtures-grid divide-y divide-gray-100">
                    {managerFixtures.map((fixture, index) => (
                        <FixtureRow
                            key={index}
                            fixture={fixture}
                            // entryIdToName={entryIdToName}
                            onFixtureClick={onFixtureClick}
                            managersData={managersData}
                            currentGW={currentGW}
                            playersData={playersData}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default LiveFixtures;