/**
 * Complete Mortgage Denial Application
 * Main controller integrating all components
 */

class MortgageDenialAppComplete {
    constructor() {
        this.aiEngine = null;
        this.chatBackend = null;
        this.storage = null;
        this.currentPage = 'dashboard';
        this.formData = {};
        this.currentLetter = null;
        this.currentModel = 'gemini-2.0-flash-exp';
        
        console.log('🚀 Initializing DenialAI Pro...');
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            // Show loading
            this.showLoading();
            
            // Initialize components
            this.aiEngine = new MortgageDenialAIEngineEnhanced();
            this.chatBackend = new MortgageDenialChatBackend();
            this.storage = new MortgageDenialStoragePuter();
            
            // Initialize storage (will authenticate)
            await this.storage.initialize();
            
            // Update user profile display
            this.updateUserProfile();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load dashboard
            await this.navigateTo('dashboard');
            
            this.hideLoading();
            console.log('✅ Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.showError('Failed to initialize application: ' + error.message);
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
        
        // Global search
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleGlobalSearch(e.target.value);
            });
        }
    }

    /**
     * Navigate to page
     */
    async navigateTo(page) {
        this.currentPage = page;
        
        // Update active nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
        
        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'generate': 'Generate Denial Letter',
            'letters': 'All Letters',
            'appeals': 'Appeals',
            'compliance': 'Compliance',
            'lenders': 'Lenders',
            'analytics': 'Analytics'
        };
        document.getElementById('pageTitle').textContent = titles[page] || page;
        
        // Load page content
        const contentArea = document.getElementById('contentArea');
        contentArea.innerHTML = '<div class="loading">Loading...</div>';
        
        try {
            switch(page) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'generate':
                    await this.loadGeneratePage();
                    break;
                case 'letters':
                    await this.loadLettersPage();
                    break;
                case 'appeals':
                    await this.loadAppealsPage();
                    break;
                case 'compliance':
                    await this.loadCompliancePage();
                    break;
                case 'lenders':
                    await this.loadLendersPage();
                    break;
                case 'analytics':
                    await this.loadAnalyticsPage();
                    break;
                default:
                    contentArea.innerHTML = '<p>Page not found</p>';
            }
        } catch (error) {
            console.error('Page load error:', error);
            contentArea.innerHTML = '<p class="error">Failed to load page</p>';
        }
    }

    /**
     * Load dashboard
     */
    async loadDashboard() {
        const stats = await this.storage.getStats();
        const recentLetters = await this.storage.getLetters({ limit: 5 });
        
        const html = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon blue">
                            <i class="fas fa-file-signature"></i>
                        </div>
                        <span class="stat-change up">
                            <i class="fas fa-arrow-up"></i> 12.5%
                        </span>
                    </div>
                    <div class="stat-value">${stats.totalGenerated || 0}</div>
                    <div class="stat-label">Letters Generated</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon green">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <span class="stat-change up">
                            <i class="fas fa-arrow-up"></i> 8.3%
                        </span>
                    </div>
                    <div class="stat-value">${stats.complianceRate ? stats.complianceRate.toFixed(1) : '100'}%</div>
                    <div class="stat-label">Compliance Rate</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon yellow">
                            <i class="fas fa-clock"></i>
                        </div>
                        <span class="stat-change up">
                            <i class="fas fa-arrow-down"></i> 45%
                        </span>
                    </div>
                    <div class="stat-value">${stats.avgGenerationTime ? (stats.avgGenerationTime / 1000).toFixed(1) : '2.3'} sec</div>
                    <div class="stat-label">Avg. Generation Time</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-header">
                        <div class="stat-icon cyan">
                            <i class="fas fa-rotate-left"></i>
                        </div>
                        <span class="stat-change down">
                            <i class="fas fa-arrow-up"></i> 3
                        </span>
                    </div>
                    <div class="stat-value">${stats.totalAppeals || 0}</div>
                    <div class="stat-label">Pending Appeals</div>
                </div>
            </div>

            <div class="quick-actions" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px;">
                <div class="quick-action-btn" onclick="app.navigateTo('generate')" style="cursor: pointer; padding: 24px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; text-align: center; transition: all 0.2s;">
                    <i class="fas fa-plus-circle" style="font-size: 32px; color: var(--primary-light); margin-bottom: 12px;"></i>
                    <span style="display: block; font-weight: 500;">New Denial Letter</span>
                </div>
                <div class="quick-action-btn" onclick="app.navigateTo('letters')" style="cursor: pointer; padding: 24px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; text-align: center; transition: all 0.2s;">
                    <i class="fas fa-list" style="font-size: 32px; color: var(--success); margin-bottom: 12px;"></i>
                    <span style="display: block; font-weight: 500;">View All Letters</span>
                </div>
                <div class="quick-action-btn" onclick="app.navigateTo('compliance')" style="cursor: pointer; padding: 24px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; text-align: center; transition: all 0.2s;">
                    <i class="fas fa-shield-halved" style="font-size: 32px; color: var(--warning); margin-bottom: 12px;"></i>
                    <span style="display: block; font-weight: 500;">Compliance Check</span>
                </div>
                <div class="quick-action-btn" onclick="openAIChat()" style="cursor: pointer; padding: 24px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; text-align: center; transition: all 0.2s;">
                    <i class="fas fa-robot" style="font-size: 32px; color: var(--accent); margin-bottom: 12px;"></i>
                    <span style="display: block; font-weight: 500;">AI Assistant</span>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-envelope-open-text"></i>
                        Recent Letters
                    </h3>
                    <button class="btn btn-secondary" onclick="app.navigateTo('letters')">View All</button>
                </div>
                <div class="card-body">
                    ${recentLetters.letters && recentLetters.letters.length > 0 ? 
                        this.renderLettersTable(recentLetters.letters) : 
                        '<div class="empty-state" style="text-align: center; padding: 48px; color: var(--text-muted);"><i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i><p>No letters generated yet</p><button class="btn btn-primary" onclick="app.navigateTo(\'generate\')"><i class="fas fa-plus"></i> Generate Your First Letter</button></div>'}
                </div>
            </div>
        `;
        
        document.getElementById('contentArea').innerHTML = html;
    }

    /**
     * Render letters table
     */
    renderLettersTable(letters) {
        return `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px solid var(--border);">
                        <th style="text-align: left; padding: 12px; font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Application ID</th>
                        <th style="text-align: left; padding: 12px; font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Applicant</th>
                        <th style="text-align: left; padding: 12px; font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Generated</th>
                        <th style="text-align: left; padding: 12px; font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Status</th>
                        <th style="text-align: left; padding: 12px; font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Compliance</th>
                        <th style="text-align: left; padding: 12px; font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${letters.map(letter => `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 16px; font-size: 14px;">${letter.applicationId || 'N/A'}</td>
                            <td style="padding: 16px; font-size: 14px;">${letter.applicantName || 'N/A'}</td>
                            <td style="padding: 16px; font-size: 14px;">${new Date(letter.generatedAt).toLocaleDateString()}</td>
                            <td style="padding: 16px;">
                                <span class="status-badge status-${letter.status || 'pending'}" style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                                    ${letter.status || 'Generated'}
                                </span>
                            </td>
                            <td style="padding: 16px; font-size: 14px;">${letter.complianceScore || 100}/100</td>
                            <td style="padding: 16px;">
                                <button class="btn btn-sm btn-secondary" onclick="app.viewLetter('${letter.id}')" style="padding: 6px 12px; font-size: 12px;">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    /**
     * Update user profile display
     */
    updateUserProfile() {
        const user = this.storage.currentUser;
        if (user) {
            const initials = user.username ? user.username.substring(0, 2).toUpperCase() : 'AN';
            const name = user.username || 'Anonymous';
            
            document.getElementById('userProfile').innerHTML = `
                <div class="user-avatar">${initials}</div>
                <div class="user-info">
                    <div class="user-name">${name}</div>
                    <div class="user-role">Compliance Officer</div>
                </div>
            `;
        }
    }

    /**
     * Show/hide loading
     */
    showLoading() {
        const contentArea = document.getElementById('contentArea');
        if (contentArea) {
            contentArea.innerHTML = '<div style="text-align: center; padding: 64px;"><div class="loading-spinner" style="margin: 0 auto;"></div><p style="margin-top: 16px; color: var(--text-muted);">Loading...</p></div>';
        }
    }

    hideLoading() {
        // Loading will be replaced by content
    }

    /**
     * Show error message
     */
    showError(message) {
        alert('Error: ' + message);
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        alert('Success: ' + message);
    }

    /**
     * Handle global search
     */
    handleGlobalSearch(query) {
        console.log('Searching for:', query);
        // Implement search functionality
    }
}

// Initialize app when DOM is ready
let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new MortgageDenialAppComplete();
        app.initialize();
    });
} else {
    app = new MortgageDenialAppComplete();
    app.initialize();
}
