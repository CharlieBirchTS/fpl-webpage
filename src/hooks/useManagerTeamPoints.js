// src/hooks/useManagerTeamPoints.js
import { useState, useEffect } from 'react';
import useManagerTeam from './useManagerTeam';
import usePlayerLivePoints from './usePlayerLivePoints';

const useManagerTeamPoints = (managerId, managersData, currentGW, playersData) => {
    const { points } = usePlayerLivePoints(currentGW);
    const { team, isLoading, error } = useManagerTeam(managerId, managersData, currentGW, playersData, points);
    const [teamPoints, setTeamPoints] = useState(null);


    useEffect(() => {
        if (!team?.starters || !points) return;

        const totalPoints = team.starters.reduce((total, player) => {
            return total + (points[player.elementId] || 0);
        }, 0);

        setTeamPoints({
            totalPoints,
        });
    }, [team, points]);

    return {
        teamPoints,
        isLoading,
        error
    };
};

export default useManagerTeamPoints;