/**
 * Enhanced Character Storage Manager
 * Firebase-only implementation with proper error handling
 * Follows Single Responsibility and Fail Fast principles
 */
import firebaseConfig from '../config/firebase-config.js';
import { FirebaseCharacterRepository } from '../repositories/character-repository.js';
import CharacterService from './character-service.js';

class EnhancedCharacterStorageManager {
    constructor() {
        this.characterService = null;
        this.isFirebaseEnabled = false;
        this.initializationPromise = null;
        this.initializationError = null;
    }

    /**
     * Initialize storage manager with Firebase only
     * @returns {Promise<boolean>} Initialization success
     * @throws {Error} When Firebase initialization fails
     */
    async initialize() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._performInitialization();
        return this.initializationPromise;
    }

    /**
     * Perform Firebase initialization
     * @private
     * @throws {Error} When Firebase fails to initialize
     */
    async _performInitialization() {
        try {
            const firebaseInitialized = await firebaseConfig.initialize();
            
            if (!firebaseInitialized) {
                throw new Error('Firebase initialization failed - please check your configuration');
            }

            const firebaseRepo = new FirebaseCharacterRepository(firebaseConfig);
            await firebaseRepo.initialize();
            
            this.characterService = new CharacterService(firebaseRepo);
            this.isFirebaseEnabled = true;
            
            console.log('Storage Manager initialized with Firebase');
            return true;
        } catch (error) {
            this.initializationError = error;
            console.error('Firebase initialization failed:', error.message);
            throw new Error(`Database connection failed: ${error.message}`);
        }
    }

    /**
     * Get all characters
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array>} Characters array
     * @throws {Error} When database is not available
     */
    async getAllCharacters(filters = {}) {
        await this.ensureInitialized();
        try {
            return await this.characterService.getAllCharacters(filters);
        } catch (error) {
            throw new Error(`Failed to load characters: ${error.message}`);
        }
    }

    /**
     * Get character by ID
     * @param {string} id - Character ID
     * @returns {Promise<Object|null>} Character or null
     * @throws {Error} When database operation fails
     */
    async getCharacterById(id) {
        await this.ensureInitialized();
        try {
            return await this.characterService.getCharacterById(id);
        } catch (error) {
            throw new Error(`Failed to load character: ${error.message}`);
        }
    }

    /**
     * Add new character
     * @param {Object} character - Character data
     * @returns {Promise<string>} Character ID
     * @throws {Error} When save operation fails
     */
    async addCharacter(character) {
        await this.ensureInitialized();
        try {
            return await this.characterService.createCharacter(character);
        } catch (error) {
            throw new Error(`Failed to save character: ${error.message}`);
        }
    }

    /**
     * Update existing character
     * @param {string} id - Character ID
     * @param {Object} updates - Updated data
     * @param {Object} originalData - Original character data for comparison
     * @returns {Promise<boolean>} Success status
     * @throws {Error} When update operation fails
     */
    async updateCharacter(id, updates, originalData = null) {
        await this.ensureInitialized();
        try {
            return await this.characterService.updateCharacter(id, updates, originalData);
        } catch (error) {
            throw new Error(`Failed to update character: ${error.message}`);
        }
    }

    /**
     * Delete character
     * @param {string} id - Character ID
     * @returns {Promise<boolean>} Success status
     * @throws {Error} When delete operation fails
     */
    async deleteCharacter(id) {
        await this.ensureInitialized();
        try {
            return await this.characterService.deleteCharacter(id);
        } catch (error) {
            throw new Error(`Failed to delete character: ${error.message}`);
        }
    }

    /**
     * Generate next masterlist number
     * @returns {Promise<string>} Next masterlist number
     * @throws {Error} When generation fails
     */
    async generateMasterlistNumber() {
        await this.ensureInitialized();
        try {
            return await this.characterService.generateMasterlistNumber();
        } catch (error) {
            throw new Error(`Failed to generate masterlist number: ${error.message}`);
        }
    }

    /**
     * Check if Firebase is enabled
     * @returns {boolean} Firebase status
     */
    isUsingFirebase() {
        return this.isFirebaseEnabled;
    }

    /**
     * Get initialization error if any
     * @returns {Error|null} Initialization error
     */
    getInitializationError() {
        return this.initializationError;
    }

    /**
     * Ensure storage manager is initialized
     * @private
     * @throws {Error} When initialization fails
     */
    async ensureInitialized() {
        if (!this.characterService) {
            await this.initialize();
        }
    }
}

export default EnhancedCharacterStorageManager;