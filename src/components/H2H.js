import React, { useEffect, useState } from 'react';
import { positionMapping } from '../constants/positionMapping';
import { teamMapping } from '../constants/teamMapping';
import '../css/H2H.css';

const H2H = ({ currentGW, gameweekFinished, fixtures, selectedManagerId, managersData, playersData }) => {
    const [homeTeamSelection, setHomeTeamSelection] = useState([]);
    const [awayTeamSelection, setAwayTeamSelection] = useState([]);
    const [playerLivePoints, setPlayerLivePoints] = useState({});
    const [selectedFixture, setSelectedFixture] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [refreshDisabled, setRefreshDisabled] = useState(false);
    const [refreshCooldown, setRefreshCooldown] = useState(0);

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
            fixtures.length === 0 ||
            managersData.length === 0 ||
            playersData.length === 0
        ) return;

        const defaultFixture = fixtures.find(
            f => f.league_entry_1 === selectedManagerId || f.league_entry_2 === selectedManagerId
        );

        if (defaultFixture) {
            setSelectedFixture(defaultFixture);
        }
    }, [selectedFixture, selectedManagerId, fixtures, managersData, playersData]);

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
        if (!currentGW) return; // ⛔ don’t run until GW is ready

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


    const isPlayerDataEmpty = Object.keys(playerLivePoints).length === 0;
    if (isLoading || isPlayerDataEmpty) return <div>Loading</div>;

    return (
        <div className="h2h-container">
            <div className="gameweek-header">
                <span className={`status ${gameweekFinished ? 'finished' : 'live'}`}>
                    {gameweekFinished ? '🔴 Gameweek' : '🟢 Gameweek'} {currentGW} – {gameweekFinished ? 'Finished' : 'Live'}
                </span>
                <button onClick={handleRefreshPoints} disabled={refreshDisabled} style={{ marginLeft: '1rem' }}>
                    {refreshDisabled ? `⏳ Refresh available in ${refreshCooldown}s...` : '🔄 Refresh Points'}
                </button>
                <span style={{ marginLeft: '1rem', fontSize: '0.9rem', color: '#666' }}>
                    Last updated: {formatTime(lastUpdated)}
                </span>
            </div>
            <div className="fixture-selector">
                <label htmlFor="fixture-selector">Select a Fixture: </label>
                <select
                    id="fixture-select"
                    onChange={(e) => {
                        const selectedKey = e.target.value;
                        const newFixture = fixtures.find(f => `${f.league_entry_1}-${f.league_entry_2}` === selectedKey || `${f.league_entry_2}-${f.league_entry_1}` === selectedKey);
                        if (newFixture) setSelectedFixture(newFixture);
                    }}
                    value={selectedFixture ? `${selectedFixture.league_entry_1}-${selectedFixture.league_entry_2}` : ''}
                >
                    {fixtures.map((fixture) => {
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
            <div className="h2h-grid">
                <div className="h2h-team">
                    <h3>Your Team</h3>
                    <h4>Total Points: {getTotalTeamPoints(splitStartersAndSubs(homeTeamSelection).starters)}</h4>
                    <ul>
                        {splitStartersAndSubs(homeTeamSelection).starters.map((player, index) => (
                            <li key={`home-starter-${index}`}>
                                {player.name} ({player.position} – {player.team}) — {player.points} pts
                            </li>
                        ))}
                    </ul>
                    <h5>Substitutes</h5>
                    <ul className="subs">
                        {splitStartersAndSubs(homeTeamSelection).subs.map((player, index) => (
                            <li key={`home-sub-${index}`}>
                                {player.name} ({player.position} – {player.team}) — {player.points} pts
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="h2h-team">
                    <h3>Opponent</h3>
                    <h4>Total Points: {getTotalTeamPoints(splitStartersAndSubs(awayTeamSelection).starters)}</h4>
                    <ul>
                        {splitStartersAndSubs(awayTeamSelection).starters.map((player, index) => (
                            <li key={`away-starter-${index}`}>
                                {player.name} ({player.position} – {player.team}) — {player.points} pts
                            </li>
                        ))}
                    </ul>
                    <h5>Substitutes</h5>
                    <ul className="subs">
                        {splitStartersAndSubs(awayTeamSelection).subs.map((player, index) => (
                            <li key={`away-sub-${index}`}>
                                {player.name} ({player.position} – {player.team}) — {player.points} pts
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default H2H;
