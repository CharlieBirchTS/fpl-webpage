import React, { useState, useEffect } from 'react';
import usePlayerLivePoints from '../../hooks/usePlayerLivePoints';
import useManagerTeam from '../../hooks/useManagerTeam';
import useManagerFixtures from '../../hooks/useManagerFixtures';
import { findManagerFixture, getOpponentId } from '../../utils/fixtureUtils';
import TeamDisplay from '../../components/common/TeamDisplay';
import LiveFixtures from '../../features/Fixtures/LiveFixtures';

const H2H = ({ currentGW, gameweekFinished, selectedManagerId, managersData, playersData, leagueId }) => {
    // State for selected teams
    const [selectedHomeId, setSelectedHomeId] = useState(selectedManagerId);
    const [selectedAwayId, setSelectedAwayId] = useState(null);

    const {
        points,
        isLoading: pointsLoading,
        error: pointsError,
        lastUpdated,
        refreshCooldown,
        refresh
    } = usePlayerLivePoints(currentGW);

    // bring in the manager fixtures from the hook
    const {
        managerFixtures
    } = useManagerFixtures(leagueId, currentGW);

    // Get the current fixture for the logged-in manager
    const currentManagerFixture = findManagerFixture(managerFixtures, selectedManagerId);

    // Set initial away team based on the logged-in manager's fixture
    useEffect(() => {
        if (currentManagerFixture) {
            const opponentId = getOpponentId(currentManagerFixture, selectedManagerId);
            setSelectedAwayId(opponentId);
        }
    }, [currentManagerFixture, selectedManagerId]);

    // Handle fixture click
    const handleFixtureClick = (fixture) => {
        setSelectedHomeId(fixture.league_entry_1);
        setSelectedAwayId(fixture.league_entry_2);
        console.log("This is the selected home id", selectedHomeId);
        console.log("This is the selected away id", selectedAwayId);
    };

    // get selected managers team
    const {
        team: homeTeam,
        isLoading: homeTeamLoading,
        error: homeTeamError
    } = useManagerTeam(selectedHomeId, managersData, currentGW, playersData, points);

    // get selected managers team
    const {
        team: awayTeam,
        isLoading: awayTeamLoading,
        error: awayTeamError
    } = useManagerTeam(selectedAwayId, managersData, currentGW, playersData, points);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header with LiveFixtures */}
                <div className="flex justify-between items-start mb-8">
                    <div className="flex-shrink-0 flex items-center gap-4">
                        {/* Test Button */}
                        <button
                            onClick={refresh}
                            disabled={refreshCooldown > 0}
                            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                        >
                            {refreshCooldown > 0
                                ? `Refresh in ${refreshCooldown}s`
                                : 'Refresh Points'}
                        </button>
                        <p>Last Updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}</p>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-8">
                    <TeamDisplay
                        team={homeTeam}
                        title="Home Team"
                        subtitle="This is the home team"
                        isLoading={homeTeamLoading}
                        error={homeTeamError}
                    />
                    <TeamDisplay
                        team={awayTeam}
                        title="Away Team"
                        subtitle="This is the away team"
                        isLoading={awayTeamLoading}
                        error={awayTeamError}
                    />
                </div>
                {/* LiveFixtures in top right */}
                <div className="flex-grow">
                    <LiveFixtures
                        currentGW={currentGW}
                        gameweekFinished={gameweekFinished}
                        leagueId={leagueId}
                        onFixtureClick={handleFixtureClick}
                    />
                </div>
            </div>
        </div>
    );
};

export default H2H;