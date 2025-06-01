import { useState, useEffect, useCallback } from 'react';
import { positionMapping } from '../constants/positionMapping';
import { teamMapping } from '../constants/teamMapping';

const useManagerTeam = (managerId, managersData, currentGW, playersData, livePoints) => {
    const [team, setTeam] = useState({ starters: [], subs: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTeam = useCallback(async () => {
        if (!managerId || !currentGW) return;

        setIsLoading(true);
        try {
            // get the manager entry id from the managers data as id doesn't work 100% of time for team selection
            const managerEntryId = managersData.find(m => m.id === managerId)?.entry_id;
            // fetch the team selection for the manager using the API
            const res = await fetch(`/api/proxy/entry/${managerEntryId}/event/${currentGW}`);
            const json = await res.json();
            const picks = json.picks || [];

            // Enrich picks with player data
            const enrichedPicks = picks.map(pick => {
                const player = playersData.find(p => p.id === pick.element);
                if (!player) return pick;

                return {
                    elementId: pick.element,
                    startingPosition: pick.position,
                    name: player.web_name,
                    position: positionMapping.find(pos => pos.id === player.element_type)?.plural_name_short || '',
                    team: teamMapping.find(t => t.id === player.team)?.name || '',
                    points: livePoints[pick.element] ?? 0
                };
            });

            // Split into starters and subs
            const starters = enrichedPicks.filter(p => p.startingPosition < 12);
            const subs = enrichedPicks.filter(p => p.startingPosition >= 12);

            setTeam({ starters, subs });
            setError(null);
        } catch (error) {
            setError(error);
            console.error('Error fetching team selection:', error);
        } finally {
            setIsLoading(false);
        }
    }, [managerId, currentGW, playersData, livePoints]);

    useEffect(() => {
        if (playersData?.length && Object.keys(livePoints).length) {
            fetchTeam();
        }
    }, [fetchTeam, playersData, livePoints]);

    return { team, isLoading, error };
};

export default useManagerTeam; 