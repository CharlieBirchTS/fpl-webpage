import React, { useEffect, useState } from 'react';
import { positionMapping } from '../constants/positionMapping'
import { teamMapping } from '../constants/teamMapping'

const H2H = ({ currentGW, gameweekFinished, fixtures, selectedManagerId, managersData, playersData }) => {
    const [homeTeamSelection, setHomeTeamSelection] = useState([]);
    const [awayTeamSelection, setAwayTeamSelection] = useState([]);
    const [playerLivePoints, setPlayerLivePoints] = useState({});

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

            // return fully enriched player object for the team selections
            return {
                element_id: sel.element,
                name: player.web_name,
                position: position.plural_name_short,
                team: team.name,
                points: liveGameweekPoints
            }
        })
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

    // THIS IS THE ORCHESTRATOR THAT RUNS BACKEND IN ORDER ASYNC 
    const loadH2HTeams = async () => {
        try {
            // 1. Identify managers
            const { selectedManagerDetails, opponentManagerDetails } = getFixtureManagers(selectedManagerId);

            // 2. refresh Live points first
            await fetchPlayerLivePoints();

            //3. Fetch & enrich both teams
            await fetchTeamSelections(selectedManagerDetails, opponentManagerDetails);
        } catch (error) {
            console.error("loadH2HTeams error:", error.message)
        }
    }



    // Automatically fetch data when dependencies are ready
    useEffect(() => {
        if (currentGW && fixtures.length && playersData.length && selectedManagerId) {
            loadH2HTeams();
        }
    }, [currentGW, fixtures, playersData, selectedManagerId]);

    return (
        <div>
            <button onClick={getFixtureManagers}>
                Test Fetch Picks
            </button>
            <button onClick={fetchPlayerLivePoints}>
                Test Points Mapping
            </button>
        </div>
    )
};

export default H2H;