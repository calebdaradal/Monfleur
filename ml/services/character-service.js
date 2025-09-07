import loggingService from './logging-service.js';
import AuthenticationService from './authentication-service.js';

// Create authentication service instance
const authenticationService = new AuthenticationService();

/**
 * Character Service
 * Handles business logic and coordinates between repositories
 * Follows Single Responsibility and Dependency Inversion Principles
 */
class CharacterService {
    constructor(repository) {
        this.repository = repository;
    }

    /**
     * Get all characters with optional filtering
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} Filtered characters
     */
    async getAllCharacters(filters = {}) {
        try {
            const characters = await this.repository.getAllCharacters();
            return this.applyFilters(characters, filters);
        } catch (error) {
            console.error('Error in CharacterService.getAllCharacters:', error);
            throw error;
        }
    }

    /**
     * Get character by ID
     * @param {string} id - Character ID
     * @returns {Promise<Object|null>} Character or null
     */
    async getCharacterById(id) {
        try {
            return await this.repository.getCharacterById(id);
        } catch (error) {
            console.error('Error in CharacterService.getCharacterById:', error);
            throw error;
        }
    }

    /**
     * Get total count of characters
     * @returns {Promise<number>} Total character count
     */
    async getCharacterCount() {
        try {
            return await this.repository.getCharacterCount();
        } catch (error) {
            console.error('Error in CharacterService.getCharacterCount:', error);
            throw error;
        }
    }

    /**
     * Create new character
     * @param {Object} characterData - Character data
     * @returns {Promise<string>} Character ID
     */
    async createCharacter(characterData) {
        try {
            // Validate character data
            const validation = this.validateCharacterData(characterData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Check for duplicate masterlist numbers
            await this.checkDuplicateMasterlistNumber(characterData.masterlistNumber);

            const characterId = await this.repository.addCharacter(characterData);

            // Log the character creation activity
            try {
                // Ensure authentication service is initialized
                if (!authenticationService.isInitialized) {
                    await authenticationService.initialize();
                }
                const currentUser = authenticationService.getCurrentUser();
                const username = currentUser ? (currentUser.username || currentUser.email || 'Unknown User') : 'Unknown User';
                await loggingService.logCharacterActivity(
                    'UPLOAD',
                    username,
                    characterData.masterlistNumber,
                    { characterId: characterId }
                );
            } catch (logError) {
                console.warn('⚠️ Failed to log character creation:', logError);
            }

            return characterId;
        } catch (error) {
            console.error('Error in CharacterService.createCharacter:', error);
            throw error;
        }
    }

    /**
     * Update existing character
     * @param {string} id - Character ID
     * @param {Object} updates - Updated data
     * @param {Object} originalData - Original character data for comparison (optional)
     * @returns {Promise<boolean>} Success status
     */
    async updateCharacter(id, updates, originalData = null) {
        try {
            // Use provided original data or get existing character for logging purposes
            const existingCharacter = originalData || await this.repository.getCharacterById(id);
            if (!existingCharacter) {
                throw new Error('Character not found');
            }

            // Validate updates
            const validation = this.validateCharacterData(updates, true);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Check for duplicate masterlist numbers (excluding current character)
            if (updates.masterlistNumber) {
                await this.checkDuplicateMasterlistNumber(updates.masterlistNumber, id);
            }

            // Compare changes for detailed logging
            const changes = this.compareCharacterChanges(existingCharacter, updates);

            const result = await this.repository.updateCharacter(id, updates);

            // Log the character update activity with detailed changes
            try {
                // Ensure authentication service is initialized
                if (!authenticationService.isInitialized) {
                    await authenticationService.initialize();
                }
                const currentUser = authenticationService.getCurrentUser();
                const username = currentUser ? (currentUser.username || currentUser.email || 'Unknown User') : 'Unknown User';
                const masterlistNumber = updates.masterlistNumber || existingCharacter.masterlistNumber;
                
                // Create detailed log entry with changes
                await loggingService.logCharacterActivity(
                    'EDIT',
                    username,
                    masterlistNumber,
                    { 
                        characterId: id,
                        changes: changes,
                        hasMultipleChanges: changes.length > 1
                    }
                );
            } catch (logError) {
                console.warn('⚠️ Failed to log character update:', logError);
            }

            return result;
        } catch (error) {
            console.error('Error in CharacterService.updateCharacter:', error);
            throw error;
        }
    }

    /**
     * Delete character
     * @param {string} id - Character ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteCharacter(id) {
        try {
            // Get character data for logging before deletion
            const character = await this.repository.getCharacterById(id);
            if (!character) {
                throw new Error('Character not found');
            }

            const result = await this.repository.deleteCharacter(id);

            // Log the character deletion activity
            try {
                // Ensure authentication service is initialized
                if (!authenticationService.isInitialized) {
                    await authenticationService.initialize();
                }
                const currentUser = authenticationService.getCurrentUser();
                const username = currentUser ? (currentUser.username || currentUser.email || 'Unknown User') : 'Unknown User';
                await loggingService.logCharacterActivity(
                    'DELETE',
                    username,
                    character.masterlistNumber,
                    { characterId: id }
                );
            } catch (logError) {
                console.warn('⚠️ Failed to log character deletion:', logError);
            }

            return result;
        } catch (error) {
            console.error('Error in CharacterService.deleteCharacter:', error);
            throw error;
        }
    }

    /**
     * Generate next masterlist number
     * @returns {Promise<string>} Next masterlist number
     */
    async generateMasterlistNumber() {
        try {
            return await this.repository.generateMasterlistNumber();
        } catch (error) {
            console.error('Error in CharacterService.generateMasterlistNumber:', error);
            throw error;
        }
    }

    /**
     * Validate character data
     * @param {Object} data - Character data
     * @param {boolean} isUpdate - Whether this is an update operation
     * @returns {Object} Validation result
     */
    validateCharacterData(data, isUpdate = false) {
        const errors = [];
        
        if (!isUpdate || data.masterlistNumber !== undefined) {
            if (!data.masterlistNumber) {
                errors.push('Masterlist number is required');
            }
        }
        
        if (!isUpdate || data.owner !== undefined) {
            if (!data.owner) {
                errors.push('Owner name is required');
            }
        }
        
        if (!isUpdate || data.artist !== undefined) {
            if (!data.artist) {
                errors.push('Artist name is required');
            }
        }
        
        if (!isUpdate || data.rarity !== undefined) {
            if (!data.rarity) {
                errors.push('Rarity is required');
            }
        }
        
        if (!isUpdate || data.status !== undefined) {
            if (!data.status) {
                errors.push('Status is required');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Check for duplicate masterlist numbers
     * @param {string} masterlistNumber - Masterlist number to check
     * @param {string} excludeId - ID to exclude from check
     */
    async checkDuplicateMasterlistNumber(masterlistNumber, excludeId = null) {
        const characters = await this.repository.getAllCharacters();
        const duplicate = characters.find(char => 
            char.masterlistNumber === masterlistNumber && char.id !== excludeId
        );
        
        if (duplicate) {
            throw new Error('A character with this masterlist number already exists');
        }
    }

    /**
     * Compare character changes for detailed logging
     * @param {Object} originalCharacter - Original character data
     * @param {Object} updates - Updated character data
     * @returns {Array} Array of change objects
     */
    compareCharacterChanges(originalCharacter, updates) {
        const changes = [];
        
        // Define trackable fields with their display names
        const trackableFields = {
            owner: 'Owner',
            artist: 'Artist',
            primaryBiome: 'Primary Biome',
            secondaryBiome: 'Secondary Biome',
            rarity: 'Rarity',
            status: 'Status',
            description: 'Description',
            traits: 'Traits',
            notes: 'Notes',
            value: 'Value',
            masterlistNumber: 'Masterlist Number'
        };
        
        // Compare each trackable field
        Object.entries(trackableFields).forEach(([fieldKey, displayName]) => {
            const originalValue = originalCharacter[fieldKey] || '';
            const newValue = updates[fieldKey] || '';
            
            // Only track actual changes (ignore empty to empty)
            if (originalValue !== newValue && !(originalValue === '' && newValue === '')) {
                changes.push({
                    field: fieldKey,
                    displayName: displayName,
                    from: originalValue || '(empty)',
                    to: newValue || '(empty)',
                    changeText: `${displayName}: ${originalValue || '(empty)'} --> ${newValue || '(empty)'}`
                });
            }
        });
        
        return changes;
    }

    /**
     * Apply filters to character list
     * @param {Array} characters - Characters to filter
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered characters
     */
    applyFilters(characters, filters) {
        if (!filters || Object.keys(filters).length === 0) {
            return characters;
        }

        return characters.filter(character => {
            // Apply rarity filter
            if (filters.rarity && filters.rarity !== 'all' && character.rarity !== filters.rarity) {
                return false;
            }

            // Apply status filter
            if (filters.status && filters.status !== 'all' && character.status !== filters.status) {
                return false;
            }

            // Apply search filter
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                const searchableFields = [
                    character.masterlistNumber,
                    character.owner,
                    character.artist,
                    character.primaryBiome,
                    character.secondaryBiome
                ].filter(Boolean).join(' ').toLowerCase();
                
                if (!searchableFields.includes(searchTerm)) {
                    return false;
                }
            }

            return true;
        });
    }
}

export default CharacterService;