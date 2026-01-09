/**
 * Healthcare Appeal Application - Main Controller
 * Integrates all components for complete denial management platform
 */

class HealthcareAppealApp {
    constructor() {
        this.aiEngine = null;
        this.chatBackend = null;
        this.storage = null;
        this.currentSection = 'dashboard';
        this.currentAppealData = null;
        this.generatedLetter = null;
        
        console.log('🏥 Initializing ClaimRecovery Pro...');
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            this.showInitializing();
            
            // Initialize components
            this.aiEngine = new HealthcareAppealAIEngine();
            this.chatBackend = new HealthcareAppealChatBackend();
            this.storage = new HealthcareAppealStoragePuter();
            
            // Initialize storage (will authenticate)
            await this.storage.initialize();
            
            // Update user display
            this.updateUserDisplay();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load dashboard
            await this.loadDashboard();
            
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
                const section = item.dataset.section;
                this.switchSection(section);
            });
        });
        
        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = btn.closest('.modal-overlay');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const parent = tab.closest('.tabs');
                parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }

    /**
     * Switch to different section
     */
    switchSection(section) {
        this.currentSection = section;
        
        // Update active nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });
        
        // Update page title
        const titles = {
            'dashboard': 'Dashboard',
            'denials': 'Denial Queue',
            'appeals': 'Appeal Generator',
            'tracking': 'Appeal Tracking',
            'providers': 'Provider Management',
            'payers': 'Payer Configuration',
            'templates': 'Letter Templates',
            'analytics': 'Performance Analytics',
            'reports': 'Reports & Exports',
            'integrations': 'EHR Integrations',
            'compliance': 'HIPAA Compliance',
            'settings': 'Settings'
        };
        
        document.getElementById('page-title').textContent = titles[section] || section;
        
        // Hide all sections
        document.querySelectorAll('.page-section').forEach(s => {
            s.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(`section-${section}`);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Load section-specific data
            this.loadSectionData(section);
        }
    }

    /**
     * Load section-specific data
     */
    async loadSectionData(section) {
        switch(section) {
            case 'dashboard':
                await this.loadDashboard();
                break;
            case 'denials':
                await this.loadDenials();
                break;
            case 'tracking':
                await this.loadAppealTracking();
                break;
            case 'providers':
                await this.loadProviders();
                break;
            case 'payers':
                await this.loadPayers();
                break;
            case 'analytics':
                await this.loadAnalytics();
                break;
            case 'compliance':
                await this.loadCompliance();
                break;
        }
    }

    /**
     * Load dashboard
     */
    async loadDashboard() {
        const stats = await this.storage.getStats();
        const recentDenials = await this.storage.getDenials({ limit: 5, status: 'pending' });
        
        // Update stat cards
        document.getElementById('stat-pending').textContent = stats.totalDenials || 47;
        document.getElementById('stat-submitted').textContent = stats.appealsSubmitted || 128;
        document.getElementById('stat-success').textContent = (stats.successRate || 72) + '%';
        document.getElementById('stat-recovered').textContent = '$' + (stats.revenueRecovered ? (stats.revenueRecovered / 1000).toFixed(0) + 'K' : '847K');
        
        // Update denial count badge
        document.getElementById('denial-count').textContent = stats.totalDenials || 47;
        
        // Populate recent denials table
        const recentDenialsTable = document.getElementById('recent-denials');
        if (recentDenialsTable && recentDenials.denials.length > 0) {
            recentDenialsTable.innerHTML = recentDenials.denials.slice(0, 5).map(denial => `
                <tr>
                    <td>${denial.claimNumber}</td>
                    <td>${denial.patientName}</td>
                    <td>${denial.payer}</td>
                    <td>$${parseInt(denial.claimAmount).toLocaleString()}</td>
                    <td><span class="denial-tag">${denial.denialReason}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="app.startAppealForDenial('${denial.id}')">
                            <i class="fas fa-pen"></i> Appeal
                        </button>
                    </td>
                </tr>
            `).join('');
        } else if (recentDenialsTable) {
            recentDenialsTable.innerHTML = this.generateSampleDenials();
        }
        
        // Populate appeal timeline
        const timeline = document.getElementById('appeal-timeline');
        if (timeline) {
            timeline.innerHTML = this.generateSampleTimeline();
        }
    }

    /**
     * Load denials list
     */
    async loadDenials() {
        const denials = await this.storage.getDenials({ limit: 50 });
        
        const table = document.getElementById('denial-table-body');
        if (table) {
            if (denials.denials.length > 0) {
                table.innerHTML = denials.denials.map(denial => this.renderDenialRow(denial)).join('');
            } else {
                table.innerHTML = this.generateSampleDenialRows();
            }
        }
    }

    /**
     * Load appeal tracking
     */
    async loadAppealTracking() {
        const appeals = await this.storage.getAppeals({ limit: 50 });
        
        const table = document.getElementById('tracking-table-body');
        if (table) {
            if (appeals.appeals.length > 0) {
                table.innerHTML = appeals.appeals.map(appeal => this.renderTrackingRow(appeal)).join('');
            } else {
                table.innerHTML = this.generateSampleTrackingRows();
            }
        }
    }

    /**
     * Load providers
     */
    async loadProviders() {
        const providers = await this.storage.getProviders();
        
        const grid = document.getElementById('providers-grid');
        if (grid) {
            grid.innerHTML = providers.map(provider => this.renderProviderCard(provider)).join('');
        }
    }

    /**
     * Load payers
     */
    async loadPayers() {
        const payers = await this.storage.getPayers();
        
        const table = document.getElementById('payers-table-body');
        if (table) {
            table.innerHTML = payers.map(payer => this.renderPayerRow(payer)).join('');
        }
    }

    /**
     * Load analytics
     */
    async loadAnalytics() {
        const stats = await this.storage.getStats();
        // Analytics page is mostly static with sample data
        console.log('Analytics loaded with stats:', stats);
    }

    /**
     * Load compliance
     */
    async loadCompliance() {
        const auditLog = await this.storage.getAuditLog(10);
        
        const timeline = document.getElementById('audit-logs');
        if (timeline && auditLog.length > 0) {
            timeline.innerHTML = auditLog.map(entry => `
                <div class="timeline-item">
                    <div class="timeline-date">${new Date(entry.timestamp).toLocaleString()}</div>
                    <div class="timeline-title">${this.formatAuditAction(entry.action)}</div>
                    <div class="timeline-description">User: ${entry.username} | ${JSON.stringify(entry.details)}</div>
                </div>
            `).join('');
        }
    }

    /**
     * Update user display
     */
    updateUserDisplay() {
        const user = this.storage.currentUser;
        if (user) {
            const initials = user.username ? user.username.substring(0, 2).toUpperCase() : 'AN';
            const name = user.username || 'Anonymous';
            
            const userMenu = document.getElementById('user-menu');
            if (userMenu) {
                userMenu.innerHTML = `
                    <div class="user-avatar">${initials}</div>
                    <div class="user-info">
                        <div class="user-name">${name}</div>
                        <div class="user-role">Administrator</div>
                    </div>
                `;
            }
        }
    }

    /**
     * Start appeal for specific denial
     */
    async startAppealForDenial(denialId) {
        // Switch to appeals section
        this.switchSection('appeals');
        
        // Load denial data into form
        const denial = await this.storage.getDenials({ limit: 1000 });
        const denialData = denial.denials.find(d => d.id === denialId);
        
        if (denialData) {
            // Pre-fill form
            document.getElementById('claim-number').value = denialData.claimNumber;
            document.getElementById('patient-name').value = denialData.patientName;
            document.getElementById('claim-amount').value = denialData.claimAmount;
            document.getElementById('service-date').value = denialData.serviceDate;
            document.getElementById('payer-select').value = denialData.payer;
            document.getElementById('denial-reason').value = denialData.denialReason;
        }
    }

    /**
     * Rendering methods
     */
    renderDenialRow(denial) {
        const deadline = new Date(denial.appealDeadline);
        const daysUntil = Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24));
        const isUrgent = daysUntil <= 7;
        
        return `
            <tr>
                <td><input type="checkbox"></td>
                <td>${denial.claimNumber}</td>
                <td>${denial.patientName}</td>
                <td>${denial.provider || 'Dr. Smith'}</td>
                <td>${denial.payer}</td>
                <td>${new Date(denial.serviceDate).toLocaleDateString()}</td>
                <td>$${parseInt(denial.claimAmount).toLocaleString()}</td>
                <td><span class="denial-tag">${denial.denialReason}</span></td>
                <td ${isUrgent ? 'style="color: var(--danger); font-weight: 600;"' : ''}>${daysUntil} days</td>
                <td><span class="badge badge-${denial.status === 'pending' ? 'pending' : 'draft'}">${denial.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="app.startAppealForDenial('${denial.id}')">
                        <i class="fas fa-pen"></i> Appeal
                    </button>
                </td>
            </tr>
        `;
    }

    renderTrackingRow(appeal) {
        return `
            <tr>
                <td>${appeal.id}</td>
                <td>${appeal.claimNumber}</td>
                <td>${appeal.patientName}</td>
                <td>${appeal.payer}</td>
                <td>$${appeal.claimAmount || '5,000'}</td>
                <td>${new Date(appeal.generatedAt).toLocaleDateString()}</td>
                <td>${appeal.level}</td>
                <td><span class="badge badge-${appeal.status === 'submitted' ? 'submitted' : appeal.status === 'approved' ? 'approved' : appeal.status === 'denied' ? 'denied' : 'draft'}">${appeal.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="app.viewAppeal('${appeal.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `;
    }

    renderProviderCard(provider) {
        const colors = ['#0066CC', '#059669', '#D97706', '#7C3AED', '#DC2626'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        return `
            <div class="provider-card">
                <div class="provider-avatar" style="background: ${color};">
                    ${provider.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div class="provider-info">
                    <div class="provider-name">${provider.name}, ${provider.title}</div>
                    <div class="provider-specialty">${provider.specialty} | NPI: ${provider.npi}</div>
                    <div class="provider-stats">
                        <div class="provider-stat">
                            <div class="provider-stat-value">${provider.denials}</div>
                            <div class="provider-stat-label">Denials</div>
                        </div>
                        <div class="provider-stat">
                            <div class="provider-stat-value">${provider.appeals}</div>
                            <div class="provider-stat-label">Appeals</div>
                        </div>
                        <div class="provider-stat">
                            <div class="provider-stat-value">${provider.successRate}%</div>
                            <div class="provider-stat-label">Success</div>
                        </div>
                    </div>
                </div>
                <div class="provider-actions">
                    <button class="btn btn-sm btn-primary" style="width: 100%;">
                        <i class="fas fa-chart-line"></i> View Details
                    </button>
                    <button class="btn btn-sm btn-secondary" style="width: 100%;">
                        <i class="fas fa-gear"></i> Configure
                    </button>
                </div>
            </div>
        `;
    }

    renderPayerRow(payer) {
        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="payer-logo">${payer.name.substring(0, 3).toUpperCase()}</div>
                        <strong>${payer.name}</strong>
                    </div>
                </td>
                <td>${payer.payerId}</td>
                <td>${payer.appealAddress}</td>
                <td>${payer.timelyFiling} days</td>
                <td>${payer.appealsSubmitted}</td>
                <td><strong style="color: var(--success);">${payer.successRate}%</strong></td>
                <td>
                    <button class="btn btn-sm btn-secondary">
                        <i class="fas fa-gear"></i> Configure
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Generate sample data for demo
     */
    generateSampleDenials() {
        const samples = [
            ['CLM-2024-15234', 'John Anderson', 'UnitedHealthcare', '$4,250', 'CO-197'],
            ['CLM-2024-15189', 'Maria Garcia', 'Aetna', '$8,900', 'MEDICAL-NECESSITY'],
            ['CLM-2024-15167', 'Robert Chen', 'Blue Cross', '$3,120', 'CO-50'],
            ['CLM-2024-15143', 'Patricia Wilson', 'Cigna', '$12,450', 'CO-16'],
            ['CLM-2024-15098', 'David Martinez', 'Medicare', '$2,870', 'CO-29']
        ];
        
        return samples.map(([claim, patient, payer, amount, reason]) => `
            <tr>
                <td>${claim}</td>
                <td>${patient}</td>
                <td>${payer}</td>
                <td>${amount}</td>
                <td><span class="denial-tag">${reason}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="app.switchSection('appeals')">
                        <i class="fas fa-pen"></i> Appeal
                    </button>
                </td>
            </tr>
        `).join('');
    }

    generateSampleDenialRows() {
        const samples = [
            {
                claim: 'CLM-2024-15234',
                patient: 'John Anderson',
                provider: 'Dr. Smith',
                payer: 'UnitedHealthcare',
                date: '2024-01-15',
                amount: '$4,250',
                reason: 'CO-197',
                deadline: '14 days'
            },
            {
                claim: 'CLM-2024-15189',
                patient: 'Maria Garcia',
                provider: 'Dr. Johnson',
                payer: 'Aetna',
                date: '2024-01-12',
                amount: '$8,900',
                reason: 'MEDICAL-NECESSITY',
                deadline: '21 days'
            },
            {
                claim: 'CLM-2024-15167',
                patient: 'Robert Chen',
                provider: 'Dr. Williams',
                payer: 'Blue Cross Blue Shield',
                date: '2024-01-10',
                amount: '$3,120',
                reason: 'CO-50',
                deadline: '28 days'
            }
        ];
        
        return samples.map(d => `
            <tr>
                <td><input type="checkbox"></td>
                <td>${d.claim}</td>
                <td>${d.patient}</td>
                <td>${d.provider}</td>
                <td>${d.payer}</td>
                <td>${d.date}</td>
                <td>${d.amount}</td>
                <td><span class="denial-tag">${d.reason}</span></td>
                <td style="color: ${d.deadline.includes('14') ? 'var(--danger)' : 'var(--gray-700)'}; font-weight: 600;">${d.deadline}</td>
                <td><span class="badge badge-pending">Pending</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="app.switchSection('appeals')">
                        <i class="fas fa-pen"></i> Appeal
                    </button>
                </td>
            </tr>
        `).join('');
    }

    generateSampleTrackingRows() {
        const samples = [
            {
                id: 'APL-2024-001',
                claim: 'CLM-2024-15100',
                patient: 'Sarah Johnson',
                payer: 'UnitedHealthcare',
                amount: '$5,200',
                submitted: '2024-01-05',
                level: 'First Level',
                status: 'submitted'
            },
            {
                id: 'APL-2024-002',
                claim: 'CLM-2024-15087',
                patient: 'Michael Brown',
                payer: 'Aetna',
                amount: '$7,800',
                submitted: '2024-01-03',
                level: 'First Level',
                status: 'approved'
            }
        ];
        
        return samples.map(a => `
            <tr>
                <td>${a.id}</td>
                <td>${a.claim}</td>
                <td>${a.patient}</td>
                <td>${a.payer}</td>
                <td>${a.amount}</td>
                <td>${a.submitted}</td>
                <td>${a.level}</td>
                <td><span class="badge badge-${a.status}">${a.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    }

    generateSampleTimeline() {
        return `
            <div class="timeline-item">
                <div class="timeline-date">10 minutes ago</div>
                <div class="timeline-title">Appeal Approved</div>
                <div class="timeline-description">Claim CLM-2024-15087 - UnitedHealthcare approved $7,800</div>
            </div>
            <div class="timeline-item">
                <div class="timeline-date">2 hours ago</div>
                <div class="timeline-title">Appeal Submitted</div>
                <div class="timeline-description">Claim CLM-2024-15100 - First level appeal submitted to Aetna</div>
            </div>
            <div class="timeline-item">
                <div class="timeline-date">5 hours ago</div>
                <div class="timeline-title">Letter Generated</div>
                <div class="timeline-description">Claim CLM-2024-15234 - AI generated medical necessity appeal</div>
            </div>
        `;
    }

    /**
     * Helper methods
     */
    formatAuditAction(action) {
        const labels = {
            'denial_created': 'New Denial Added',
            'appeal_generated': 'Appeal Letter Generated',
            'appeal_status_changed': 'Appeal Status Updated',
            'file_accessed': 'File Accessed',
            'data_exported': 'Data Exported'
        };
        return labels[action] || action;
    }

    showInitializing() {
        console.log('Loading application...');
    }

    showError(message) {
        alert('Error: ' + message);
    }

    showSuccess(message) {
        // Show toast notification
        console.log('Success:', message);
    }

    /**
     * View appeal
     */
    async viewAppeal(appealId) {
        const appeal = await this.storage.getAppeal(appealId);
        if (appeal) {
            alert(`Appeal Details:\n\nClaim: ${appeal.claimNumber}\nPatient: ${appeal.patientName}\nStatus: ${appeal.status}\n\nLetter preview available in full version.`);
        }
    }
}

// Initialize app when DOM is ready
let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new HealthcareAppealApp();
        app.initialize();
    });
} else {
    app = new HealthcareAppealApp();
    app.initialize();
}

// Global helper functions
function switchSection(section) {
    if (app) app.switchSection(section);
}

function showNewDenialModal() {
    document.getElementById('new-denial-modal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function showOrgModal() {
    alert('Organization selector - switch between multiple healthcare organizations');
}

function showAddProviderModal() {
    alert('Add new provider form');
}

function showImportModal() {
    alert('Import denials from 835/ERA files or CSV');
}
