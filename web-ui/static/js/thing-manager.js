/**
 * Digital Twin Thing Manager
 * 
 * Manages all thing-related operations including CRUD operations,
 * form handling, validation, and UI interactions for digital twins.
 */

class ThingManager {
    constructor() {
        this.things = [];
        this.filteredThings = [];
        this.currentSort = { field: null, direction: 'asc' };
        this.currentFilters = {};
        this.selectedThings = new Set();
        this.currentPage = 1;
        this.itemsPerPage = 20;
        
        this.init();
    }

    /**
     * Initialize thing manager
     */
    init() {
        this.setupEventListeners();
        console.log('Thing Manager initialized');
    }

    /**
     * Setup event listeners for thing operations
     */
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', 
                window.dashboardManager.debounce((e) => this.handleSearch(e.target.value), 300)
            );
        }

        // Filter functionality
        document.querySelectorAll('.filter-select').forEach(select => {
            select.addEventListener('change', (e) => this.handleFilter(e.target));
        });

        // Clear filters
        const clearFiltersBtn = document.getElementById('clear-filters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        // Clear search
        const searchClear = document.getElementById('search-clear');
        if (searchClear) {
            searchClear.addEventListener('click', () => this.clearSearch());
        }

        // Table sorting
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => this.handleSort(header.dataset.sort));
        });

        // Bulk selection
        const selectAllCheckbox = document.getElementById('select-all');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', (e) => this.handleSelectAll(e.target.checked));
        }

        // Bulk actions
        const bulkActionsToggle = document.getElementById('bulk-actions-toggle');
        if (bulkActionsToggle) {
            bulkActionsToggle.addEventListener('click', () => this.toggleBulkActionsMode());
        }

        // Pagination
        const prevPageBtn = document.getElementById('prev-page');
        const nextPageBtn = document.getElementById('next-page');
        if (prevPageBtn) prevPageBtn.addEventListener('click', () => this.previousPage());
        if (nextPageBtn) nextPageBtn.addEventListener('click', () => this.nextPage());
    }

    /**
     * Load things from API
     */
    async loadThings() {
        try {
            const response = await window.apiClient.getMongoThings();
            this.things = response.data || [];
            this.applyFiltersAndSort();
            this.updateUI();
            
            // Update filter dropdowns
            this.updateFilterOptions();
            
            window.notificationManager.show(
                `Loaded ${this.things.length} things`,
                'success',
                null,
                2000
            );
            
        } catch (error) {
            console.error('Failed to load things:', error);
            this.things = [];
            this.updateUI();
        }
    }

    /**
     * Create a new thing
     */
    async createThing(thingData) {
        try {
            const validation = window.apiClient.validateThingData(thingData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }

            const response = await window.apiClient.createMongoThing(thingData);
            
            // Add to local array
            this.things.push(response.data);
            this.applyFiltersAndSort();
            this.updateUI();
            
            window.notificationManager.show(
                `Thing "${thingData.thingId}" created successfully`,
                'success'
            );
            
            return response.data;
            
        } catch (error) {
            console.error('Failed to create thing:', error);
            window.notificationManager.show(
                `Failed to create thing: ${error.message}`,
                'error'
            );
            throw error;
        }
    }

    /**
     * Update an existing thing
     */
    async updateThing(thingId, updateData) {
        try {
            const response = await window.apiClient.updateMongoThing(thingId, updateData);
            
            // Update local array
            const index = this.things.findIndex(t => t.thingId === thingId);
            if (index !== -1) {
                this.things[index] = { ...this.things[index], ...response.data };
                this.applyFiltersAndSort();
                this.updateUI();
            }
            
            window.notificationManager.show(
                `Thing "${thingId}" updated successfully`,
                'success'
            );
            
            return response.data;
            
        } catch (error) {
            console.error('Failed to update thing:', error);
            window.notificationManager.show(
                `Failed to update thing: ${error.message}`,
                'error'
            );
            throw error;
        }
    }

    /**
     * Delete a thing
     */
    async deleteThing(thingId) {
        try {
            await window.apiClient.deleteMongoThing(thingId);
            
            // Remove from local array
            this.things = this.things.filter(t => t.thingId !== thingId);
            this.selectedThings.delete(thingId);
            this.applyFiltersAndSort();
            this.updateUI();
            
            window.notificationManager.show(
                `Thing "${thingId}" deleted successfully`,
                'success'
            );
            
        } catch (error) {
            console.error('Failed to delete thing:', error);
            window.notificationManager.show(
                `Failed to delete thing: ${error.message}`,
                'error'
            );
            throw error;
        }
    }

    /**
     * Bulk delete selected things
     */
    async bulkDeleteThings() {
        if (this.selectedThings.size === 0) {
            window.notificationManager.show('No things selected', 'warning');
            return;
        }

        const thingIds = Array.from(this.selectedThings);
        const confirmed = confirm(
            `Are you sure you want to delete ${thingIds.length} selected thing(s)? This action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            const promises = thingIds.map(id => window.apiClient.deleteMongoThing(id));
            const results = await Promise.allSettled(promises);
            
            let successCount = 0;
            let failCount = 0;
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successCount++;
                    // Remove from local array
                    this.things = this.things.filter(t => t.thingId !== thingIds[index]);
                    this.selectedThings.delete(thingIds[index]);
                } else {
                    failCount++;
                    console.error(`Failed to delete ${thingIds[index]}:`, result.reason);
                }
            });
            
            this.applyFiltersAndSort();
            this.updateUI();
            
            if (failCount === 0) {
                window.notificationManager.show(
                    `Successfully deleted ${successCount} thing(s)`,
                    'success'
                );
            } else {
                window.notificationManager.show(
                    `Deleted ${successCount} thing(s), failed to delete ${failCount}`,
                    'warning'
                );
            }
            
        } catch (error) {
            console.error('Bulk delete failed:', error);
            window.notificationManager.show(
                'Bulk delete operation failed',
                'error'
            );
        }
    }

    /**
     * Handle search input
     */
    handleSearch(query) {
        this.currentFilters.search = query.toLowerCase();
        this.currentPage = 1;
        this.applyFiltersAndSort();
        this.updateUI();
    }

    /**
     * Handle filter selection
     */
    handleFilter(selectElement) {
        const filterType = selectElement.id.replace('-filter', '');
        const value = selectElement.value;
        
        if (value) {
            this.currentFilters[filterType] = value;
        } else {
            delete this.currentFilters[filterType];
        }
        
        this.currentPage = 1;
        this.applyFiltersAndSort();
        this.updateUI();
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.currentFilters = {};
        this.currentPage = 1;
        
        // Reset filter dropdowns
        document.querySelectorAll('.filter-select').forEach(select => {
            select.value = '';
        });
        
        // Clear search
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        this.applyFiltersAndSort();
        this.updateUI();
    }

    /**
     * Clear search
     */
    clearSearch() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.value = '';
            this.handleSearch('');
        }
    }

    /**
     * Handle table sorting
     */
    handleSort(field) {
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = field;
            this.currentSort.direction = 'asc';
        }
        
        this.applyFiltersAndSort();
        this.updateUI();
        this.updateSortIndicators();
    }

    /**
     * Update sort indicators in table headers
     */
    updateSortIndicators() {
        document.querySelectorAll('.sortable').forEach(header => {
            const field = header.dataset.sort;
            header.classList.remove('sort-asc', 'sort-desc');
            
            if (this.currentSort.field === field) {
                header.classList.add(`sort-${this.currentSort.direction}`);
            }
        });
    }

    /**
     * Handle select all checkbox
     */
    handleSelectAll(checked) {
        if (checked) {
            this.filteredThings.forEach(thing => {
                this.selectedThings.add(thing.thingId);
            });
        } else {
            this.selectedThings.clear();
        }
        
        this.updateTableCheckboxes();
        this.updateBulkActions();
    }

    /**
     * Handle individual thing selection
     */
    handleThingSelection(thingId, checked) {
        if (checked) {
            this.selectedThings.add(thingId);
        } else {
            this.selectedThings.delete(thingId);
        }
        
        this.updateSelectAllCheckbox();
        this.updateBulkActions();
    }

    /**
     * Toggle bulk actions mode
     */
    toggleBulkActionsMode() {
        const bulkActionsBar = document.getElementById('bulk-actions-bar');
        const isActive = bulkActionsBar.style.display !== 'none';
        
        if (isActive) {
            this.exitBulkActionsMode();
        } else {
            this.enterBulkActionsMode();
        }
    }

    /**
     * Enter bulk actions mode
     */
    enterBulkActionsMode() {
        const bulkActionsBar = document.getElementById('bulk-actions-bar');
        if (bulkActionsBar) {
            bulkActionsBar.style.display = 'block';
        }
        
        // Show checkboxes
        document.querySelectorAll('.table-checkbox').forEach(checkbox => {
            checkbox.style.display = 'block';
        });
        
        this.updateBulkActions();
    }

    /**
     * Exit bulk actions mode
     */
    exitBulkActionsMode() {
        const bulkActionsBar = document.getElementById('bulk-actions-bar');
        if (bulkActionsBar) {
            bulkActionsBar.style.display = 'none';
        }
        
        // Clear selections
        this.selectedThings.clear();
        this.updateTableCheckboxes();
        this.updateSelectAllCheckbox();
    }

    /**
     * Apply filters and sorting to things array
     */
    applyFiltersAndSort() {
        let filtered = [...this.things];
        
        // Apply search filter
        if (this.currentFilters.search) {
            const search = this.currentFilters.search;
            filtered = filtered.filter(thing => {
                return (
                    thing.thingId?.toLowerCase().includes(search) ||
                    thing.attributes?.manufacturer?.toLowerCase().includes(search) ||
                    thing.attributes?.model?.toLowerCase().includes(search) ||
                    thing.attributes?.location?.toLowerCase().includes(search)
                );
            });
        }
        
        // Apply other filters
        Object.keys(this.currentFilters).forEach(filterType => {
            if (filterType === 'search') return;
            
            const filterValue = this.currentFilters[filterType];
            filtered = filtered.filter(thing => {
                switch (filterType) {
                    case 'manufacturer':
                        return thing.attributes?.manufacturer === filterValue;
                    case 'model':
                        return thing.attributes?.model === filterValue;
                    case 'status':
                        return this.getThingStatus(thing) === filterValue;
                    default:
                        return true;
                }
            });
        });
        
        // Apply sorting
        if (this.currentSort.field) {
            filtered.sort((a, b) => {
                let aValue = this.getSortValue(a, this.currentSort.field);
                let bValue = this.getSortValue(b, this.currentSort.field);
                
                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                }
                
                let result = 0;
                if (aValue < bValue) result = -1;
                else if (aValue > bValue) result = 1;
                
                return this.currentSort.direction === 'desc' ? -result : result;
            });
        }
        
        this.filteredThings = filtered;
    }

    /**
     * Get value for sorting
     */
    getSortValue(thing, field) {
        switch (field) {
            case 'thingId':
                return thing.thingId || '';
            case 'manufacturer':
                return thing.attributes?.manufacturer || '';
            case 'model':
                return thing.attributes?.model || '';
            case 'created':
                return thing._created || thing.attributes?._created || '';
            default:
                return '';
        }
    }

    /**
     * Get thing status
     */
    getThingStatus(thing) {
        // Simple status determination - can be enhanced
        if (thing.attributes?.status) {
            return thing.attributes.status;
        }
        return Math.random() > 0.5 ? 'active' : 'inactive'; // Mock status
    }

    /**
     * Update filter dropdown options
     */
    updateFilterOptions() {
        // Update manufacturer filter
        const manufacturers = [...new Set(
            this.things.map(t => t.attributes?.manufacturer).filter(Boolean)
        )].sort();
        this.updateSelectOptions('manufacturer-filter', manufacturers);
        
        // Update model filter
        const models = [...new Set(
            this.things.map(t => t.attributes?.model).filter(Boolean)
        )].sort();
        this.updateSelectOptions('model-filter', models);
    }

    /**
     * Update select element options
     */
    updateSelectOptions(selectId, options) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        
        // Clear existing options except the first one (placeholder)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Add new options
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            select.appendChild(optionElement);
        });
        
        // Restore selected value if it still exists
        if (options.includes(currentValue)) {
            select.value = currentValue;
        }
    }

    /**
     * Update UI elements
     */
    updateUI() {
        this.renderThingsTable();
        this.updatePagination();
        this.updateCounters();
        this.updateBulkActions();
    }

    /**
     * Render things table
     */
    renderThingsTable() {
        const tableBody = document.getElementById('things-table-body');
        if (!tableBody) return;
        
        // Calculate pagination
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageThings = this.filteredThings.slice(startIndex, endIndex);
        
        if (pageThings.length === 0) {
            tableBody.innerHTML = `
                <tr class="no-data-row">
                    <td colspan="7" class="loading-cell">
                        <div class="loading-placeholder">
                            <i class="fas fa-info-circle"></i>
                            No things found
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = pageThings.map(thing => `
            <tr class="thing-row" data-thing-id="${thing.thingId}">
                <td>
                    <input type="checkbox" class="table-checkbox thing-checkbox" 
                           data-thing-id="${thing.thingId}"
                           ${this.selectedThings.has(thing.thingId) ? 'checked' : ''}>
                </td>
                <td class="thing-id-cell">
                    <span class="thing-id-text" title="${thing.thingId}">${thing.thingId}</span>
                </td>
                <td data-label="Manufacturer">${thing.attributes?.manufacturer || '-'}</td>
                <td data-label="Model">${thing.attributes?.model || '-'}</td>
                <td data-label="Status">
                    <span class="status-badge ${this.getThingStatus(thing)}">
                        ${this.getThingStatus(thing)}
                    </span>
                </td>
                <td data-label="Created">${this.formatDate(thing._created || thing.attributes?._created)}</td>
                <td class="actions-cell">
                    <div class="action-buttons">
                        <button class="btn btn-icon btn-sm" title="View Details" 
                                onclick="thingManager.viewThing('${thing.thingId}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-icon btn-sm" title="Edit" 
                                onclick="thingManager.editThing('${thing.thingId}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-icon btn-sm btn-danger" title="Delete" 
                                onclick="thingManager.confirmDeleteThing('${thing.thingId}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Add event listeners for checkboxes
        tableBody.querySelectorAll('.thing-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleThingSelection(e.target.dataset.thingId, e.target.checked);
            });
        });
    }

    /**
     * Update pagination controls
     */
    updatePagination() {
        const totalPages = Math.ceil(this.filteredThings.length / this.itemsPerPage);
        
        const prevBtn = document.getElementById('prev-page');
        const nextBtn = document.getElementById('next-page');
        const paginationInfo = document.getElementById('pagination-info');
        
        if (prevBtn) prevBtn.disabled = this.currentPage <= 1;
        if (nextBtn) nextBtn.disabled = this.currentPage >= totalPages;
        
        if (paginationInfo) {
            paginationInfo.textContent = `Page ${this.currentPage} of ${totalPages || 1}`;
        }
    }

    /**
     * Update counters
     */
    updateCounters() {
        const thingsCount = document.getElementById('things-count');
        const filteredCount = document.getElementById('filtered-count');
        
        if (thingsCount) {
            thingsCount.textContent = `${this.things.length} thing${this.things.length !== 1 ? 's' : ''}`;
        }
        
        if (filteredCount) {
            filteredCount.textContent = `${this.filteredThings.length} filtered`;
        }
    }

    /**
     * Update bulk actions
     */
    updateBulkActions() {
        const bulkActionsToggle = document.getElementById('bulk-actions-toggle');
        const bulkSelectionCount = document.getElementById('bulk-selection-count');
        const bulkDeleteBtn = document.getElementById('bulk-delete');
        
        const selectedCount = this.selectedThings.size;
        
        if (bulkActionsToggle) {
            bulkActionsToggle.disabled = this.filteredThings.length === 0;
        }
        
        if (bulkSelectionCount) {
            bulkSelectionCount.textContent = `${selectedCount} selected`;
        }
        
        if (bulkDeleteBtn) {
            bulkDeleteBtn.disabled = selectedCount === 0;
            bulkDeleteBtn.onclick = () => this.bulkDeleteThings();
        }
    }

    /**
     * Update table checkboxes
     */
    updateTableCheckboxes() {
        document.querySelectorAll('.thing-checkbox').forEach(checkbox => {
            const thingId = checkbox.dataset.thingId;
            checkbox.checked = this.selectedThings.has(thingId);
        });
    }

    /**
     * Update select all checkbox
     */
    updateSelectAllCheckbox() {
        const selectAllCheckbox = document.getElementById('select-all');
        if (!selectAllCheckbox) return;
        
        const visibleThingIds = this.filteredThings.map(t => t.thingId);
        const selectedVisibleCount = visibleThingIds.filter(id => this.selectedThings.has(id)).length;
        
        if (selectedVisibleCount === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = false;
        } else if (selectedVisibleCount === visibleThingIds.length) {
            selectAllCheckbox.checked = true;
            selectAllCheckbox.indeterminate = false;
        } else {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.indeterminate = true;
        }
    }

    /**
     * Navigate to previous page
     */
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updateUI();
        }
    }

    /**
     * Navigate to next page
     */
    nextPage() {
        const totalPages = Math.ceil(this.filteredThings.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.updateUI();
        }
    }

    /**
     * View thing details
     */
    viewThing(thingId) {
        const thing = this.things.find(t => t.thingId === thingId);
        if (thing) {
            if (window.thingDetailModal) {
                window.thingDetailModal.show(thing);
            } else {
                // Fallback: navigate to details page
                window.location.href = `/things/${encodeURIComponent(thingId)}`;
            }
        }
    }

    /**
     * Edit thing
     */
    editThing(thingId) {
        window.location.href = `/edit-thing/${encodeURIComponent(thingId)}`;
    }

    /**
     * Confirm delete thing
     */
    confirmDeleteThing(thingId) {
        const thing = this.things.find(t => t.thingId === thingId);
        const thingName = thing?.thingId || thingId;
        
        if (window.deleteConfirmationModal) {
            window.deleteConfirmationModal.show(thingId, thingName);
        } else {
            // Fallback: use browser confirm
            if (confirm(`Are you sure you want to delete thing "${thingName}"? This action cannot be undone.`)) {
                this.deleteThing(thingId);
            }
        }
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }
}

// Global instance
window.thingManager = new ThingManager();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThingManager;
}