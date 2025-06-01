// src/components/common/TeamDisplay/index.js
import React from 'react';

const TeamDisplay = ({
    team,
    title,
    subtitle, // Optional subtitle for additional context
    isLoading,
    error,
    onPlayerClick, // Optional callback for player interaction
    className, // Optional additional classes
    showSubstitutes = true, // Optional flag to show/hide subs
    showPoints = true, // Optional flag to show/hide points
}) => {
    if (isLoading) {
        return (
            <div className={`bg-white rounded-lg shadow p-4 ${className || ''}`}>
                <p className="text-gray-500">Loading team...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-white rounded-lg shadow p-4 ${className || ''}`}>
                <p className="text-red-500">Error loading team: {error.message}</p>
            </div>
        );
    }

    if (!team || (!team.starters?.length && !team.subs?.length)) {
        return (
            <div className={`bg-white rounded-lg shadow p-4 ${className || ''}`}>
                <p className="text-gray-500">No team data available</p>
            </div>
        );
    }

    const renderPlayer = (player, index) => (
        <div
            key={index}
            className={`flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors ${onPlayerClick ? 'cursor-pointer' : ''
                }`}
            onClick={() => onPlayerClick?.(player)}
        >
            <div className="flex items-center space-x-2">
                <span>{player.name}</span>
                <span className="text-gray-500">({player.position})</span>
            </div>
            {showPoints && (
                <span className="font-semibold">{player.points} pts</span>
            )}
        </div>
    );

    return (
        <div className={className}>
            <div className="mb-4">
                <h2 className="text-xl font-semibold">{title}</h2>
                {subtitle && (
                    <p className="text-gray-600 text-sm">{subtitle}</p>
                )}
            </div>

            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-bold mb-2">Starters</h3>
                <div className="space-y-2">
                    {team.starters.map(renderPlayer)}
                </div>

                {showSubstitutes && team.subs?.length > 0 && (
                    <>
                        <h3 className="font-bold mt-4 mb-2">Substitutes</h3>
                        <div className="space-y-2">
                            {team.subs.map(renderPlayer)}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TeamDisplay;