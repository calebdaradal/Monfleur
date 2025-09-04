/**
 * Character Repository Interface
 * Defines contract for character data operations
 * Follows Interface Segregation Principle
 */
class ICharacterRepository {
    async getAllCharacters() { throw new Error('Method not implemented'); }
    async getCharacterById(id) { throw new Error('Method not implemented'); }
    async addCharacter(character) { throw new Error('Method not implemented'); }
    async updateCharacter(id, character) { throw new Error('Method not implemented'); }
    async deleteCharacter(id) { throw new Error('Method not implemented'); }
    async getCharacterCount() { throw new Error('Method not implemented'); }
    generateMasterlistNumber() { throw new Error('Method not implemented'); }
}

/**
 * Firebase Character Repository Implementation
 * Handles Firebase Realtime Database operations
 */
class FirebaseCharacterRepository extends ICharacterRepository {
    constructor(firebaseConfig) {
        super();
        this.firebaseConfig = firebaseConfig;
        this.charactersRef = null;
    }

    /**
     * Initialize repository with Firebase database reference
     */
    async initialize() {
        if (!this.firebaseConfig.isInitialized()) {
            throw new Error('Firebase not initialized');
        }
        
        const { ref } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
        this.charactersRef = ref(this.firebaseConfig.getDatabase(), 'characters');
    }

    /**
     * Get all characters from Firebase
     * @returns {Promise<Array>} Array of characters
     */
    async getAllCharacters() {
        try {
            const { get } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
            const snapshot = await get(this.charactersRef);
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                return Object.keys(data).map(key => ({ id: key, ...data[key] }));
            }
            return [];
        } catch (error) {
            console.error('Error fetching characters:', error);
            throw error;
        }
    }

    /**
     * Get character by ID
     * @param {string} id - Character ID
     * @returns {Promise<Object|null>} Character object or null
     */
    async getCharacterById(id) {
        try {
            const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
            const characterRef = ref(this.firebaseConfig.getDatabase(), `characters/${id}`);
            const snapshot = await get(characterRef);
            
            return snapshot.exists() ? { id, ...snapshot.val() } : null;
        } catch (error) {
            console.error('Error fetching character:', error);
            throw error;
        }
    }

    /**
     * Add new character to Firebase
     * @param {Object} character - Character data
     * @returns {Promise<string>} Character ID
     */
    async addCharacter(character) {
        try {
            const { ref, push, set } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
            
            const newCharacterRef = push(this.charactersRef);
            const characterData = {
                ...character,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await set(newCharacterRef, characterData);
            return newCharacterRef.key;
        } catch (error) {
            console.error('Error adding character:', error);
            throw error;
        }
    }

    /**
     * Update existing character
     * @param {string} id - Character ID
     * @param {Object} updates - Updated character data
     * @returns {Promise<boolean>} Success status
     */
    async updateCharacter(id, updates) {
        try {
            const { ref, update } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
            const characterRef = ref(this.firebaseConfig.getDatabase(), `characters/${id}`);
            
            const updateData = {
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            await update(characterRef, updateData);
            return true;
        } catch (error) {
            console.error('Error updating character:', error);
            throw error;
        }
    }

    /**
     * Delete character from Firebase
     * @param {string} id - Character ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteCharacter(id) {
        try {
            const { ref, remove } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
            const characterRef = ref(this.firebaseConfig.getDatabase(), `characters/${id}`);
            
            await remove(characterRef);
            return true;
        } catch (error) {
            console.error('Error deleting character:', error);
            throw error;
        }
    }

    /**
     * Get total count of characters
     * @returns {Promise<number>} Total character count
     */
    async getCharacterCount() {
        try {
            const { get } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
            const snapshot = await get(this.charactersRef);
            
            if (snapshot.exists()) {
                const data = snapshot.val();
                return Object.keys(data).length;
            }
            return 0;
        } catch (error) {
            console.error('Error fetching character count:', error);
            throw error;
        }
    }

    /**
     * Generate next masterlist number
     * @returns {Promise<string>} Next masterlist number
     */
    async generateMasterlistNumber() {
        try {
            const characters = await this.getAllCharacters();
            const numbers = characters
                .map(char => char.masterlistNumber)
                .filter(num => num && num.startsWith('ML-'))
                .map(num => parseInt(num.replace('ML-', '')))
                .filter(num => !isNaN(num));
            
            const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
            return `ML-${String(maxNumber + 1).padStart(3, '0')}`;
        } catch (error) {
            console.error('Error generating masterlist number:', error);
            return 'ML-001';
        }
    }
}

/**
 * LocalStorage Character Repository (Fallback)
 * Maintains existing localStorage functionality
 */
class LocalStorageCharacterRepository extends ICharacterRepository {
    constructor() {
        super();
        this.storageKey = 'monfleur_characters';
        this.characters = [];
        this.loadCharacters();
    }

    /**
     * Load characters from localStorage
     */
    loadCharacters() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            this.characters = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading characters from localStorage:', error);
            this.characters = [];
        }
    }

    /**
     * Save characters to localStorage
     */
    saveCharacters() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.characters));
            return true;
        } catch (error) {
            console.error('Error saving characters to localStorage:', error);
            return false;
        }
    }

    async getAllCharacters() {
        return [...this.characters];
    }

    async getCharacterById(id) {
        return this.characters.find(char => char.id === id) || null;
    }

    async addCharacter(character) {
        const newCharacter = {
            ...character,
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.characters.push(newCharacter);
        this.saveCharacters();
        return newCharacter.id;
    }

    async updateCharacter(id, updates) {
        const index = this.characters.findIndex(char => char.id === id);
        if (index !== -1) {
            this.characters[index] = {
                ...this.characters[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            return this.saveCharacters();
        }
        return false;
    }

    async deleteCharacter(id) {
        this.characters = this.characters.filter(char => char.id !== id);
        return this.saveCharacters();
    }

    async getCharacterCount() {
        return this.characters.length;
    }

    generateMasterlistNumber() {
        const numbers = this.characters
            .map(char => char.masterlistNumber)
            .filter(num => num && num.startsWith('ML-'))
            .map(num => parseInt(num.replace('ML-', '')))
            .filter(num => !isNaN(num));
        
        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
        return `ML-${String(maxNumber + 1).padStart(3, '0')}`;
    }

    /**
     * Generate unique ID for new characters
     */
    generateId() {
        return 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

export { ICharacterRepository, FirebaseCharacterRepository, LocalStorageCharacterRepository };