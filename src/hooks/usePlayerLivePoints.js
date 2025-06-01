import { useState, useEffect, useCallback } from 'react';

const usePlayerLivePoints = (currentGW) => {
    const [points, setPoints] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [refreshCooldown, setRefreshCooldown] = useState(0);

    // Points calculation utility
    const calculatePoints = (explainArray) => {
        if (!Array.isArray(explainArray)) return 0;
        return explainArray.reduce((total, group) => {
            if (!Array.isArray(group[0])) return total;
            return total + group[0].reduce((sum, action) => sum + (action.points ?? 0), 0);
        }, 0);
    };

    // Fetch points
    const fetchPoints = useCallback(async () => {
        if (!currentGW) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/proxy/event/${currentGW}/live`);
            const json = await res.json();
            const pointsMap = {};
            for (const playerId in json.elements) {
                pointsMap[parseInt(playerId)] = calculatePoints(json.elements[playerId].explain);
            }
            setPoints(pointsMap);
            setLastUpdated(new Date());
            setError(null);
        } catch (error) {
            setError(error);
            console.error('Error fetching live points:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentGW]);

    // Refresh with cooldown
    const refresh = async () => {
        setRefreshCooldown(10);
        await fetchPoints();
        const countdown = setInterval(() => {
            setRefreshCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(countdown);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Initial fetch
    useEffect(() => {
        if (Object.keys(points).length === 0) {
            fetchPoints();
        }
    }, [currentGW, fetchPoints, points]);

    return {
        points,
        isLoading,
        error,
        lastUpdated,
        refreshCooldown,
        refresh
    };
};

export default usePlayerLivePoints;
