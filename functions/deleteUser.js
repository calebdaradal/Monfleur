/**
 * Firebase Cloud Function to delete users from Firebase Authentication
 * This function requires Firebase Admin SDK and proper authentication
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const auth = getAuth();
const db = getFirestore();

/**
 * Cloud Function to delete a user from Firebase Authentication and Firestore
 * @param {Object} data - Function parameters
 * @param {string} data.uid - User ID to delete
 * @param {Object} context - Function context with authentication info
 * @returns {Object} Result of the deletion operation
 */
exports.deleteUser = onCall(async (request) => {
    const { uid } = request.data;
    const { auth: authContext } = request;

    // Check if the caller is authenticated
    if (!authContext) {
        throw new HttpsError('unauthenticated', 'User must be authenticated to delete users.');
    }

    try {
        // Verify the caller has admin privileges
        const callerUid = authContext.uid;
        const callerRecord = await auth.getUser(callerUid);
        
        // Check if caller has admin role in Firestore
        const callerQuery = await db.collection('users')
            .where('uid', '==', callerUid)
            .limit(1)
            .get();
        
        let hasAdminRole = false;
        if (!callerQuery.empty) {
            const userData = callerQuery.docs[0].data();
            hasAdminRole = userData.role === 'administrator' || userData.role === 'admin';
        }

        if (!hasAdminRole) {
            throw new HttpsError('permission-denied', 'Only administrators can delete users.');
        }

        // Get user record to check if it exists
        let userRecord;
        try {
            userRecord = await auth.getUser(uid);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // User doesn't exist in Auth, but might exist in Firestore
                console.log(`User ${uid} not found in Firebase Auth, checking Firestore only.`);
            } else {
                throw error;
            }
        }

        // Delete from Firebase Authentication if user exists
        if (userRecord) {
            await auth.deleteUser(uid);
            console.log(`Successfully deleted user ${uid} from Firebase Authentication.`);
        }

        // Delete from Firestore
        const userQuery = await db.collection('users')
            .where('uid', '==', uid)
            .limit(1)
            .get();

        if (!userQuery.empty) {
            await userQuery.docs[0].ref.delete();
            console.log(`Successfully deleted user ${uid} from Firestore.`);
        }

        return {
            success: true,
            message: 'User deleted successfully from both Authentication and Firestore',
            deletedFromAuth: !!userRecord,
            deletedFromFirestore: !userQuery.empty
        };

    } catch (error) {
        console.error('Error deleting user:', error);
        
        if (error instanceof HttpsError) {
            throw error;
        }
        
        throw new HttpsError('internal', `Failed to delete user: ${error.message}`);
    }
});