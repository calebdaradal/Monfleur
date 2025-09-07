/**
 * Character Upload and Edit System
 * Handles character creation and editing with Google Drive image integration
 */

// Import storage manager if available
/**
 * Character Upload and Edit System
 * Updated to use Firebase integration with localStorage fallback
 */

// Import the enhanced storage manager
import EnhancedCharacterStorageManager from './services/storage-manager.js';
// Import GoogleDriveImageHandler for image processing
import { GoogleDriveImageHandler } from './database.js';
// Import toast notification system
import toastManager from './components/toast.js';

// Global variables
let storageManager;
let originalCharacterData = null; // Store original character data for edit comparison

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Create connection status element if it doesn't exist
 * @returns {HTMLElement} Status element
 */
function createConnectionStatusElement() {
    const statusElement = document.createElement('div');
    statusElement.id = 'connectionStatus';
    statusElement.className = 'connection-status-container';
    
    const header = document.querySelector('.main-header');
    if (header) {
        header.appendChild(statusElement);
    } else {
        document.body.insertBefore(statusElement, document.body.firstChild);
    }
    
    return statusElement;
}

/**
 * Show success message to user
 * @param {string} message - Success message
 */
function showSuccessMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success';
    alertDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    const form = document.querySelector('.character-form');
    if (form) {
        form.insertBefore(alertDiv, form.firstChild);
        setTimeout(() => alertDiv.remove(), 5000);
    }
}

/**
 * Show error message to user
 * @param {string} message - Error message
 */
function showErrorMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-error';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
    `;
    
    const form = document.querySelector('.character-form');
    if (form) {
        form.insertBefore(alertDiv, form.firstChild);
        setTimeout(() => alertDiv.remove(), 5000);
    }
}

// Update the DOMContentLoaded event handler
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize enhanced storage manager
    try {
        storageManager = new EnhancedCharacterStorageManager();
        await storageManager.initialize();
        
        // Show success status
        showConnectionStatus(true, 'Connected to Firebase Database');
        
        // Initialize the rest of the application
        setupTabs();
        setupFormHandlers();
        setupImagePreview();
        await checkEditMode(); // Make this await
    } catch (error) {
        console.error('Database connection failed:', error);
        showConnectionStatus(false, error.message);
        
        // Disable form functionality
        disableApplication(error.message);
    }
});

/**
 * Show connection status to user
 * @param {boolean} isConnected - Whether connected to database
 * @param {string} message - Status message
 */
function showConnectionStatus(isConnected, message) {
    const statusElement = document.getElementById('connectionStatus') || createConnectionStatusElement();
    statusElement.innerHTML = `
        <div class="connection-status ${isConnected ? 'connected' : 'error'}">
            <i class="fas ${isConnected ? 'fa-cloud-check' : 'fa-exclamation-triangle'}"></i>
            <span>${message}</span>
        </div>
    `;
}

/**
 * Disable application when database is unavailable
 * @param {string} errorMessage - Error message to display
 */
function disableApplication(errorMessage) {
    // Disable form
    const form = document.querySelector('.character-form');
    if (form) {
        const inputs = form.querySelectorAll('input, select, textarea, button');
        inputs.forEach(input => {
            input.disabled = true;
        });
    }
    
    // Show error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'database-error-message';
    errorDiv.innerHTML = `
        <div class="error-container">
            <i class="fas fa-database"></i>
            <h3>Database Connection Failed</h3>
            <p>${errorMessage}</p>
            <p>Please check your internet connection and Firebase configuration, then refresh the page.</p>
            <button onclick="location.reload()" class="btn btn-primary">
                <i class="fas fa-refresh"></i> Retry Connection
            </button>
        </div>
    `;
    
    const mainContent = document.querySelector('.main-content') || document.body;
    mainContent.insertBefore(errorDiv, mainContent.firstChild);
}

// Update handleFormSubmit to show specific error messages
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const characterData = extractCharacterData(formData);
    
    // Validate masterlist number format (digits only)
    const masterlistDigits = characterData.masterlistNumber;
    if (!validateMasterlistNumber(masterlistDigits)) {
        toastManager.showError('Please enter a valid masterlist number (digits only, e.g., 123)');
        return;
    }
    
    // Convert to full masterlist number for storage
    characterData.masterlistNumber = getFullMasterlistNumber(masterlistDigits);
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    try {
        const editId = getEditId();
        
        let success;
        if (editId) {
            success = await storageManager.updateCharacter(editId, characterData, originalCharacterData);
        } else {
            success = await storageManager.addCharacter(characterData);
        }
        
        if (success) {
            // Show toast notification for successful operation
            toastManager.showSuccess(editId ? 'Character updated successfully!' : 'Character uploaded successfully!');
            
            if (editId) {
                // Navigate back to database after successful update
                setTimeout(() => {
                    window.location.href = 'database.html';
                }, 1500); // Give time for toast to be seen
            } else {
                // Reset form for new uploads
                resetForm();
            }
        }
    } catch (error) {
        console.error('Error saving character:', error);
        toastManager.showError(error.message);
    } finally {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

/**
 * Setup tab functionality
 */
function setupTabs() {
    const tabTriggers = document.querySelectorAll('.tab-trigger');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const tabId = trigger.getAttribute('data-tab');
            
            // Remove active class from all triggers and contents
            tabTriggers.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked trigger and corresponding content
            trigger.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

/**
 * Setup form event handlers
 */
function setupFormHandlers() {
    const form = document.querySelector('.character-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
        
        // Auto-preview on form changes
        form.addEventListener('input', debounce(previewCharacter, 300));
        form.addEventListener('change', previewCharacter);
    }
    
    // Generate masterlist number button
    const generateBtn = document.getElementById('generateMasterlistBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateMasterlistNumber);
    }
    
    // Setup masterlist number validation
    const masterlistInput = document.getElementById('masterlistNumber');
    if (masterlistInput) {
        masterlistInput.addEventListener('input', handleMasterlistNumberChange);
        masterlistInput.addEventListener('blur', handleMasterlistNumberBlur);
    }
}

/**
 * Setup Google Drive image preview functionality
 */
function setupImagePreview() {
    const imageUrlInput = document.getElementById('imageUrl');
    if (imageUrlInput) {
        imageUrlInput.addEventListener('input', debounce(handleImageUrlChange, 500));
        imageUrlInput.addEventListener('paste', (e) => {
            setTimeout(() => handleImageUrlChange(e), 100);
        });
    }
}

/**
 * Handle image URL input changes - Updated to use sidebar preview only
 * @param {Event} event - Input event
 */
async function handleImageUrlChange(event) {
    const imageUrl = event.target.value.trim();
    const statusDiv = document.getElementById('imageUrlStatus');
    
    if (!imageUrl) {
        updateImageUrlStatus('', 'neutral');
        // Trigger character preview update to show placeholder
        previewCharacter();
        return;
    }
    
    // Validate Google Drive URL format
    if (!GoogleDriveImageHandler.isValidGoogleDriveUrl(imageUrl)) {
        updateImageUrlStatus('Please enter a valid Google Drive image link', 'error');
        // Trigger character preview update to show error state
        previewCharacter();
        return;
    }
    
    updateImageUrlStatus('Checking image...', 'loading');
    
    // Test if image loads successfully
    const directUrl = GoogleDriveImageHandler.convertToDirectUrl(imageUrl);
    const isValid = await GoogleDriveImageHandler.testImageLoad(directUrl);
    
    if (isValid) {
        updateImageUrlStatus('Image loaded successfully!', 'success');
    } else {
        updateImageUrlStatus('Failed to load image. Make sure it\'s publicly accessible.', 'error');
    }
    
    // Update the sidebar preview with the new image
    previewCharacter();
}

/**
 * Update image URL status indicator
 * @param {string} message - Status message
 * @param {string} type - Status type (success, error, loading, neutral)
 */
function updateImageUrlStatus(message, type) {
    const statusDiv = document.getElementById('imageUrlStatus');
    if (!statusDiv) return;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-triangle',
        loading: 'fa-spinner fa-spin',
        neutral: 'fa-info-circle'
    };
    
    statusDiv.innerHTML = message ? `
        <div class="status-message ${type}">
            <i class="fas ${icons[type] || icons.neutral}"></i>
            <span>${message}</span>
        </div>
    ` : '';
}

// DELETE this entire duplicate function block:
// async function handleFormSubmit(event) {
//     event.preventDefault();
//     
//     const formData = new FormData(event.target);
//     const characterData = extractCharacterData(formData);
//     
//     // Show loading state
//     const submitBtn = event.target.querySelector('button[type="submit"]');
//     const originalText = submitBtn.innerHTML;
//     submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
//     submitBtn.disabled = true;
//     
//     try {
//         // Check if editing existing character
//         const editId = getEditId();
//         
//         let success;
//         if (editId) {
//             success = await storageManager.updateCharacter(editId, characterData);
//         } else {
//             success = await storageManager.addCharacter(characterData);
//         }
//         
//         if (success) {
//             showSuccessMessage(editId ? 'Character updated successfully!' : 'Character created successfully!');
//             if (!editId) {
//                 resetForm();
//             }
//         } else {
//             showErrorMessage('Failed to save character. Please try again.');
//         }
//     } catch (error) {
//         console.error('Error saving character:', error);
//         showErrorMessage(`An error occurred: ${error.message}`);
//     } finally {
//         // Restore button state
//         submitBtn.innerHTML = originalText;
//         submitBtn.disabled = false;
//     }
// }

/**
 * Generate next available masterlist number (updated for async)
 */
async function generateMasterlistNumber() {
    if (storageManager) {
        try {
            const nextNumber = await storageManager.generateMasterlistNumber();
            const input = document.getElementById('masterlistNumber');
            if (input) {
                input.value = nextNumber;
                previewCharacter();
            }
        } catch (error) {
            console.error('Error generating masterlist number:', error);
            showErrorMessage('Failed to generate masterlist number');
        }
    }
}

/**
 * Preview character with current form data
 */
function previewCharacter() {
    const form = document.querySelector('.character-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const data = extractCharacterData(formData);
    const preview = document.getElementById('characterPreview');
    
    if (!preview) return;
    
    const imageUrl = data.imageUrl ? GoogleDriveImageHandler.convertToDirectUrl(data.imageUrl) : '';
    
    preview.innerHTML = `
        <div class="character-card preview">
            <div class="character-image-container">
                ${imageUrl ? 
                    `<img src="${imageUrl}" alt="Character Preview" class="character-image" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBDMTA4LjI4NCA3MCA5NS4wNzE2IDc3LjE2MzQgOTUuMDcxNiA4NS40NDc3VjEwNi41NTJDOTUuMDcxNiAxMTQuODM3IDEwMS4yODQgMTIyIDEwOSAxMjJIMTEwQzExOC4yODQgMTIyIDEyNS4wNzE2IDExNC44MzcgMTI1LjA3MTYgMTA2LjU1MlY4NS40NDc3QzEyNS4wNzE2IDc3LjE2MzQgMTE4LjI4NCA3MCAxMTAgNzBIMTAwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K'">`
                    : `<div class="character-image placeholder-image">
                         <i class="fas fa-image"></i>
                         <span>No Image</span>
                       </div>`
                }
            </div>
            <div class="character-info">
                <div class="character-header">
                    <span class="character-ml">${data.masterlistNumber ? getFullMasterlistNumber(data.masterlistNumber) : 'ML-XXX'}</span>
                    <span class="character-rarity rarity-${(data.rarity || 'unknown').toLowerCase().replace(' ', '-')}">
                        ${data.rarity || 'Unknown'}
                    </span>
                </div>
                <div class="character-details">
                    <span><strong>Owner:</strong> ${data.owner || 'Unknown Owner'}</span>
                    <span><strong>Artist:</strong> ${data.artist || 'Unknown Artist'}</span>
                    <span><strong>Biome:</strong> ${data.biome || 'Unknown'}</span>
                    <span><strong>Status:</strong> ${data.status || 'Unknown'}</span>
                </div>
                ${data.description ? `
                    <div class="character-description">
                        <strong>Description:</strong>
                        <p>${data.description}</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Search character functionality for edit tab
 */
async function searchCharacter() {
    const searchTerm = document.getElementById('editSearch').value.trim();
    const resultsDiv = document.getElementById('editResults');
    
    if (!searchTerm) {
        resultsDiv.innerHTML = '<p class="text-muted-foreground">Enter a masterlist number or character ID to search</p>';
        return;
    }
    
    if (!storageManager) {
        resultsDiv.innerHTML = '<p class="text-muted-foreground">Storage manager not available</p>';
        return;
    }
    
    try {
        const characters = await storageManager.getAllCharacters();
        const results = characters.filter(char => 
            char.masterlistNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            char.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            char.owner.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<p class="text-muted-foreground">No characters found matching your search</p>';
            return;
        }
        
        resultsDiv.innerHTML = results.map(character => `
            <div class="card character-search-result" style="margin-top: 1rem;">
                <div class="card-content">
                    <div class="search-result-header">
                        <h4>${character.masterlistNumber}</h4>
                        <span class="character-rarity rarity-${character.rarity?.toLowerCase().replace(' ', '-')}">
                            ${character.rarity}
                        </span>
                    </div>
                    <div class="search-result-details">
                        <p><strong>Owner:</strong> ${character.owner}</p>
                        <p><strong>Artist:</strong> ${character.artist}</p>
                        <p><strong>Biome:</strong> ${character.biome}</p>
                        <p><strong>Status:</strong> ${character.status}</p>
                    </div>
                    <div class="search-result-actions" style="margin-top: 1rem;">
                        <button class="btn btn-primary" onclick="editCharacterById('${character.id}')">
                            <i class="fas fa-edit"></i>Edit Character
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to search characters:', error);
        resultsDiv.innerHTML = '<p class="text-muted-foreground">Failed to load characters. Please refresh the page and try again.</p>';
    }
}

/**
 * Edit character by ID
 * @param {string} id - Character ID
 */
function editCharacterById(id) {
    window.location.href = `upload.html?edit=${id}`;
}

/**
 * Check if in edit mode and load character data
 */
async function checkEditMode() {
    const editId = getEditId();
    if (editId && storageManager) {
        try {
            const characters = await storageManager.getAllCharacters();
            const character = characters.find(char => char.id === editId);
            if (character) {
                loadCharacterForEdit(character);
            } else {
                // showErrorMessage('Character not found'); // Remove this line
            }
        } catch (error) {
            console.error('Failed to load character for editing:', error);
            // showErrorMessage('Failed to load character data. Please refresh the page and try again.'); // Remove this line
        }
    }
}

/**
 * Get edit ID from URL parameters
 * @returns {string|null} Edit ID or null
 */
function getEditId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('edit');
}

/**
 * Load character data into form for editing
 * @param {Object} character - Character data
 */
function loadCharacterForEdit(character) {
    const form = document.querySelector('.character-form');
    if (!form) return;
    
    // Store original character data for comparison when saving
    originalCharacterData = JSON.parse(JSON.stringify(character));
    
    // Extract digits from masterlist number (remove ML- prefix)
    const masterlistDigits = character.masterlistNumber ? 
        character.masterlistNumber.replace(/^ML-/, '') : '';
    
    // Populate form fields
    const fields = {
        masterlistNumber: masterlistDigits, // Store only digits for the input
        owner: character.owner,
        artist: character.artist,
        primaryBiome: character.primaryBiome || character.biome, // Handle legacy data
        secondaryBiome: character.secondaryBiome,
        rarity: character.rarity,
        status: character.status,
        imageUrl: character.imageUrl,
        description: character.description,
        traits: character.traits,
        notes: character.notes,
        value: character.value // Add this missing field
    };
    
    Object.entries(fields).forEach(([fieldName, value]) => {
        const field = form.querySelector(`[name="${fieldName}"]`);
        if (field && value) {
            field.value = value;
        }
    });
    
    // Update page title
    const pageTitle = document.querySelector('h1');
    if (pageTitle) {
        pageTitle.textContent = `Edit Character - ${character.masterlistNumber}`;
    }
    
    // Update submit button text
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Character';
    }
    
    // Trigger preview
    previewCharacter();
}

/**
 * Reset form to initial state
 */
function resetForm() {
    const form = document.querySelector('.character-form');
    if (form) {
        form.reset();
        previewCharacter();
        updateImageUrlStatus('', 'neutral');
        
        // Clear original character data
        originalCharacterData = null;
        
        // Clear any error messages
        const errorContainer = document.getElementById('formErrors');
        if (errorContainer) {
            errorContainer.innerHTML = '';
        }
    }
}

// Storage manager debugging (moved to after initialization)

// Test the addCharacter method
window.testFirebase = async function() {
    try {
        const testCharacter = {
            masterlistNumber: 'ML-TEST',
            owner: 'Test Owner',
            artist: 'Test Artist',
            rarity: 'Common',
            status: 'Active'
        };
        const result = await storageManager.addCharacter(testCharacter);
        console.log('Test character added:', result);
    } catch (error) {
        console.error('Test failed:', error);
    }
};

/**
 * Validate masterlist number format
 * @param {string} digits - Digits only (without ML- prefix)
 * @returns {boolean} True if valid format
 */
function validateMasterlistNumber(digits) {
    if (!digits || typeof digits !== 'string') {
        return false;
    }
    
    // Check if it contains only digits and has at least one digit
    const digitPattern = /^[0-9]+$/;
    return digitPattern.test(digits.trim());
}

/**
 * Get full masterlist number with ML- prefix
 * @param {string} digits - Digits only
 * @returns {string} Full masterlist number (ML-XXX)
 */
function getFullMasterlistNumber(digits) {
    return digits ? `ML-${digits}` : '';
}

/**
 * Handle masterlist number input changes
 * @param {Event} event - Input event
 */
function handleMasterlistNumberChange(event) {
    const input = event.target;
    let value = input.value;
    
    // Remove any non-digit characters
    const digitsOnly = value.replace(/[^0-9]/g, '');
    
    // Update input value to digits only
    if (value !== digitsOnly) {
        input.value = digitsOnly;
    }
    
    // Update validation status
    updateMasterlistValidationStatus(input, digitsOnly);
}

/**
 * Handle masterlist number input blur (when user leaves the field)
 * @param {Event} event - Blur event
 */
function handleMasterlistNumberBlur(event) {
    const input = event.target;
    const digits = input.value.trim();
    
    updateMasterlistValidationStatus(input, digits);
}

/**
 * Update masterlist number validation status display
 * @param {HTMLInputElement} input - Input element
 * @param {string} digits - Digits only
 */
function updateMasterlistValidationStatus(input, digits) {
    const isValid = validateMasterlistNumber(digits);
    const statusContainer = getOrCreateMasterlistStatusContainer(input);
    const inputContainer = input.closest('.masterlist-input-container');
    
    if (!digits) {
        // Empty field - show neutral state
        statusContainer.innerHTML = '';
        if (inputContainer) {
            inputContainer.classList.remove('input-valid', 'input-invalid');
        }
    } else if (isValid) {
        // Valid format - just show visual feedback without message
        statusContainer.innerHTML = '';
        if (inputContainer) {
            inputContainer.classList.add('input-valid');
            inputContainer.classList.remove('input-invalid');
        }
    } else {
        // Invalid format
        statusContainer.innerHTML = `
            <div class="validation-message error">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Please enter only numbers (e.g., 123)</span>
            </div>
        `;
        if (inputContainer) {
            inputContainer.classList.add('input-invalid');
            inputContainer.classList.remove('input-valid');
        }
    }
}

/**
 * Get or create status container for masterlist number validation
 * @param {HTMLInputElement} input - Input element
 * @returns {HTMLElement} Status container element
 */
function getOrCreateMasterlistStatusContainer(input) {
    let statusContainer = input.parentNode.querySelector('.masterlist-validation-status');
    
    if (!statusContainer) {
        statusContainer = document.createElement('div');
        statusContainer.className = 'masterlist-validation-status';
        input.parentNode.appendChild(statusContainer);
    }
    
    return statusContainer;
}

/**
 * Extract character data from form
 * @param {FormData} formData - Form data object
 * @returns {Object} Character data object
 */
function extractCharacterData(formData) {
    return {
        masterlistNumber: formData.get('masterlistNumber') || '',
        owner: formData.get('owner') || '',
        artist: formData.get('artist') || '',
        primaryBiome: formData.get('primaryBiome') || '',
        secondaryBiome: formData.get('secondaryBiome') || '',
        biome: formData.get('primaryBiome') || '', // For backward compatibility
        rarity: formData.get('rarity') || '',
        status: formData.get('status') || '',
        imageUrl: formData.get('imageUrl') || '',
        description: formData.get('description') || '',
        traits: formData.get('traits') || '',
        notes: formData.get('notes') || '',
        value: formData.get('value') || ''
    };
}