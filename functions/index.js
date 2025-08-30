/**
 * Firebase Cloud Functions Entry Point
 * Exports all cloud functions for the Monfleur application
 */

// Import and export the deleteUser function
const { deleteUser } = require('./deleteUser');

// Export all functions
module.exports = {
    deleteUser
};