/**
 * Thing Form Manager
 * 
 * Manages the thing creation and editing form, including validation,
 * dynamic attribute/feature management, and form submission.
 */

class ThingFormManager {
    constructor() {
        this.form = null;
        this.isEditMode = false;
        this.currentThingId = null;
        this.customAttributes = [];
        this.features = [];
        
        this.init();
    }

    /**
     * Initialize form manager
     */
    init() {
        this.form = document.getElementById('thing-form');
        if (!this.form) {
            console.warn('Thing form not found');
            return;
        }

        this.setupEventListeners();
        this.setupFormValidation();
        console.log('Thing Form Manager initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // JSON preview
        const previewBtn = document.getElementById('preview-json');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.showJsonPreview());
        }

        // Custom attributes
        const addAttributeBtn = document.getElementById('add-attribute');
        if (addAttributeBtn) {
            addAttributeBtn.addEventListener('click', () => this.addCustomAttribute());
        }

        // Features
        const addFeatureBtn = document.getElementById('add-feature');
        if (addFeatureBtn) {
            addFeatureBtn.addEventListener('click', () => this.addFeature());
        }

        // JSON preview modal
        this.setupJsonPreviewModal();

        // Thing type change
        const thingTypeSelect = document.getElementById('thingType');
        if (thingTypeSelect) {
            thingTypeSelect.addEventListener('change', (e) => this.handleThingTypeChange(e.target.value));
        }

        // Form input validation
        this.form.querySelectorAll('.form-input, .form-select').forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    /**
     * Setup JSON preview modal
     */
    setupJsonPreviewModal() {
        const modal = document.getElementById('json-preview-modal');
        const overlay = document.getElementById('json-preview-overlay');
        const closeBtn = document.getElementById('json-preview-close');
        const closeFooterBtn = document.getElementById('json-preview-close-footer');
        const copyBtn = document.getElementById('copy-json');
        const formatBtn = document.getElementById('format-json');

        if (overlay) {
            overlay.addEventListener('click', () => this.hideJsonPreview());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideJsonPreview());
        }

        if (closeFooterBtn) {
            closeFooterBtn.addEventListener('click', () => this.hideJsonPreview());
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyJsonToClipboard());
        }

        if (formatBtn) {
            formatBtn.addEventListener('click', () => this.formatJsonPreview());
        }

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && modal.style.display === 'block') {
                this.hideJsonPreview();
            }
        });
    }

    /**
     * Setup form validation
     */
    setupFormValidation() {
        // Real-time validation for required fields
        const requiredFields = this.form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
        });
    }

    /**
     * Load existing thing data for editing
     */
    loadThingData(thingData) {
        if (!thingData) return;

        this.isEditMode = true;
        this.currentThingId = thingData.thingId;

        // Load basic information
        this.setFieldValue('thingId', thingData.thingId);
        
        // Load attributes
        if (thingData.attributes) {
            // Standard attributes
            this.setFieldValue('manufacturer', thingData.attributes.manufacturer);
            this.setFieldValue('model', thingData.attributes.model);
            this.setFieldValue('serialNumber', thingData.attributes.serialNumber);
            this.setFieldValue('location', thingData.attributes.location);

            // Custom attributes (excluding standard ones)
            const standardAttrs = ['manufacturer', 'model', 'serialNumber', 'location', '_created', '_modified', '_revision'];
            Object.keys(thingData.attributes).forEach(key => {
                if (!standardAttrs.includes(key)) {
                    this.addCustomAttribute(key, thingData.attributes[key]);
                }
            });
        }

        // Load features
        if (thingData.features) {
            Object.keys(thingData.features).forEach(featureId => {
                this.addFeature(featureId, thingData.features[featureId]);
            });
        }

        // Load definition
        if (thingData.definition) {
            this.setFieldValue('definition', thingData.definition);
        }

        // Load policy ID
        if (thingData.policyId) {
            this.setFieldValue('policyId', thingData.policyId);
        }

        // Detect thing type from thingId or attributes
        this.detectAndSetThingType(thingData);
    }

    /**
     * Set field value safely
     */
    setFieldValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field && value !== undefined && value !== null) {
            field.value = value;
        }
    }

    /**
     * Detect and set thing type
     */
    detectAndSetThingType(thingData) {
        const thingTypeSelect = document.getElementById('thingType');
        if (!thingTypeSelect) return;

        let detectedType = 'custom';

        // Detect from thingId prefix
        if (thingData.thingId) {
            const prefix = thingData.thingId.split(':')[0].toLowerCase();
            const typeMap = {
                'vehicle': 'vehicle',
                'car': 'vehicle',
                'truck': 'vehicle',
                'sensor': 'sensor',
                'device': 'device',
                'equipment': 'equipment'
            };
            detectedType = typeMap[prefix] || detectedType;
        }

        // Detect from attributes
        if (thingData.attributes) {
            if (thingData.attributes.vehicleType || thingData.attributes.engineType) {
                detectedType = 'vehicle';
            } else if (thingData.attributes.sensorType || thingData.attributes.measurementUnit) {
                detectedType = 'sensor';
            }
        }

        thingTypeSelect.value = detectedType;
        this.handleThingTypeChange(detectedType);
    }

    /**
     * Handle thing type change
     */
    handleThingTypeChange(thingType) {
        // You can add type-specific form adjustments here
        console.log('Thing type changed to:', thingType);
        
        // Example: Show/hide type-specific fields
        // This can be expanded based on requirements
    }

    /**
     * Add custom attribute
     */
    addCustomAttribute(key = '', value = '') {
        const attributesList = document.getElementById('custom-attributes-list');
        const template = document.getElementById('attribute-template');
        
        if (!attributesList || !template) return;

        const clone = template.content.cloneNode(true);
        const attributeItem = clone.querySelector('.custom-attribute-item');
        
        const keyInput = clone.querySelector('.attribute-key');
        const valueInput = clone.querySelector('.attribute-value');
        const removeBtn = clone.querySelector('.remove-attribute');

        // Set values if provided
        if (key) keyInput.value = key;
        if (value) valueInput.value = value;

        // Add remove functionality
        removeBtn.addEventListener('click', () => {
            attributeItem.remove();
            this.updateCustomAttributes();
        });

        // Add validation
        keyInput.addEventListener('blur', () => this.validateAttributeKey(keyInput));
        keyInput.addEventListener('input', () => this.updateCustomAttributes());
        valueInput.addEventListener('input', () => this.updateCustomAttributes());

        attributesList.appendChild(clone);
        this.updateCustomAttributes();

        // Focus on the key input for new attributes
        if (!key) {
            keyInput.focus();
        }
    }

    /**
     * Add feature
     */
    addFeature(featureId = '', featureData = null) {
        const featuresList = document.getElementById('features-list');
        const template = document.getElementById('feature-template');
        
        if (!featuresList || !template) return;

        const clone = template.content.cloneNode(true);
        const featureItem = clone.querySelector('.feature-item');
        
        const featureIdInput = clone.querySelector('.feature-id');
        const removeBtn = clone.querySelector('.remove-feature');
        const addPropertyBtn = clone.querySelector('.add-property');
        const propertiesList = clone.querySelector('.properties-list');

        // Set feature ID if provided
        if (featureId) featureIdInput.value = featureId;

        // Add remove functionality
        removeBtn.addEventListener('click', () => {
            featureItem.remove();
            this.updateFeatures();
        });

        // Add property functionality
        addPropertyBtn.addEventListener('click', () => {
            this.addProperty(propertiesList);
        });

        // Feature ID validation
        featureIdInput.addEventListener('blur', () => this.validateFeatureId(featureIdInput));
        featureIdInput.addEventListener('input', () => this.updateFeatures());

        // Load existing properties if provided
        if (featureData && featureData.properties) {
            Object.keys(featureData.properties).forEach(propKey => {
                this.addProperty(propertiesList, propKey, featureData.properties[propKey]);
            });
        }

        featuresList.appendChild(clone);
        this.updateFeatures();

        // Focus on the feature ID input for new features
        if (!featureId) {
            featureIdInput.focus();
        }
    }

    /**
     * Add property to feature
     */
    addProperty(propertiesList, key = '', value = '') {
        const template = document.getElementById('property-template');
        if (!template) return;

        const clone = template.content.cloneNode(true);
        const propertyItem = clone.querySelector('.property-item');
        
        const keyInput = clone.querySelector('.property-key');
        const typeSelect = clone.querySelector('.property-type');
        const valueInput = clone.querySelector('.property-value');
        const removeBtn = clone.querySelector('.remove-property');

        // Set values if provided
        if (key) keyInput.value = key;
        if (value !== '') {
            // Detect type and set value
            const { type, formattedValue } = this.detectPropertyType(value);
            typeSelect.value = type;
            valueInput.value = formattedValue;
        }

        // Add remove functionality
        removeBtn.addEventListener('click', () => {
            propertyItem.remove();
            this.updateFeatures();
        });

        // Add validation and update handlers
        keyInput.addEventListener('blur', () => this.validatePropertyKey(keyInput));
        [keyInput, typeSelect, valueInput].forEach(input => {
            input.addEventListener('input', () => this.updateFeatures());
        });

        propertiesList.appendChild(clone);
        this.updateFeatures();

        // Focus on the key input for new properties
        if (!key) {
            keyInput.focus();
        }
    }

    /**
     * Detect property type from value
     */
    detectPropertyType(value) {
        if (typeof value === 'boolean') {
            return { type: 'boolean', formattedValue: value.toString() };
        } else if (typeof value === 'number') {
            return { type: 'number', formattedValue: value.toString() };
        } else if (typeof value === 'object' && Array.isArray(value)) {
            return { type: 'array', formattedValue: JSON.stringify(value) };
        } else if (typeof value === 'object' && value !== null) {
            return { type: 'object', formattedValue: JSON.stringify(value) };
        } else {
            return { type: 'string', formattedValue: value.toString() };
        }
    }

    /**
     * Update custom attributes array
     */
    updateCustomAttributes() {
        this.customAttributes = [];
        document.querySelectorAll('.custom-attribute-item').forEach(item => {
            const key = item.querySelector('.attribute-key').value.trim();
            const value = item.querySelector('.attribute-value').value.trim();
            if (key) {
                this.customAttributes.push({ key, value });
            }
        });
    }

    /**
     * Update features array
     */
    updateFeatures() {
        this.features = [];
        document.querySelectorAll('.feature-item').forEach(item => {
            const featureId = item.querySelector('.feature-id').value.trim();
            if (featureId) {
                const feature = { id: featureId, properties: {} };
                
                item.querySelectorAll('.property-item').forEach(propItem => {
                    const key = propItem.querySelector('.property-key').value.trim();
                    const type = propItem.querySelector('.property-type').value;
                    const value = propItem.querySelector('.property-value').value.trim();
                    
                    if (key && value) {
                        feature.properties[key] = this.parsePropertyValue(value, type);
                    }
                });
                
                this.features.push(feature);
            }
        });
    }

    /**
     * Parse property value based on type
     */
    parsePropertyValue(value, type) {
        try {
            switch (type) {
                case 'boolean':
                    return value.toLowerCase() === 'true';
                case 'number':
                    return parseFloat(value);
                case 'object':
                case 'array':
                    return JSON.parse(value);
                default:
                    return value;
            }
        } catch (error) {
            console.warn('Failed to parse property value:', value, error);
            return value;
        }
    }

    /**
     * Validate field
     */
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.id || field.name;
        let isValid = true;
        let errorMessage = '';

        // Clear previous error
        this.clearFieldError(field);

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Specific field validations
        switch (fieldName) {
            case 'thingId':
                if (value && !this.isValidThingId(value)) {
                    isValid = false;
                    errorMessage = 'Thing ID must contain only letters, numbers, hyphens, underscores, and colons';
                }
                break;
            case 'definition':
                if (value && !this.isValidUrl(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid URL';
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    /**
     * Validate thing ID format
     */
    isValidThingId(thingId) {
        // Thing ID should contain only letters, numbers, hyphens, underscores, and colons
        return /^[a-zA-Z0-9\-_:]+$/.test(thingId);
    }

    /**
     * Validate URL format
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Validate attribute key
     */
    validateAttributeKey(keyInput) {
        const key = keyInput.value.trim();
        if (!key) return;

        // Check for duplicate keys
        const allKeys = Array.from(document.querySelectorAll('.attribute-key'))
            .map(input => input.value.trim())
            .filter(k => k);
        
        const duplicates = allKeys.filter(k => k === key);
        if (duplicates.length > 1) {
            keyInput.classList.add('error');
            this.showTooltipError(keyInput, 'Duplicate attribute key');
        } else {
            keyInput.classList.remove('error');
        }
    }

    /**
     * Validate feature ID
     */
    validateFeatureId(featureIdInput) {
        const featureId = featureIdInput.value.trim();
        if (!featureId) return;

        // Check for duplicate feature IDs
        const allFeatureIds = Array.from(document.querySelectorAll('.feature-id'))
            .map(input => input.value.trim())
            .filter(id => id);
        
        const duplicates = allFeatureIds.filter(id => id === featureId);
        if (duplicates.length > 1) {
            featureIdInput.classList.add('error');
            this.showTooltipError(featureIdInput, 'Duplicate feature ID');
        } else {
            featureIdInput.classList.remove('error');
        }
    }

    /**
     * Validate property key
     */
    validatePropertyKey(keyInput) {
        const key = keyInput.value.trim();
        if (!key) return;

        // Check for duplicate keys within the same feature
        const featureItem = keyInput.closest('.feature-item');
        const allKeys = Array.from(featureItem.querySelectorAll('.property-key'))
            .map(input => input.value.trim())
            .filter(k => k);
        
        const duplicates = allKeys.filter(k => k === key);
        if (duplicates.length > 1) {
            keyInput.classList.add('error');
            this.showTooltipError(keyInput, 'Duplicate property key');
        } else {
            keyInput.classList.remove('error');
        }
    }

    /**
     * Show field error
     */
    showFieldError(field, message) {
        field.classList.add('error');
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    /**
     * Clear field error
     */
    clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = document.getElementById(`${field.id}-error`);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    /**
     * Show tooltip error
     */
    showTooltipError(element, message) {
        element.title = message;
        setTimeout(() => {
            element.title = '';
        }, 3000);
    }

    /**
     * Build thing data from form
     */
    buildThingData() {
        this.updateCustomAttributes();
        this.updateFeatures();

        const thingData = {
            thingId: document.getElementById('thingId').value.trim()
        };

        // Add attributes
        const attributes = {};
        
        // Standard attributes
        const manufacturer = document.getElementById('manufacturer').value.trim();
        const model = document.getElementById('model').value.trim();
        const serialNumber = document.getElementById('serialNumber').value.trim();
        const location = document.getElementById('location').value.trim();

        if (manufacturer) attributes.manufacturer = manufacturer;
        if (model) attributes.model = model;
        if (serialNumber) attributes.serialNumber = serialNumber;
        if (location) attributes.location = location;

        // Custom attributes
        this.customAttributes.forEach(attr => {
            if (attr.key && attr.value) {
                attributes[attr.key] = attr.value;
            }
        });

        if (Object.keys(attributes).length > 0) {
            thingData.attributes = attributes;
        }

        // Add features
        if (this.features.length > 0) {
            thingData.features = {};
            this.features.forEach(feature => {
                if (feature.id && Object.keys(feature.properties).length > 0) {
                    thingData.features[feature.id] = {
                        properties: feature.properties
                    };
                }
            });
        }

        // Add definition
        const definition = document.getElementById('definition').value.trim();
        if (definition) {
            thingData.definition = definition;
        }

        // Add policy ID
        const policyId = document.getElementById('policyId').value.trim();
        if (policyId) {
            thingData.policyId = policyId;
        }

        return thingData;
    }

    /**
     * Validate form
     */
    validateForm() {
        let isValid = true;

        // Validate all form inputs
        this.form.querySelectorAll('.form-input, .form-select').forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        // Validate custom attributes
        document.querySelectorAll('.attribute-key').forEach(keyInput => {
            this.validateAttributeKey(keyInput);
            if (keyInput.classList.contains('error')) {
                isValid = false;
            }
        });

        // Validate features
        document.querySelectorAll('.feature-id').forEach(featureIdInput => {
            this.validateFeatureId(featureIdInput);
            if (featureIdInput.classList.contains('error')) {
                isValid = false;
            }
        });

        // Validate properties
        document.querySelectorAll('.property-key').forEach(keyInput => {
            this.validatePropertyKey(keyInput);
            if (keyInput.classList.contains('error')) {
                isValid = false;
            }
        });

        return isValid;
    }

    /**
     * Handle form submission
     */
    async handleSubmit(event) {
        event.preventDefault();

        // Validate form
        if (!this.validateForm()) {
            window.notificationManager.show(
                'Please fix the errors in the form',
                'error'
            );
            return;
        }

        // Build thing data
        const thingData = this.buildThingData();

        // Show loading state
        const submitBtn = document.getElementById('submit-button');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            if (this.isEditMode) {
                await window.apiClient.updateMongoThing(this.currentThingId, thingData);
                window.notificationManager.show(
                    `Thing "${thingData.thingId}" updated successfully`,
                    'success'
                );
            } else {
                await window.apiClient.createMongoThing(thingData);
                window.notificationManager.show(
                    `Thing "${thingData.thingId}" created successfully`,
                    'success'
                );
            }

            // Redirect to things list
            setTimeout(() => {
                window.location.href = '/things';
            }, 1500);

        } catch (error) {
            console.error('Failed to save thing:', error);
            window.notificationManager.show(
                `Failed to save thing: ${error.message}`,
                'error'
            );
        } finally {
            // Restore button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    /**
     * Show JSON preview
     */
    showJsonPreview() {
        const thingData = this.buildThingData();
        const jsonContent = JSON.stringify(thingData, null, 2);
        
        const previewElement = document.getElementById('json-preview-content');
        const modal = document.getElementById('json-preview-modal');
        
        if (previewElement) {
            previewElement.textContent = jsonContent;
        }
        
        if (modal) {
            modal.style.display = 'block';
            document.body.classList.add('modal-open');
        }
    }

    /**
     * Hide JSON preview
     */
    hideJsonPreview() {
        const modal = document.getElementById('json-preview-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    }

    /**
     * Copy JSON to clipboard
     */
    async copyJsonToClipboard() {
        const previewElement = document.getElementById('json-preview-content');
        if (!previewElement) return;

        try {
            await navigator.clipboard.writeText(previewElement.textContent);
            window.notificationManager.show(
                'JSON copied to clipboard',
                'success',
                null,
                2000
            );
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            window.notificationManager.show(
                'Failed to copy to clipboard',
                'error'
            );
        }
    }

    /**
     * Format JSON preview
     */
    formatJsonPreview() {
        const previewElement = document.getElementById('json-preview-content');
        if (!previewElement) return;

        try {
            const jsonData = JSON.parse(previewElement.textContent);
            const formattedJson = JSON.stringify(jsonData, null, 2);
            previewElement.textContent = formattedJson;
        } catch (error) {
            console.error('Failed to format JSON:', error);
        }
    }
}

// Global instance
window.ThingFormManager = ThingFormManager;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThingFormManager;
}