import React, { useEffect, useState } from 'react';
import { positionMapping } from '../constants/positionMapping'
import { teamMapping } from '../constants/teamMapping'

const H2H = ({ currentGW, gameweekFinished, fixtures, selectedManagerId, managersData, playersData }) => {
    const [homeTeamSelection, setHomeTeamSelection] = useState([]);
    const [awayTeamSelection, setAwayTeamSelection] = useState([]);
    const [playerLivePoints, setPlayerLivePoints] = useState({});

    const fetchFixturesManagers = async () => {
        try {
            // get the details of the selected manager from prop passed from App.js
            const selectedManagerDetails = managersData.find(m => m.id === selectedManagerId)
            // check it returned something
            if (!selectedManagerDetails) {
                console.warn(`Manager with id ${selectedManagerId} not found`);
                return;
            }

            // return the object where the selected manager is either home or away
            const selectedManagerFixture = fixtures.find(fix => fix.league_entry_1 === selectedManagerId || fix.league_entry_2 === selectedManagerId);
            // check if something is returned
            if (!selectedManagerFixture) {
                console.warn('No fixture found for selected manager');
                return;
            }

            // obtain opponents manager ID from fixture
            const selectedManagerOpponentId = selectedManagerFixture.league_entry_1 === selectedManagerId
                ? selectedManagerFixture.league_entry_2
                : selectedManagerFixture.league_entry_1;

            // take that ID and then pull that managers details
            const opponentManagerDetails = managersData.find(m => m.id === selectedManagerOpponentId);
            if (!opponentManagerDetails) {
                console.warn("Opponent manager not found");
                return;
            }

            // put in the extra CODE HERE

            // get the home and aways team selection in raw form i.e. IDs for names
            const rawHomeTeamSelection = await fetchManagersSelection(selectedManagerDetails);
            const rawAwayTeamSelection = await fetchManagersSelection(opponentManagerDetails);
            // check array is returned
            if (!Array.isArray(playersData) || playersData.length === 0) {
                console.warn("playersData not ready when trying to enrich");
                return;
            }

            // enrich it with full players data object passed from parent
            const enrichedHomeTeamSelection = enrichTeamSelection(rawHomeTeamSelection);
            const enrichedAwayTeamSelection = enrichTeamSelection(rawAwayTeamSelection);

            // set the state based on final output
            setHomeTeamSelection(enrichedHomeTeamSelection);
            setAwayTeamSelection(enrichedAwayTeamSelection);

            console.log("This is the enriched Home team:", enrichedHomeTeamSelection);
            console.log("This is the enriched Away team:", enrichedAwayTeamSelection);

        } catch (error) {
            console.error(`Error fetching matchup data:`, error)
        }
    };

    const fetchManagersSelection = async (selectedManagerDetails) => {
        if (!selectedManagerDetails || !selectedManagerDetails.entry_id || !currentGW) return;
        try {
            // now run the API to get the team of the selected manager
            const res = await fetch(`/api/proxy/entry/${selectedManagerDetails.entry_id}/event/${currentGW}`);
            const json = await res.json();
            // a standard setter just stores this result as state, and if there's nothing returns empty array
            const picks = json.picks || [];
            return picks;  // ✅ also returns the data for further use
        } catch (error) {
            console.error(`Error fetching team selection for manager ${selectedManagerDetails.entry_id}:`, error)
            return [];
        }
    };

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



    // Automatically fetch data when dependencies are ready
    useEffect(() => {
        if (currentGW && fixtures.length && playersData.length && selectedManagerId) {
            fetchFixturesManagers();
            fetchManagersSelection();
        }
    }, [currentGW, fixtures, playersData, selectedManagerId]);

    return (
        <div>
            <button onClick={fetchFixturesManagers}>
                Test Fetch Picks
            </button>
            <button onClick={fetchPlayerLivePoints}>
                Test Points Mapping
            </button>
        </div>
    )
};

export default H2H;