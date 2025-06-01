/**
 * Finds the current fixture for a given manager ID from an array of fixtures
 * @param {Array} fixtures - Array of fixture objects
 * @param {number} managerId - The ID of the manager to find the fixture for
 * @returns {Object|null} The fixture object if found, null otherwise
 */
export const findManagerFixture = (fixtures, managerId) => {
    if (!fixtures || !managerId) return null;
    return fixtures.find(fixture =>
        fixture.league_entry_1 === managerId ||
        fixture.league_entry_2 === managerId
    );
};

/**
 * Gets the opponent's ID from a fixture
 * @param {Object} fixture - The fixture object
 * @param {number} managerId - The ID of the manager to get the opponent for
 * @returns {number|null} The opponent's ID if found, null otherwise
 */
export const getOpponentId = (fixture, managerId) => {
    if (!fixture || !managerId) return null;
    return fixture.league_entry_1 === managerId
        ? fixture.league_entry_2
        : fixture.league_entry_1;
};