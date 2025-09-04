/**
 * Character Gallery Manager
 * 
 * A comprehensive character gallery system with configurable layouts,
 * filtering, search functionality, and UI visibility controls.
 * 
 * Features:
 * - Grid and Masonry layout options
 * - Character filtering by rarity and status
 * - Search functionality
 * - Configurable default settings
 * - UI element visibility controls
 * - Firebase Realtime Database integration
 * - Responsive design
 * 
 * @author Monfleur Development Team
 * @version 2.0.0
 */

import firebaseConfig from '../ml/config/firebase-config.js';

/**
 * Main Character Gallery Manager Class
 * 
 * Manages the display and interaction of character galleries with
 * configurable options for layout, filtering, and UI controls.
 * 
 * Configuration Options:
 * @param {Object} options - Configuration object
 * @param {string} [options.containerId='charactersContainer'] - ID of the main container element
 * @param {string} [options.searchId='characterSearch'] - ID of the search input element
 * @param {string} [options.rarityFilterId='rarityFilter'] - ID of the rarity filter element
 * @param {string} [options.statusFilterId='statusFilter'] - ID of the status filter element
 * @param {string} [options.resultsCountId='resultsCount'] - ID of the results count element
 * @param {string} [options.layoutToggleId='layoutToggle'] - ID of the layout toggle container
 * @param {string} [options.defaultLayout='masonry'] - Default layout ('grid' or 'masonry')
 * @param {string} [options.defaultRarity=''] - Default rarity filter value
 * @param {string} [options.defaultStatus=''] - Default status filter value
 * @param {string} [options.defaultSearch=''] - Default search value
 * @param {boolean} [options.showLayoutToggle=true] - Show/hide layout toggle buttons
 * @param {boolean} [options.showGridButton=false] - Show/hide grid layout button
 * @param {boolean} [options.showMasonryButton=false] - Show/hide masonry layout button
 * @param {boolean} [options.showFilters=false] - Show/hide all filter elements (when true, enables search and filters)
 * @param {boolean} [options.showRarityFilter=false] - Show/hide rarity filter
 * @param {boolean} [options.showStatusFilter=false] - Show/hide status filter
 * @param {boolean} [options.showSearch=false] - Show/hide search input
 * @param {boolean} [options.showResultsCount=false] - Show/hide results count
 * @param {boolean} [options.showGalleryTitle=false] - Show/hide gallery title
 * @param {boolean} [options.showMasterlistNumber=false] - Show/hide masterlist number in character cards
 * @param {boolean} [options.autoLoad=true] - Automatically load characters on initialization
 */
export class CharacterGalleryManager {
    /**
     * Initialize the Character Gallery Manager
     * 
     * @param {Object} options - Configuration options
     * @param {string} options.containerId - ID of the characters container element
     * @param {string} options.searchId - ID of the search input element
     * @param {string} options.rarityFilterId - ID of the rarity filter select element
     * @param {string} options.statusFilterId - ID of the status filter select element
     * @param {string} options.resultsCountId - ID of the results count display element
     * @param {string} options.layoutToggleId - ID of the layout toggle container
     * @param {string} options.defaultLayout - Initial layout mode ('grid' or 'masonry')
     * @param {boolean} options.showLayoutToggle - Show/hide layout toggle buttons
     * @param {string} options.defaultRarity - Initial rarity filter value
     * @param {string} options.defaultStatus - Initial status filter value
     * @param {string} options.defaultSearch - Initial search term
     * @param {boolean} options.showFilters - Show/hide filter controls
     * @param {boolean} options.showSearch - Show/hide search input
     * @param {boolean} options.showResultsCount - Show/hide results counter
     * @param {boolean} options.autoLoad - Auto-load characters on initialization
     */
    constructor(options = {}) {
        // Element IDs configuration
        this.containerId = options.containerId || 'charactersContainer';
        this.searchId = options.searchId || 'characterSearch';
        this.rarityFilterId = options.rarityFilterId || 'rarityFilter';
        this.statusFilterId = options.statusFilterId || 'statusFilter';
        this.resultsCountId = options.resultsCountId || 'resultsCount';
        this.layoutToggleId = options.layoutToggleId || 'layoutToggle';
        
        // Layout and UI configuration
        this.defaultLayout = options.defaultLayout || 'masonry'; // defaults to masonry
        this.showLayoutToggle = options.showLayoutToggle !== false; // defaults to true
        
        // Default filter and search values
        this.defaultRarity = options.defaultRarity || '';
        this.defaultStatus = options.defaultStatus || '';
        this.defaultSearch = options.defaultSearch || '';
        
        // Enhanced UI visibility controls - Default to hidden for cleaner UI
        this.showFilters = false;
        this.showRarityFilter = false;
        this.showStatusFilter = false;
        this.showSearch = false;
        this.showResultsCount = false;
        this.showGridButton = false;
        this.showMasonryButton = false;
        this.showGalleryTitle = false;
        
        // Character information field visibility controls - Default to hidden
        this.showOwner = true;
        this.showArtist = true;
        this.showBiome = true;
        this.showSecondaryBiome = true;
        this.showDescription = false;
        this.showTraits = false;
        this.showNotes = false;
        this.showValue = true;
        this.showRarityBadge = true;
        this.showStatus = true;
        this.showMasterlistNumber = true;
        
        // Override defaults with user-provided options
        if (options.showFilters === true) {
            this.showFilters = true;
            this.showRarityFilter = true;
            this.showStatusFilter = true;
            this.showSearch = true;
        }
        
        // Individual overrides (these take precedence over showFilters)
        if (options.showRarityFilter === true) this.showRarityFilter = true;
        if (options.showRarityFilter === false) this.showRarityFilter = false;
        if (options.showStatusFilter === true) this.showStatusFilter = true;
        if (options.showStatusFilter === false) this.showStatusFilter = false;
        if (options.showSearch === true) this.showSearch = true;
        if (options.showSearch === false) this.showSearch = false;
        if (options.showResultsCount === true) this.showResultsCount = true;
        if (options.showResultsCount === false) this.showResultsCount = false;
        if (options.showGridButton === true) this.showGridButton = true;
        if (options.showGridButton === false) this.showGridButton = false;
        if (options.showMasonryButton === true) this.showMasonryButton = true;
        if (options.showMasonryButton === false) this.showMasonryButton = false;
        if (options.showGalleryTitle === true) this.showGalleryTitle = true;
        if (options.showGalleryTitle === false) this.showGalleryTitle = false;
        
        // Character information field overrides
        if (options.showOwner === true) this.showOwner = true;
        if (options.showOwner === false) this.showOwner = false;
        if (options.showArtist === true) this.showArtist = true;
        if (options.showArtist === false) this.showArtist = false;
        if (options.showBiome === true) this.showBiome = true;
        if (options.showBiome === false) this.showBiome = false;
        if (options.showSecondaryBiome === true) this.showSecondaryBiome = true;
        if (options.showSecondaryBiome === false) this.showSecondaryBiome = false;
        if (options.showDescription === true) this.showDescription = true;
        if (options.showDescription === false) this.showDescription = false;
        if (options.showTraits === true) this.showTraits = true;
        if (options.showTraits === false) this.showTraits = false;
        if (options.showNotes === true) this.showNotes = true;
        if (options.showNotes === false) this.showNotes = false;
        if (options.showValue === true) this.showValue = true;
        if (options.showValue === false) this.showValue = false;
        if (options.showRarityBadge === true) this.showRarityBadge = true;
        if (options.showRarityBadge === false) this.showRarityBadge = false;
        if (options.showStatus === true) this.showStatus = true;
        if (options.showStatus === false) this.showStatus = false;
        
        // Backward compatibility: if showFilters is false, hide individual filters
        if (options.showFilters === false) {
            this.showRarityFilter = false;
            this.showStatusFilter = false;
        }
        
        // Backward compatibility: if showLayoutToggle is false, hide individual buttons
        if (options.showLayoutToggle === false) {
            this.showGridButton = false;
            this.showMasonryButton = false;
        }
        
        // Loading configuration
        this.autoLoad = options.autoLoad !== false;
        
        // Internal state
        this.characters = [];
        this.filteredCharacters = [];
        this.currentLayout = this.defaultLayout;
        this.isLoading = false;
        
        // Set global instance reference for image error handling
        if (typeof window !== 'undefined') {
            window.characterGalleryManager = this;
        }
        
        // Initialize the gallery
        this.init();
    }

    /**
     * Initialize the gallery system
     * Sets up Firebase connection, DOM elements, and event listeners
     */
    async init() {
        try {
            // Initialize Firebase connection
            await firebaseConfig.initialize();
            this.database = firebaseConfig.getDatabase();
            
            // Get DOM elements
            this.container = document.getElementById(this.containerId);
            this.searchInput = document.getElementById(this.searchId);
            this.rarityFilter = document.getElementById(this.rarityFilterId);
            this.statusFilter = document.getElementById(this.statusFilterId);
            this.resultsCount = document.getElementById(this.resultsCountId);
            this.layoutToggle = document.getElementById(this.layoutToggleId);
            
            // Validate required elements
            if (!this.container) {
                throw new Error(`Container element with ID '${this.containerId}' not found`);
            }
            
            // Apply default settings and UI visibility
            this.applyDefaultSettings();
            this.setupUIVisibility();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Auto-load characters if enabled
            if (this.autoLoad) {
                await this.loadCharacters();
            }
            
        } catch (error) {
            console.error('Failed to initialize Character Gallery:', error);
            this.showError('Failed to initialize character gallery');
        }
    }

    /**
     * Apply default settings for filters, search, and layout
     */
    applyDefaultSettings() {
        // Set default search value
        if (this.searchInput && this.defaultSearch) {
            this.searchInput.value = this.defaultSearch;
        }
        
        // Set default rarity filter
        if (this.rarityFilter && this.defaultRarity) {
            this.rarityFilter.value = this.defaultRarity;
        }
        
        // Set default status filter
        if (this.statusFilter && this.defaultStatus) {
            this.statusFilter.value = this.defaultStatus;
        }
        
        // Set default layout and update button states
        this.setLayout(this.defaultLayout);
    }

    /**
     * Setup UI element visibility based on configuration
     */
    setupUIVisibility() {
        // If showFilters is false, hide all filter-related elements
        if (!this.showFilters) {
            this.toggleElementVisibility(this.rarityFilter, false);
            this.toggleElementVisibility(this.statusFilter, false);
            this.toggleElementVisibility(this.searchInput, false);
        } else {
            // Control search input visibility
            this.toggleElementVisibility(this.searchInput, this.showSearch);
            
            // Control individual filter visibility
            this.toggleElementVisibility(this.rarityFilter, this.showRarityFilter);
            this.toggleElementVisibility(this.statusFilter, this.showStatusFilter);
        }
        
        // Control individual layout button visibility
        if (this.layoutToggle) {
            const gridBtn = this.layoutToggle.querySelector('#gridLayoutBtn');
            const masonryBtn = this.layoutToggle.querySelector('#masonryLayoutBtn');
            
            this.toggleElementVisibility(gridBtn, this.showGridButton);
            this.toggleElementVisibility(masonryBtn, this.showMasonryButton);
            
            // Show/hide layout toggle container based on overall setting and button visibility
            const hasVisibleButtons = this.showGridButton || this.showMasonryButton;
            this.toggleElementVisibility(this.layoutToggle, this.showLayoutToggle && hasVisibleButtons);
        }
        
        // Control results count visibility - hide the entire results-info div
        if (this.resultsCount) {
            const resultsInfoDiv = this.resultsCount.closest('.results-info');
            this.toggleElementVisibility(resultsInfoDiv || this.resultsCount, this.showResultsCount);
        }
        
        // Control gallery title visibility
        const galleryTitle = document.querySelector('.gallery-title');
        this.toggleElementVisibility(galleryTitle, this.showGalleryTitle);
    }

    /**
     * Toggle visibility of a DOM element
     * 
     * @param {HTMLElement} element - The element to show/hide
     * @param {boolean} show - Whether to show the element
     */
    toggleElementVisibility(element, show) {
        if (element) {
            element.style.display = show ? '' : 'none';
            
            // Also hide parent container if it has specific classes
            const parent = element.closest('.search-container, .filter-group, .gallery-controls');
            if (parent && !show) {
                const siblings = parent.querySelectorAll('input, select, button');
                const visibleSiblings = Array.from(siblings).filter(sibling => 
                    sibling !== element && sibling.style.display !== 'none'
                );
                
                if (visibleSiblings.length === 0) {
                    parent.style.display = 'none';
                }
            }
        }
    }

    /**
     * Setup event listeners for user interactions
     */
    setupEventListeners() {
        // Search input event listener
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => {
                this.filterCharacters();
            });
        }

        // Filter event listeners
        if (this.rarityFilter) {
            this.rarityFilter.addEventListener('change', () => {
                this.filterCharacters();
            });
        }

        if (this.statusFilter) {
            this.statusFilter.addEventListener('change', () => {
                this.filterCharacters();
            });
        }

        // Layout toggle event listeners
        if (this.layoutToggle) {
            const gridBtn = this.layoutToggle.querySelector('#gridLayoutBtn');
            const masonryBtn = this.layoutToggle.querySelector('#masonryLayoutBtn');
            
            if (gridBtn) {
                gridBtn.addEventListener('click', () => {
                    this.setLayout('grid');
                });
            }
            
            if (masonryBtn) {
                masonryBtn.addEventListener('click', () => {
                    this.setLayout('masonry');
                });
            }
        }
    }

    /**
     * Load characters from Firebase Realtime Database
     */
    async loadCharacters() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoading();

        try {
            const { ref, get } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js');
            
            const charactersRef = ref(this.database, 'characters');
            const snapshot = await get(charactersRef);

            if (snapshot.exists()) {
                const data = snapshot.val();
                
                // Validate and process character data
                this.characters = Object.keys(data)
                    .map(key => {
                        const character = data[key];
                        
                        // Skip invalid character entries
                        if (!character || typeof character !== 'object') {
                            console.warn(`Invalid character data for ID: ${key}`);
                            return null;
                        }
                        
                        return {
                            id: key,
                            ...character,
                            // Ensure required fields have default values
                            masterlistNumber: character.masterlistNumber || key,
                            rarity: character.rarity || 'Common',
                            status: character.status || 'Available',
                            owner: character.owner || 'Unknown',
                            artist: character.artist || 'Unknown'
                        };
                    })
                    .filter(character => character !== null); // Remove invalid entries
                
                console.log(`Loaded ${this.characters.length} characters from Firebase`);
                this.filterCharacters();
            } else {
                console.log('No character data found in Firebase');
                this.characters = [];
                this.showEmpty();
            }
        } catch (error) {
            console.error('Error loading characters:', error);
            this.showError('Failed to load characters. Please try again later.');
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Filter characters based on current search and filter values
     */
    filterCharacters() {
        if (!this.characters.length) {
            this.filteredCharacters = [];
            this.renderCharacters();
            return;
        }

        let filtered = [...this.characters];
        
        // Debug logging for filter values
        const searchTerm = this.searchInput ? this.searchInput.value.toLowerCase().trim() : '';
        const rarityFilter = this.rarityFilter ? this.rarityFilter.value : '';
        const statusFilter = this.statusFilter ? this.statusFilter.value : '';
        
        console.log('Filter Debug:', {
            searchTerm,
            rarityFilter,
            statusFilter,
            totalCharacters: this.characters.length
        });

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(character => {
                const masterlistNumber = character.masterlistNumber?.toLowerCase() || '';
                const owner = character.owner?.toLowerCase() || '';
                const artist = character.artist?.toLowerCase() || '';
                const description = character.description?.toLowerCase() || '';
                
                return masterlistNumber.includes(searchTerm) ||
                       owner.includes(searchTerm) ||
                       artist.includes(searchTerm) ||
                       description.includes(searchTerm);
            });
        }

        // Apply rarity filter
        if (rarityFilter && rarityFilter !== 'all') {
            filtered = filtered.filter(character => character.rarity === rarityFilter);
        }

        // Apply status filter
        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(character => character.status === statusFilter);
        }

        this.filteredCharacters = filtered;
        
        // Debug logging for filtered results
        console.log('Filter Results:', {
            filteredCount: filtered.length,
            sampleCharacters: filtered.slice(0, 3).map(c => ({ 
                masterlistNumber: c.masterlistNumber, 
                rarity: c.rarity, 
                status: c.status 
            }))
        });
        
        this.updateResultsCount();
        this.renderCharacters();
    }

    /**
     * Update the results count display
     */
    updateResultsCount() {
        if (this.resultsCount) {
            const count = this.filteredCharacters.length;
            const total = this.characters.length;
            this.resultsCount.textContent = `Showing ${count} of ${total} characters`;
        }
    }

    /**
     * Set the layout mode and update UI
     * 
     * @param {string} layout - The layout mode ('grid' or 'masonry')
     */
    setLayout(layout) {
        this.currentLayout = layout;
        
        // Update button active states
        if (this.layoutToggle) {
            const gridBtn = this.layoutToggle.querySelector('#gridLayoutBtn');
            const masonryBtn = this.layoutToggle.querySelector('#masonryLayoutBtn');
            
            if (gridBtn && masonryBtn) {
                gridBtn.classList.toggle('active', layout === 'grid');
                masonryBtn.classList.toggle('active', layout === 'masonry');
            }
        }
        
        // Re-render characters with new layout
        this.renderCharacters();
    }

    /**
     * Render characters in the container with current layout
     */
    renderCharacters() {
        if (!this.container) return;

        if (this.filteredCharacters.length === 0) {
            this.showEmpty();
            return;
        }

        // Reset container classes
        this.container.className = 'characters-container';
        
        if (this.currentLayout === 'masonry') {
            this.renderMasonryLayout();
        } else {
            this.renderGridLayout();
        }
    }

    /**
     * Render characters in grid layout
     */
    renderGridLayout() {
        const charactersHTML = this.filteredCharacters.map(character => 
            this.createCharacterCard(character)
        ).join('');
        
        this.container.innerHTML = `<div class="characters-grid">${charactersHTML}</div>`;
    }

    /**
     * Render characters in masonry layout
     * Uses CSS Grid with auto-fit and consistent thumbnail dimensions
     */
    renderMasonryLayout() {
        const charactersHTML = this.filteredCharacters.map(character => 
            this.createCharacterCard(character)
        ).join('');
        
        this.container.innerHTML = `<div class="characters-masonry">${charactersHTML}</div>`;
        
        // Calculate and set row spans for masonry layout after images load
        this.setupMasonryRowSpans();
    }
    
    /**
     * Calculate and set row spans for masonry layout cards
     */
    setupMasonryRowSpans() {
        const masonryContainer = this.container.querySelector('.characters-masonry');
        if (!masonryContainer) return;
        
        const cards = masonryContainer.querySelectorAll('.character-card');
        const gridAutoRows = parseInt(getComputedStyle(masonryContainer).gridAutoRows) || 10;
        
        cards.forEach(card => {
            const img = card.querySelector('.character-image');
            if (img) {
                const setRowSpan = () => {
                    // Reset any existing row span to get natural height
                    card.style.setProperty('--row-span', '1');
                    
                    // Force a reflow and wait for layout to stabilize
                    requestAnimationFrame(() => {
                        const cardHeight = card.getBoundingClientRect().height;
                        
                        // Calculate row span with padding and ensure minimum height
                        const rowSpan = Math.max(10, Math.ceil((cardHeight + 20) / gridAutoRows));
                        
                        // Set the calculated row span
                        card.style.setProperty('--row-span', rowSpan);
                    });
                };
                
                if (img.complete) {
                    // Add a small delay to ensure layout is stable
                    setTimeout(setRowSpan, 50);
                } else {
                    img.addEventListener('load', () => setTimeout(setRowSpan, 50));
                    img.addEventListener('error', () => setTimeout(setRowSpan, 50));
                }
            }
        });
    }



    /**
     * Convert Google Drive sharing URL to direct image URL
     * 
     * @param {string} url - Google Drive sharing URL
     * @returns {string} Direct image URL or original URL if not a Google Drive link
     */
    convertGoogleDriveUrl(url, size = 'w400-h400') {
        if (!url) return '';
        
        // Handle different Google Drive URL formats
        const patterns = [
            // Standard sharing URL: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
            /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/,
            // Open URL: https://drive.google.com/open?id=FILE_ID
            /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
            // Direct thumbnail URL (already converted)
            /drive\.google\.com\/thumbnail\?id=([a-zA-Z0-9_-]+)/,
            // Additional patterns for better compatibility
            /\/file\/d\/([a-zA-Z0-9-_]+)/,
            /id=([a-zA-Z0-9-_]+)/,
            /\/d\/([a-zA-Z0-9-_]+)\//
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                const fileId = match[1];
                return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
            }
        }
        
        return url; // Return original if no pattern matches
    }

    /**
     * Get high-resolution URL for image preview
     * @param {string} url - Original image URL
     * @returns {string} High-resolution image URL
     */
    getPreviewImageUrl(url) {
        if (!url) return '';
        
        // For Google Drive URLs, use larger size for preview
        if (url.includes('drive.google.com')) {
            return this.convertGoogleDriveUrl(url, 'w800-h800');
        }
        
        return url;
    }

    /**
     * Test if image URL is accessible
     * @param {string} imageUrl - Image URL to test
     * @returns {Promise<boolean>} Promise resolving to true if image loads
     */
    testImageLoad(imageUrl) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = imageUrl;
            
            // Timeout after 10 seconds
            setTimeout(() => resolve(false), 10000);
        });
    }

    /**
     * Create HTML for a character card
     * 
     * @param {Object} character - Character data
     * @returns {string} HTML string for the character card
     */
    createCharacterCard(character) {
        // Convert Google Drive URL to direct link if needed
        const rawImageUrl = character.imageUrl || '';
        const imageUrl = this.convertGoogleDriveUrl(rawImageUrl) || this.getPlaceholderImage();
        const previewImageUrl = this.getPreviewImageUrl(rawImageUrl);
        
        // Extract all character data with fallbacks
        const masterlistNumber = character.masterlistNumber || 'Unknown Character';
        const rarity = character.rarity || 'Common';
        const status = this.formatStatus(character.status) || 'Available';
        const description = character.description || '';
        const owner = character.owner || 'Unknown';
        const artist = character.artist || 'Unknown';
        const biome = character.biome || character.primaryBiome || 'Unknown';
        const secondaryBiome = character.secondaryBiome || '';
        const traits = character.traits || '';
        const notes = character.notes || '';
        const value = character.value || '';
        
        // CSS classes for styling
        const rarityClass = rarity.toLowerCase().replace(/\s+/g, '-');
        const statusClass = status.toLowerCase().replace(/\s+/g, '-');
        
        // Generate character details based on visibility settings
        let characterDetails = '';
        
        if (this.showOwner && owner && owner !== 'Unknown') {
            characterDetails += `
                <div class="character-detail">
                    <strong>Owner:</strong> <span>${owner}</span>
                </div>`;
        }
        
        if (this.showArtist && artist && artist !== 'Unknown') {
            characterDetails += `
                <div class="character-detail">
                    <strong>Artist:</strong> <span>${artist}</span>
                </div>`;
        }
        
        if (this.showBiome && biome && biome !== 'Unknown') {
            characterDetails += `
                <div class="character-detail">
                    <strong>Primary Biome:</strong> <span>${biome}</span>
                </div>`;
        }
        
        if (this.showSecondaryBiome && secondaryBiome) {
            characterDetails += `
                <div class="character-detail">
                    <strong>Secondary Biome:</strong> <span>${secondaryBiome}</span>
                </div>`;
        }
        
        if (this.showValue && value) {
            characterDetails += `
                <div class="character-detail">
                    <strong>Value:</strong> <span>${value}</span>
                </div>`;
        }
        
        if (this.showTraits && traits) {
            characterDetails += `
                <div class="character-detail">
                    <strong>Traits:</strong> <span>${traits}</span>
                </div>`;
        }
        
        if (this.showNotes && notes) {
            characterDetails += `
                <div class="character-detail">
                    <strong>Notes:</strong> <span>${notes}</span>
                </div>`;
        }
        
        if (this.showDescription && description) {
            characterDetails += `
                <div class="character-description">
                    <strong>Description:</strong> <p>${description}</p>
                </div>`;
        }
        
        // Check if there's any content to display in character-info
        const hasHeaderContent = this.showMasterlistNumber || this.showStatus;
        const hasInfoContent = hasHeaderContent || characterDetails;
        
        return `
            <div class="character-card" data-character-id="${character.id}" data-rarity="${rarity}" data-status="${status}">
                <div class="character-image-container">
                    <img src="${imageUrl}" 
                         alt="${masterlistNumber}" 
                         class="character-image character-thumbnail" 
                         loading="lazy"
                         data-full-image="${previewImageUrl || imageUrl}"
                         onclick="window.showImagePreview(this.dataset.fullImage, this.alt)"
                         onerror="window.handleCharacterImageError(this)">
                    ${this.showRarityBadge ? `<div class="rarity-badge rarity-${rarityClass}">${rarity}</div>` : ''}
                </div>
                ${hasInfoContent ? `
                <div class="character-info">
                    ${hasHeaderContent ? `
                    <div class="character-header">
                        ${this.showMasterlistNumber ? `<h3 class="character-name">${masterlistNumber}</h3>` : ''}
                        ${this.showStatus ? `<span class="character-status status-${statusClass}">${status}</span>` : ''}
                    </div>` : ''}
                    ${characterDetails ? `<div class="character-details">${characterDetails}</div>` : ''}
                </div>` : ''}
            </div>
        `;
    }

    /**
     * Show loading state
     */
    showLoading() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Loading characters...</p>
                </div>
            `;
        }
    }

    /**
     * Show empty state when no characters are found
     */
    showEmpty() {
        if (this.container) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No characters found</h3>
                    <p>Try adjusting your search or filter criteria.</p>
                </div>
            `;
        }
    }

    /**
     * Show error state
     * 
     * @param {string} message - Error message to display
     */
    showError(message) {
        if (this.container) {
            this.container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="retry-button">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
        }
    }

    /**
     * Refresh the character gallery
     * Reloads characters from the database
     */
    async refresh() {
        await this.loadCharacters();
    }

    /**
     * Get current filter and search state
     * 
     * @returns {Object} Current state object
     */
    getState() {
        return {
            layout: this.currentLayout,
            search: this.searchInput ? this.searchInput.value : '',
            rarity: this.rarityFilter ? this.rarityFilter.value : '',
            status: this.statusFilter ? this.statusFilter.value : '',
            charactersCount: this.characters.length,
            filteredCount: this.filteredCharacters.length
        };
    }

    /**
     * Set filter and search state
     * 
     * @param {Object} state - State object to apply
     */
    setState(state) {
        if (state.layout) {
            this.setLayout(state.layout);
        }
        
        if (this.searchInput && state.search !== undefined) {
            this.searchInput.value = state.search;
        }
        
        if (this.rarityFilter && state.rarity !== undefined) {
            this.rarityFilter.value = state.rarity;
        }
        
        if (this.statusFilter && state.status !== undefined) {
            this.statusFilter.value = state.status;
        }
        
        this.filterCharacters();
    }

    /**
     * Handle image loading errors by setting placeholder
     * 
     * @param {HTMLImageElement} img - The image element that failed to load
     */
    handleImageError(img) {
        if (img.src !== '/images/characters/placeholder.png') {
            img.src = '/images/characters/placeholder.png';
            img.alt = 'Character image not available';
        }
    }

    /**
     * Get placeholder image URL
     * 
     * @returns {string} Placeholder image URL
     */
    getPlaceholderImage() {
        return '/images/characters/placeholder.png';
    }

    /**
     * Format status text for display
     * 
     * @param {string} status - Raw status value
     * @returns {string} Formatted status text
     */
    formatStatus(status) {
        if (!status) return 'Available';
        
        // Convert status to title case
        return status.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Destroy the gallery instance and clean up event listeners
     */
    destroy() {
        // Remove event listeners
        if (this.searchInput) {
            this.searchInput.removeEventListener('input', this.filterCharacters);
        }
        
        if (this.rarityFilter) {
            this.rarityFilter.removeEventListener('change', this.filterCharacters);
        }
        
        if (this.statusFilter) {
            this.statusFilter.removeEventListener('change', this.filterCharacters);
        }
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        // Reset state
        this.characters = [];
        this.filteredCharacters = [];
        this.isLoading = false;
    }
}

// Export for global usage if needed
if (typeof window !== 'undefined') {
    window.CharacterGalleryManager = CharacterGalleryManager;
    
    // Global instance reference for image error handling
    window.characterGalleryManager = null;
    
    // Global image error handler
    window.handleCharacterImageError = function(img) {
        if (window.characterGalleryManager && typeof window.characterGalleryManager.handleImageError === 'function') {
            window.characterGalleryManager.handleImageError(img);
        } else {
            // Fallback error handling
            if (img.src !== '/images/characters/placeholder.png') {
                img.src = '/images/characters/placeholder.png';
                img.alt = 'Character image not available';
            }
        }
    };
    
    // Image preview functionality
    window.showImagePreview = async function(imageUrl, altText) {
        // Validate input parameters
        if (!imageUrl) {
            console.warn('No image URL provided for preview');
            return;
        }
        
        // Remove existing preview if any
        const existingPreview = document.getElementById('image-preview-modal');
        if (existingPreview) {
            existingPreview.remove();
            return;
        }
        
        // Create preview container with loading state
        const previewContainer = document.createElement('div');
        previewContainer.id = 'image-preview-modal';
        
        // Create inner div
        const innerDiv = document.createElement('div');
        
        // Add loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = 'color: white; text-align: center; padding: 20px; font-size: 18px;';
        loadingDiv.textContent = 'Loading image...';
        innerDiv.appendChild(loadingDiv);
        
        // Add click handler to close modal
        const closeModal = () => {
            const modal = document.getElementById('image-preview-modal');
            if (modal) {
                modal.remove();
            }
        };
        
        // Add event listeners to container
        previewContainer.addEventListener('click', closeModal);
        
        // Assemble and show the modal with loading state
        previewContainer.appendChild(innerDiv);
        document.body.appendChild(previewContainer);
        
        // Test image load
        try {
            const img = new Image();
            
            // Set up promise for image loading
            const imageLoadPromise = new Promise((resolve, reject) => {
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load image'));
                
                // Set timeout for loading
                setTimeout(() => reject(new Error('Image load timeout')), 10000);
            });
            
            // Start loading the image
            img.src = imageUrl;
            img.alt = altText || 'Character Preview';
            
            // Wait for image to load
            await imageLoadPromise;
            
            // Remove loading indicator and add the image
            innerDiv.removeChild(loadingDiv);
            img.addEventListener('click', closeModal);
            innerDiv.appendChild(img);
            
        } catch (error) {
            console.error('Failed to load preview image:', imageUrl, error);
            
            // Show error message
            loadingDiv.textContent = 'Failed to load image. Click to close.';
            loadingDiv.style.color = '#ff6b6b';
            
            // Auto-close after 3 seconds
            setTimeout(closeModal, 3000);
        }
    };
}