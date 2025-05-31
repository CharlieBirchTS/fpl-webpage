import React, { useEffect, useState } from 'react';
import { positionMapping } from '../../constants/positionMapping';
import { teamMapping } from '../../constants/teamMapping';
import useManagerFixtures from '../../hooks/useManagerFixtures';

const H2H = ({ currentGW, gameweekFinished, selectedManagerId, managersData, playersData, leagueId }) => {
    const [homeTeamSelection, setHomeTeamSelection] = useState([]);
    const [awayTeamSelection, setAwayTeamSelection] = useState([]);
    const [playerLivePoints, setPlayerLivePoints] = useState({});
    const [selectedFixture, setSelectedFixture] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [refreshDisabled, setRefreshDisabled] = useState(false);
    const [refreshCooldown, setRefreshCooldown] = useState(0);

    const { managerFixtures, managerFixturesLoading, managerFixturesError } = useManagerFixtures(leagueId, currentGW);

    ///////////////////////////////
    // Basic logging in the console
    ///////////////////////////////
    useEffect(() => {
        console.log("🔁 playerLivePoints updated:", playerLivePoints);
    }, [playerLivePoints]);

    useEffect(() => {
        console.log("🔁 selectedManagerId updated:", selectedManagerId);
    }, [selectedManagerId]);

    useEffect(() => {
        console.log("✅ Enriched team for selected manager:", homeTeamSelection);
        console.log("✅ Enriched team for opponent manager:", awayTeamSelection);
    }, [homeTeamSelection, awayTeamSelection]);

    useEffect(() => {
        console.log("📊 Manager fixtures:", managerFixtures);
    }, [managerFixtures]);

    useEffect(() => {
        console.log("📊 League ID is:", leagueId);
    }, [leagueId]);

    ///////////////////////////////
    // Top Level Utility Functions
    ///////////////////////////////

    // Get time to be used for the refresh button
    const formatTime = (date) => date ? new Date(date).toLocaleTimeString() : 'Not yet refreshed';

    // Utility for getting the points, this extracts all the components
    // within the Explain part of the API resp and sums the points together
    const calculateExplainPoints = (explainArray) => {
        if (!Array.isArray(explainArray)) return 0;

        return explainArray.reduce((total, group) => {
            if (!Array.isArray(group[0])) return total;
            return total + group[0].reduce((sum, action) => sum + (action.points ?? 0), 0);
        }, 0);
    };

    const isPlayerDataEmpty = Object.keys(playerLivePoints).length === 0;

    const gameweekClass = gameweekFinished
        ? 'bg-red-100 text-red-700'
        : 'bg-green-100 text-green-700';

    const homeTeamManagerDetails = managersData.find(m => m.id === selectedFixture?.league_entry_1);
    const awayTeamManagerDetails = managersData.find(m => m.id === selectedFixture?.league_entry_2);

    const homeTeamName = homeTeamManagerDetails?.teamName || "Home Team";
    const awayTeamName = awayTeamManagerDetails?.teamName || "Away Team";

    // This takes the raw player object i.e. including IDs and replaces
    // with actual values (player, team) and also adds the points to the object
    const enrichTeamSelection = (teamSelection) => {
        if (!Array.isArray(teamSelection)) return [];
        if (!Array.isArray(playersData) || playersData.length === 0) return teamSelection;

        return teamSelection.map(sel => {
            const player = playersData.find(p => p.id === sel.element);
            if (!player) return sel;

            const position = positionMapping.find(pos => pos.id === player.element_type);
            const team = teamMapping.find(t => t.id === player.team);

            return {
                elementId: sel.element,
                startingPosition: sel.position,
                name: player.web_name,
                position: position?.plural_name_short || '',
                team: team?.name || '',
                points: playerLivePoints[sel.element] ?? 0
            };
        });
    };

    // splits the starting 11 from the subs in the managers selection
    const splitStartersAndSubs = (team) => {
        const starters = team.filter(player => player.startingPosition < 12);
        const subs = team.filter(player => player.startingPosition >= 12);
        return { starters, subs };
    };

    // sums all the points of all the players to the teams total points is live
    const getTotalTeamPoints = (players) => players.reduce((sum, p) => sum + (p.points ?? 0), 0);

    ///////////////////////////////
    // Main Component
    ///////////////////////////////

    // Step 1
    // ✅ Automatically sets the default fixture on initial load
    // This effect finds and sets the fixture involving the selected manager,
    // but only runs once when all required data is available.
    // It exits early if a fixture is already selected, or if any dependencies aren't ready yet.
    useEffect(() => {
        if (
            selectedFixture ||
            !selectedManagerId ||
            !managerFixtures ||
            managerFixtures.length === 0 ||
            managersData.length === 0 ||
            playersData.length === 0
        ) return;

        const defaultFixture = managerFixtures.find(
            f => f.league_entry_1 === selectedManagerId || f.league_entry_2 === selectedManagerId
        );

        if (defaultFixture) {
            setSelectedFixture(defaultFixture);
        }
    }, [selectedFixture, selectedManagerId, managerFixtures, managersData, playersData]);

    // Step 2
    // 📥 Fetches a manager's team selection for the current gameweek
    // Uses the manager's entry_id and currentGW to hit the FPL API.
    // Returns an array of player picks, or an empty array if the fetch fails or data is incomplete.
    const fetchManagerSelection = async (managerDetails) => {
        if (!managerDetails || !managerDetails.entry_id || !currentGW) return [];
        try {
            const res = await fetch(`/api/proxy/entry/${managerDetails.entry_id}/event/${currentGW}`);
            const json = await res.json();
            console.log(`📥 Picks for manager ${managerDetails.managerName}:`, json.picks);
            return json.picks || [];
        } catch (error) {
            console.error(`Error fetching team selection for manager ${managerDetails.entry_id}:`, error);
            return [];
        }
    };

    // Step 3
    // ⚡ Fetches live player points for the current gameweek
    // Runs once whenever `currentGW` changes.
    // Retrieves raw explain data from the API and maps total points per player.
    // Updates the `playerLivePoints` state, which is later used to enrich team selections.
    const fetchPlayerLivePoints = async () => {
        if (!currentGW) return; // ⛔ don't run until GW is ready

        setIsLoading(true);
        try {
            const res = await fetch(`/api/proxy/event/${currentGW}/live`);
            const json = await res.json();

            const pointsMap = {};
            for (const playerId in json.elements) {
                const explain = json.elements[playerId].explain;
                const totalPoints = calculateExplainPoints(explain);
                pointsMap[parseInt(playerId)] = totalPoints;
            }

            console.log("✅ Fetched live points for currentGW:", currentGW, pointsMap);

            setPlayerLivePoints(pointsMap);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error fetching live points:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // 🚀 Fetch live player points once when the component mounts or when `currentGW` changes
    // Uses a normal async function declared outside the effect for reuse (e.g. manual refresh).
    // Only fetches if the `playerLivePoints` object is currently empty.

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!playerLivePoints || Object.keys(playerLivePoints).length === 0) {
            fetchPlayerLivePoints();
        }
    }, [currentGW]);


    // 🧩 Loads and enriches team selections whenever the user selects a new fixture
    // Waits until all required data is available: fixture, players, managers, and live points
    // Fetches raw picks for both managers, enriches them with player details and live points,
    // then updates the home and away team selections used for rendering
    useEffect(() => {
        const loadFromSelectedFixture = async () => {
            if (
                !selectedFixture ||
                !playerLivePoints || Object.keys(playerLivePoints).length === 0 ||
                !playersData || playersData.length === 0 ||
                !managersData || managersData.length === 0
            ) return;

            const manager1 = managersData.find(m => m.id === selectedFixture.league_entry_1);
            const manager2 = managersData.find(m => m.id === selectedFixture.league_entry_2);

            console.log("👥 Loaded managers from fixture:", { manager1, manager2 });

            if (manager1 && manager2) {
                const [rawSel, rawOpp] = await Promise.all([
                    fetchManagerSelection(manager1),
                    fetchManagerSelection(manager2)
                ]);

                setHomeTeamSelection(enrichTeamSelection(rawSel));
                setAwayTeamSelection(enrichTeamSelection(rawOpp));
            }
        };

        loadFromSelectedFixture();
    }, [selectedFixture, managersData, playersData, playerLivePoints]);


    // 🔄 Manually refreshes live player points when the user clicks the refresh button
    // Disables the button for 10 seconds to prevent repeated API calls
    // Calls the same fetch function used on initial load to update the global points map
    const handleRefreshPoints = async () => {
        setRefreshDisabled(true);
        setRefreshCooldown(10);

        console.log("🔄 Manual refresh triggered at:", new Date().toLocaleTimeString());

        await fetchPlayerLivePoints();
        // setTimeout(() => setRefreshDisabled(false), 10000); // disable for 10 seconds
        const countdown = setInterval(() => {
            setRefreshCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(countdown);
                    setRefreshDisabled(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    if (managerFixturesLoading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-gray-600">Loading fixtures...</p>
                </div>
            </div>
        );
    }

    if (managerFixturesError) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-red-600">Error loading fixtures: {managerFixturesError.message}</p>
                </div>
            </div>
        );
    }

    if (!managerFixtures || managerFixtures.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-lg text-gray-600">No fixtures available for this gameweek</p>
                </div>
            </div>
        );
    }

    if (isLoading || isPlayerDataEmpty) return <div>Loading</div>;

    return (
        <div className="h2h-page min-h-screen w-full p-8 bg-gray-50">
            <div className="w-full max-w-7xl mx-auto space-y-8">
                {/* Header */}
                {/* GW Status */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className={`text-sm font-medium px-3 py-2 rounded ${gameweekClass}`}>
                        {gameweekFinished ? '🔴 Gameweek' : '🟢 Gameweek'} {currentGW} – {gameweekFinished ? 'Finished' : 'Live'}
                    </div>
                    {/* Fixture Selector */}
                    <div className="flex justify-center">
                        <select
                            id="fixture-select"
                            onChange={(e) => {
                                const selectedKey = e.target.value;
                                const newFixture = managerFixtures.find(f => `${f.league_entry_1}-${f.league_entry_2}` === selectedKey || `${f.league_entry_2}-${f.league_entry_1}` === selectedKey);
                                if (newFixture) setSelectedFixture(newFixture);
                            }}
                            value={selectedFixture ? `${selectedFixture.league_entry_1}-${selectedFixture.league_entry_2}` : ''}
                            className="w-full border px-4 py-2 rounded shadow-sm"
                        >
                            <option value="">Select a fixture</option>
                            {managerFixtures.map((fixture) => {
                                const team1 = managersData.find(m => m.id === fixture.league_entry_1);
                                const team2 = managersData.find(m => m.id === fixture.league_entry_2);

                                const label = team1 && team2
                                    ? `${team1.managerName} vs ${team2.managerName}`
                                    : `${fixture.league_entry_1} vs ${fixture.league_entry_2}`;

                                const key = `${fixture.league_entry_1}-${fixture.league_entry_2}`;

                                return (
                                    <option key={key} value={key}>{label}</option>
                                );
                            })}
                        </select>
                    </div>
                    {/* Refresh button */}
                    <div className="flex justify-end items-center gap-3 text-sm text-gray-600">
                        <button
                            onClick={handleRefreshPoints}
                            disabled={refreshDisabled}
                            className="bg-white border px-3 py-2 rounded shadow-sm hover:bg-gray-100 disabled:opacity-50">
                            {refreshDisabled ? `⏳ Refresh available in ${refreshCooldown}s...` : '🔄 Refresh Points'}
                        </button>
                        <span className="hidden md:inline">
                            Last updated: {formatTime(lastUpdated)}
                        </span>
                    </div>
                </div>


                {/* Team Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Home Team */}
                    <div className="bg-white p-4 rounded-xl shadow space-y-4">
                        <div className="relative">
                            <h3 className="text-xl font-extrabold text-gray-800 tracking-tight text-center">{homeTeamName}</h3>
                            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-2xl font-extrabold bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full">
                                {getTotalTeamPoints(splitStartersAndSubs(homeTeamSelection).starters)}</span>
                        </div>
                        {/* Starters */}
                        <div className="space-y-1">
                            {splitStartersAndSubs(homeTeamSelection).starters.map((player, index) => (
                                <div
                                    key={`home-starter-${index}`}
                                    className="mx-auto w-full max-w-md grid grid-cols-3 text-center items-center py-2 px-4 bg-white hover:bg-gray-50 rounded shadow-sm">
                                    <span
                                        className={`text-xs font-semibold px-2 py-1 rounded-full
                                                        ${player.position === 'GK' ? 'bg-blue-100 text-blue-800' :
                                                player.position === 'DEF' ? 'bg-green-100 text-green-800' :
                                                    player.position === 'MID' ? 'bg-yellow-100 text-yellow-800' :
                                                        player.position === 'FWD' ? 'bg-pink-100 text-pink-800' :
                                                            'bg-gray-100 text-gray-700'}
                                                        `}>
                                        {player.position}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-800">{player.name}</span>
                                    <span className="text-sm font-semibold text-indigo-700">{player.points} pts</span>
                                </div>
                            ))}
                        </div>
                        <div className="text-sm font-bold text-indigo-800 text-center mt-4 uppercase tracking-wide">Substitutes</div>
                        <div className="space-y-1">
                            {splitStartersAndSubs(homeTeamSelection).subs.map((player, index) => (
                                <div key={`home-sub-${index}`} className="mx-auto w-full max-w-md grid grid-cols-3 text-center items-center py-2 px-4 bg-white hover:bg-gray-50 rounded shadow-sm">
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">{player.position}</span>
                                    <span className="text-sm font-semibold text-gray-800">{player.name}</span>
                                    <span className="text-sm font-semibold text-indigo-700">{player.points} pts</span>
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* Away Team */}
                    <div className="bg-white p-4 rounded-xl shadow space-y-4">
                        <div className="relative">
                            <h3 className="text-xl font-extrabold text-gray-800 tracking-tight text-center">{awayTeamName}</h3>
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-extrabold bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full">
                                {getTotalTeamPoints(splitStartersAndSubs(awayTeamSelection).starters)}
                            </span>
                        </div>
                        {/* Starters */}
                        <div className="space-y-1">
                            {splitStartersAndSubs(awayTeamSelection).starters.map((player, index) => (
                                <div
                                    key={`away-starter-${index}`}
                                    className="mx-auto w-full max-w-md grid grid-cols-3 text-center items-center py-2 px-4 bg-white hover:bg-gray-50 rounded shadow-sm">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full
                                                        ${player.position === 'GK' ? 'bg-blue-100 text-blue-800' :
                                            player.position === 'DEF' ? 'bg-green-100 text-green-800' :
                                                player.position === 'MID' ? 'bg-yellow-100 text-yellow-800' :
                                                    player.position === 'FWD' ? 'bg-pink-100 text-pink-800' :
                                                        'bg-gray-100 text-gray-700'}
                                                        `}>{player.position}</span>
                                    <span className="text-sm font-semibold text-gray-800">{player.name}</span>
                                    <span className="text-sm font-semibold text-indigo-700">{player.points} pts</span>
                                </div>
                            ))}
                        </div>
                        <div className="text-sm font-bold text-indigo-800 text-center mt-4 uppercase tracking-wide">Substitutes</div>
                        <div className="space-y-1">
                            {splitStartersAndSubs(awayTeamSelection).subs.map((player, index) => (
                                <div key={`away-sub-${index}`} className="mx-auto w-full max-w-md grid grid-cols-3 text-center items-center py-2 px-4 bg-white hover:bg-gray-50 rounded shadow-sm">
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">{player.position}</span>
                                    <span className="text-sm font-semibold text-gray-800">{player.name}</span>
                                    <span className="text-sm font-semibold text-indigo-700">{player.points} pts</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default H2H;
