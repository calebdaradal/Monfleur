/**
 * Character Database Management System
 * Handles local character storage with Google Drive image integration
 * Follows SOLID principles for maintainability and extensibility
 */

// Character storage manager - Single Responsibility Principle
class CharacterStorageManager {
    constructor() {
        this.characters = [];
        this.storageKey = 'monfleur_characters';
        this.loadCharacters();
    }

    /**
     * Load characters from localStorage
     * Falls back to empty array if no data exists
     */
    loadCharacters() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            this.characters = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading characters:', error);
            this.characters = [];
        }
    }

    /**
     * Save characters to localStorage
     * @param {Array} characters - Array of character objects
     */
    saveCharacters(characters = this.characters) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(characters));
            this.characters = characters;
            return true;
        } catch (error) {
            console.error('Error saving characters:', error);
            return false;
        }
    }

    /**
     * Add new character to storage
     * @param {Object} character - Character data object
     */
    addCharacter(character) {
        const newCharacter = {
            ...character,
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.characters.push(newCharacter);
        return this.saveCharacters();
    }

    /**
     * Update existing character
     * @param {string} id - Character ID
     * @param {Object} updates - Updated character data
     */
    updateCharacter(id, updates) {
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

    /**
     * Delete character by ID
     * @param {string} id - Character ID
     */
    deleteCharacter(id) {
        this.characters = this.characters.filter(char => char.id !== id);
        return this.saveCharacters();
    }

    /**
     * Get all characters
     */
    getAllCharacters() {
        return [...this.characters];
    }

    /**
     * Generate unique ID for new characters
     */
    generateId() {
        return 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Generate next masterlist number
     */
    generateMasterlistNumber() {
        const existingNumbers = this.characters
            .map(char => char.masterlistNumber)
            .filter(num => num && num.startsWith('ML-'))
            .map(num => parseInt(num.replace('ML-', '')))
            .filter(num => !isNaN(num));
        
        const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
        return `ML-${nextNumber.toString().padStart(4, '0')}`;
    }
}

/**
 * Character Database Management System
 * Firebase-based implementation with proper error handling
 * Follows SOLID principles for maintainability and extensibility
 */

// Import Firebase-based storage manager
import EnhancedCharacterStorageManager from './services/storage-manager.js';

// Google Drive image handler - Single Responsibility Principle
class GoogleDriveImageHandler {
    /**
     * Convert Google Drive share link to direct image URL
     * @param {string} shareUrl - Google Drive share URL
     * @returns {string} Direct image URL
     */
    static convertToDirectUrl(shareUrl) {
        if (!shareUrl) return '';
        
        // Handle different Google Drive URL formats
        const patterns = [
            /\/file\/d\/([a-zA-Z0-9-_]+)/,
            /id=([a-zA-Z0-9-_]+)/,
            /\/d\/([a-zA-Z0-9-_]+)\//
        ];
        
        for (const pattern of patterns) {
            const match = shareUrl.match(pattern);
            if (match) {
                // Use thumbnail API instead of direct view
                return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400-h400`;
            }
        }
        
        return shareUrl; // Return original if no pattern matches
    }

    /**
     * Get different sizes for Google Drive images
     * @param {string} shareUrl - Google Drive share URL
     * @param {string} size - Size parameter (e.g., 'w200-h200', 'w400-h400')
     * @returns {string} Thumbnail URL
     */
    static getThumbnailUrl(shareUrl, size = 'w300-h300') {
        if (!shareUrl) return '';
        
        const patterns = [
            /\/file\/d\/([a-zA-Z0-9-_]+)/,
            /id=([a-zA-Z0-9-_]+)/,
            /\/d\/([a-zA-Z0-9-_]+)\//
        ];
        
        for (const pattern of patterns) {
            const match = shareUrl.match(pattern);
            if (match) {
                return `https://drive.google.com/thumbnail?id=${match[1]}&sz=${size}`;
            }
        }
        
        return shareUrl;
    }

    /**
     * Validate if URL is a Google Drive link
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid Google Drive URL
     */
    static isValidGoogleDriveUrl(url) {
        return url && url.includes('drive.google.com');
    }

    /**
     * Test if image URL is accessible
     * @param {string} imageUrl - Image URL to test
     * @returns {Promise<boolean>} Promise resolving to true if image loads
     */
    static testImageLoad(imageUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = imageUrl;
            
            // Timeout after 10 seconds
            setTimeout(() => resolve(false), 10000);
        });
    }
}

// Character filter manager - Single Responsibility Principle
class CharacterFilterManager {
    constructor(characters) {
        this.allCharacters = characters;
        this.filteredCharacters = [...characters];
    }

    /**
     * Apply filters to character list
     * @param {Object} filters - Filter criteria
     * @param {string} filters.search - Search query
     * @param {string} filters.rarity - Rarity filter
     * @param {string} filters.status - Status filter
     * @param {string} filters.biome - Biome filter
     */
    applyFilters(filters) {
        const { search = '', rarity = 'all', status = 'all', biome = 'all' } = filters;
        
        this.filteredCharacters = this.allCharacters.filter(character => {
            const matchesSearch = this.matchesSearchQuery(character, search);
            const matchesRarity = rarity === 'all' || character.rarity === rarity;
            const matchesStatus = status === 'all' || character.status === status;
            const matchesBiome = biome === 'all' || character.biome?.includes(biome);
            
            return matchesSearch && matchesRarity && matchesStatus && matchesBiome;
        });
        
        return this.filteredCharacters;
    }

    /**
     * Check if character matches search query
     * @param {Object} character - Character object
     * @param {string} query - Search query
     */
    matchesSearchQuery(character, query) {
        if (!query) return true;
        
        const searchFields = [
            character.masterlistNumber,
            character.owner,
            character.artist,
            character.biome
        ];
        
        return searchFields.some(field => 
            field?.toLowerCase().includes(query.toLowerCase())
        );
    }

    /**
     * Update character list
     * @param {Array} characters - New character list
     */
    updateCharacters(characters) {
        this.allCharacters = characters;
        this.filteredCharacters = [...characters];
    }
}

// Main application class - Dependency Inversion Principle
class CharacterDatabaseApp {
    constructor() {
        this.storageManager = null;
        this.filterManager = null;
        this.currentView = 'grid';
        this.isLoading = true;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        document.addEventListener('DOMContentLoaded', async () => {
            await this.initializeFirebase();
            this.setupEventListeners();
        });
    }

    /**
     * Initialize Firebase connection and load characters
     */
    async initializeFirebase() {
        try {
            // Show loading status
            this.showConnectionStatus(false, 'Connecting to Firebase Database...');
            
            // Initialize Firebase storage manager
            this.storageManager = new EnhancedCharacterStorageManager();
            await this.storageManager.initialize();
            
            // Load characters from Firebase with separate error handling
            let characters = [];
            try {
                characters = await this.storageManager.getAllCharacters();
            } catch (loadError) {
                console.error('Failed to load characters:', loadError);
                characters = []; // Ensure we have an empty array
            }
            
            this.filterManager = new CharacterFilterManager(characters);
            
            // Show success status
            this.showConnectionStatus(true, `Connected to Firebase Database - ${characters.length} characters loaded`);
            
            // Render characters
            this.isLoading = false;
            this.renderCharacters();
            this.updateResultsCount();
            
        } catch (error) {
            console.error('Firebase initialization failed:', error);
            
            // Initialize with empty array to prevent errors
            this.filterManager = new CharacterFilterManager([]);
            this.isLoading = false;
            
            this.showConnectionStatus(false, `Database connection failed: ${error.message}`);
            this.showError('Failed to connect to Firebase database. Please refresh the page to try again.');
        }
    }

    /**
     * Show connection status to user
     * @param {boolean} isConnected - Whether connected to database
     * @param {string} message - Status message
     */
    showConnectionStatus(isConnected, message) {
        const statusElement = document.getElementById('connectionStatus') || this.createConnectionStatusElement();
        // Make connection status invisible by setting display to none
        statusElement.style.display = 'none';
    }

    /**
     * Create connection status element
     * @returns {HTMLElement} Status element
     */
    createConnectionStatusElement() {
        const statusElement = document.createElement('div');
        statusElement.id = 'connectionStatus';
        statusElement.className = 'connection-status-container';
        
        const contentArea = document.querySelector('.content-area');
        if (contentArea) {
            contentArea.insertBefore(statusElement, contentArea.firstChild);
        }
        
        return statusElement;
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        const container = document.getElementById('charactersGrid');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Database Error</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-refresh"></i>Retry
                    </button>
                </div>
            `;
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // View toggle buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleViewToggle(btn));
        });
        
        // Search and filter inputs
        const searchInput = document.getElementById('searchInput');
        const rarityFilter = document.getElementById('rarityFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (searchInput) searchInput.addEventListener('input', () => this.handleFiltersChange());
        if (rarityFilter) rarityFilter.addEventListener('change', () => this.handleFiltersChange());
        if (statusFilter) statusFilter.addEventListener('change', () => this.handleFiltersChange());
    }

    /**
     * Handle view toggle
     * @param {HTMLElement} btn - Clicked button
     */
    handleViewToggle(btn) {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentView = btn.getAttribute('data-view');
        this.renderCharacters();
    }

    /**
     * Handle filter changes
     */
    handleFiltersChange() {
        if (!this.filterManager || this.isLoading) return;
        
        const filters = {
            search: document.getElementById('searchInput')?.value || '',
            rarity: document.getElementById('rarityFilter')?.value || 'all',
            status: document.getElementById('statusFilter')?.value || 'all'
        };
        
        this.filterManager.applyFilters(filters);
        this.renderCharacters();
        this.updateResultsCount();
    }

    /**
     * Render characters in the current view
     */
    renderCharacters() {
        const container = document.getElementById('charactersGrid');
        if (!container || !this.filterManager) return;
        
        // Update container class based on current view
        container.className = this.currentView === 'list' ? 'characters-list' : 'characters-grid';
        
        if (this.isLoading) {
            container.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner-modern"></div>
                </div>
            `;
            return;
        }
        
        const characters = this.filterManager.filteredCharacters;
        
        if (characters.length === 0) {
            container.innerHTML = '<p class="text-muted-foreground">No characters found matching your criteria.</p>';
            return;
        }
        
        container.innerHTML = characters.map(character => this.renderCharacterCard(character)).join('');
    }

    /**
     * Render individual character card
     * @param {Object} character - Character data
     */
    renderCharacterCard(character) {
        const imageUrl = GoogleDriveImageHandler.convertToDirectUrl(character.imageUrl);
        
        if (this.currentView === 'list') {
            // List view - matching the format shown in the image
            return `
                <div class="character-list-item" data-character-id="${character.id}">
                    <div class="character-list-content">
                        <div class="character-list-header">
                            <span class="character-ml">${character.masterlistNumber}</span>
                            <span class="character-rarity rarity-${character.rarity?.toLowerCase().replace(' ', '-')}">
                                ${character.rarity}
                            </span>
                        </div>
                        <div class="character-list-body">
                            <div class="character-list-image">
                                <img src="${imageUrl}" 
                                     alt="${character.masterlistNumber}" 
                                     class="character-thumbnail"
                                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBDMTA4LjI4NCA3MCA5NS4wNzE2IDc3LjE2MzQgOTUuMDcxNiA4NS40NDc3VjEwNi41NTJDOTUuMDcxNiAxMTQuODM3IDEwMS4yODQgMTIyIDEwOSAxMjJIMTEwQzExOC4yODQgMTIyIDEyNS4wNzE2IDExNC44MzcgMTI1LjA3MTYgMTA2LjU1MlY4NS40NDc3QzEyNS4wNzE2IDc3LjE2MzQgMTE4LjI4NCA3MCAxMTAgNzBIMTAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'">
                            </div>
                            <div class="character-list-details">
                                <div class="character-list-info-grid">
                                    <div class="character-list-info-column">
                                        <p><strong>Owner:</strong> ${character.owner}</p>
                                        <p><strong>Artist:</strong> ${character.artist}</p>
                                        <p><strong>Biome:</strong> ${character.biome}</p>
                                        <p><strong>Status:</strong> ${character.status}</p>
                                    </div>
                                    <div class="character-list-info-column">
                                        <p><strong>Traits:</strong> ${character.traits || 'None specified'}</p>
                                    </div>
                                    <div class="character-list-info-column">
                                        <p><strong>Notes:</strong> ${character.notes || 'No notes'}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="character-list-actions">
                                <button class="btn btn-outline" onclick="app.editCharacter('${character.id}')">
                                    <i class="fas fa-edit"></i>Edit
                                </button>
                                <button class="btn btn-primary" onclick="app.viewCharacter('${character.id}')">
                                    <i class="fas fa-eye"></i>View
                                </button>
                                <button class="btn btn-danger" onclick="app.deleteCharacter('${character.id}')">
                                    <i class="fas fa-trash"></i>Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Grid view - existing implementation
            return `
                <div class="character-card" data-character-id="${character.id}">
                    <div class="character-image-container">
                        <img src="${imageUrl}" 
                             alt="${character.masterlistNumber}" 
                             class="character-image"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBDMTA4LjI4NCA3MCA5NS4wNzE2IDc3LjE2MzQgOTUuMDcxNiA4NS40NDc3VjEwNi41NTJDOTUuMDcxNiAxMTQuODM3IDEwMS4yODQgMTIyIDEwOSAxMjJIMTEwQzExOC4yODQgMTIyIDEyNS4wNzE2IDExNC44MzcgMTI1LjA3MTYgMTA2LjU1MlY4NS40NDc3QzEyNS4wNzE2IDc3LjE2MzQgMTE4LjI4NCA3MCAxMTAgNzBIMTAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'">
                        <div class="image-status-indicator" title="${character.imageUrl ? 'Image loaded' : 'No image'}">
                            <i class="fas ${character.imageUrl}"></i>
                        </div>
                    </div>
                    <div class="character-info">
                        <div class="character-header">
                            <span class="character-ml">${character.masterlistNumber}</span>
                            <span class="character-rarity rarity-${character.rarity?.toLowerCase().replace(' ', '-')}">${character.rarity}</span>
                        </div>
                        <div class="character-details">
                            <span><strong>Owner:</strong> ${character.owner}</span>
                            <span><strong>Artist:</strong> ${character.artist}</span>
                            <span><strong>Biome:</strong> ${character.biome}</span>
                            <span><strong>Status:</strong> ${character.status}</span>
                        </div>
                        <div class="character-actions">
                            <button class="btn btn-outline" onclick="app.editCharacter('${character.id}')">
                                <i class="fas fa-edit"></i>Edit
                            </button>
                            <button class="btn btn-primary" onclick="app.viewCharacter('${character.id}')">
                                <i class="fas fa-eye"></i>View Image
                            </button>
                            <button class="btn btn-danger" onclick="app.deleteCharacter('${character.id}')">
                                <i class="fas fa-trash"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Update results count display
     */
    updateResultsCount() {
        const countElement = document.getElementById('resultsCount');
        if (countElement && this.filterManager && this.storageManager) {
            const filtered = this.filterManager.filteredCharacters.length;
            const total = this.filterManager.allCharacters.length;
            countElement.textContent = `Showing ${filtered} of ${total} characters`;
        }
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('rarityFilter').value = 'all';
        document.getElementById('statusFilter').value = 'all';
        this.handleFiltersChange();
    }

    /**
     * View character details
     * @param {string} id - Character ID
     */
    viewCharacter(id) {
        // Add safety check for filterManager
        if (!this.filterManager || !this.filterManager.allCharacters) {
            alert('Database not available. Please refresh the page and try again.');
            return;
        }
        
        const character = this.filterManager.allCharacters.find(char => char.id === id);
        if (character) {
            // Open character detail modal or navigate to detail page
            console.log('Viewing character:', character);
            alert(`Viewing ${character.masterlistNumber} - This would open a detailed view modal`);
        } else {
            alert('Character not found. Please refresh the page and try again.');
        }
    }

    /**
     * Edit character
     * @param {string} id - Character ID
     */
    editCharacter(id) {
        // Add safety check for filterManager
        if (!this.filterManager || !this.filterManager.allCharacters) {
            alert('Database not available. Please refresh the page and try again.');
            return;
        }
        
        const character = this.filterManager.allCharacters.find(char => char.id === id);
        if (character) {
            window.location.href = `upload.html?edit=${character.id}`;
        } else {
            alert('Character not found. Please refresh the page and try again.');
        }
    }

    /**
     * Delete character
     * @param {string} id - Character ID
     */
    async deleteCharacter(id) {
        // Add safety check for filterManager and storageManager
        if (!this.filterManager || !this.filterManager.allCharacters || !this.storageManager) {
            alert('Database not available. Please refresh the page and try again.');
            return;
        }
        
        const character = this.filterManager.allCharacters.find(char => char.id === id);
        if (character && confirm(`Are you sure you want to delete ${character.masterlistNumber}?`)) {
            try {
                await this.storageManager.deleteCharacter(id);
                
                // Reload characters from Firebase
                const characters = await this.storageManager.getAllCharacters();
                this.filterManager.updateCharacters(characters);
                
                this.renderCharacters();
                this.updateResultsCount();
                
                this.showConnectionStatus(true, `Character ${character.masterlistNumber} deleted successfully`);
            } catch (error) {
                console.error('Error deleting character:', error);
                alert('Failed to delete character. Please try again.');
            }
        } else if (!character) {
            alert('Character not found. Please refresh the page and try again.');
        }
    }

    /**
     * Refresh character list
     */
    async refreshCharacters() {
        if (!this.storageManager) return;
        
        try {
            this.isLoading = true;
            this.renderCharacters();
            
            const characters = await this.storageManager.getAllCharacters();
            this.filterManager.updateCharacters(characters);
            
            this.isLoading = false;
            this.renderCharacters();
            this.updateResultsCount();
            
            this.showConnectionStatus(true, `Characters refreshed - ${characters.length} characters loaded`);
        } catch (error) {
            console.error('Error refreshing characters:', error);
            this.showConnectionStatus(false, 'Failed to refresh characters');
        }
    }
}

// Initialize the application
const app = new CharacterDatabaseApp();

// Make app globally available for onclick handlers
window.app = app;

// Export for use in other modules
export {
    GoogleDriveImageHandler,
    CharacterFilterManager,
    CharacterDatabaseApp
};