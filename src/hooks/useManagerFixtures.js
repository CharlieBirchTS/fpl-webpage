import { useState, useEffect } from 'react';

const useManagerFixtures = (leagueId, currentGW) => {
    const [managerFixtures, setManagerFixtures] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchManagerFixtures = async () => {
            if (!currentGW) return;

            try {
                setIsLoading(true);
                const res = await fetch(`/api/proxy/league/${leagueId}/details`);
                const json = await res.json();

                const currentWeekFixtures = json.matches.filter(
                    match => match.event === currentGW
                );

                setManagerFixtures(currentWeekFixtures);
            } catch (error) {
                setError(error);
                console.error('Error fetching fixtures:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchManagerFixtures();
    }, [leagueId, currentGW]);

    return { managerFixtures, isLoading, error };
};

export default useManagerFixtures;
