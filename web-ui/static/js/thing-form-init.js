/**
 * Thing Form Initialization Script
 * 
 * This script initializes the thing form manager when the page loads.
 * It's separated from the template to avoid VS Code parser conflicts.
 */

// Global function to initialize the form with optional thing data
function initializeThingForm(thingData = null) {
    // Initialize thing form manager
    if (typeof ThingFormManager !== 'undefined') {
        window.thingFormManager = new ThingFormManager();
        
        // Load existing thing data if editing
        if (thingData) {
            window.thingFormManager.loadThingData(thingData);
        }
        
        console.log('Thing Form Manager initialized', thingData ? 'with existing data' : 'for new thing');
    } else {
        console.error('ThingFormManager not loaded');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if thing data was passed from the template
    if (typeof window.thingFormData !== 'undefined') {
        initializeThingForm(window.thingFormData);
    } else {
        initializeThingForm();
    }
});