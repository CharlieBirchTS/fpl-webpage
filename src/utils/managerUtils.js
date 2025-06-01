/**
 * Creates a lookup object mapping manager IDs to their team names
 * @param {Array} managersData - Array of manager objects
 * @returns {Object} Object mapping manager IDs to team names
 */
export const createTeamNameLookup = (managersData) => {
    const lookup = {};
    managersData.forEach(manager => {
        lookup[manager.id] = manager.teamName;
    });
    return lookup;
};

/**
 * Gets a team name for a given manager ID
 * @param {Array} managersData - Array of manager objects
 * @param {number} managerId - The ID of the manager
 * @returns {string|undefined} The team name if found, undefined otherwise
 */
export const getTeamName = (managersData, managerId) => {
    return managersData.find(manager => manager.id === managerId)?.teamName;
};