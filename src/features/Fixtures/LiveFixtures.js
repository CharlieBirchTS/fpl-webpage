import managersData from '../../constants/manager_details.json';

const LiveFixtures = ({ gameweekFinished, fixtures }) => {
    // Create a lookup from entry ID to team name
    const entryIdToName = {};
    managersData.league_entries.forEach(manager => {
        entryIdToName[manager.id] = manager.entry_name;
    });

    return (
        <div className="fixtures-section bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="fixtures-header bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
                <div className="flex items-center justify-between">
                    <h3 className="fixtures-title text-xl font-bold text-white">Live Scores</h3>
                    {gameweekFinished !== null && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${gameweekFinished
                            ? 'gameweek-finished bg-red-100 text-red-700'
                            : 'gameweek-livebg green-100 text-green-700'
                            }`}>
                            {gameweekFinished ? '🔴 Gameweek Finished' : '🟢 Live Gameweek'}
                        </span>
                    )}
                </div>
            </div>
            {!Array.isArray(fixtures) || fixtures.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    <p>Loading fixtures...</p>
                </div>
            ) : (
                <div className="fixtures-grid divide-y divide-gray-100">
                    {fixtures.map((fixture, index) => (
                        <div className="p-4 hover:bg-gray-50 transition-colors duration-200" key={index}>
                            <div className="flex items-center justify-between max-w-3xl mx-auto">
                                {/* Home Team */}
                                <div className="flex-1 text-right pr-4">
                                    <span className="font-semibold text-gray-800">
                                        {entryIdToName[fixture.league_entry_1]}
                                    </span>
                                </div>
                                {/* Scores */}
                                <div className="flex items-center space-x-4 px-4">
                                    <span className="text-2xl font-bold text-gray-900 min-w-[2rem] text-center">
                                        {fixture.league_entry_1_points ?? '-'}
                                    </span>
                                    <span className="text-gray-400">vs</span>
                                    <span className="text-2xl font-bold text-gray-900 min-w-[2rem] text-center">
                                        {fixture.league_entry_2_points ?? '-'}
                                    </span>
                                </div>
                                {/* Away Team */}
                                <div className="flex-1 text-left pl-4">
                                    <span className="font-semibold text-gray-800">
                                        {entryIdToName[fixture.league_entry_2]}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LiveFixtures;
