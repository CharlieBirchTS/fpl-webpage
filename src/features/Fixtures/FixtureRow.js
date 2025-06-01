import React from 'react';
import useManagerTeamPoints from '../../hooks/useManagerTeamPoints';
import { createTeamNameLookup } from '../../utils/managerUtils';

const FixtureRow = ({ fixture, onFixtureClick, managersData, currentGW, playersData }) => {
    const { teamPoints: homeTeamPoints } = useManagerTeamPoints(
        fixture.league_entry_1,
        managersData,
        currentGW,
        playersData
    );
    const { teamPoints: awayTeamPoints } = useManagerTeamPoints(
        fixture.league_entry_2,
        managersData,
        currentGW,
        playersData
    );

    const entryIdtoName = createTeamNameLookup(managersData);

    const homeTeamName = entryIdtoName[fixture.league_entry_1]
    const awayTeamName = entryIdtoName[fixture.league_entry_2]


    return (
        <div
            onClick={() => onFixtureClick(fixture)}
            className="p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
        >
            <div className="flex items-center justify-between max-w-3xl mx-auto">
                <div className="flex-1 text-right pr-4">
                    <span className="font-semibold text-gray-800">
                        {homeTeamName}
                    </span>
                </div>
                <div className="flex items-center space-x-4 px-4">
                    <span className="text-2xl font-bold text-gray-900 min-w-[2rem] text-center">
                        {homeTeamPoints?.totalPoints ?? '-'}
                    </span>
                    <span className="text-gray-400">vs</span>
                    <span className="text-2xl font-bold text-gray-900 min-w-[2rem] text-center">
                        {awayTeamPoints?.totalPoints ?? '-'}
                    </span>
                </div>
                <div className="flex-1 text-left pl-4">
                    <span className="font-semibold text-gray-800">
                        {awayTeamName}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default FixtureRow; 