import React, { useEffect, useState } from 'react';

const H2H = ({ currentGW, gameweekFinished, fixtures, selectedManagerId, managersData, playersData }) => {
    const [homeTeamSelection, setHomeTeamSelection] = useState([]);
    const [awayTeamSelection, setAwayTeamSelection] = useState([]);

    const fetchFixturesManagers = async () => {
        try {
            // get the details of the selected manager from prop passed from App.js
            const selectedManagerDetails = managersData.find(m => m.id === selectedManagerId)
            // check it returned something
            if (!selectedManagerDetails) {
                console.warn(`Manager with id ${selectedManagerId} not found`);
                return;
            }

            const selectedManagerFixture = fixtures.find(fix => fix.league_entry_1 === selectedManagerId || fix.league_entry_2 === selectedManagerId);
            console.log("This is the selected users fixture:", selectedManagerFixture)

            if (!selectedManagerFixture) {
                console.warn('No fixture found for selected manager');
                return;
            }

            const selectedManagerOpponentId = selectedManagerFixture.league_entry_1 === selectedManagerId
                ? selectedManagerFixture.league_entry_2
                : selectedManagerFixture.league_entry_1;

            const opponentManagerDetails = managersData.find(m => m.id === selectedManagerOpponentId);
            if (!opponentManagerDetails) {
                console.warn("Opponent manager not found");
                return;
            }

            // get the home and aways team selection in raw form i.e. IDs for names
            const rawHomeTeamSelection = await fetchManagersSelection(selectedManagerDetails);
            const rawAwayTeamSelection = await fetchManagersSelection(opponentManagerDetails);

            if (!Array.isArray(playersData) || playersData.length === 0) {
                console.warn("playersData not ready when trying to enrich");
                return;
            }

            // enrich it with full players data object passed from parent
            const enrichedHomeTeamSelection = enrichTeamSelection(rawHomeTeamSelection);
            const enrichedAwayTeamSelection = enrichTeamSelection(rawAwayTeamSelection);


            console.log("This is the enriched home team:", enrichedHomeTeamSelection[0])
            console.log("This is the enriched away team:", enrichedAwayTeamSelection[0])
            // set the state based on final output
            setHomeTeamSelection(enrichedHomeTeamSelection);
            setAwayTeamSelection(enrichedAwayTeamSelection);

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

    const enrichTeamSelection = (teamSelection) => {
        console.log("This is the team selection accepted by enrichTeamSelection:", teamSelection)
        console.log("playersData length:", playersData?.length)
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
            return {
                element_id: sel.element,
                name: player.web_name,
                position_code: player.element_type,
                teamCode: player.team,
            }
        })
    };

    return (
        <button onClick={fetchFixturesManagers}>
            Test Fetch Picks
        </button>
    )
};

export default H2H;