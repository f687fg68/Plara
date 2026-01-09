/**
 * DisputeShield AI - Chargeback & Dispute Response Writer
 * Complete Puter.js Integration for Revenue Protection
 * Generates winning chargeback rebuttals using advanced AI and reason-code-specific strategies
 */

// ===================== DISPUTE RESPONSE STATE MANAGEMENT =====================
const DisputeResponseWriter = {
    state: {
        // Current dispute details
        disputeType: 'chargeback', // chargeback, paypal, marketplace, refund
        platform: 'stripe', // stripe, paypal, shopify, amazon, etc.
        cardNetwork: 'visa', // visa, mastercard, amex
        reasonCode: '', // e.g., "10.4", "13.1", "4837"
        transactionAmount: '',
        transactionDate: '',
        disputeFiledDate: '',

        // Evidence inventory
        evidenceItems: [],
        hasShippingProof: false,
        hasAuthorizationProof: false,
        hasCustomerComm: false,
        hasSignature: false,
        has3DSecure: false,

        // Merchant narrative
        merchantNarrative: '',
        customerBackground: '',
        refundOffered: false,

        // Generated response
        currentResponse: null,
        isGenerating: false,

        // Templates and history
        templates: [],
        history: [],
        stats: {
            totalDisputes: 0,
            won: 0,
            lost: 0,
            pending: 0,
            recovered: 0,
            winRate: 0
        },

        // Selected AI model
        selectedModel: 'claude-sonnet-4', // Default to Claude Sonnet 4.5 for legal writing

        // Available AI models - Gemini 3.0 Pro & Claude Sonnet 4.5 prioritized
        availableModels: [
            { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', description: 'Advanced reasoning for complex dispute analysis', provider: 'google' },
            { id: 'claude-sonnet-4', name: 'Claude Sonnet 4.5', description: 'Superior legal writing and persuasive arguments', provider: 'anthropic' },
            { id: 'claude-opus-4', name: 'Claude Opus 4', description: 'Most capable for high-stakes disputes', provider: 'anthropic' },
            { id: 'claude-haiku', name: 'Claude Haiku', description: 'Fast responses for simple disputes', provider: 'anthropic' },
            { id: 'gpt-4o', name: 'GPT-4o', description: 'Fast and reliable responses', provider: 'openai' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Efficient for standard disputes', provider: 'openai' }
        ]
    },

    // KV Storage keys
    KV_KEYS: {
        templates: (userId) => `dispute:templates:${userId}`,
        history: (userId, year, month) => `dispute:history:${userId}:${year}:${month}`,
        stats: (userId) => `dispute:stats:${userId}`,
        systemTemplate: (reasonCode, network) => `dispute:system:${reasonCode}:${network}`
    },

    // Initialize the module
    async init() {
        console.log('🛡️ Initializing DisputeShield AI...');
        await this.loadUserData();
        this.setupSlashCommands();
        console.log('✅ DisputeShield AI ready');
    },

    // Load user data from Puter KV
    async loadUserData() {
        try {
            if (!window.puter || !(await puter.auth.isSignedIn())) {
                console.log('User not signed in, skipping data load');
                return;
            }

            const user = await puter.auth.getUser();
            const userId = user.username;

            // Load templates
            const templatesData = await puter.kv.get(this.KV_KEYS.templates(userId));
            if (templatesData) {
                this.state.templates = JSON.parse(templatesData);
                console.log(`Loaded ${this.state.templates.length} templates`);
            }

            // Load stats
            const statsData = await puter.kv.get(this.KV_KEYS.stats(userId));
            if (statsData) {
                this.state.stats = JSON.parse(statsData);
                this.calculateWinRate();
                console.log(`Win rate: ${(this.state.stats.winRate * 100).toFixed(0)}%`);
            }

            // Load recent history
            const now = new Date();
            const historyData = await puter.kv.get(
                this.KV_KEYS.history(userId, now.getFullYear(), now.getMonth() + 1)
            );
            if (historyData) {
                this.state.history = JSON.parse(historyData);
            }

        } catch (error) {
            console.warn('Failed to load user data:', error);
        }
    },

    // Save user data
    async saveUserData() {
        try {
            const user = await puter.auth.getUser();
            const userId = user.username;

            await puter.kv.set(this.KV_KEYS.templates(userId), JSON.stringify(this.state.templates));
            await puter.kv.set(this.KV_KEYS.stats(userId), JSON.stringify(this.state.stats));

            const now = new Date();
            await puter.kv.set(
                this.KV_KEYS.history(userId, now.getFullYear(), now.getMonth() + 1),
                JSON.stringify(this.state.history)
            );

        } catch (error) {
            console.error('Failed to save user data:', error);
        }
    },

    // Calculate win rate
    calculateWinRate() {
        const total = this.state.stats.won + this.state.stats.lost;
        this.state.stats.winRate = total > 0 ? this.state.stats.won / total : 0;
    },

    // Setup slash commands
    setupSlashCommands() {
        window.disputeCommandHandler = async (raw) => {
            const match = raw.match(/^\s*\/dispute(?:\s+(.+))?$/i);
            if (!match) return false;

            const subcommand = (match[1] || '').trim();

            if (!subcommand || subcommand === 'help') {
                this.showHelp();
                return true;
            }

            if (subcommand === 'generate' || subcommand === 'gen') {
                await this.handleGenerateCommand();
                return true;
            }

            if (subcommand.startsWith('type ')) {
                const type = subcommand.substring(5).trim();
                this.setDisputeType(type);
                return true;
            }

            if (subcommand.startsWith('reason ')) {
                const code = subcommand.substring(7).trim();
                this.setReasonCode(code);
                return true;
            }

            if (subcommand.startsWith('platform ')) {
                const platform = subcommand.substring(9).trim();
                this.setPlatform(platform);
                return true;
            }

            if (subcommand.startsWith('network ')) {
                const network = subcommand.substring(8).trim();
                this.setCardNetwork(network);
                return true;
            }

            if (subcommand === 'stats') {
                this.showStats();
                return true;
            }

            if (subcommand === 'templates') {
                this.showTemplates();
                return true;
            }

            if (subcommand === 'codes') {
                this.showReasonCodes();
                return true;
            }

            if (subcommand.startsWith('evidence ')) {
                const evidenceType = subcommand.substring(9).trim();
                this.addEvidence(evidenceType);
                return true;
            }

            if (subcommand.startsWith('amount ')) {
                const amount = subcommand.substring(7).trim();
                this.setAmount(amount);
                return true;
            }

            // Model selection command: /dispute model <model>
            if (subcommand.startsWith('model ')) {
                const modelInput = subcommand.substring(6).trim().toLowerCase();
                this.setModel(modelInput);
                return true;
            }

            // Dual-AI comparison: /dispute compare
            if (subcommand === 'compare' || subcommand === 'dual') {
                await this.generateDualAI();
                return true;
            }

            // Show available models: /dispute models
            if (subcommand === 'models') {
                this.showModels();
                return true;
            }

            return false;
        };
    },

    // Set AI model
    setModel(modelInput) {
        // Allow shorthand model names
        let modelId = modelInput;

        // Gemini shortcuts
        if (modelInput === 'gemini' || modelInput === 'gemini-3' || modelInput === 'gemini-3-pro') {
            modelId = 'gemini-3-pro-preview';
        }
        // Claude Sonnet shortcuts
        else if (modelInput === 'claude' || modelInput === 'sonnet' || modelInput === 'claude-sonnet') {
            modelId = 'claude-sonnet-4';
        }
        // Claude Opus shortcuts
        else if (modelInput === 'opus' || modelInput === 'claude-opus') {
            modelId = 'claude-opus-4';
        }
        // Claude Haiku shortcuts
        else if (modelInput === 'haiku' || modelInput === 'claude-haiku') {
            modelId = 'claude-haiku';
        }
        // GPT shortcuts
        else if (modelInput === 'gpt' || modelInput === 'gpt-4' || modelInput === 'gpt-4o') {
            modelId = 'gpt-4o';
        }
        else if (modelInput === 'gpt-mini' || modelInput === 'gpt-4o-mini') {
            modelId = 'gpt-4o-mini';
        }
        // Auto selection
        else if (modelInput === 'auto') {
            modelId = 'auto';
        }

        // Find model info
        const modelInfo = this.state.availableModels.find(m => m.id === modelId);
        const modelName = modelInfo ? modelInfo.name : modelId;

        this.state.selectedModel = modelId;
        showNotification(`✅ AI Model set to: ${modelName}`, 'success');
        console.log(`DisputeShield AI model changed to: ${modelId}`);
    },

    // Show available models
    showModels() {
        const modelList = this.state.availableModels.map(m =>
            `• **${m.name}** (\`${m.id}\`) - ${m.description}`
        ).join('\n');

        const currentModel = this.state.availableModels.find(m => m.id === this.state.selectedModel);
        const currentName = currentModel ? currentModel.name : this.state.selectedModel;

        const modelsText = `🤖 **Available AI Models:**\n\n${modelList}\n\n**Current Model:** ${currentName}\n\n**Usage:** /dispute model <gemini|claude|opus|haiku|gpt|auto>`;

        if (window.editorjs) {
            window.editorjs.blocks.insert('paragraph', { text: modelsText });
        }
        showNotification('Available models displayed', 'info');
    },

    // Show help
    showHelp() {
        const currentModel = this.state.availableModels.find(m => m.id === this.state.selectedModel);
        const currentModelName = currentModel ? currentModel.name : this.state.selectedModel;

        const helpText = `🛡️ **DisputeShield AI - Chargeback & Dispute Response Writer**

**AI MODELS (Gemini 3.0 Pro & Claude Sonnet 4.5):**
/dispute model <model> - Set AI (gemini, claude, opus, haiku, gpt, auto)
/dispute models - Show all available models
/dispute compare - Generate with BOTH Gemini 3.0 Pro & Claude Sonnet 4.5

**COMMANDS:**
/dispute help - Show this help
/dispute type <type> - Set dispute type (chargeback, paypal, marketplace, refund)
/dispute platform <platform> - Set platform (stripe, paypal, shopify, amazon, etc.)
/dispute network <network> - Set card network (visa, mastercard, amex, discover)
/dispute reason <code> - Set reason code (e.g., 10.4, 13.1, 4837, F24)
/dispute amount <amount> - Set transaction amount
/dispute evidence <type> - Add evidence (shipping, signature, auth, 3dsecure, etc.)
/dispute codes - Show available reason codes for selected network
/dispute generate - Generate winning response
/dispute templates - Show saved templates
/dispute stats - Show win rate statistics

**WORKFLOW:**
1. Set basic details:
   /dispute type chargeback
   /dispute platform stripe
   /dispute network visa
   /dispute reason 13.1
   /dispute amount 299.99

2. Add evidence:
   /dispute evidence shipping
   /dispute evidence signature

3. Generate response:
   /dispute generate

**🤖 MODEL SHORTCUTS:**
• gemini - Gemini 3.0 Pro (Advanced reasoning)
• claude / sonnet - Claude Sonnet 4.5 (Superior legal writing)
• opus - Claude Opus 4 (High-stakes disputes)
• auto - Automatic selection based on dispute complexity

**WIN RATE:** ${(this.state.stats.winRate * 100).toFixed(0)}% | **Current Model:** ${currentModelName}`;

        if (window.editorjs) {
            window.editorjs.blocks.insert('paragraph', { text: helpText });
        }
        showNotification('DisputeShield AI help displayed', 'info');
    },

    // Set dispute type
    setDisputeType(type) {
        const validTypes = ['chargeback', 'paypal', 'marketplace', 'refund', 'violation'];
        const normalizedType = type.toLowerCase();

        if (validTypes.includes(normalizedType)) {
            this.state.disputeType = normalizedType;
            showNotification(`✅ Dispute type set to: ${normalizedType}`, 'success');
        } else {
            showNotification(`❌ Invalid type. Use: ${validTypes.join(', ')}`, 'error');
        }
    },

    // Set platform
    setPlatform(platform) {
        const validPlatforms = ['stripe', 'paypal', 'shopify', 'amazon', 'ebay', 'etsy', 'square', 'adyen', 'braintree'];
        const normalizedPlatform = platform.toLowerCase();

        if (validPlatforms.includes(normalizedPlatform)) {
            this.state.platform = normalizedPlatform;
            showNotification(`✅ Platform set to: ${normalizedPlatform}`, 'success');
        } else {
            this.state.platform = normalizedPlatform; // Allow custom platforms
            showNotification(`✅ Platform set to: ${normalizedPlatform}`, 'success');
        }
    },

    // Set card network
    setCardNetwork(network) {
        const validNetworks = ['visa', 'mastercard', 'amex', 'discover'];
        const normalizedNetwork = network.toLowerCase();

        if (validNetworks.includes(normalizedNetwork)) {
            this.state.cardNetwork = normalizedNetwork;
            showNotification(`✅ Card network set to: ${normalizedNetwork}`, 'success');
        } else {
            showNotification(`❌ Invalid network. Use: ${validNetworks.join(', ')}`, 'error');
        }
    },

    // Set reason code
    setReasonCode(code) {
        this.state.reasonCode = code;
        const reasonData = PromptService.getReasonCodeData(code, this.state.cardNetwork);
        showNotification(`✅ Reason code set to: ${code} - ${reasonData.name}`, 'success');
    },

    // Set transaction amount
    setAmount(amount) {
        const numAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
        if (isNaN(numAmount)) {
            showNotification('❌ Invalid amount', 'error');
            return;
        }
        this.state.transactionAmount = numAmount.toFixed(2);
        showNotification(`✅ Amount set to: $${this.state.transactionAmount}`, 'success');
    },

    // Add evidence
    addEvidence(evidenceType) {
        const evidenceMap = {
            'shipping': { type: 'Shipping/Tracking', flag: 'hasShippingProof' },
            'signature': { type: 'Delivery Signature', flag: 'hasSignature' },
            'auth': { type: 'Authorization Proof', flag: 'hasAuthorizationProof' },
            '3dsecure': { type: '3D Secure Authentication', flag: 'has3DSecure' },
            'communication': { type: 'Customer Communication', flag: 'hasCustomerComm' }
        };

        const evidence = evidenceMap[evidenceType.toLowerCase()];
        if (evidence) {
            this.state[evidence.flag] = true;
            this.state.evidenceItems.push({
                type: evidence.type,
                description: 'Available',
                confidence: 90
            });
            showNotification(`✅ Evidence added: ${evidence.type}`, 'success');
        } else {
            showNotification(`❌ Unknown evidence type. Use: ${Object.keys(evidenceMap).join(', ')}`, 'error');
        }
    },

    // Show reason codes
    showReasonCodes() {
        const network = this.state.cardNetwork.toUpperCase();
        const codes = REASON_CODE_MAP[network] || REASON_CODE_MAP.VISA;

        const codeList = Object.entries(codes)
            .map(([code, data]) => `• **${code}**: ${data.name} (${data.category})`)
            .join('\n');

        const helpText = `📋 **${network} Reason Codes:**\n\n${codeList}\n\nUse: /dispute reason <code>`;

        if (window.editorjs) {
            window.editorjs.blocks.insert('paragraph', { text: helpText });
        }
        showNotification(`${network} reason codes displayed`, 'info');
    },

    // Show statistics
    showStats() {
        const stats = this.state.stats;
        const winRate = (stats.winRate * 100).toFixed(0);
        const avgRecovery = stats.won > 0 ? (stats.recovered / stats.won).toFixed(2) : 0;

        const statsText = `📊 **DisputeShield AI Statistics**

**Overall Performance:**
• Total Disputes Handled: ${stats.totalDisputes}
• Won: ${stats.won} ✅
• Lost: ${stats.lost} ❌
• Pending: ${stats.pending} ⏳
• Win Rate: ${winRate}%

**Revenue Protected:**
• Total Recovered: $${stats.recovered.toLocaleString()}
• Average per Win: $${avgRecovery}

**Current Configuration:**
• Dispute Type: ${this.state.disputeType}
• Platform: ${this.state.platform}
• Card Network: ${this.state.cardNetwork}
• Reason Code: ${this.state.reasonCode || 'Not set'}`;

        if (window.editorjs) {
            window.editorjs.blocks.insert('paragraph', { text: statsText });
        }
        showNotification('Statistics displayed', 'info');
    },

    // Show templates
    showTemplates() {
        if (this.state.templates.length === 0) {
            showNotification('No saved templates yet', 'info');
            return;
        }

        const templateList = this.state.templates
            .map((t, i) => `${i + 1}. **${t.name}** (${t.reasonCode}) - Used ${t.useCount} times`)
            .join('\n');

        const templatesText = `📚 **Saved Templates:**\n\n${templateList}\n\nTemplates are auto-loaded when you use matching reason codes.`;

        if (window.editorjs) {
            window.editorjs.blocks.insert('paragraph', { text: templatesText });
        }
        showNotification(`${this.state.templates.length} templates available`, 'info');
    },

    // Handle generate command
    async handleGenerateCommand() {
        // Check if we have merchant narrative from chat input or attachments
        const chatInput = document.getElementById('user-input');
        const merchantText = chatInput?.value.trim();

        if (merchantText && merchantText.length > 20) {
            this.state.merchantNarrative = merchantText;
        }

        if (!this.state.reasonCode) {
            showNotification('⚠️ Please set reason code first: /dispute reason <code>', 'warning');
            return;
        }

        if (!this.state.transactionAmount) {
            showNotification('⚠️ Please set transaction amount: /dispute amount <amount>', 'warning');
            return;
        }

        // Generate the response
        await this.generateResponse();
    }
};

// ===================== REASON CODE DATABASE =====================
const REASON_CODE_MAP = {
    VISA: {
        '10.4': {
            name: 'Fraud - Card Absent Environment',
            category: 'fraudulent',
            defendWith: ['IP verification', 'Device fingerprint', 'Email confirmation', 'CVV match', '3D Secure'],
            rebuttalFocus: 'Prove cardholder authorized the transaction',
            commonMisses: ['Weak IP evidence', 'Missing email confirmation', 'No authorization logs']
        },
        '10.5': {
            name: 'Visa Fraud Monitoring Program',
            category: 'fraudulent',
            defendWith: ['CVV2 verification', 'AVS match', 'IP/Device tracking', 'Purchase history'],
            rebuttalFocus: 'Strong authorization and anti-fraud measures'
        },
        '11.1': {
            name: 'Card Recovery Bulletin',
            category: 'authorization',
            defendWith: ['Authorization code', 'Transaction timestamp', 'Verification logs'],
            rebuttalFocus: 'Valid authorization at time of transaction'
        },
        '11.2': {
            name: 'Declined Authorization',
            category: 'authorization',
            defendWith: ['Authorization approval code', 'Bank approval timestamp'],
            rebuttalFocus: 'Transaction was properly authorized'
        },
        '12.1': {
            name: 'Late Presentment',
            category: 'processing_error',
            defendWith: ['Presentment date', 'Processing timeline documentation'],
            rebuttalFocus: 'Timely processing of transaction'
        },
        '12.2': {
            name: 'Incorrect Transaction Code',
            category: 'processing_error',
            defendWith: ['Correct MCC code', 'Transaction type documentation'],
            rebuttalFocus: 'Proper transaction coding'
        },
        '13.1': {
            name: 'Merchandise/Services Not Received',
            category: 'product_not_received',
            defendWith: ['Tracking number', 'Signed delivery', 'GPS confirmation', 'System delivery record', 'Customer signature'],
            rebuttalFocus: 'Concrete proof product was delivered to cardholder address',
            commonMisses: ['Missing tracking', 'Generic delivery claim', 'No signature proof']
        },
        '13.2': {
            name: 'Cancelled Recurring',
            category: 'recurring_transaction',
            defendWith: ['Cancellation policy', 'Customer agreement', 'Billing cycle records'],
            rebuttalFocus: 'Valid recurring billing per agreement'
        },
        '13.3': {
            name: 'Not as Described or Defective',
            category: 'product_unacceptable',
            defendWith: ['Product photos', 'Description accuracy', 'Email communication', 'Replacement proof', 'Satisfaction history'],
            rebuttalFocus: 'Product matches description or reasonable replacement offered',
            commonMisses: ['No customer communication proof', 'Missing product arrival confirmation']
        },
        '13.4': {
            name: 'Counterfeit Merchandise',
            category: 'product_unacceptable',
            defendWith: ['Supplier documentation', 'Authentication certificates', 'Product sources'],
            rebuttalFocus: 'Legitimate product sourcing and authenticity'
        },
        '13.5': {
            name: 'Misrepresentation',
            category: 'product_unacceptable',
            defendWith: ['Accurate product listing', 'Clear terms', 'Customer acknowledgment'],
            rebuttalFocus: 'No misleading information provided'
        },
        '13.6': {
            name: 'Credit Not Processed',
            category: 'consumer_disputes',
            defendWith: ['Refund processing records', 'Credit issue timeline', 'Customer notification'],
            rebuttalFocus: 'Refund was processed or not applicable'
        },
        '13.7': {
            name: 'Cancelled Merchandise/Services',
            category: 'consumer_disputes',
            defendWith: ['Cancellation policy', 'Timeline of events', 'Service delivery proof'],
            rebuttalFocus: 'Service provided or cancellation policy followed'
        },
        '13.8': {
            name: 'Original Credit Transaction Not Accepted',
            category: 'consumer_disputes',
            defendWith: ['Original credit documentation', 'Processing records'],
            rebuttalFocus: 'Credit transaction was valid'
        },
        '13.9': {
            name: 'Non-Receipt of Cash or Load Transaction Value',
            category: 'atm_disputes',
            defendWith: ['ATM transaction logs', 'Dispensing records', 'Camera footage'],
            rebuttalFocus: 'Cash was dispensed correctly'
        }
    },
    MASTERCARD: {
        '4837': {
            name: 'No Cardholder Authorization',
            category: 'fraudulent',
            defendWith: ['Order confirmation', 'Email verification', 'Billing address match', 'IP geolocation', 'Device fingerprint'],
            rebuttalFocus: 'Clear proof of cardholder authorization',
            commonMisses: ['Vague authorization claims', 'Missing email proof']
        },
        '4840': {
            name: 'Fraudulent Processing of Transaction',
            category: 'fraudulent',
            defendWith: ['Transaction logs', 'Processing documentation', 'Authorization records'],
            rebuttalFocus: 'Legitimate transaction processing'
        },
        '4849': {
            name: 'Questionable Merchant Activity',
            category: 'fraudulent',
            defendWith: ['Business legitimacy', 'Processing history', 'Customer satisfaction'],
            rebuttalFocus: 'Legitimate merchant operations'
        },
        '4853': {
            name: 'Cardholder Dispute',
            category: 'consumer_disputes',
            defendWith: ['Transaction details', 'Customer communication', 'Service delivery proof'],
            rebuttalFocus: 'Valid transaction with customer consent'
        },
        '4854': {
            name: 'Cardholder Dispute - Not Elsewhere Classified',
            category: 'consumer_disputes',
            defendWith: ['Comprehensive transaction records', 'Communication logs'],
            rebuttalFocus: 'Transaction was legitimate and properly executed'
        },
        '4855': {
            name: 'Goods or Services Not Provided',
            category: 'product_not_received',
            defendWith: ['Shipping proof', 'Tracking confirmation', 'Service completion certificate', 'Delivery signature'],
            rebuttalFocus: 'Evidence of fulfillment',
            commonMisses: ['Missing delivery proof', 'No service completion documentation']
        },
        '4857': {
            name: 'Card-Activated Telephone Transaction',
            category: 'authorization',
            defendWith: ['Phone authorization', 'Call recording', 'Customer verification'],
            rebuttalFocus: 'Proper telephone authorization'
        },
        '4859': {
            name: 'Services Not Rendered',
            category: 'product_not_received',
            defendWith: ['Service completion proof', 'Timeline documentation', 'Customer acknowledgment'],
            rebuttalFocus: 'Service was rendered as agreed'
        },
        '4860': {
            name: 'Credit Not Processed',
            category: 'consumer_disputes',
            defendWith: ['Refund records', 'Credit processing timeline', 'Customer notification'],
            rebuttalFocus: 'Credit was processed or not due'
        },
        '4862': {
            name: 'Counterfeit Transaction',
            category: 'fraudulent',
            defendWith: ['EMV chip data', 'POS terminal logs', 'Card present evidence'],
            rebuttalFocus: 'Legitimate card-present transaction'
        },
        '4863': {
            name: 'Cardholder Does Not Recognize',
            category: 'fraudulent',
            defendWith: ['Merchant descriptor', 'Transaction details', 'Customer history'],
            rebuttalFocus: 'Clear merchant identification'
        },
        '4870': {
            name: 'Chip Liability Shift',
            category: 'authorization',
            defendWith: ['EMV terminal capability', 'Chip read data', 'Terminal certification'],
            rebuttalFocus: 'Proper EMV processing'
        },
        '4871': {
            name: 'Chip/PIN Liability Shift',
            category: 'authorization',
            defendWith: ['PIN verification', 'Chip data', 'Terminal logs'],
            rebuttalFocus: 'Secure chip and PIN transaction'
        }
    },
    AMEX: {
        'F24': {
            name: 'No Card Member Authorization',
            category: 'fraudulent',
            defendWith: ['Order confirmation', 'Billing address match', 'Email verification', 'Purchase history'],
            rebuttalFocus: 'Cardholder authorization proof',
            commonMisses: ['Weak verification evidence', 'Missing order confirmation']
        },
        'F29': {
            name: 'Card Not Present',
            category: 'fraudulent',
            defendWith: ['CVV match', 'AVS verification', 'IP tracking', '3D Secure'],
            rebuttalFocus: 'Strong card-not-present verification'
        },
        'F30': {
            name: 'EMV Counterfeit',
            category: 'fraudulent',
            defendWith: ['EMV chip data', 'Terminal certification', 'Transaction logs'],
            rebuttalFocus: 'Legitimate EMV transaction'
        },
        'F31': {
            name: 'EMV Lost/Stolen',
            category: 'fraudulent',
            defendWith: ['PIN verification', 'EMV data', 'Cardholder verification'],
            rebuttalFocus: 'Secure cardholder verification'
        },
        'C02': {
            name: 'Credit Not Processed',
            category: 'consumer_disputes',
            defendWith: ['Credit records', 'Refund timeline', 'Customer notification'],
            rebuttalFocus: 'Credit processed or not applicable'
        },
        'C04': {
            name: 'Goods/Services Returned or Refused',
            category: 'consumer_disputes',
            defendWith: ['Return policy', 'No return received', 'Refund policy compliance'],
            rebuttalFocus: 'Return policy followed or no return received'
        },
        'C05': {
            name: 'Goods/Services Cancelled',
            category: 'consumer_disputes',
            defendWith: ['Cancellation policy', 'Service delivery', 'Terms compliance'],
            rebuttalFocus: 'Services provided or policy followed'
        },
        'C08': {
            name: 'Goods/Services Not Received or Partially Received',
            category: 'product_not_received',
            defendWith: ['Proof of shipment', 'Tracking evidence', 'Delivery confirmation', 'Signature'],
            rebuttalFocus: 'Complete delivery evidence',
            commonMisses: ['Incomplete tracking', 'Missing delivery confirmation']
        },
        'C14': {
            name: 'Paid by Other Means',
            category: 'consumer_disputes',
            defendWith: ['Single payment proof', 'Transaction uniqueness', 'No duplicate payments'],
            rebuttalFocus: 'No duplicate payment occurred'
        },
        'C18': {
            name: '"No Show" or CARDeposit Cancelled',
            category: 'consumer_disputes',
            defendWith: ['Cancellation policy', 'Charges disclosure', 'Customer agreement'],
            rebuttalFocus: 'Cancellation policy clearly disclosed'
        },
        'C28': {
            name: 'Cancelled Recurring Billing',
            category: 'recurring_transaction',
            defendWith: ['Cancellation policy', 'Billing agreement', 'Proper cancellation process'],
            rebuttalFocus: 'Recurring billing per customer agreement'
        },
        'C31': {
            name: 'Goods/Services Not as Described',
            category: 'product_unacceptable',
            defendWith: ['Accurate description', 'Product photos', 'Customer communication'],
            rebuttalFocus: 'Product matched description'
        },
        'C32': {
            name: 'Goods/Services Damaged or Defective',
            category: 'product_unacceptable',
            defendWith: ['Quality assurance', 'Replacement offer', 'Return policy'],
            rebuttalFocus: 'Product quality or replacement offered'
        }
    },
    DISCOVER: {
        'AA': {
            name: 'Does Not Recognize',
            category: 'fraudulent',
            defendWith: ['Clear merchant name', 'Transaction details', 'Customer communication'],
            rebuttalFocus: 'Transaction clarity and recognition'
        },
        'AP': {
            name: 'Recurring Payments',
            category: 'recurring_transaction',
            defendWith: ['Subscription agreement', 'Billing disclosure', 'Cancellation policy'],
            rebuttalFocus: 'Valid recurring billing agreement'
        },
        'AT': {
            name: 'Authorization',
            category: 'authorization',
            defendWith: ['Authorization code', 'Approval records'],
            rebuttalFocus: 'Valid authorization obtained'
        },
        'CD': {
            name: 'Credit/Debit Posted Incorrectly',
            category: 'processing_error',
            defendWith: ['Correct posting records', 'Transaction accuracy'],
            rebuttalFocus: 'Accurate transaction posting'
        },
        'CR': {
            name: 'Cancelled Reservation',
            category: 'consumer_disputes',
            defendWith: ['Cancellation policy', 'Charges disclosure'],
            rebuttalFocus: 'Cancellation policy compliance'
        },
        'DA': {
            name: 'Declined Authorization',
            category: 'authorization',
            defendWith: ['Authorization approval', 'Approval code'],
            rebuttalFocus: 'Transaction was authorized'
        },
        'DP': {
            name: 'Duplicate Processing',
            category: 'processing_error',
            defendWith: ['Single transaction proof', 'Unique transaction ID'],
            rebuttalFocus: 'No duplicate processing occurred'
        },
        'IC': {
            name: 'Illegible Sales Data',
            category: 'processing_error',
            defendWith: ['Clear transaction records', 'Readable documentation'],
            rebuttalFocus: 'Clear and legible transaction data'
        },
        'IN': {
            name: 'Invalid Card Number',
            category: 'processing_error',
            defendWith: ['Correct card number', 'Validation records'],
            rebuttalFocus: 'Valid card number used'
        },
        'LP': {
            name: 'Late Presentation',
            category: 'processing_error',
            defendWith: ['Timely presentment', 'Processing timeline'],
            rebuttalFocus: 'Transaction presented on time'
        },
        'N': {
            name: 'Not as Described',
            category: 'product_unacceptable',
            defendWith: ['Accurate description', 'Product matching'],
            rebuttalFocus: 'Product matched description'
        },
        'NA': {
            name: 'No Authorization',
            category: 'authorization',
            defendWith: ['Authorization obtained', 'Approval code'],
            rebuttalFocus: 'Proper authorization'
        },
        'NC': {
            name: 'Not Classified',
            category: 'consumer_disputes',
            defendWith: ['Comprehensive documentation', 'Transaction validity'],
            rebuttalFocus: 'Valid transaction'
        },
        'NF': {
            name: 'Non-Receipt of Cash',
            category: 'atm_disputes',
            defendWith: ['ATM dispensing records', 'Cash distribution logs'],
            rebuttalFocus: 'Cash properly dispensed'
        },
        'RG': {
            name: 'Non-Receipt of Goods',
            category: 'product_not_received',
            defendWith: ['Delivery proof', 'Tracking', 'Signature'],
            rebuttalFocus: 'Goods delivered'
        },
        'RM': {
            name: 'Quality Dispute',
            category: 'product_unacceptable',
            defendWith: ['Quality standards', 'Product specifications'],
            rebuttalFocus: 'Product met quality standards'
        },
        'RN': {
            name: 'Credit Not Received',
            category: 'consumer_disputes',
            defendWith: ['Credit processing', 'Refund records'],
            rebuttalFocus: 'Credit issued or not due'
        }
    }
};

// ===================== PROMPT ENGINEERING SERVICE =====================
const PromptService = {

    // Build comprehensive dispute response prompt
    buildDisputePrompt(disputeState) {
        const reasonCodeData = this.getReasonCodeData(disputeState.reasonCode, disputeState.cardNetwork);
        const evidenceList = this.formatEvidenceList(disputeState.evidenceItems);
        const platformProfiles = {
            stripe: { focus: 'Compelling Evidence', tone: 'technical, concise', notes: 'Reference re-presentment package structure and reason code alignment.' },
            creditcard: { focus: 'Compelling Evidence', tone: 'technical, concise', notes: 'Map to network reason codes; emphasize authorization and delivery proof.' },
            paypal: { focus: 'Policy Compliance', tone: 'procedural, clear', notes: 'Cite PayPal policies, timelines, and seller protection criteria.' },
            amazon: { focus: 'Marketplace Rules & Customer Orientation', tone: 'conciliatory but firm', notes: 'Show compliance with A-to-Z policies and seller performance.' },
            ebay: { focus: 'Marketplace Rules & Customer Orientation', tone: 'conciliatory but firm', notes: 'Cite eBay Money Back Guarantee rules, order and message history.' }
        };
        const platKey = (disputeState.platform || '').toLowerCase();
        const plat = platformProfiles[platKey] || (platKey.match(/stripe|visa|mastercard|amex|discover/) ? platformProfiles.creditcard : { focus: 'Compelling Evidence', tone: 'professional', notes: 'Align with platform submission requirements.' });

        return `You are an expert merchant dispute specialist with 15+ years of experience winning chargebacks across Visa, Mastercard, American Express, and Discover networks. Your win rate is 87% and you've recovered over $50M for merchants.

🎯 DISPUTE DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Reason Code: ${disputeState.reasonCode} - ${reasonCodeData.name}
• Card Network: ${disputeState.cardNetwork.toUpperCase()}
• Transaction Amount: $${disputeState.transactionAmount}
• Transaction Date: ${disputeState.transactionDate}
• Dispute Filed: ${disputeState.disputeFiledDate}
• Platform: ${disputeState.platform.toUpperCase()}
• Dispute Type: ${disputeState.disputeType}

📋 REASON CODE CATEGORY: ${reasonCodeData.category}
🏷️ PLATFORM LOGIC: ${disputeState.platform.toUpperCase()} → ${plat.focus} (${plat.tone})

🔍 AVAILABLE EVIDENCE:
${evidenceList || '(No specific evidence provided - use general best practices)'}

📝 EVIDENCE STRENGTHS:
${this.formatEvidenceStrength(disputeState)}

💬 MERCHANT NARRATIVE:
${disputeState.merchantNarrative || 'Standard transaction - customer received goods/services as described'}

👤 CUSTOMER BACKGROUND:
${disputeState.customerBackground || 'First-time purchase, no prior disputes or issues'}

💰 REFUND STATUS:
${disputeState.refundOffered ? '⚠️ Partial refund offered but dispute still filed' : '✓ No refund offered - defending full amount'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 YOUR STRATEGIC OBJECTIVE:
Generate a winning ${disputeState.platform} dispute response focused on: "${reasonCodeData.rebuttalFocus}"

📊 KEY DEFENSE STRATEGY:
The most effective arguments for ${disputeState.reasonCode} are:
${reasonCodeData.defendWith.map((item, i) => `${i + 1}. ${item}`).join('\n')}

⚠️ COMMON MISTAKES TO AVOID:
${reasonCodeData.commonMisses ? reasonCodeData.commonMisses.map(m => `• ${m}`).join('\n') : '• Being too vague or emotional\n• Not addressing the specific reason code\n• Missing concrete evidence references'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 RESPONSE STRUCTURE (MANDATORY):

**1. ACKNOWLEDGMENT** (2-3 sentences)
   → Professional, respectful tone
   → Reference dispute ID/transaction ID
   → State your position clearly

**2. TRANSACTION SUMMARY** (3-4 sentences)
   → Recap: order, date, amount, product/service
   → Customer's claim/allegation
   → Your position in one clear sentence

**3. EVIDENCE PRESENTATION** (5-7 bullet points)
   → Present STRONGEST evidence first
   → Use specific data: tracking numbers, dates, timestamps
   → Reference attached documentation
   → Build momentum with layered proof

**4. DIRECT REBUTTAL** (4-6 sentences)
   → Counter the SPECIFIC reason code claim
   → Use the customer's own words against them if applicable
   → Demonstrate policy compliance
   → Show good-faith merchant behavior

**5. POLICY/PAYMENT RULE COMPLIANCE** (3-4 sentences)
   → Reference ${disputeState.platform} policies
   → Show terms of service compliance
   → Demonstrate industry best practices
   → Prove you followed all procedures
   → Tailor to ${plat.focus}. Notes: ${plat.notes}

**6. CLOSING STATEMENT** (2-3 sentences)
   → Summarize why reversal is warranted
   → Professional but firm tone
   → Request specific action (reverse dispute)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ CRITICAL CONSTRAINTS:

✓ LENGTH: 400-600 words (payment processor limits)
✓ TONE: Professional, factual, confident - NO emotional language
✓ TERMINOLOGY: Use "cardholder" not "customer" for chargebacks
✓ SPECIFICITY: Reference exact evidence items, dates, tracking numbers
✓ NO PLACEHOLDERS: Write complete, ready-to-submit content (no [INSERT X])
✓ NO ADMISSIONS: Never admit fault or use vague defensive language
✓ ANTICIPATE: Address potential counter-arguments proactively
✓ PLATFORM-SPECIFIC: Format for ${disputeState.platform} submission standards

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 WINNING STRATEGIES FOR THIS REASON CODE:

${this.getWinningStrategies(disputeState.reasonCode, disputeState.cardNetwork)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate the complete, submission-ready dispute response now. Make it persuasive, professional, and designed to WIN.`;
    },

    // Get reason code data with fallback
    getReasonCodeData(reasonCode, cardNetwork) {
        const network = cardNetwork.toUpperCase();
        const map = REASON_CODE_MAP[network] || REASON_CODE_MAP.VISA;
        const data = map[reasonCode] || {
            name: 'General Dispute',
            category: 'consumer_disputes',
            defendWith: ['Transaction documentation', 'Customer communication', 'Proof of delivery/service'],
            rebuttalFocus: 'Demonstrate legitimate transaction and merchant good faith',
            commonMisses: ['Vague evidence', 'Missing specifics', 'Emotional language']
        };
        return data;
    },

    // Format evidence list
    formatEvidenceList(evidenceItems) {
        if (!evidenceItems || evidenceItems.length === 0) {
            return null;
        }

        return evidenceItems.map((item, i) =>
            `${i + 1}. **${item.type}**: ${item.description}${item.confidence ? ` (Strength: ${item.confidence}%)` : ''}`
        ).join('\n');
    },

    // Format evidence strength summary
    formatEvidenceStrength(disputeState) {
        const strengths = [];

        if (disputeState.hasShippingProof) strengths.push('✓ Shipping/Tracking Proof');
        if (disputeState.hasAuthorizationProof) strengths.push('✓ Authorization/Verification');
        if (disputeState.hasCustomerComm) strengths.push('✓ Customer Communication Logs');
        if (disputeState.hasSignature) strengths.push('✓ Delivery Signature');
        if (disputeState.has3DSecure) strengths.push('✓ 3D Secure Authentication');

        if (strengths.length === 0) {
            return '⚠️ No specific evidence flagged - general defense strategy needed';
        }

        return strengths.join('\n');
    },

    // Get winning strategies for specific reason codes
    getWinningStrategies(reasonCode, cardNetwork) {
        const strategies = {
            '10.4': `• Focus heavily on IP address matching billing location
• Emphasize CVV/AVS match (shows cardholder knowledge)
• Reference any prior successful transactions with same card
• Highlight email verification and account history
• Use device fingerprinting data if available`,

            '13.1': `• Lead with tracking number showing delivered status
• Include signature confirmation if available
• Reference GPS delivery location matching billing address
• Show customer did not report non-delivery at time of delivery
• Prove no return was attempted within return window`,

            '13.3': `• Quote exact product listing/description
• Show product photos match listing precisely
• Reference customer's original purchase confirmation
• Prove no complaints during return window
• Show customer used/accepted product (if applicable)`,

            '4837': `• Strong emphasis on order confirmation email
• Prove billing address matched shipping address
• Show IP geolocation consistent with cardholder
• Reference any customer service interactions
• Highlight lack of fraud report at time of transaction`,

            '4855': `• Comprehensive tracking from pickup to delivery
• Include all scan events along delivery route
• Show signature or delivery photo
• Prove customer had opportunity to report non-receipt
• Reference no attempted return or complaint`,

            'F24': `• Detailed order confirmation records
• Show account was created/accessed by cardholder
• Prove billing information matches cardholder
• Include purchase history showing pattern
• Reference American Express SafeKey if used`,

            'C08': `• Complete delivery documentation chain
• Signature confirmation critical
• Show no return was initiated
• Prove customer accepted delivery
• Reference tracking showing "delivered" status`
        };

        return strategies[reasonCode] || `• Present all available evidence clearly
• Address the specific reason code claim directly
• Demonstrate merchant good faith and policy compliance
• Show customer had opportunity to resolve before dispute
• Reference industry-standard practices followed`;
    }
};

// Extend DisputeResponseWriter with prompt methods
DisputeResponseWriter.PromptService = PromptService;

// ===================== AI RESPONSE GENERATION =====================
DisputeResponseWriter.generateResponse = async function () {
    if (!this.state.merchantNarrative && !this.state.evidenceItems.length) {
        showNotification('Please provide dispute details and evidence first', 'warning');
        return;
    }

    if (!this.state.reasonCode) {
        showNotification('Please select a reason code', 'warning');
        return;
    }

    this.state.isGenerating = true;
    showNotification('🛡️ Generating winning dispute response...', 'info');

    try {
        // Build comprehensive prompt
        const prompt = PromptService.buildDisputePrompt(this.state);

        // Determine best model based on dispute complexity
        const model = this.selectBestModel();

        showNotification(`Using ${model} for maximum win probability...`, 'info');

        let fullResponse = '';

        // Call Puter AI with streaming
        const stream = await puter.ai.chat(prompt, {
            model: model,
            stream: true,
            temperature: 0.4, // Balanced: professional but not robotic
            max_tokens: 2000  // Extended for comprehensive responses
        });

        // Stream response
        for await (const chunk of stream) {
            if (chunk?.text) {
                fullResponse += chunk.text;

                // Update UI in real-time if callback is set
                if (this.onStreamUpdate) {
                    this.onStreamUpdate(fullResponse);
                }
            }
        }

        this.state.currentResponse = fullResponse;
        this.state.isGenerating = false;

        // Save to history
        await this.saveToHistory(fullResponse);

        // Insert into document
        await this.insertIntoDocument(fullResponse);

        // Analyze response strength
        const analysis = this.analyzeResponse(fullResponse);

        showNotification(`✅ Response generated! Win probability: ${analysis.winProbability}%`, 'success');

        return fullResponse;

    } catch (error) {
        console.error('Response generation failed:', error);
        this.state.isGenerating = false;
        showNotification('❌ Generation failed: ' + error.message, 'error');
        throw error;
    }
};

// Select best AI model based on dispute characteristics
DisputeResponseWriter.selectBestModel = function () {
    // If user has explicitly selected a model, use that
    if (this.state.selectedModel && this.state.selectedModel !== 'auto') {
        return this.state.selectedModel;
    }

    const amount = parseFloat(this.state.transactionAmount) || 0;
    const evidenceCount = this.state.evidenceItems.length;
    const reasonCode = this.state.reasonCode || '';

    // Fraud disputes: use Claude Opus 4 (most capable for legal precision)
    if (reasonCode.match(/10\.[45]/) || reasonCode === '4837' || reasonCode === 'F24') {
        console.log('🎯 High-risk fraud dispute - using Claude Opus 4');
        return 'claude-opus-4';
    }

    // High-stakes disputes (>$1000): use Claude Opus 4
    if (amount > 1000) {
        console.log('💰 High-value dispute ($' + amount + ') - using Claude Opus 4');
        return 'claude-opus-4';
    }

    // Complex disputes with lots of evidence: use Gemini 3.0 Pro for advanced reasoning
    if (evidenceCount >= 5 || (this.state.merchantNarrative && this.state.merchantNarrative.length > 500)) {
        console.log('🧠 Complex dispute with ' + evidenceCount + ' evidence items - using Gemini 3.0 Pro');
        return 'gemini-3-pro-preview';
    }

    // Standard disputes: use Claude Sonnet 4.5 (best balance of quality and speed)
    console.log('📝 Standard dispute - using Claude Sonnet 4.5');
    return 'claude-sonnet-4';
};

// Analyze response quality and win probability
DisputeResponseWriter.analyzeResponse = function (response) {
    let score = 0;
    let factors = [];

    // Length check
    const wordCount = response.split(/\s+/).length;
    if (wordCount >= 400 && wordCount <= 600) {
        score += 15;
        factors.push('✓ Optimal length');
    } else if (wordCount >= 300) {
        score += 10;
        factors.push('⚠️ Length could be optimized');
    }

    // Evidence references
    if (/tracking|delivery|signature|proof/i.test(response)) {
        score += 20;
        factors.push('✓ Strong evidence references');
    }

    // Specific data
    if (/\d{10,}|[A-Z0-9]{10,}/.test(response)) {
        score += 15;
        factors.push('✓ Specific tracking/order numbers');
    }

    // Professional terminology
    if (/cardholder|dispute|transaction|authorization/i.test(response)) {
        score += 10;
        factors.push('✓ Professional terminology');
    }

    // Policy compliance
    if (/policy|terms|agreement|procedure/i.test(response)) {
        score += 15;
        factors.push('✓ Policy compliance mentioned');
    }

    // Clear structure
    const sections = (response.match(/\*\*\d\./g) || []).length;
    if (sections >= 4) {
        score += 10;
        factors.push('✓ Well-structured response');
    }

    // Evidence strength bonus
    if (this.state.hasShippingProof) score += 5;
    if (this.state.hasSignature) score += 5;
    if (this.state.has3DSecure) score += 5;

    const winProbability = Math.min(score, 100);

    return {
        score,
        winProbability,
        factors,
        recommendation: winProbability >= 80 ? 'Excellent' :
            winProbability >= 60 ? 'Good' :
                winProbability >= 40 ? 'Fair' : 'Needs Improvement'
    };
};

// Save response to history
DisputeResponseWriter.saveToHistory = async function (response) {
    const entry = {
        id: Date.now(),
        disputeType: this.state.disputeType,
        platform: this.state.platform,
        reasonCode: this.state.reasonCode,
        cardNetwork: this.state.cardNetwork,
        amount: this.state.transactionAmount,
        response: response,
        evidence: this.state.evidenceItems,
        outcome: 'pending',
        createdAt: new Date().toISOString(),
        wordCount: response.split(/\s+/).length
    };

    this.state.history.unshift(entry);

    // Update stats
    this.state.stats.totalDisputes++;
    this.state.stats.pending++;

    await this.saveUserData();
};

// Insert response into document editor
DisputeResponseWriter.insertIntoDocument = async function (response) {
    if (!window.editorjs) {
        console.warn('Editor.js not available');
        return;
    }

    try {
        // Wrap in document content block
        const wrapped = `:::DOCUMENT_CONTENT\n# Dispute Response - ${this.state.reasonCode}\n\n${response}\n:::`;

        // Use existing processDocumentContent if available
        if (window.processDocumentContent) {
            const handled = await processDocumentContent(wrapped);
            if (handled) {
                console.log('✅ Dispute response inserted into document');
                return;
            }
        }

        // Fallback: insert as paragraphs
        const sections = response.split(/\n\n+/);
        for (const section of sections) {
            if (section.trim()) {
                await window.editorjs.blocks.insert('paragraph', {
                    text: section.trim()
                });
            }
        }

        console.log('✅ Dispute response inserted into document');
    } catch (error) {
        console.error('Failed to insert into document:', error);
    }
};

// ===================== TEMPLATE MANAGEMENT =====================
DisputeResponseWriter.saveTemplate = async function (name, description) {
    if (!this.state.currentResponse) {
        showNotification('No response to save as template', 'warning');
        return;
    }

    const template = {
        id: Date.now(),
        name: name || `${this.state.reasonCode} Template`,
        description: description || '',
        reasonCode: this.state.reasonCode,
        cardNetwork: this.state.cardNetwork,
        disputeType: this.state.disputeType,
        platform: this.state.platform,
        pattern: this.state.currentResponse,
        evidence: this.state.evidenceItems,
        winRate: 0,
        useCount: 0,
        createdAt: new Date().toISOString()
    };

    this.state.templates.unshift(template);
    await this.saveUserData();

    showNotification(`✅ Template saved: ${name}`, 'success');
};

DisputeResponseWriter.loadTemplate = async function (templateId) {
    const template = this.state.templates.find(t => t.id === templateId);
    if (!template) {
        showNotification('Template not found', 'error');
        return;
    }

    this.state.reasonCode = template.reasonCode;
    this.state.cardNetwork = template.cardNetwork;
    this.state.disputeType = template.disputeType;
    this.state.platform = template.platform;
    this.state.evidenceItems = template.evidence || [];
    this.state.currentResponse = template.pattern;

    template.useCount++;
    await this.saveUserData();

    showNotification(`✅ Template loaded: ${template.name}`, 'success');
};

// Export for global access
window.DisputeResponseWriter = DisputeResponseWriter;
window.REASON_CODE_MAP = REASON_CODE_MAP;
window.PromptService = PromptService;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        DisputeResponseWriter.init();
    });
} else {
    DisputeResponseWriter.init();
}
