/**
 * Firebase Configuration Manager
 * Handles Firebase initialization and configuration
 * Follows Single Responsibility Principle
 */
class FirebaseConfig {
    constructor() {
        this.config = {
            apiKey: "AIzaSyAMzMFswpaT38o21WmYDGuIobkRSAHrJvY",
            authDomain: "monfleur-45b76.firebaseapp.com",
            databaseURL: "https://monfleur-45b76-default-rtdb.firebaseio.com",
            projectId: "monfleur-45b76",
            storageBucket: "monfleur-45b76.firebasestorage.app",
            messagingSenderId: "243740121037",
            appId: "1:243740121037:web:367c21d278101c08019684"
        };
        this.app = null;
        this.database = null;
    }

    /**
     * Initialize Firebase application
     * @returns {Promise<boolean>} Success status
     */
    async initialize() {
        try {
            // Import Firebase modules dynamically
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getDatabase } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
            
            this.app = initializeApp(this.config);
            this.database = getDatabase(this.app);
            
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            return false;
        }
    }

    /**
     * Get database instance
     * @returns {Database|null} Firebase database instance
     */
    getDatabase() {
        return this.database;
    }

    /**
     * Check if Firebase is initialized
     * @returns {boolean} Initialization status
     */
    isInitialized() {
        return this.database !== null;
    }
}

// Export singleton instance
const firebaseConfig = new FirebaseConfig();
export default firebaseConfig;