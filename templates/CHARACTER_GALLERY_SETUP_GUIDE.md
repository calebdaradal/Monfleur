# Character Gallery Setup Guide

## Overview

This guide explains how to easily add character galleries to any page on your website using the provided template and JavaScript module.

## Features

- **🔍 Real-time Search**: Instantly filter characters by name
- **🎯 Advanced Filtering**: Filter by rarity and trade status
- **📱 Responsive Design**: Works perfectly on all devices
- **🎨 Layout Options**: Choose between Grid and Masonry layouts
- **🚀 Fast Loading**: Optimized performance with Firebase
- **🎨 Beautiful UI**: Modern, clean design with smooth animations
- **🔧 Easy Integration**: Drop-in solution for any website
- **📸 Smart Image Handling**: Automatic Google Drive image processing
- **⚡ Real-time Updates**: Automatically syncs with Firebase database
- **🎛️ Interactive Controls**: Toggle between different view modes
- **⚙️ Configurable Defaults**: Set default layout, filters, and search terms
- **👁️ UI Visibility Control**: Show/hide filters, search, and layout toggles

## Files Included

1. **`character-gallery-template.html`** - Complete HTML template with styles
2. **`js/character-gallery-manager.js`** - JavaScript module for functionality
3. **`CHARACTER_GALLERY_SETUP_GUIDE.md`** - This setup guide

## Quick Start

### Method 1: Complete Template (Recommended for new pages)

1. **Include the required files in your HTML:**
```html
<!-- In your <head> section -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
<link rel="stylesheet" href="../CharacterList/character-gallery.css">

<!-- Before closing </body> tag -->
<script type="module">
    import { CharacterGalleryManager } from '../CharacterList/character-gallery-manager.js';
    
    // Initialize the gallery with default settings
    const gallery = new CharacterGalleryManager();
    
    // OR with custom configuration
    const gallery = new CharacterGalleryManager({
        defaultLayout: 'masonry', // Start with masonry layout
        defaultRarity: 'rare', // Show only rare characters by default
        showLayoutToggle: false, // Hide layout toggle buttons
        showFilters: false, // Hide filter controls
        defaultSearch: 'dragon' // Pre-fill search with 'dragon'
    });
</script>
```

**Note:** Adjust the paths (`../CharacterList/character-gallery.css` and `../CharacterList/character-gallery-manager.js`) based on your file structure:
- If your HTML file is in the root directory, use `./CharacterList/character-gallery.css` and `./CharacterList/character-gallery-manager.js`
- If your HTML file is in a subfolder (like `templates/`), use `../CharacterList/character-gallery.css` and `../CharacterList/character-gallery-manager.js`

2. Copy the entire content from `character-gallery-template.html`
3. Paste it into your HTML file
4. Make sure the file paths are correct for your directory structure
5. Done! The gallery will automatically load and display characters.

### Method 2: Section Integration (For existing pages)

1. **Add the HTML section** to your existing page:

```html
<!-- Character Gallery Section -->
<section class="character-gallery-section">
    <!-- Gallery Header -->
    <div class="gallery-header">
        <h2 class="gallery-title">Character Gallery</h2>
        <div class="gallery-controls">
            <!-- Search Input -->
            <div class="search-container">
                <i class="fas fa-search search-icon"></i>
                <input type="text" 
                       id="characterSearch" 
                       class="search-input" 
                       placeholder="Search characters...">
            </div>
            
            <!-- Filter Controls -->
            <div class="filter-controls">
                <select id="rarityFilter" class="filter-select">
                    <option value="">All Rarities</option>
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="ultra-rare">Ultra Rare</option>
                    <option value="legendary">Legendary</option>
                </select>
                
                <select id="statusFilter" class="filter-select">
                    <option value="">All Status</option>
                    <option value="trade-gift">Trade Gift</option>
                    <option value="trade-gift-resell">Trade Gift Resell</option>
                    <option value="not-for-trade">Not For Trade</option>
                </select>
            </div>
        </div>
    </div>
    
    <!-- Results Count -->
    <div class="results-info">
        <span id="resultsCount" class="results-count">Loading characters...</span>
    </div>
    
    <!-- Characters Container -->
    <div id="charactersContainer" class="characters-container">
        <!-- Loading State -->
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading characters...</p>
        </div>
    </div>
</section>
```

2. **Add the CSS** (copy from the template file and paste in your `<head>` or CSS file)

3. **Add the JavaScript** before closing `</body>` tag:

```html
<script type="module">
    import { CharacterGalleryManager } from './js/character-gallery-manager.js';
    
    document.addEventListener('DOMContentLoaded', () => {
        new CharacterGalleryManager();
    });
</script>
```

**Note:** Adjust the import path based on your file structure:
- If your HTML file is in the root directory: `'./js/character-gallery-manager.js'`
- If your HTML file is in a subfolder: `'../js/character-gallery-manager.js'`

## Advanced Usage

### Custom Configuration

You can customize the gallery by passing options to the `CharacterGalleryManager`:

```javascript
<script type="module">
    import { CharacterGalleryManager } from './js/character-gallery-manager.js';
    
    document.addEventListener('DOMContentLoaded', () => {
        new CharacterGalleryManager({
            // Element IDs
            containerId: 'myCustomContainer',
            searchId: 'myCustomSearch',
            rarityFilterId: 'myCustomRarityFilter',
            statusFilterId: 'myCustomStatusFilter',
            resultsCountId: 'myCustomResultsCount',
            layoutToggleId: 'myCustomLayoutToggle',
            
            // Default Values
            defaultLayout: 'masonry', // 'grid' or 'masonry'
            defaultRarity: 'rare', // Filter value or empty string
            defaultStatus: 'trade-gift', // Filter value or empty string
            defaultSearch: 'dragon', // Pre-fill search term
            
            // UI Visibility
            showLayoutToggle: false, // Hide layout toggle buttons
            showFilters: true, // Show/hide filter controls
            showSearch: true, // Show/hide search input
            showResultsCount: true // Show/hide results counter
        });
    });
</script>
```

### Configuration Options Reference

#### Element IDs
- `containerId` (string, default: 'charactersContainer') - ID of the characters container element
- `searchId` (string, default: 'characterSearch') - ID of the search input element
- `rarityFilterId` (string, default: 'rarityFilter') - ID of the rarity filter select element
- `statusFilterId` (string, default: 'statusFilter') - ID of the status filter select element
- `resultsCountId` (string, default: 'resultsCount') - ID of the results count display element
- `layoutToggleId` (string, default: 'layoutToggle') - ID of the layout toggle container

#### Default Values
- `defaultLayout` (string, default: 'grid') - Initial layout mode ('grid' or 'masonry')
- `defaultRarity` (string, default: '') - Initial rarity filter value
- `defaultStatus` (string, default: '') - Initial status filter value
- `defaultSearch` (string, default: '') - Initial search term

#### UI Visibility Controls
- `showLayoutToggle` (boolean, default: true) - Show/hide layout toggle buttons
- `showFilters` (boolean, default: true) - Show/hide all filter controls
- `showSearch` (boolean, default: true) - Show/hide search input
- `showResultsCount` (boolean, default: true) - Show/hide results counter

### Common Configuration Examples

#### Simple Gallery (No Controls)
```javascript
new CharacterGalleryManager({
    showLayoutToggle: false,
    showFilters: false,
    showSearch: false,
    showResultsCount: false
});
```

#### Rare Characters Only
```javascript
new CharacterGalleryManager({
    defaultRarity: 'rare',
    showFilters: false // Lock the filter
});
```

#### Search-Only Gallery
```javascript
new CharacterGalleryManager({
    showLayoutToggle: false,
    showFilters: false,
    defaultSearch: 'Enter character name...'
});
```

#### Masonry Layout with Pre-filtered Results
```javascript
new CharacterGalleryManager({
    defaultLayout: 'masonry',
    defaultRarity: 'legendary',
    defaultStatus: 'trade-gift',
    showLayoutToggle: false
});
```

### Multiple Galleries on One Page

To have multiple galleries on the same page:

1. **Give each gallery unique IDs:**

```html
<!-- First Gallery -->
<section class="character-gallery-section">
    <div class="gallery-header">
        <h2 class="gallery-title">Featured Characters</h2>
        <div class="gallery-controls">
            <div class="search-container">
                <i class="fas fa-search search-icon"></i>
                <input type="text" id="featuredSearch" class="search-input" placeholder="Search featured...">
            </div>
            <div class="filter-controls">
                <select id="featuredRarityFilter" class="filter-select">
                    <!-- options -->
                </select>
            </div>
        </div>
    </div>
    <div class="results-info">
        <span id="featuredResultsCount" class="results-count">Loading...</span>
    </div>
    <div id="featuredContainer" class="characters-container"></div>
</section>

<!-- Second Gallery -->
<section class="character-gallery-section">
    <div class="gallery-header">
        <h2 class="gallery-title">All Characters</h2>
        <div class="gallery-controls">
            <div class="search-container">
                <i class="fas fa-search search-icon"></i>
                <input type="text" id="allSearch" class="search-input" placeholder="Search all...">
            </div>
            <div class="filter-controls">
                <select id="allRarityFilter" class="filter-select">
                    <!-- options -->
                </select>
            </div>
        </div>
    </div>
    <div class="results-info">
        <span id="allResultsCount" class="results-count">Loading...</span>
    </div>
    <div id="allContainer" class="characters-container"></div>
</section>
```

2. **Initialize each gallery separately:**

```javascript
<script type="module">
    import { CharacterGalleryManager } from './js/character-gallery-manager.js';
    
    document.addEventListener('DOMContentLoaded', () => {
        // Featured characters gallery
        const featuredGallery = new CharacterGalleryManager({
            containerId: 'featuredContainer',
            searchId: 'featuredSearch',
            rarityFilterId: 'featuredRarityFilter',
            resultsCountId: 'featuredResultsCount'
        });
        
        // All characters gallery
        const allGallery = new CharacterGalleryManager({
            containerId: 'allContainer',
            searchId: 'allSearch',
            rarityFilterId: 'allRarityFilter',
            resultsCountId: 'allResultsCount'
        });
    });
</script>
```

## Integration Examples

### Example 1: Homepage Integration

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monfleur - Home</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <!-- Your existing styles -->
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- Your existing header/navigation -->
    <header>
        <nav><!-- Your navigation --></nav>
    </header>
    
    <!-- Your existing content -->
    <main>
        <section class="hero">
            <h1>Welcome to Monfleur</h1>
            <p>Discover amazing characters...</p>
        </section>
        
        <!-- INSERT CHARACTER GALLERY HERE -->
        <!-- Copy the character gallery section from the template -->
        <section class="character-gallery-section">
            <!-- ... gallery content ... -->
        </section>
        
        <!-- Your other content -->
    </main>
    
    <!-- Your existing footer -->
    <footer>
        <!-- Your footer content -->
    </footer>
    
    <!-- CHARACTER GALLERY SCRIPT -->
    <script type="module">
        import { CharacterGalleryManager } from './js/character-gallery-manager.js';
        
        document.addEventListener('DOMContentLoaded', () => {
            new CharacterGalleryManager();
        });
    </script>
</body>
</html>
```

### Example 2: Dedicated Characters Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Characters - Monfleur</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <!-- Just copy the entire template content here -->
    <!-- The template is self-contained with all necessary styles -->
</body>
</html>
```

### Example 3: Modal/Popup Gallery

```html
<!-- Trigger Button -->
<button id="showGalleryBtn" class="btn btn-primary">
    <i class="fas fa-images"></i> View Character Gallery
</button>

<!-- Modal -->
<div id="galleryModal" class="modal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Character Gallery</h2>
            <button id="closeModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
            <!-- Insert character gallery section here -->
            <section class="character-gallery-section">
                <!-- ... gallery content ... -->
            </section>
        </div>
    </div>
</div>

<script type="module">
    import { CharacterGalleryManager } from './js/character-gallery-manager.js';
    
    let galleryManager = null;
    
    document.getElementById('showGalleryBtn').addEventListener('click', () => {
        const modal = document.getElementById('galleryModal');
        modal.style.display = 'block';
        
        // Initialize gallery only when modal is opened
        if (!galleryManager) {
            galleryManager = new CharacterGalleryManager();
        }
    });
    
    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('galleryModal').style.display = 'none';
    });
</script>
```

## Customization

### Styling

The gallery uses CSS custom properties (variables) for easy theming. You can override these in your CSS:

```css
.character-gallery-section {
    --primary-color: #your-color;
    --secondary-color: #your-color;
    --border-color: #your-color;
    --background-color: #your-color;
}
```

### Adding Custom Filters

To add custom filters, modify the HTML and update the `applyFilters()` method in the JavaScript:

```html
<!-- Add new filter -->
<select id="biomeFilter" class="filter-select">
    <option value="">All Biomes</option>
    <option value="forest">Forest</option>
    <option value="desert">Desert</option>
    <option value="mountain">Mountain</option>
</select>
```

```javascript
// Initialize with custom filter
new CharacterGalleryManager({
    biomeFilterId: 'biomeFilter' // Add custom option
});
```

## Troubleshooting

### Common Issues

1. **Gallery not loading:**
   - Check that the JavaScript file path is correct
   - Ensure Firebase is accessible
   - Check browser console for errors

2. **Images not showing:**
   - Verify Google Drive URLs are public
   - Check network connectivity
   - Images will fallback to placeholders automatically

3. **Filters not working:**
   - Ensure all element IDs match the configuration
   - Check that event listeners are properly attached

4. **Styling issues:**
   - Make sure CSS is included
   - Check for CSS conflicts with existing styles
   - Use browser developer tools to debug

### Debug Mode

To enable debug logging, open browser console and run:

```javascript
// Enable detailed logging
window.characterGalleryManager.debug = true;
```

## API Reference

### CharacterGalleryManager Methods

- `refresh()` - Reload characters from database
- `getFilteredCharacters()` - Get currently filtered characters
- `getAllCharacters()` - Get all loaded characters
- `applyFilters()` - Manually trigger filter application

### Configuration Options

#### Element IDs
- `containerId` - ID of characters container element
- `searchId` - ID of search input element
- `rarityFilterId` - ID of rarity filter select element
- `statusFilterId` - ID of status filter select element
- `resultsCountId` - ID of results count display element
- `layoutToggleId` - ID of layout toggle container element

#### Default Values
- `defaultLayout` - Initial layout mode ('grid' or 'masonry')
- `defaultRarity` - Initial rarity filter value
- `defaultStatus` - Initial status filter value
- `defaultSearch` - Initial search term

#### UI Visibility Controls
- `showLayoutToggle` - Show/hide layout toggle buttons
- `showFilters` - Show/hide filter controls
- `showSearch` - Show/hide search input
- `showResultsCount` - Show/hide results counter

## Support

For additional help or customization requests, please refer to the main project documentation or contact the development team.

---

**Happy character showcasing! 🎨✨**