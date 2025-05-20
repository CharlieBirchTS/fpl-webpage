import React, { useEffect, useState } from 'react';
import { positionMapping } from '../constants/positionMapping';
import { teamMapping } from '../constants/teamMapping';
import '../css/H2H.css';

const H2H = ({ currentGW, gameweekFinished, fixtures, selectedManagerId, managersData, playersData }) => {
    const [homeTeamSelection, setHomeTeamSelection] = useState([]);
    const [awayTeamSelection, setAwayTeamSelection] = useState([]);
    const [playerLivePoints, setPlayerLivePoints] = useState({});
    const [selectedFixture, setSelectedFixture] = useState(null);

    // sets default fixture to the one with the selected manager in
    useEffect(() => {
        if (!selectedFixture && selectedManagerId && fixtures.length && managersData.length && playersData.length) {
            const defaultFixture = fixtures.find(
                f => f.league_entry_1 === selectedManagerId || f.league_entry_2 === selectedManagerId
            );
            if (defaultFixture) {
                setSelectedFixture(defaultFixture);

                // 👇 Immediately get both managers
                const manager1 = managersData.find(m => m.entry_id === defaultFixture.league_entry_1);
                const manager2 = managersData.find(m => m.entry_id === defaultFixture.league_entry_2);

                if (manager1 && manager2) {
                    // 👇 Load live points and enriched team data right away
                    fetchPlayerLivePoints();
                    fetchTeamSelections(manager1, manager2)
                }
            }
        }
    }, [selectedFixture, selectedManagerId, fixtures, managersData, playersData]);

    // THIS RETURNS THE DETAILS OF THE SELECTED MANAGER AND THEIR OPPONENT
    const getFixtureManagers = (selectedManagerId) => {
        try {
            // get the details of the selected manager from prop passed from App.js
            const selectedManagerDetails = managersData.find(m => m.id === selectedManagerId)
            // check it returned something
            if (!selectedManagerDetails) {
                throw new Error(`❌ Manager with ID ${selectedManagerId} not found in managersData.`);
            }

            // return the object where the selected manager is either home or away
            const selectedManagerFixture = fixtures.find(fix => fix.league_entry_1 === selectedManagerId || fix.league_entry_2 === selectedManagerId);
            // check if something is returned
            if (!selectedManagerFixture) {
                throw new Error(`❌ No fixture found involving manager ID ${selectedManagerId}.`);
            }

            // obtain opponents manager ID from fixture
            const selectedManagerOpponentId = selectedManagerFixture.league_entry_1 === selectedManagerId
                ? selectedManagerFixture.league_entry_2
                : selectedManagerFixture.league_entry_1;

            // take that ID and then pull that managers details
            const opponentManagerDetails = managersData.find(m => m.id === selectedManagerOpponentId);
            if (!opponentManagerDetails) {
                throw new Error(`❌ Opponent with ID ${selectedManagerOpponentId} not found in managersData.`);
            }

            return { selectedManagerDetails, opponentManagerDetails };

        } catch (error) {
            console.error(`Error fetching matchup data:`, error)
        }
    };

    // THIS RETURNS THE RAW PICKS FROM THE API FOR A SINGLE MANAGER
    const fetchManagerSelection = async (ManagerDetails) => {
        if (!ManagerDetails || !ManagerDetails.entry_id || !currentGW) return;
        try {
            // now run the API to get the team of the selected manager
            const res = await fetch(`/api/proxy/entry/${ManagerDetails.entry_id}/event/${currentGW}`);
            const json = await res.json();
            // a standard setter just stores this result as state, and if there's nothing returns empty array
            const picks = json.picks || [];
            return picks;  // ✅ also returns the data for further use


        } catch (error) {
            console.error(`Error fetching team selection for manager ${ManagerDetails.entry_id}:`, error)
            return [];
        }
    };

    // THIS RUNS THROUGH THE EXPLAIN COMPONENT OF THE API TO GENERATE LIVE POINTS
    const calculateExplainPoints = (explainArray) => {
        if (!Array.isArray(explainArray)) return 0;

        return explainArray.reduce((total, group) => {
            if (!Array.isArray(group[0])) return total;

            const groupPoints = group[0].reduce((sum, action) => {
                return sum + (action.points ?? 0);
            }, 0);

            return total + groupPoints;
        }, 0);
    };

    // THIS GETS THE RAW LIVE POINTS OBJECT FROM THE API AND MAPS LIVE POINTS TO PLAYER ID
    const fetchPlayerLivePoints = async () => {
        try {
            const res = await fetch(`/api/proxy/event/${currentGW}/live`);
            const json = await res.json();

            const elements = json.elements;

            const pointsMap = {};
            for (const playerId in elements) {
                const explain = elements[playerId].explain;
                const totalPoints = calculateExplainPoints(explain);
                pointsMap[parseInt(playerId)] = totalPoints;
            }

            setPlayerLivePoints(pointsMap);
        } catch (error) {
            console.error("Error fetching live points:", error);
        }
    };

    // THIS MAPS THE IDS FOR TEAM AND POSITION AND ADDS THAT TO THE FINAL PLAYER OBJECT
    const enrichTeamSelection = (teamSelection) => {
        if (!Array.isArray(teamSelection)) {
            console.warn("Invalid teamSelection passed in:", teamSelection);
            return [];
        }

        if (!Array.isArray(playersData) || playersData.length === 0) {
            console.warn("playersData not ready yet:", playersData);
            return teamSelection; // return raw if players can't be mapped yet
        }

        return teamSelection.map(sel => {
            const player = playersData.find(p => p.id === sel.element);
            if (!player) return sel;

            // map the pos & team to players object to replace IDs with actual values
            const position = positionMapping.find(pos => pos.id === player.element_type)
            const team = teamMapping.find(t => t.id === player.team)

            // map this GWs points for each player from the PointsMap obj created in fetchPlayerLivePoints above
            const liveGameweekPoints = playerLivePoints[sel.element] ?? 0;

            // get the starting position of players to distinguish between start and subs
            const playerStartingPosition = sel.position;

            // return fully enriched player object for the team selections
            return {
                elementId: sel.element,
                startingPosition: playerStartingPosition,
                name: player.web_name,
                position: position.plural_name_short,
                team: team.name,
                points: liveGameweekPoints
            }
        })
    };

    const splitStartersAndSubs = (team) => {
        const starters = team.filter(player => player.startingPosition < 12);
        const subs = team.filter(player => player.startingPosition >= 12);
        return { starters, subs }
    };

    const getTotalTeamPoints = (players) => {
        return players.reduce((sum, p) => sum + (p.points ?? 0), 0);
    };

    // THIS GETS THE SELECTION OF BOTH MANAGERS IN PARALLEL, AND THEN ENRICHES THEM BOTH, AND SETS THE STATE
    const fetchTeamSelections = async (selectedManagerDetails, opponentManagerDetails) => {
        const [rawSel, rawOpp] = await Promise.all([
            fetchManagerSelection(selectedManagerDetails),
            fetchManagerSelection(opponentManagerDetails)
        ]);

        const enrichedSelectedManagerSelection = enrichTeamSelection(rawSel);
        const enrichedOpponentManagerSelection = enrichTeamSelection(rawOpp);

        setHomeTeamSelection(enrichedSelectedManagerSelection);
        setAwayTeamSelection(enrichedOpponentManagerSelection);
    };

    // THIS IS THE ORCHESTRATOR THAT RUNS IN ORDER ASYNC 
    const loadH2HTeams = async () => {
        try {
            // 1. Identify managers
            const { selectedManagerDetails, opponentManagerDetails } = getFixtureManagers(selectedManagerId);
            if (!selectedManagerDetails || !opponentManagerDetails) return;

            // 2. refresh Live points first
            await fetchPlayerLivePoints();

            //3. Fetch & enrich both teams
            await fetchTeamSelections(selectedManagerDetails, opponentManagerDetails);

        } catch (error) {
            console.error("loadH2HTeams error:", error.message)
        }
    }

    // reload the players & points when the user selects the fixture
    // I think this can be made more seamless by passing the managers from the dropdown into the loadH2HTeams
    // need to have a think about it. I've built a lot of logic to set the manager from the selected manager 
    // so surely I can pass it more generically as manager 1 or 2 and set the default from the default fixture
    // at the top of this file maybe?
    useEffect(() => {
        const loadFromSelectedFixture = async () => {
            if (!selectedFixture & homeTeamSelection.length === 0) return;

            const manager1 = managersData.find(m => m.id === selectedFixture.league_entry_1)
            const manager2 = managersData.find(m => m.id === selectedFixture.league_entry_2)

            if (manager1 && manager2) {
                await fetchPlayerLivePoints(); // Optional if already loaded
                await fetchTeamSelections(manager1, manager2);
            }
        };

        loadFromSelectedFixture();
    }, [selectedFixture]);

    // Automatically fetch data when dependencies are ready
    useEffect(() => {
        if (currentGW && fixtures.length && playersData.length && selectedManagerId) {
            loadH2HTeams();
            console.log(fixtures);
        }
    }, [currentGW, fixtures, playersData, selectedManagerId]);


    return (
        <div className="h2h-container">
            <div className="gameweek-header">
                <span className={`status ${gameweekFinished ? 'finished' : 'live'}`} n>
                    {gameweekFinished ? '🔴 Gameweek' : '🟢 Gameweek'} {currentGW} – {gameweekFinished ? 'Finished' : 'Live'}
                </span>
            </div>
            <div className="fixture-selector">
                <label htmlFor="fixture-selector">Select a Fixture: </label>
                <select
                    id="fixture-select"
                    onChange={(e) => {
                        const selectedKey = e.target.value;
                        console.log("User selected fixture key:", selectedKey)
                        fixtures.forEach(f => {
                            const key = `${f.league_entry_1}-${f.league_entry_2}`;
                            console.log("Available fixture key:", key);
                        });
                        const newFixture = fixtures.find(f => `${f.league_entry_1}-${f.league_entry_2}` === selectedKey ||
                            `${f.league_entry_2}-${f.league_entry_1}` === selectedKey);

                        if (newFixture) {
                            setSelectedFixture(newFixture);
                        }
                    }}
                    value={
                        selectedFixture
                            ? `${selectedFixture.league_entry_1}-${selectedFixture.league_entry_2}`
                            : ''
                    }
                >

                    {fixtures.map((fixture) => {
                        const team1 = managersData.find(m => m.id === fixture.league_entry_1);
                        const team2 = managersData.find(m => m.id === fixture.league_entry_2);

                        const label = team1 && team2
                            ? `${team1.managerName} vs ${team2.managerName}`
                            : `${fixture.league_entry_1} vs ${fixture.league_entry_2}`;

                        const key = `${fixture.league_entry_1}-${fixture.league_entry_2}`;

                        // console.log("Fixture option key:", key, "Label:", label);

                        return (
                            <option key={key} value={key}>
                                {label}
                            </option>
                        );
                    })}
                </select>
            </div>
            <div className="h2h-grid">
                {/* Your Team Panel */}
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
                {/* Opponent Team Panel */}
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
    )
};

export default H2H;