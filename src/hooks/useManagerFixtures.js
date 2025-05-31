import { useState, useEffect } from 'react';

const useManagerFixtures = (leagueId, currentGW) => {
    const [managerFixtures, setManagerFixtures] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchManagerFixtures = async () => {
            if (!currentGW) {
                setError(new Error('Current gameweek is required'));
                setIsLoading(false);
                return;
            }

            if (!leagueId) {
                setError(new Error('League ID is required'));
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);

                const res = await fetch(`/api/proxy/league/${leagueId}/details`);

                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }

                const json = await res.json();

                if (!json.matches) {
                    throw new Error('Invalid response format: matches data is missing');
                }

                const currentWeekFixtures = json.matches.filter(
                    match => match.event === currentGW
                );

                setManagerFixtures(currentWeekFixtures);
            } catch (error) {
                setError(error);
                console.error('Error fetching managers fixtures:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchManagerFixtures();
    }, [leagueId, currentGW]);

    return {
        managerFixtures,
        managerFixturesLoading: isLoading,
        managerFixturesError: error
    };
};

export default useManagerFixtures;
