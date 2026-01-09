/**
 * Plara - AI Assistant Application
 * Main JavaScript file for handling UI interactions and Puter.js AI integration
 */

// State
let currentTask = '';
let isSidebarOpen = false;
let chatHistory = [];
let attachments = [];
let isRecording = false;
let mediaRecorder = null;
let audioChunks = [];
let zoomLevel = 1.0;
// Minimal conversation attachments buffer
let minimalAttachments = [];
let isChatOpen = false;
// Attachments dedicated for Notion-style chat
let chatAttachments = [];
let selectedChatModel = 'gemini-3-pro-preview'; // Default to Gemini 3.0 Pro as requested
let popupChatHistory = [];
let currentConversationId = 'conv_' + Date.now();

const SYSTEM_PROMPT = `You are Plara, an AI assistant. You have access to the document editor on the page.
If the user asks you to write, draft, or edit the document (e.g. "write an essay", "add a title"), you MUST output the content intended for the document inside a special block like this:

:::DOCUMENT_CONTENT
# Optional Title
Your content here...
:::

The content inside the block should be formatted in Markdown.
- Use # for headers
- Use - or * for bullet points
- Use standard text for paragraphs

Anything OUTSIDE this block will be shown as a normal chat message.
Use the document block ONLY when specifically asked to generate content for the document.`;

/**
 * Tiny DOM helper
 */
function addListener(id, event, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(event, handler);
}

/**
 * Initialize the application
 */
function init() {
  try {
    setupEventListeners();
    console.log('Plara initialized successfully');

    // Check if Puter.js is loaded
    if (typeof puter === 'undefined') {
      console.warn('Puter.js not loaded. AI features will be disabled.');
      showNotification('Connecting to AI services...', 'info');
    } else {
      // Initialize Auth UI
      updateAuthUI();

      // Initialize Document Pagination
      if (window.initDocumentPagination) {
        window.initDocumentPagination({ maxBlocksPerPage: 45, autoCreatePages: true });
        console.log('📄 Pagination initialized from app.js');
      }

      // Monkey patch legacy Editor.js calls to use Pagination System
      // This ensures all AI tools (ScamBaiter, AppealGuard, etc) automatically support pagination
      if (!window.editorjs) window.editorjs = {};
      if (!window.editorjs.blocks) window.editorjs.blocks = {};

      const originalInsert = window.editorjs.blocks.insert;

      window.editorjs.blocks.insert = async (type, data, config) => {
        if (window.docPagination) {
          // Route to pagination system
          // We wrap single block in array
          return await window.docPagination.insertBlocks([{ type, data }]);
        } else if (originalInsert) {
          return originalInsert.call(window.editorjs.blocks, type, data, config);
        }
      };
    }
  } catch (error) {
    console.error('Initialization error:', error);
    showNotification('Some features may be unavailable. Check console for details.', 'error');
  }
}

/**
 * Setup all event listeners with safety checks
 */
function setupEventListeners() {
  addListener('chatOpenBtn', 'click', () => {
    const container = document.getElementById('notionChatContainer');
    if (!container) return;
    // Toggle visibility for floating chat
    if (container.style.display === 'none' || getComputedStyle(container).display === 'none') {
      container.style.display = '';
      openNotionChat();
    } else {
      closeNotionChat();
      container.style.display = 'none';
    }
  });
  addListener('chatCloseBtn', 'click', closeNotionChat);
  addListener('chatCloseBtn', 'click', closeNotionChat);
  addListener('chatSendBtn', 'click', handleChatSubmit);
  addListener('chatGenImageBtn', 'click', async () => {
    // Basic auth check for image generation
    if (!puter.auth.isSignedIn()) {
      showNotification('Please sign in to generate images.', 'error');
      return;
    }
    const user = await puter.auth.getUser();
    const hasSub = await checkSubscriptionStatus(user.email);
    if (!hasSub) {
      showNotification('Active subscription required for image generation.', 'warning');
      return;
    }
    handleGenerateImageFromChat();
  });

  // Model Selector
  addListener('modelSelector', 'click', toggleModelDropdown);
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('modelDropdown');
    const selector = document.getElementById('modelSelector');
    if (!dropdown || !selector) return;
    const within = dropdown.contains(e.target) || selector.contains(e.target);
    if (!within) dropdown.style.display = 'none';
  });

  Array.from(document.querySelectorAll('.dropdown-item-dark')).forEach(item => {
    item.addEventListener('click', (e) => {
      const model = e.currentTarget.getAttribute('data-model');
      if (model) setSelectedModel(model);
      const dropdown = document.getElementById('modelDropdown');
      if (dropdown) dropdown.style.display = 'none';
    });
  });
  addListener('chatGenImageBtn', 'click', handleGenerateImageFromChat);
  addListener('modelSelector', 'click', toggleModelDropdown);
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('modelDropdown');
    const selector = document.getElementById('modelSelector');
    if (!dropdown || !selector) return;
    const within = dropdown.contains(e.target) || selector.contains(e.target);
    if (!within) dropdown.style.display = 'none';
  });
  Array.from(document.querySelectorAll('.dropdown-item-dark')).forEach(item => {
    item.addEventListener('click', (e) => {
      const model = e.currentTarget.getAttribute('data-model');
      setSelectedModel(model);
      const dropdown = document.getElementById('modelDropdown');
      if (dropdown) dropdown.style.display = 'none';
    });
  });
  const ci = document.getElementById('chatInput');
  if (ci) {
    ci.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleChatSubmit();
      }
    });
    ci.addEventListener('input', () => {
      ci.style.height = 'auto';
      ci.style.height = (ci.scrollHeight) + 'px';
    });
  }
  addListener('chatAttachBtn', 'click', () => {
    // Hint: You can run /ocr after attaching image(s) to extract text with Mistral OCR (PDFs supported)
    showNotification("Tip: After attaching images/PDFs, type '/ocr' to extract text with Mistral OCR.", 'info');
    const fi = document.getElementById('hiddenFileInput');
    if (fi) fi.click();
  });
  (function setupChatFileInput() {
    const fi = document.getElementById('hiddenFileInput');
    if (!fi) return;
    fi.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          chatAttachments.push({ file, preview: ev.target.result, type: file.type.startsWith('image/') ? 'image' : 'file' });
          renderChatAttachmentBar();
        };
        reader.readAsDataURL(file);
      });
      fi.value = '';
    });
  })();
  addListener('sidebarToggle', 'click', toggleSidebar);
  addListener('sidebarOverlay', 'click', closeSidebar);

  // Zoom controls (bottom toolbar)
  addListener('zoomInBtn', 'click', () => updateZoom(0.1));
  addListener('zoomOutBtn', 'click', () => updateZoom(-0.1));
  addListener('zoomResetBtn', 'click', () => updateZoom(0));
  addListener('zoomFitBtn', 'click', () => fitToScreen());

  // Top zoom controls (above document)
  addListener('topZoomInBtn', 'click', () => updateZoom(0.1));
  addListener('topZoomOutBtn', 'click', () => updateZoom(-0.1));
  addListener('topZoomResetBtn', 'click', () => updateZoom(0));
  addListener('topZoomFitBtn', 'click', () => fitToScreen());

  addListener('ejRedoBtn', 'click', handleRedo);

  // Export Buttons
  addListener('exportPdfBtn', 'click', () => {
    if (window.exportManager) window.exportManager.exportToPdf();
  });
  addListener('exportDocxBtn', 'click', () => {
    if (window.exportManager) window.exportManager.exportToDocx();
  });

  // Auth Button
  addListener('signinBtn', 'click', async () => {
    if (puter.auth.isSignedIn()) {
      await handleSignOut();
    } else {
      await handleSignIn();
    }
  });
}

/**
 * Update the UI based on authentication state
 */
async function updateAuthUI() {
  const statusEl = document.querySelector('.auth-status');
  const signinBtn = document.getElementById('signinBtn');

  if (!statusEl || !signinBtn) return;

  if (puter.auth.isSignedIn()) {
    try {
      const user = await puter.auth.getUser();
      statusEl.textContent = `Signed in as ${user.username || user.name || 'User'}`;
      signinBtn.textContent = 'Sign out';
      signinBtn.classList.add('signed-in');
    } catch (err) {
      console.error('Failed to get user info:', err);
      statusEl.textContent = 'Signed in';
      signinBtn.textContent = 'Sign out';
    }
  } else {
    statusEl.textContent = 'Not signed in';
    signinBtn.textContent = 'Sign in';
    signinBtn.classList.remove('signed-in');
  }
}

/**
 * Handle user sign in
 */
async function handleSignIn() {
  try {
    showNotification('Signing in...', 'info');
    const res = await puter.auth.signIn();
    console.log('Signed in successfully:', res);
    await updateAuthUI();
    showNotification('Success! You are now signed in.', 'success');
  } catch (err) {
    console.error('Sign in failed:', err);
    showNotification('Sign in failed. Please try again.', 'error');
  }
}

/**
 * Handle user sign out
 */
async function handleSignOut() {
  try {
    puter.auth.signOut();
    await updateAuthUI();
    showNotification('You have been signed out.', 'info');
  } catch (err) {
    console.error('Sign out failed:', err);
    showNotification('Sign out failed.', 'error');
  }
}

/**
 * Check if the user has an active subscription via the backend
 */
async function checkSubscriptionStatus(email) {
  try {
    // Determine backend URL (default to 8000 if not specified)
    const backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:8000'
      : ''; // In production it might be on the same origin or a specific subdomain

    const response = await fetch(`${backendUrl}/api/subscriptions/${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error('Failed to verify subscription');

    const data = await response.json();
    return data.has_active_subscription === true;
  } catch (error) {
    console.error('Subscription check error:', error);
    // Be conservative: if check fails, assume no subscription
    return false;
  }
}

function updateZoom(delta) {
  if (delta === 0) {
    zoomLevel = 1.0;
  } else {
    zoomLevel = Math.round((zoomLevel + delta) * 10) / 10;
    zoomLevel = Math.max(0.5, Math.min(2.5, zoomLevel));
  }

  const page = document.getElementById('a4Page');
  const display = document.getElementById('zoomLevelDisplay');
  const topDisplay = document.getElementById('topZoomDisplay');

  if (page) {
    page.style.transform = `scale(${zoomLevel})`;
  }
  if (display) {
    display.textContent = `${Math.round(zoomLevel * 100)}%`;
  }
  if (topDisplay) {
    topDisplay.textContent = `${Math.round(zoomLevel * 100)}%`;
  }
}

function openNotionChat() {
  const container = document.getElementById('notionChatContainer');
  if (container) {
    container.classList.add('active');
    isChatOpen = true;
    document.getElementById('chatInput')?.focus();
    renderChatAttachmentBar();
    positionModelDropdown();
  }
}

function closeNotionChat() {
  const container = document.getElementById('notionChatContainer');
  if (container) {
    container.classList.remove('active');
    isChatOpen = false;
  }
}

function handleChatSubmit() {
  return handleChatSubmitAsync();
}

async function handleChatSubmitAsync() {
  // --- AUTH & SUBSCRIPTION CHECK ---
  if (!puter.auth.isSignedIn()) {
    showNotification('Please sign in to use AI features.', 'error');
    const signinBtn = document.getElementById('signinBtn');
    if (signinBtn) {
      signinBtn.style.boxShadow = '0 0 15px var(--color-accent)';
      setTimeout(() => signinBtn.style.boxShadow = '', 2000);
    }
    return;
  }

  try {
    const user = await puter.auth.getUser();
    const hasSub = await checkSubscriptionStatus(user.email);

    if (!hasSub) {
      showNotification('Active subscription required to use AI features.', 'warning');
      // Redirect to pricing or show modal
      setTimeout(() => {
        if (confirm('View pricing plans to unlock AI features?')) {
          window.location.href = 'pricing.html';
        }
      }, 1000);
      return;
    }
  } catch (err) {
    console.error('Auth check failed:', err);
    showNotification('Authentication error. Please try again.', 'error');
    return;
  }
  // ---------------------------------

  // Intercept compliance slash-commands before normal chat handling
  try {
    const inputEl = document.getElementById('chatInput');
    const raw = (inputEl?.value || '').trim();
    if (!raw) return;

    // LegalForge AI commands
    if (/^\s*\/legal\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      await handleLegalCommand(raw);
      return;
    }

    // /permit (Construction Permit & Compliance)
    if (/^\s*\/permit\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      await handlePermitCommand(raw);
      return;
    }

    // /ocr (also supports PDFs via rasterization)
    if (/^\s*\/ocr(\s+all|\s*)$/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      await runOcrOnChatAttachmentsIncludingPDFs();
      return;
    }

    // /regulatory - AI Regulatory Response Writer
    if (/^\s*\/regulatory\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      if (window.regulatoryCommandHandler) {
        await window.regulatoryCommandHandler(raw);
      } else {
        showNotification('Regulatory Response Writer not loaded', 'error');
      }
      return;
    }

    // /translate - AI Translation System (Regulatory Response Writer)
    if (raw.trim().startsWith('/translate')) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      if (window.translateCommandHandler) {
        await window.translateCommandHandler(raw);
      } else {
        showNotification('Translation system not loaded', 'error');
      }
      return;
    }

    // /dispute - DisputeShield AI Chargeback & Dispute Response Writer
    if (/^\s*\/dispute\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      if (window.disputeCommandHandler) {
        await window.disputeCommandHandler(raw);
      } else {
        showNotification('DisputeShield AI not loaded', 'error');
      }
      return;
    }

    // /prior-auth - PriorAuthGuard AI (Pre-service PA denial + P2P)
    if (/^\s*\/prior-auth\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      if (window.priorAuthCommandHandler) {
        await window.priorAuthCommandHandler(raw);
      } else {
        showNotification('PriorAuthGuard AI not loaded', 'error');
      }
      return;
    }

    // /appeal - AppealGuard AI Academic Appeal Response Writer
    if (/^\s*\/appeal\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      if (window.appealCommandHandler) {
        await window.appealCommandHandler(raw);
      } else {
        showNotification('AppealGuard not loaded', 'error');
      }
      return;
    }

    // /pushback - PushbackPro AI Vendor & Contract Response Writer
    if (/^\s*\/pushback\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';

      // Initialize PushbackPro state if not already done
      if (!window.pushbackState) {
        window.pushbackState = {
          responseType: 'price-increase',
          negotiationTone: 'firm',
          selectedModel: 'claude-sonnet-4.5',
          leveragePoints: [],
          formData: {},
          currentDraft: '',
          history: []
        };
      }

      if (window.pushbackCommandHandler) {
        await window.pushbackCommandHandler(raw);
      } else {
        showNotification('⚠️ PushbackPro not loaded. Please refresh the page.', 'error');
        console.error('PushbackPro modules not loaded. Check pushback-response-writer.js, pushback-ai-engine.js, and pushback-display.js');
      }
      return;
    }

    // /churnguard - ChurnGuard Customer Success Churn Prevention Engine
    if (/^\s*\/churnguard\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';

      // Initialize ChurnGuard state if not already done
      if (!window.churnGuardState) {
        window.churnGuardState = {
          selectedModel: 'claude-sonnet-4.5',
          responseType: 'retention',
          customerData: {},
          sentimentAnalysis: null,
          churnRisk: null,
          currentResponse: null,
          history: []
        };
      }

      if (window.churnGuardCommandHandler) {
        await window.churnGuardCommandHandler(raw);
      } else {
        showNotification('⚠️ ChurnGuard not loaded. Please refresh the page.', 'error');
        console.error('ChurnGuard modules not loaded. Check churnguard-response-writer.js, churnguard-ai-engine.js, and churnguard-display.js');
      }
      return;
    }

    // /saferesponse - SafeResponse AI De-escalation Response Generator
    if (/^\s*\/saferesponse\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';

      // Initialize SafeResponse state if not already done
      if (!window.safeResponseState) {
        window.safeResponseState = {
          selectedModel: 'claude-sonnet-4.5',
          responseStyle: 'professional',
          platform: 'general',
          currentMessage: '',
          analysis: null,
          generatedResponse: null,
          history: []
        };
      }

      if (window.safeResponseCommandHandler) {
        await window.safeResponseCommandHandler(raw);
      } else {
        showNotification('⚠️ SafeResponse not loaded. Please refresh the page.', 'error');
        console.error('SafeResponse modules not loaded. Check saferesponse-writer.js, saferesponse-ai-engine.js, and saferesponse-display.js');
      }
      return;
    }

    // /scambait - ScamBaiter Pro AI Response Generator
    if (/^\s*\/scambait\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';

      // Initialize ScamBaiter state if not already done
      if (!window.scamBaiterState) {
        window.scamBaiterState = {
          currentTone: 'elderly',
          selectedModel: 'gemini-2.0-flash-exp',
          settings: {
            absurdity: 50,
            length: 50,
            fakeDetails: true,
            questions: true,
            delayTactics: false,
            multipart: false,
            typos: false
          },
          currentScam: '',
          currentResponse: '',
          history: []
        };
      }

      if (window.scamBaiterCommandHandler) {
        await window.scamBaiterCommandHandler(raw);
      } else {
        showNotification('⚠️ ScamBaiter Pro not loaded. Please refresh the page.', 'error');
        console.error('ScamBaiter modules not loaded. Check scambaiter-response-writer.js, scambaiter-ai-engine.js, and scambaiter-display.js');
      }
      return;
    }

    // /civilreply - CivilReply AI Political Discourse Generator
    if (/^\s*\/civilreply\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';

      // Initialize CivilReply state if not already done
      if (!window.civilReplyState) {
        window.civilReplyState = {
          stance: 'neutral',
          tone: 'diplomatic',
          platform: 'general',
          selectedModel: 'auto',
          currentComment: '',
          currentResponse: null,
          history: []
        };
      }

      if (window.civilReplyCommandHandler) {
        await window.civilReplyCommandHandler(raw);
      } else {
        showNotification('⚠️ CivilReply not loaded. Please refresh the page.', 'error');
        console.error('CivilReply modules not loaded. Check civilreply-response-writer.js, civilreply-ai-engine.js, and civilreply-display.js');
      }
      return;
    }

    // Compliance Writer commands
    const mDaily = raw.match(/^\s*\/(dailylog)\b/i);
    const mSafety = raw.match(/^\s*\/(safetynarrative)\b/i);
    const mIncident = raw.match(/^\s*\/(incident)\b/i);
    const mPermit = raw.match(/^\s*\/(permit)\b/i);
    const mInspection = raw.match(/^\s*\/(inspection)\b/i);
    const mCap = raw.match(/^\s*\/(cap)\b/i);
    const mSector = raw.match(/^\s*\/sector\s+(construction|telecom|utilities)\b/i);
    const mJur = raw.match(/^\s*\/jurisdiction\s+([\w\-]+)\b/i);
    const mTone = raw.match(/^\s*\/tone\s+(formal|professional|concise|assertive|cooperative)\b/i);

    // /insurance - AI Insurance Claim Response Writer
    if (/^\s*\/insurance\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      if (window.insuranceCommandHandler) {
        await window.insuranceCommandHandler(raw);
      } else {
        showNotification('Insurance Response Writer not loaded', 'error');
      }
      return;
    }

    // /pushback - AI Vendor & Contract Pushback Response Writer
    if (/^\s*\/pushback\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      if (window.pushbackCommandHandler) {
        await window.pushbackCommandHandler(raw);
      } else {
        showNotification('Pushback Response Writer not loaded', 'error');
      }
      return;
    }

    // /health - HealthGuard Patient Portal Response Assistant
    if (/^\s*\/health\b/i.test(raw) || /^\s*\/patient\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      if (window.healthCommandHandler) {
        await window.healthCommandHandler(raw);
      } else {
        showNotification('HealthGuard Assistant not loaded', 'error');
      }
      return;
    }

    // /rfp - GovProposal AI Response Writer
    if (/^\s*\/rfp\b/i.test(raw) || /^\s*\/proposal\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      if (window.rfpCommandHandler) {
        await window.rfpCommandHandler(raw);
      } else {
        showNotification('GovProposal AI not loaded', 'error');
      }
      return;
    }

    // /churn - ChurnGuard AI Prevention Engine
    if (/^\s*\/churn\b/i.test(raw) || /^\s*\/retention\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      if (window.churnCommandHandler) {
        await window.churnCommandHandler(raw);
      } else {
        showNotification('ChurnGuard AI not loaded', 'error');
      }
      return;
    }

    // /discovery - LegalMind AI Legal Discovery Generator
    if (/^\s*\/discovery\b/i.test(raw) || /^\s*\/legal\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      if (window.discoveryCommandHandler) {
        await window.discoveryCommandHandler(raw);
      } else {
        showNotification('LegalMind AI not loaded', 'error');
      }
      return;
    }

    // /exec - Executive Ghostwriter
    if (/^\s*\/exec\b/i.test(raw) || /^\s*\/ghostwriter\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      if (window.execCommandHandler) {
        await window.execCommandHandler(raw);
      } else {
        showNotification('ExecWriter AI not loaded', 'error');
      }
      return;
    }

    // /safety - SafeSpace AI
    if (/^\s*\/safety\b/i.test(raw) || /^\s*\/deescalate\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      if (window.safetyCommandHandler) {
        await window.safetyCommandHandler(raw);
      } else {
        showNotification('SafeSpace AI not loaded', 'error');
      }
      return;
    }

    // /scam - ScamBaiter AI
    if (/^\s*\/scam\b/i.test(raw) || /^\s*\/bait\b/i.test(raw)) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
      if (window.scamCommandHandler) {
        await window.scamCommandHandler(raw);
      } else {
        showNotification('ScamBaiter AI not loaded', 'error');
      }
      return;
    }

    if (mSector) {
      inputEl.value = '';
      await setCompliancePref('sector', mSector[1].toLowerCase());
      showNotification(`Sector set to ${mSector[1]}`, 'success');
      return;
    }
    if (mJur) {
      inputEl.value = '';
      await setCompliancePref('jurisdiction', mJur[1].toLowerCase());
      showNotification(`Jurisdiction set to ${mJur[1]}`, 'success');
      return;
    }
    if (mTone) {
      inputEl.value = '';
      await setCompliancePref('tone', mTone[1].toLowerCase());
      showNotification(`Tone set to ${mTone[1]}`, 'success');
      return;
    }
    if (mCap) {
      inputEl.value = '';
      await insertCAPTemplateBlock();
      return;
    }
    if (mDaily || mSafety || mIncident || mPermit || mInspection) {
      inputEl.value = '';
      const type = mDaily ? 'daily-log' : mSafety ? 'safety-narrative' : mIncident ? 'incident-report' : mPermit ? 'permit-justification' : 'inspection-explanation';
      await generateComplianceDocument(type);
      return;
    }
  } catch (_) { }

  const input = document.getElementById('chatInput');
  if (!input) return;

  const task = input.value.trim();
  if (!task) return;

  // Slash command for image generation
  const imgMatch = task.match(/^\s*(?:\/img\s+|img:\s*)([\s\S]+)/i);
  if (imgMatch && imgMatch[1]) {
    const imgPrompt = imgMatch[1].trim();
    generateImage(imgPrompt);
    input.value = '';
    input.style.height = 'auto';
    return;
  }

  // Snapshot and clear input
  input.value = '';
  input.style.height = 'auto';

  // Directly work with the document editor: add a small marker for the user task
  // (Hidden - user text not shown in document)
  // if (window.editorjs) {
  //     try {
  //         await window.editorjs.blocks.insert('paragraph', { text: `<em>User:</em> ${task}` });
  //     } catch {}
  // }

  // Show a small toast while thinking
  showNotification('Thinking...', 'info');

  try {
    let userMsg = { role: 'user', content: task };

    // ✨ ENHANCED: Use PuterFS for attachment handling
    if (chatAttachments.length > 0) {
      const uploaded = [];
      for (const att of chatAttachments) {
        try {
          // Use PuterFS manager for organized storage
          let puterFile;
          if (window.puterFS && window.puterFS.isInitialized) {
            puterFile = await window.puterFS.saveChatAttachment(att.file);
          } else {
            // Fallback to direct Puter.js
            puterFile = await puter.fs.write(`chat_${Date.now()}_${att.file.name}`, att.file);
          }
          uploaded.push({ type: 'file', puter_path: puterFile.path });
        } catch (e) {
          console.warn('Upload failed for', att.file?.name, e);
        }
      }
      const content = [{ type: 'text', text: task }, ...uploaded];
      userMsg = { role: 'user', content };
    }

    popupChatHistory.push(userMsg);

    // Ensure system prompt is present for context (prepended virtually if not supported by API, 
    // but for array-based chat, we usually prepend it or set it as system role if supported.
    // Puter.js chat usually takes simple array. We'll prepend a system message if history is short/empty or just always ensure it's there?
    // Actually, let's just prepend it to the history array passed to the API if it's not there.
    // Note: Puter.js might not strictly support 'system' role in all models, but usually it does or treats it as context.
    let messagesToSend = [...popupChatHistory];
    if (messagesToSend.length > 0 && messagesToSend[0].role !== 'system') {
      messagesToSend.unshift({ role: 'system', content: SYSTEM_PROMPT });
    }

    const selectedModel = document.getElementById('chatModelSelect')?.value || selectedChatModel || 'gemini-3-pro-preview';
    const response = await puter.ai.chat(messagesToSend, { stream: true, model: selectedModel });
    let fullText = '';
    for await (const part of response) {
      const text = part?.text || '';
      fullText += text;
    }

    popupChatHistory.push({ role: 'assistant', content: fullText });

    // ✨ ENHANCED: Save chat history to KV store
    if (window.puterKV && window.puterKV.isInitialized) {
      try {
        await window.puterKV.saveChatHistory(currentConversationId, popupChatHistory);
      } catch (kvError) {
        console.warn('Failed to save chat history to KV:', kvError);
      }
    }

    // Prefer DOCUMENT_CONTENT block if present; otherwise insert the plain response as paragraphs
    const handled = await processDocumentContent(fullText);
    if (!handled && fullText) {
      if (window.docPagination) {
        await window.docPagination.insertContent(fullText);
      } else if (window.editorjs) {
        const paragraphs = fullText.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
        for (const p of paragraphs) {
          await window.editorjs.blocks.insert('paragraph', { text: p });
        }
      }
    }

    chatAttachments = [];
    renderChatAttachmentBar();
  } catch (error) {
    console.error('Chat Error:', error);
    appendNotionMessage({ role: 'assistant', content: 'Error: ' + (error.message || error.toString()) });
  }
}

/**
 * Process AI response for document content blocks and update Editor.js
 */
async function processDocumentContent(text) {
  if (!text || !window.editorjs) return false;

  // Regex to find content between :::DOCUMENT_CONTENT and :::
  // Using [\s\S]*? to match across newlines non-greedily
  const match = text.match(/:::DOCUMENT_CONTENT\s*([\s\S]*?)\s*:::/);

  if (!(match && match[1])) return false;

  const content = match[1].trim();
  if (!content) return false;

  showNotification('Updating document...', 'info');

  // Simple Markdown to Editor.js Blocks Parser
  const lines = content.split('\n');
  const blocks = [];
  let currentParagraph = '';

  const flushParagraph = () => {
    if (currentParagraph) {
      blocks.push({ type: 'paragraph', data: { text: currentParagraph.trim() } });
      currentParagraph = '';
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Empty line indicates paragraph break
    if (!line) {
      flushParagraph();
      continue;
    }

    // Check for headers or list items
    if (line.startsWith('#') || line.startsWith('- ') || line.startsWith('* ')) {
      flushParagraph();

      if (line.startsWith('# ')) {
        blocks.push({ type: 'header', data: { text: line.substring(2), level: 1 } });
      } else if (line.startsWith('## ')) {
        blocks.push({ type: 'header', data: { text: line.substring(3), level: 2 } });
      } else if (line.startsWith('### ')) {
        blocks.push({ type: 'header', data: { text: line.substring(4), level: 3 } });
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Collect consecutive list items
        const items = [line.substring(2)];
        // Look ahead for more list items
        while (i + 1 < lines.length && (lines[i + 1].trim().startsWith('- ') || lines[i + 1].trim().startsWith('* '))) {
          i++;
          items.push(lines[i].trim().substring(2));
        }
        blocks.push({ type: 'list', data: { style: 'unordered', items: items } });
      }
    } else {
      // Accumulate paragraph text
      if (currentParagraph) {
        currentParagraph += ' ' + line;
      } else {
        currentParagraph = line;
      }
    }
  }
  flushParagraph();

  // Insert blocks into Editor.js
  try {
    if (window.docPagination) {
      await window.docPagination.insertBlocks(blocks);
    } else {
      for (const block of blocks) {
        await window.editorjs.blocks.insert(block.type, block.data);
      }
    }
    showNotification('Document updated successfully', 'success');
    return true;
  } catch (e) {
    console.error('Editor update failed:', e);
    showNotification('Failed to update document', 'error');
    return false;
  }
}

function appendNotionMessage(msg, isLoading = false) {
  const container = document.getElementById('notionChatMessages');
  if (!container) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${msg.role}-message`;

  let innerHTML = '';
  if (msg.role === 'assistant') {
    innerHTML += `
        <div class="message-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.4 7.2L19.6 9.6L14.4 12L12 17.2L9.6 12L4.4 9.6L9.6 7.2L12 2Z" />
            </svg>
        </div>`;
  }

  innerHTML += `<div class="message-content">${isLoading ? '<span class="typing-indicator"></span>' : formatMessageText(msg.content)}</div>`;
  msgDiv.innerHTML = innerHTML;
  container.appendChild(msgDiv);

  // Hide welcome/suggestions on first message
  const welcome = document.querySelector('.notion-welcome');
  const suggestions = document.querySelector('.notion-suggestions');
  if (welcome) welcome.style.display = 'none';
  if (suggestions) suggestions.style.display = 'none';

  scrollToNotionBottom();
  return msgDiv;
}

function renderChatAttachmentBar() {
  const container = document.getElementById('chatAttachmentBar');
  if (!container) return;
  container.innerHTML = '';
  chatAttachments.forEach((att, idx) => {
    const chip = document.createElement('div');
    chip.className = 'ci-attachment-chip';
    chip.innerHTML = `
            ${att.type === 'image' ? `<img src="${att.preview}" alt="preview">` : `<span class="file-icon">📎</span>`}
            <span class="file-name">${att.file.name}</span>
            <button class="remove-att" data-idx="${idx}" aria-label="Remove attachment">×</button>
        `;
    container.appendChild(chip);
  });
  container.querySelectorAll('.remove-att').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const i = Number(e.currentTarget.getAttribute('data-idx'));
      chatAttachments.splice(i, 1);
      renderChatAttachmentBar();
    });
  });
}

function scrollToNotionBottom() {
  const body = document.getElementById('notionChatBody');
  if (body) body.scrollTop = body.scrollHeight;
}

function toggleModelDropdown() {
  const dropdown = document.getElementById('modelDropdown');
  const selector = document.getElementById('modelSelector');
  if (!dropdown || !selector) return;
  if (dropdown.style.display === 'none' || !dropdown.style.display) {
    positionModelDropdown();
    dropdown.style.display = 'block';
  } else {
    dropdown.style.display = 'none';
  }
}

function positionModelDropdown() {
  const dropdown = document.getElementById('modelDropdown');
  const selector = document.getElementById('modelSelector');
  if (!dropdown || !selector) return;
  const rect = selector.getBoundingClientRect();
  dropdown.style.left = rect.left + 'px';
  dropdown.style.top = (rect.bottom + 8) + 'px';
  dropdown.style.position = 'fixed';
  dropdown.style.zIndex = '10000';
}

function setSelectedModel(model) {
  selectedChatModel = model;
  const names = {
    'gemini-3-pro-preview': 'Gemini 3 Pro',
    'gpt-5.2-chat': 'GPT-5.2 Chat',
    'gpt-5.2-pro': 'GPT-5.2 Pro'
  };
  const textEl = document.getElementById('modelSelectorText');
  if (textEl) textEl.textContent = names[model] || model;
  document.querySelectorAll('.dropdown-item-dark').forEach(el => {
    if (el.getAttribute('data-model') === model) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
  const hiddenSelect = document.getElementById('chatModelSelect');
  if (hiddenSelect) hiddenSelect.value = model;
}

/**
 * Toggle sidebar open/close
 */
function toggleSidebar() {
  if (isSidebarOpen) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

/**
 * Open the sidebar
 */
function openSidebar() {
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebarToggle = document.getElementById('sidebarToggle');

  if (sidebar) {
    isSidebarOpen = true;
    sidebar.classList.add('open');
    if (sidebarOverlay) sidebarOverlay.classList.add('active');
    if (sidebarToggle) sidebarToggle.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

/**
 * Close the sidebar
 */
function closeSidebar() {
  const sidebar = document.getElementById('sidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebarToggle = document.getElementById('sidebarToggle');

  if (sidebar) {
    isSidebarOpen = false;
    sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    if (sidebarToggle) sidebarToggle.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Handle form submission from main page
 */
function handleMainSubmit() {
  const taskInput = document.getElementById('taskInput');
  if (!taskInput) return;

  const task = taskInput.value.trim();
  if (!task) {
    showNotification('Please enter a task', 'warning');
    return;
  }

  // Slash command for image generation
  const imgMatch = task.match(/^\s*(?:\/img\s+|img:\s*)([\s\S]+)/i);
  if (imgMatch && imgMatch[1]) {
    const imgPrompt = imgMatch[1].trim();
    generateImage(imgPrompt);
    taskInput.value = '';
    return;
  }

  // Unify: If there were separate landing/chat views, we stay in the main workspace now
  // Add to history
  chatHistory.push({ role: 'user', content: task, attachments: minimalAttachments });

  // Snapshot and clear attachments for this turn
  const turnAttachments = [...minimalAttachments];
  minimalAttachments = [];

  // Append to conversation area
  appendMessage({ role: 'user', content: task });

  // FS command interception
  if (isFsCommand(task)) {
    runFsCommand(task, turnAttachments)
      .then(output => {
        appendMessage({ role: 'assistant', content: output });
        chatHistory.push({ role: 'assistant', content: output });
      })
      .catch(err => {
        const msg = `FS Error: ${err?.message || err}`;
        appendMessage({ role: 'assistant', content: msg });
      });
    taskInput.value = '';
    return;
  }

  // Show loading indicator
  const loadingMsg = appendMessage({ role: 'assistant', content: 'Thinking...' }, true);

  // Get selected model
  const selectedModel = 'gemini-3-pro-preview';

  // Call Puter.js AI
  puter.ai.chat(task, { stream: true, model: selectedModel })
    .then(async response => {
      loadingMsg.remove();

      const messageDiv = appendMessage({ role: 'assistant', content: '' });
      const contentDiv = messageDiv.querySelector('.message-content');
      let fullText = '';

      for await (const part of response) {
        const text = part?.text || '';
        fullText += text;
        contentDiv.innerHTML = formatMessageText(fullText);
        scrollToBottom();
      }

      chatHistory.push({ role: 'assistant', content: fullText });
      addTTSButton(messageDiv, fullText);
    })
    .catch(error => {
      loadingMsg.remove();
      console.error('AI Error:', error);
      appendMessage({ role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' });
    });

  taskInput.value = '';
}

// Duplicate handleChatSubmit removed
// function handleChatSubmit() {
//    handleMainSubmit();
// }

/**
 * Open the Chat Interface
 */
// Track minimal conversations


function openChatInterface() {
  // No-op in unified workspace, but ensuring focus
  document.getElementById('taskInput')?.focus();
}

/**
 * Handle File Selection
 */
function handleFileSelection(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  files.forEach(file => {
    // Read file for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const attachment = {
        file: file,
        preview: e.target.result,
        type: file.type.startsWith('image/') ? 'image' : 'file'
      };
      attachments.push(attachment);
      renderAttachmentPreviews();
    };
    reader.readAsDataURL(file);
  });

  // Reset input
  event.target.value = '';
}

/**
 * Render Attachment Previews
 */
function renderAttachmentPreviews() {
  const container = document.getElementById('attachmentPreviews');
  if (!container) return;

  container.innerHTML = '';

  attachments.forEach((att, index) => {
    const chip = document.createElement('div');
    chip.className = 'attachment-chip';

    let content = '';
    if (att.type === 'image') {
      content = `<img src="${att.preview}" alt="preview">`;
    }
    content += `<span>${att.file.name}</span>`;
    content += `<button class="remove-attachment" onclick="removeAttachment(${index})">×</button>`;

    chip.innerHTML = content;
    container.appendChild(chip);
  });
}

// Make globally available for onclick
window.removeAttachment = function (index) {
  attachments.splice(index, 1);
  renderAttachmentPreviews();
};

/**
 * Minimal Conversation (no bubbles, no borders)
 */
async function minimalSend(textOrCommand) {
  const text = (textOrCommand || '').toString().trim();
  const messagesEl = document.getElementById('messages');
  if (!messagesEl || !text) return;

  // Render user line
  appendMinimalLine('user', text);

  // Prepare payload
  const hasPuter = typeof window !== 'undefined' && window.puter && window.puter.ai;
  if (!hasPuter) {
    appendMinimalLine('assistant', 'AI is unavailable right now.');
    return;
  }

  // Upload any queued attachments to Puter FS
  let content = [];
  if (text) content.push({ type: 'text', text });

  const uploaded = [];
  try {
    for (const file of minimalAttachments) {
      const uploadedFile = await puter.fs.write(`chat_${Date.now()}_${file.name}`, file);
      uploaded.push({ type: 'file', puter_path: uploadedFile.path });
    }
  } catch (e) {
    console.warn('File upload failed:', e);
  }

  if (uploaded.length) content = content.concat(uploaded);

  // Clear attachments buffer for next message
  minimalAttachments = [];

  // Create assistant placeholder
  const assistantNode = appendMinimalLine('assistant', '');
  let acc = '';

  try {
    // Build request: if only text, send as string; else send messages array
    let req = content.length === 1 && content[0].type === 'text'
      ? text
      : [{ role: 'user', content }];

    const resp = await puter.ai.chat(req, { model: 'gpt-5-nano', stream: true });
    for await (const part of resp) {
      const delta = part?.text || '';
      if (delta) {
        acc += delta;
        updateMinimalLine(assistantNode, acc);
      }
    }
    // Track minimal history
    chatHistory.push({ role: 'user', content: text });
    chatHistory.push({ role: 'assistant', content: acc });
  } catch (err) {
    updateMinimalLine(assistantNode, `Error: ${err.message || err}`);
  }
}

/**
 * Append Message to Chat
 */
function appendMessage(msg, isLoading = false) {
  const chatMessages = document.getElementById('chatMessages');
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${msg.role}-message`;

  let innerHTML = '';

  // Add Icon for Assistant
  if (msg.role === 'assistant') {
    innerHTML += `
        <div class="message-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L14.4 7.2L19.6 9.6L14.4 12L12 17.2L9.6 12L4.4 9.6L9.6 7.2L12 2Z" />
            </svg>
        </div>`;
  }

  innerHTML += `<div class="message-content">`;

  // Text Content
  if (msg.content) {
    innerHTML += isLoading ? '<span class="typing-indicator"></span>' : formatMessageText(msg.content);
  }

  // Attachment Display (for User - though mostly hidden now)
  if (msg.attachments && msg.attachments.length > 0) {
    msg.attachments.forEach(att => {
      if (att.type === 'image') {
        innerHTML += `<img src="${att.preview}" class="message-image" alt="uploaded image">`;
      } else {
        innerHTML += `<div class="file-attachment">📄 ${att.file.name}</div>`;
      }
    });
  }

  innerHTML += `</div>`;

  // Actions container (populated later for assistant)
  if (msg.role === 'assistant' && !isLoading) {
    innerHTML += `<div class="message-actions"></div>`;
  }

  msgDiv.innerHTML = innerHTML;
  chatMessages.appendChild(msgDiv);
  scrollToBottom();

  return msgDiv;
}

/**
 * Format Text (Basic Markdown-ish)
 */
function formatMessageText(text) {
  // Escape HTML
  let formatted = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Line breaks
  formatted = formatted.replace(/\n/g, '<br>');

  // Code blocks (simple)
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

  // Bold
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  return formatted;
}

function appendMinimalLine(role, text) {
  const containerId = role === 'assistant' ? 'aiOutput' : 'messages';
  const container = document.getElementById(containerId);
  if (!container) return null;
  const line = document.createElement('div');
  line.className = `msg-line ${role}`;
  const span = document.createElement('div');
  span.className = `msg-text-plain ${role}`;
  span.textContent = text || '';
  line.appendChild(span);
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;
  return span; // return the text node container to update later
}

function updateMinimalLine(textNodeEl, text) {
  if (!textNodeEl) return;
  textNodeEl.textContent = text || '';
  const container = textNodeEl.closest('#aiOutput, #messages');
  if (container) container.scrollTop = container.scrollHeight;
}

function handleNewSession() {
  // Reset Chat Interface
  const chatInterface = document.getElementById('chatInterface');
  const mainContent = document.querySelector('.main-content');
  const chatMessages = document.getElementById('chatMessages');
  const hero = document.getElementById('heroTitle');

  // Hide Chat, Show Main
  if (chatInterface) chatInterface.style.display = 'none';
  if (mainContent) mainContent.style.display = '';
  if (hero) hero.style.display = '';

  // Hide Floating User Message
  const floatMsg = document.getElementById('floatingUserMessage');
  if (floatMsg) {
    floatMsg.style.display = 'none';
    floatMsg.textContent = '';
  }

  // Reset Messages (Keep Welcome?)
  if (chatMessages) {
    chatMessages.innerHTML = `
      <div class="message assistant-message">
        <div class="message-content">
          <p>Hello! I'm Plara, your AI assistant. I can help you with research, writing, coding, and image generation. What's on your mind?</p>
        </div>
      </div>`;
  }

  // Reset Legacy UI (just in case)
  const messages = document.getElementById('messages');
  const aiOut = document.getElementById('aiOutput');
  const chatBox = document.getElementById('chatBox');
  if (messages) { messages.innerHTML = ''; messages.classList.remove('active'); }
  if (aiOut) { aiOut.innerHTML = ''; aiOut.classList.remove('active'); }
  if (chatBox) chatBox.classList.remove('sticky-bottom');

  // Reset state
  chatHistory = [];
  attachments = [];
  minimalAttachments = [];
  showNotification('New session started', 'success');
}




function scrollToBottom() {
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Add Text-to-Speech Button
 */
function addTTSButton(messageDiv, text) {
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'message-actions';

  const ttsBtn = document.createElement('button');
  ttsBtn.className = 'msg-action-btn';
  ttsBtn.title = 'Read Aloud';
  ttsBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;

  ttsBtn.onclick = async () => {
    try {
      const audio = await puter.ai.txt2speech(text, {
        voice: 'Joanna', // Standard neural voice
        engine: 'neural'
      });
      audio.play();
    } catch (error) {
      console.error('TTS Error:', error);
      showNotification('TTS failed', 'error');
    }
  };

  actionsDiv.appendChild(ttsBtn);
  messageDiv.appendChild(actionsDiv);
}

/**
 * Handle Voice Input (Speech-to-Text)
 */
async function handleVoiceInput() {
  showNotification('Voice input is currently disabled to protect privacy.', 'info');
  return;
  // const btn = document.getElementById('voiceInputBtn');

  if (!isRecording) {
    // Start Recording
    try {
      // Logic disabled: no permissions requested
      // const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' }); // or audio/mp3
        // Convert Blob to File
        const audioFile = new File([audioBlob], "voice_input.wav", { type: "audio/wav" });

        // Transcribe
        showNotification('Transcribing...', 'info');
        try {
          const transcript = await puter.ai.speech2txt(audioFile);
          const text = typeof transcript === 'string' ? transcript : transcript.text;

          const chatInput = document.getElementById('chatInput');
          chatInput.value += (chatInput.value ? ' ' : '') + text;
          chatInput.focus();
        } catch (error) {
          console.error('STT Error:', error);
          showNotification('Transcription failed', 'error');
        }
      };

      mediaRecorder.start();
      isRecording = true;
      btn.classList.add('active'); // Pulse animation
      showNotification('Listening...', 'info');

    } catch (error) {
      console.error('Mic Error:', error);
      showNotification('Microphone access denied', 'error');
    }
  } else {
    // Stop Recording
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    isRecording = false;
    btn.classList.remove('active');
  }
}

/**
 * Handle Quick Actions
 */
async function handleQuickAction(action) {
  if (action === 'new-session') {
    handleNewSession();
    return;
  }

  if (action === 'generate-image') {
    const userPrompt = (document.getElementById('taskInput')?.value || '').trim() || "A beautiful cinematic digital art piece";
    generateImage(userPrompt);

  } else if (action === 'zoom-in') {
    zoomLevel += 0.1;
    applyZoom();
  } else if (action === 'zoom-out') {
    zoomLevel = Math.max(0.2, zoomLevel - 0.1);
    applyZoom();
  } else if (action === 'zoom-fit') {
    fitToScreen();
  } else {
    showNotification(`${action} coming soon`, 'info');
  }
}

/**
 * Apply the current zoom level to the A4 page
 */
function handleGenerateImageFromChat() {
  const ci = document.getElementById('chatInput');
  const prompt = (ci?.value || '').trim();
  if (!prompt) {
    showNotification("Type a prompt in the message box, or use '/img your prompt'", 'info');
    return;
  }
  generateImage(prompt);
}

function handleGenerateImageClick() {
  const taskInput = document.getElementById('taskInput');
  const prompt = (taskInput?.value || '').trim() || 'A cinematic portrait of an explorer in soft golden hour light';
  generateImage(prompt);
}

function applyZoom() {
  const a4Page = document.getElementById('a4Page');
  if (a4Page) {
    a4Page.style.transform = `scale(${zoomLevel})`;
    // Adjust container height to accommodate scaled page if needed
    const container = document.getElementById('docEditorContainer');
    if (container) {
      // This is a simple way to handle height, but might need more refinement
      // if the scaled page overflows.
      // For now, let's keep it simple.
    }
  }
}

/**
 * Calculate and apply zoom level to fit the document to the current viewport height
 */
function fitToScreen() {
  const a4Page = document.getElementById('a4Page');
  const container = document.getElementById('docEditorContainer');
  if (a4Page && container) {
    const viewportHeight = window.innerHeight - 200; // Leave some space for navbar/input
    const pageHeight = 1122; // 297mm in pixels roughly (96dpi)

    // Target height-based fit
    zoomLevel = Math.min(1.0, viewportHeight / pageHeight);
    applyZoom();
    showNotification(`Zoom adjusted to ${Math.round(zoomLevel * 100)}%`, 'info');
  }
}

/**
 * Handle sign in action (Legacy/Placeholder)
 */
function handleSignIn() {
  closeSidebar();
  showNotification('Sign in functionality coming soon', 'info');
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  Object.assign(notification.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    padding: '12px 24px',
    borderRadius: '8px',
    backgroundColor: getNotificationColor(type),
    color: 'white',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: '1000',
    opacity: '0',
    transform: 'translateY(20px)',
    transition: 'all 0.3s ease'
  });

  document.body.appendChild(notification);

  requestAnimationFrame(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function getNotificationColor(type) {
  const colors = {
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  };
  return colors[type] || colors.info;
}

// Image generation using Puter.js Nano Banana (Gemini 3 Pro Image)
async function generateImage(promptText) {
  if (!promptText) return;
  if (!(window.puter && puter.ai)) {
    showNotification('Puter.ai not available', 'error');
    return;
  }

  showNotification('Generating image with Nano Banana (Gemini 3 Pro Image)...', 'info');

  try {
    const result = await puter.ai.txt2img({
      prompt: promptText,
      model: 'gemini-3-pro-image-preview'
    });
    // Normalize possible return types to a usable image URL
    const toUrlFromResult = async (res) => {
      const isWebUrl = (s) => /^(data:|blob:|https?:)/i.test(s);
      if (res instanceof HTMLImageElement) return res.src;
      if (typeof res === 'string') {
        if (isWebUrl(res)) return res;
        try {
          return await puter.fs.getReadURL(res);
        } catch {
          const blob = await puter.fs.read(res);
          return URL.createObjectURL(blob);
        }
      }
      if (res && typeof res === 'object') {
        if (res instanceof Blob) return URL.createObjectURL(res);
        if (res.url || res.dataUrl) return (res.url || res.dataUrl);
        if (res.path) return await puter.fs.getReadURL(res.path);
        if (res.tagName && res.tagName.toLowerCase() === 'img') return res.src;
      }
      throw new Error('Unexpected image return type from puter.ai.txt2img');
    };

    const imgUrl = await toUrlFromResult(result);

    if (window.editorjs) {
      await window.editorjs.blocks.insert('image', {
        url: imgUrl,
        caption: promptText,
        withBorder: false,
        withBackground: false,
        stretched: false
      });
      showNotification('Image inserted into document', 'success');
    } else {
      showNotification('Editor not ready', 'warning');
    }
  } catch (error) {
    console.error('Image Gen Error:', error);
    showNotification('Error generating image: ' + (error.message || error), 'error');
  }
}

// ================= LegalForge AI (SMB Legal Document Generator) =================

// In-memory session state (persisted to Puter KV per user)
const legalState = {
  profile: null,          // business profile
  currentDoc: null,       // active document object
  currentDocId: null,     // active doc id key
  docsIndex: [],          // list of doc ids for user
};

const LEGAL_KV_KEYS = {
  profile: (uid) => `legal.profile.${uid}`,
  index: (uid) => `legal.index.${uid}`,
  doc: (uid, id) => `legal.doc.${uid}.${id}`
};

const LEGAL_DOC_TYPES = {
  'privacy-policy': { title: 'Privacy Policy', compliance: ['GDPR', 'CCPA', 'ePrivacy'] },
  'terms-of-service': { title: 'Terms of Service', compliance: ['Contract', 'UCC'] },
  'nda': { title: 'Non-Disclosure Agreement', compliance: ['Confidentiality'] },
  'employment-contract': { title: 'Employment Contract', compliance: ['FLSA', 'EEOC'] },
  'service-agreement': { title: 'Service Agreement', compliance: ['Contract Law'] },
  'employee-handbook': { title: 'Employee Handbook', compliance: ['FLSA', 'EEOC'] },
  'hipaa-baa': { title: 'HIPAA Business Associate Agreement', compliance: ['HIPAA', 'HITECH'] },
  'aml-policy': { title: 'AML/KYC Policy', compliance: ['BSA/AML', 'FATF'] },
  'dpa': { title: 'Data Processing Agreement', compliance: ['GDPR Art.28'] }
};

async function legalEnsureAuth() {
  if (!(window.puter && puter.auth)) throw new Error('Puter auth not available');
  if (!(await puter.auth.isSignedIn())) {
    await puter.auth.signIn();
  }
  return await puter.auth.getUser();
}

async function legalLoadProfile(uid) {
  legalState.profile = await puter.kv.get(LEGAL_KV_KEYS.profile(uid)) || {
    businessName: '',
    businessType: '',
    industry: 'general',
    jurisdiction: 'US',
    employees: 0,
    emails: { contact: '' }
  };
  return legalState.profile;
}

async function legalSaveProfile(uid) {
  await puter.kv.set(LEGAL_KV_KEYS.profile(uid), legalState.profile);
}

async function legalLoadIndex(uid) {
  legalState.docsIndex = await puter.kv.get(LEGAL_KV_KEYS.index(uid)) || [];
  return legalState.docsIndex;
}

async function legalSaveIndex(uid) {
  await puter.kv.set(LEGAL_KV_KEYS.index(uid), legalState.docsIndex);
}

function legalNewDocId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function legalSaveDoc(uid, doc) {
  const key = LEGAL_KV_KEYS.doc(uid, doc.id);
  await puter.kv.set(key, doc);
  if (!legalState.docsIndex.includes(doc.id)) {
    legalState.docsIndex.unshift(doc.id);
    await legalSaveIndex(uid);
  }
}

async function legalGetDoc(uid, id) {
  return await puter.kv.get(LEGAL_KV_KEYS.doc(uid, id));
}

function legalDocToPlainText(doc) {
  // Convert HTML from Editor.js insertion target to plain text fallback
  return (doc?.content || '').toString();
}

function legalRenderToEditor(markdown) {
  if (!window.editorjs) { showNotification('Editor is not ready', 'warning'); return; }
  // Reuse processDocumentContent by wrapping in DOCUMENT_CONTENT block
  processDocumentContent(`:::DOCUMENT_CONTENT\n${markdown}\n:::`);
}

function legalComplianceChecklist(docType) {
  const base = {
    'privacy-policy': [
      'Data Controller', 'Data Categories', 'Legal Basis (GDPR)', 'Retention', 'User Rights', 'Cookie Disclosure', 'Breach Notification', 'CCPA Rights'
    ],
    'hipaa-baa': [
      'PHI Definition', 'Permitted Uses', 'Safeguards (Admin/Physical/Technical)', 'Breach Notification', 'Subcontractor Requirements', 'Audit Rights', '45 CFR 164.504'
    ],
    'aml-policy': [
      'CIP Procedures', 'CDD Workflow', 'EDD Triggers', 'PEP Screening', 'SAR Filing', 'Record Retention (5 years)', 'FinCEN References'
    ]
  };
  return base[docType] || [];
}

async function legalVerifyCompliance(content, docType) {
  const checklist = legalComplianceChecklist(docType);
  const missing = checklist.filter(s => !new RegExp(s, 'i').test(content));
  return { status: missing.length ? 'INCOMPLETE' : 'COMPLETE', missing };
}

async function handleLegalCommand(raw) {
  try {
    const user = await legalEnsureAuth();
    await legalLoadProfile(user.uid || user.username || 'me');
    await legalLoadIndex(user.uid || user.username || 'me');

    const cmd = raw.trim();

    // Help
    if (/^\/legal\s*(help)?$/i.test(cmd)) {
      appendNotionMessage({
        role: 'assistant', content: (
          `LegalForge commands:
- /legal types — list document types
- /legal new <type> — start a new document
- /legal save <name> — save current document
- /legal list — list your docs
- /legal open <id> — open a saved doc
- /legal verify — run compliance check
- /legal profile name=<..> type=<..> industry=<..> juris=<..> email=<..>
- /legal apply <change request> — modify current doc with AI
- /legal regen — regenerate current doc
- /legal export — save current doc as a .txt in Puter FS`
        )
      });
      return;
    }

    // List types
    if (/^\/legal\s+types\b/i.test(cmd)) {
      const list = Object.entries(LEGAL_DOC_TYPES).map(([k, v]) => `- ${k} — ${v.title}`).join('\n');
      appendNotionMessage({ role: 'assistant', content: list });
      return;
    }

    // Set profile
    if (/^\/legal\s+profile\b/i.test(cmd)) {
      const kv = Object.fromEntries((cmd.match(/(\w+)=([^\s]+)/g) || []).map(p => {
        const [k, v] = p.split('='); return [k, v];
      }));
      legalState.profile.businessName = kv.name || legalState.profile.businessName;
      legalState.profile.businessType = kv.type || legalState.profile.businessType;
      legalState.profile.industry = kv.industry || legalState.profile.industry;
      legalState.profile.jurisdiction = kv.juris || legalState.profile.jurisdiction;
      if (kv.email) legalState.profile.emails.contact = kv.email;
      await legalSaveProfile(user.uid || user.username || 'me');
      appendNotionMessage({ role: 'assistant', content: 'Profile saved.' });
      return;
    }

    // New document
    const mNew = cmd.match(/^\/legal\s+new\s+(\S+)/i);
    if (mNew) {
      const type = mNew[1].toLowerCase();
      const def = LEGAL_DOC_TYPES[type];
      if (!def) { appendNotionMessage({ role: 'assistant', content: `Unknown type: ${type}` }); return; }

      const id = legalNewDocId();
      legalState.currentDocId = id;
      const doc = {
        id,
        type,
        title: def.title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'draft',
        versions: [],
        content: ''
      };
      legalState.currentDoc = doc;

      // Build prompt
      const prompt = buildLegalPromptFromProfile(type, def, legalState.profile);
      const resp = await puter.ai.chat(prompt, { model: 'gpt-5-nano' });
      const content = typeof resp === 'string' ? resp : (resp?.text || resp?.content || JSON.stringify(resp));

      doc.content = content;
      doc.versions.push({ versionId: 'v1', timestamp: new Date().toISOString(), content });
      await legalSaveDoc(user.uid || user.username || 'me', doc);

      legalRenderToEditor(content);
      appendNotionMessage({ role: 'assistant', content: `New ${def.title} generated. Use /legal save <name> to save with a friendly name.` });
      return;
    }

    // Save current
    const mSave = cmd.match(/^\/legal\s+save\s+(.+)/i);
    if (mSave) {
      if (!legalState.currentDoc) { appendNotionMessage({ role: 'assistant', content: 'No current document.' }); return; }
      const name = mSave[1].trim();
      legalState.currentDoc.savedName = name;
      legalState.currentDoc.updatedAt = new Date().toISOString();
      await legalSaveDoc(user.uid || user.username || 'me', legalState.currentDoc);
      appendNotionMessage({ role: 'assistant', content: `Saved as "${name}"` });
      return;
    }

    // List docs
    if (/^\/legal\s+list\b/i.test(cmd)) {
      const uid = user.uid || user.username || 'me';
      await legalLoadIndex(uid);
      if (!legalState.docsIndex.length) { appendNotionMessage({ role: 'assistant', content: 'No documents yet.' }); return; }
      const lines = [];
      for (const id of legalState.docsIndex) {
        const d = await legalGetDoc(uid, id);
        if (d) lines.push(`- ${id} | ${d.savedName || d.title} | ${d.type} | ${new Date(d.updatedAt).toLocaleString()}`);
      }
      appendNotionMessage({ role: 'assistant', content: lines.join('\n') });
      return;
    }

    // Open
    const mOpen = cmd.match(/^\/legal\s+open\s+(\S+)/i);
    if (mOpen) {
      const id = mOpen[1];
      const uid = user.uid || user.username || 'me';
      const d = await legalGetDoc(uid, id);
      if (!d) { appendNotionMessage({ role: 'assistant', content: 'Not found.' }); return; }
      legalState.currentDoc = d; legalState.currentDocId = d.id;
      legalRenderToEditor(d.content);
      appendNotionMessage({ role: 'assistant', content: `Opened ${d.savedName || d.title}` });
      return;
    }

    // Verify
    if (/^\/legal\s+verify\b/i.test(cmd)) {
      if (!legalState.currentDoc) { appendNotionMessage({ role: 'assistant', content: 'No current document.' }); return; }
      const res = await legalVerifyCompliance(legalState.currentDoc.content, legalState.currentDoc.type);
      if (res.status === 'COMPLETE') {
        appendNotionMessage({ role: 'assistant', content: 'Compliance check: COMPLETE ✅' });
      } else {
        appendNotionMessage({ role: 'assistant', content: 'Compliance check: INCOMPLETE\nMissing: ' + res.missing.join(', ') });
      }
      return;
    }

    // Apply change with AI
    const mApply = cmd.match(/^\/legal\s+apply\s+([\s\S]+)/i);
    if (mApply) {
      if (!legalState.currentDoc) { appendNotionMessage({ role: 'assistant', content: 'No current document.' }); return; }
      const change = mApply[1].trim();
      const system = `You are a senior legal editor. Modify the given document according to the request, preserving existing valid clauses and improving compliance where relevant. Output the full updated document.`;
      const msgs = [
        { role: 'system', content: system },
        { role: 'user', content: `Request: ${change}\n\nDocument:\n${legalState.currentDoc.content}` }
      ];
      const resp = await puter.ai.chat(msgs, { model: 'gpt-5-nano' });
      const updated = typeof resp === 'string' ? resp : (resp?.text || resp?.content || JSON.stringify(resp));
      legalState.currentDoc.content = updated;
      legalState.currentDoc.updatedAt = new Date().toISOString();
      legalState.currentDoc.versions.push({ versionId: `v${legalState.currentDoc.versions.length + 1}`, timestamp: new Date().toISOString(), content: updated });
      await legalSaveDoc(user.uid || user.username || 'me', legalState.currentDoc);
      legalRenderToEditor(updated);
      appendNotionMessage({ role: 'assistant', content: 'Applied change and saved new version.' });
      return;
    }

    // Regenerate
    if (/^\/legal\s+regen\b/i.test(cmd)) {
      if (!legalState.currentDoc) { appendNotionMessage({ role: 'assistant', content: 'No current document.' }); return; }
      const def = LEGAL_DOC_TYPES[legalState.currentDoc.type];
      const prompt = buildLegalPromptFromProfile(legalState.currentDoc.type, def, legalState.profile);
      const resp = await puter.ai.chat(prompt, { model: 'gpt-5-nano' });
      const content = typeof resp === 'string' ? resp : (resp?.text || resp?.content || JSON.stringify(resp));
      legalState.currentDoc.content = content;
      legalState.currentDoc.updatedAt = new Date().toISOString();
      legalState.currentDoc.versions.push({ versionId: `v${legalState.currentDoc.versions.length + 1}`, timestamp: new Date().toISOString(), content });
      await legalSaveDoc(user.uid || user.username || 'me', legalState.currentDoc);
      legalRenderToEditor(content);
      appendNotionMessage({ role: 'assistant', content: 'Regenerated document.' });
      return;
    }

    // Export
    if (/^\/legal\s+export\b/i.test(cmd)) {
      if (!legalState.currentDoc) { appendNotionMessage({ role: 'assistant', content: 'No current document.' }); return; }
      const fname = `${(legalState.currentDoc.savedName || legalState.currentDoc.title || 'document').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
      await puter.fs.write(fname, legalState.currentDoc.content, { dedupeName: true });
      const url = await puter.fs.getReadURL(fname);
      appendNotionMessage({ role: 'assistant', content: `Exported to FS: ${fname}\n${url}` });
      return;
    }

    appendNotionMessage({ role: 'assistant', content: 'Unknown /legal command. Use /legal help' });
  } catch (e) {
    console.error('LegalForge Error:', e);
    appendNotionMessage({ role: 'assistant', content: 'LegalForge error: ' + (e.message || e) });
  }
}

function buildLegalPromptFromProfile(type, def, profile) {
  const base = `You are an expert legal document writer specializing in ${def.compliance.join(', ')} compliance.\nGenerate a comprehensive ${def.title} for the following SMB. Use clear headings, numbered sections, bullet points, and add [CUSTOMIZE: ...] placeholders where client-specific info is required. Include a short disclaimer for legal review. Output the complete document.`;
  return [
    { role: 'system', content: base },
    {
      role: 'user', content: (
        `Business:
- Name: ${profile.businessName || '[CUSTOMIZE: Business Name]'}
- Type: ${profile.businessType || 'General'}
- Industry: ${profile.industry || 'general'}
- Jurisdiction: ${profile.jurisdiction || 'US'}
- Employees: ${profile.employees || 0}
- Contact Email: ${profile.emails?.contact || '[CUSTOMIZE: email]'}

Requirements:
- Ensure compliance with: ${def.compliance.join(', ')}
- Maintain professional tone, plain-English explanations in [Note: ...]
- Include table of contents if appropriate
- Add data retention, rights, breach, and transfer sections (privacy)
- Add safeguards and HHS references (HIPAA BAA) when relevant
- Add CIP/CDD/EDD sections (AML) when relevant
`)
    }
  ];
}

// ================= PermitForge AI (Construction Permit & Compliance) =================

const permitState = {
  profile: null, // contractor/firm profile
  projects: [], // minimal index
  current: null // active project
};

const PERMIT_KV = {
  profile: (uid) => `permit.profile.${uid}`,
  projectIndex: (uid) => `permit.projects.${uid}`,
  project: (uid, id) => `permit.project.${uid}.${id}`
};

const PERMIT_TYPES = {
  'residential': ['building', 'electrical', 'mechanical', 'plumbing', 'energy'],
  'commercial': ['building', 'electrical', 'mechanical', 'plumbing', 'fire', 'zoning', 'energy']
};

const JURIS_SAMPLE = {
  'CA:Los_Angeles': {
    zoning: {
      R1: { front: 25, side: 5, rear: 25, height: 45 }
    },
    energy: { title24: '2025', window_u_factor: 0.30, attic_r: 38, wall_r: 19 },
    seismic: { standard: 'ASCE 7' },
    codeRefs: ['LAMC', 'Title 24 2025']
  },
  'NY:New_York': {
    zoning: { R1: { front: 10, side: 5, rear: 30, height: 35 } },
    energy: { ll97: 2024 },
    codeRefs: ['NYC Building Code 2014', 'Local Law 97']
  }
};

function permitNewId() { return `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`; }

async function permitEnsureAuth() {
  if (!(window.puter && puter.auth)) throw new Error('Puter auth unavailable');
  if (!(await puter.auth.isSignedIn())) await puter.auth.signIn();
  return await puter.auth.getUser();
}

async function permitLoadProfile(uid) {
  permitState.profile = await puter.kv.get(PERMIT_KV.profile(uid)) || {
    company: '', contact: '', email: '', phone: '', role: 'Contractor'
  };
  return permitState.profile;
}
async function permitSaveProfile(uid) { await puter.kv.set(PERMIT_KV.profile(uid), permitState.profile); }
async function permitLoadIndex(uid) { permitState.projects = await puter.kv.get(PERMIT_KV.projectIndex(uid)) || []; return permitState.projects; }
async function permitSaveIndex(uid) { await puter.kv.set(PERMIT_KV.projectIndex(uid), permitState.projects); }
async function permitSaveProject(uid, p) { await puter.kv.set(PERMIT_KV.project(uid, p.id), p); if (!permitState.projects.includes(p.id)) { permitState.projects.unshift(p.id); await permitSaveIndex(uid); } }
async function permitGetProject(uid, id) { return await puter.kv.get(PERMIT_KV.project(uid, id)); }

function renderToEditorAsDocument(markdown) {
  processDocumentContent(`:::DOCUMENT_CONTENT\n${markdown}\n:::`);
}

function buildPermitPrompt(project) {
  const jurisKey = `${project.state}:${project.city}`;
  const juris = JURIS_SAMPLE[jurisKey] || {};
  const codeRefs = (juris.codeRefs || []).join(', ');
  return [
    {
      role: 'system', content:
        `You are a construction permitting and building code expert. Generate a permit application package in clear sections with headings, numbered lists, and include explicit code citations. Include a summary compliance matrix. If information is missing, add [CUSTOMIZE: ...] placeholders. Ensure tone is professional.`
    },
    {
      role: 'user', content:
        `Project:
- Name: ${project.name}
- Address: ${project.address}
- Jurisdiction: ${project.city}, ${project.state}
- Permit Types: ${project.permitTypes.join(', ')}
- Description: ${project.description}
- Lot Size: ${project.lotSize || '-'} sq ft
- APN: ${project.apn || '-'}

Codes & Constraints:
- Known Code References: ${codeRefs || '-'}
- Zoning: ${JSON.stringify(juris.zoning || {})}
- Energy: ${JSON.stringify(juris.energy || {})}
- Seismic: ${JSON.stringify(juris.seismic || {})}

Documents Needed:
- Applicant information
- Scope of work
- Code compliance statement with citations
- Required attachments checklist
- Owner authorization (if needed)
- Energy compliance (if selected)

Instructions:
1) Produce a professional multi-section document ready for municipal submission.
2) Add a compliance checklist mapping requirement -> status.
3) Add a section "Required Attachments" tailored to permit types.
4) Add a disclaimer to consult local authority and licensed professionals.
` }
  ];
}

async function handlePermitCommand(raw) {
  try {
    const user = await permitEnsureAuth();
    const uid = user.uid || user.username || 'me';
    await permitLoadProfile(uid); await permitLoadIndex(uid);

    const cmd = raw.trim();

    if (/^\/permit\s*(help)?$/i.test(cmd)) {
      appendNotionMessage({
        role: 'assistant', content:
          `PermitForge commands:
- /permit profile company=<..> contact=<..> email=<..>
- /permit new state=<CA> city=<Los_Angeles> name="Proj" address="..." types=building,electrical desc="..." lot=7500 apn=123-456
- /permit list
- /permit open <projectId>
- /permit generate  (generate application document for current project)
- /permit apply <change request>
- /permit export   (save current doc as .txt and return link)
`});
      return;
    }

    if (/^\/permit\s+profile\b/i.test(cmd)) {
      const args = Object.fromEntries((cmd.match(/(\w+)=\"[^\"]+\"|(\w+)=\S+/g) || []).map(pair => {
        const [k, v] = pair.includes('="')
          ? [pair.split('=')[0], pair.match(/=\"([\s\S]+)\"/)[1]]
          : pair.split('=');
        return [k, v];
      }));
      permitState.profile.company = args.company || permitState.profile.company;
      permitState.profile.contact = args.contact || permitState.profile.contact;
      permitState.profile.email = args.email || permitState.profile.email;
      permitState.profile.phone = args.phone || permitState.profile.phone;
      await permitSaveProfile(uid);
      appendNotionMessage({ role: 'assistant', content: 'Permit profile saved.' });
      return;
    }

    const mNew = cmd.match(/^\/permit\s+new\b([\s\S]*)$/i);
    if (mNew) {
      const tail = mNew[1] || '';
      const args = Object.fromEntries((tail.match(/(\w+)=\"[^\"]+\"|(\w+)=\S+/g) || []).map(pair => {
        const [k, v] = pair.includes('="')
          ? [pair.split('=')[0], pair.match(/=\"([\s\S]+)\"/)[1]]
          : pair.split('=');
        return [k, v];
      }));
      const id = permitNewId();
      const proj = {
        id,
        state: args.state || 'CA',
        city: args.city || 'Los_Angeles',
        name: args.name || 'Untitled Project',
        address: args.address || '[CUSTOMIZE: address]',
        description: args.desc || '[CUSTOMIZE: scope of work]',
        lotSize: Number(args.lot) || null,
        apn: args.apn || '',
        permitTypes: (args.types || 'building').split(',').map(s => s.trim()),
        versions: [],
        content: ''
      };
      permitState.current = proj;
      await permitSaveProject(uid, proj);
      appendNotionMessage({ role: 'assistant', content: `New project created: ${proj.name} (${proj.id}). Use /permit generate to build the document.` });
      return;
    }

    if (/^\/permit\s+list\b/i.test(cmd)) {
      if (!permitState.projects.length) { appendNotionMessage({ role: 'assistant', content: 'No projects yet.' }); return; }
      const lines = [];
      for (const id of permitState.projects) {
        const p = await permitGetProject(uid, id);
        if (p) lines.push(`- ${p.id} | ${p.name} | ${p.city}, ${p.state} | ${new Date(p.updatedAt || p.createdAt || Date.now()).toLocaleString()}`);
      }
      appendNotionMessage({ role: 'assistant', content: lines.join('\n') });
      return;
    }

    const mOpen = cmd.match(/^\/permit\s+open\s+(\S+)/i);
    if (mOpen) {
      const id = mOpen[1];
      const p = await permitGetProject(uid, id);
      if (!p) { appendNotionMessage({ role: 'assistant', content: 'Project not found.' }); return; }
      permitState.current = p;
      if (p.content) renderToEditorAsDocument(p.content);
      appendNotionMessage({ role: 'assistant', content: `Opened ${p.name}` });
      return;
    }

    if (/^\/permit\s+generate\b/i.test(cmd)) {
      if (!permitState.current) { appendNotionMessage({ role: 'assistant', content: 'No current project. Use /permit new ...' }); return; }
      const prompt = buildPermitPrompt(permitState.current);
      const resp = await puter.ai.chat(prompt, { model: 'gpt-5-nano' });
      const content = typeof resp === 'string' ? resp : (resp?.text || resp?.content || JSON.stringify(resp));
      permitState.current.content = content;
      permitState.current.updatedAt = new Date().toISOString();
      permitState.current.versions.push({ versionId: `v${(permitState.current.versions.length + 1)}`, timestamp: new Date().toISOString(), content });
      await permitSaveProject(uid, permitState.current);
      renderToEditorAsDocument(content);
      appendNotionMessage({ role: 'assistant', content: 'Generated permit application document.' });
      return;
    }

    const mApply = cmd.match(/^\/permit\s+apply\s+([\s\S]+)/i);
    if (mApply) {
      if (!permitState.current) { appendNotionMessage({ role: 'assistant', content: 'No current project.' }); return; }
      const change = mApply[1].trim();
      const msgs = [
        { role: 'system', content: 'You are a senior permitting specialist. Update the document precisely based on the request; keep valid content and improve citations. Output the full document.' },
        { role: 'user', content: `Request: ${change}\n\nDocument:\n${permitState.current.content}` }
      ];
      const resp = await puter.ai.chat(msgs, { model: 'gpt-5-nano' });
      const updated = typeof resp === 'string' ? resp : (resp?.text || resp?.content || JSON.stringify(resp));
      permitState.current.content = updated;
      permitState.current.updatedAt = new Date().toISOString();
      permitState.current.versions.push({ versionId: `v${(permitState.current.versions.length + 1)}`, timestamp: new Date().toISOString(), content: updated });
      await permitSaveProject(uid, permitState.current);
      renderToEditorAsDocument(updated);
      appendNotionMessage({ role: 'assistant', content: 'Applied change and saved new version.' });
      return;
    }

    if (/^\/permit\s+export\b/i.test(cmd)) {
      if (!permitState.current) { appendNotionMessage({ role: 'assistant', content: 'No current project.' }); return; }
      const fname = `${permitState.current.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
      await puter.fs.write(fname, permitState.current.content || '', { dedupeName: true });
      const url = await puter.fs.getReadURL(fname);
      appendNotionMessage({ role: 'assistant', content: `Exported: ${fname}\n${url}` });
      return;
    }

    appendNotionMessage({ role: 'assistant', content: 'Unknown /permit command. Use /permit help' });
  } catch (e) {
    console.error('PermitForge Error:', e);
    appendNotionMessage({ role: 'assistant', content: 'PermitForge error: ' + (e.message || e) });
  }
}

// ================= Mistral OCR (Puter.js img2txt) helpers =================
async function runOcrOnCurrentChatAttachments(options = {}) {
  // Deprecated in favor of runOcrOnChatAttachmentsIncludingPDFs but kept for backward compatibility
  return runOcrOnChatAttachmentsIncludingPDFs(options);
}

async function runOcrOnChatAttachmentsIncludingPDFs(options = {}) {
  if (!(window.puter && puter.ai)) {
    showNotification('Puter.ai not available for OCR', 'error');
    return;
  }
  if (!chatAttachments.length) {
    showNotification('Attach one or more images/PDFs and type /ocr', 'info');
    return;
  }
  const provider = 'mistral';
  const model = options.model || 'mistral-ocr-latest';
  const useAnnotations = !!options.annotations;
  const results = [];

  showNotification('Running OCR with Mistral...', 'info');

  const dataURLtoBlob = async (dataURL) => {
    const res = await fetch(dataURL);
    return await res.blob();
  };

  // Rasterize PDFs into images via pdf.js when needed
  const rasterizePdf = async (file) => {
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const images = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvasContext: ctx, viewport }).promise;
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png', 0.95));
      images.push(blob);
    }
    return images;
  };

  for (const att of chatAttachments) {
    try {
      const file = att.file;
      // Direct images
      if (file && file.type && file.type.startsWith('image/')) {
        const req = { source: file, provider, model };
        if (useAnnotations) { req.bboxAnnotationFormat = 'yolo'; req.includeImageBase64 = false; }
        const textOrObj = await puter.ai.img2txt(req);
        const text = typeof textOrObj === 'string' ? textOrObj : (textOrObj?.text || JSON.stringify(textOrObj));
        results.push({ name: file.name, text });
        continue;
      }
      // PDFs -> rasterize pages
      if (file && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) {
        const pages = await rasterizePdf(file);
        let combined = '';
        for (let p = 0; p < pages.length; p++) {
          const req = { source: pages[p], provider, model };
          if (useAnnotations) { req.bboxAnnotationFormat = 'yolo'; req.includeImageBase64 = false; }
          const textOrObj = await puter.ai.img2txt(req);
          const txt = typeof textOrObj === 'string' ? textOrObj : (textOrObj?.text || JSON.stringify(textOrObj));
          combined += `\n\n[Page ${p + 1}]\n${txt}`;
        }
        results.push({ name: file.name, text: combined.trim() });
        continue;
      }
      // If only preview exists, fallback
      if (!file && att.preview) {
        const blob = await dataURLtoBlob(att.preview);
        const req = { source: blob, provider, model };
        if (useAnnotations) { req.bboxAnnotationFormat = 'yolo'; req.includeImageBase64 = false; }
        const textOrObj = await puter.ai.img2txt(req);
        const text = typeof textOrObj === 'string' ? textOrObj : (textOrObj?.text || JSON.stringify(textOrObj));
        results.push({ name: 'image', text });
      }
    } catch (err) {
      console.warn('OCR failed:', err);
      results.push({ name: att.file?.name || 'file', text: `[OCR error] ${err.message || err}` });
    }
  }

  // Insert into Editor.js
  if (window.editorjs && results.length) {
    await window.editorjs.blocks.insert('header', { text: 'OCR Extracted Text', level: 2 });
    for (const r of results) {
      await window.editorjs.blocks.insert('header', { text: r.name, level: 3 });
      const chunks = (r.text || '').split(/\n\n+/).filter(Boolean);
      if (chunks.length === 0) {
        await window.editorjs.blocks.insert('paragraph', { text: r.text || '(no text)' });
      } else {
        for (const p of chunks) {
          await window.editorjs.blocks.insert('paragraph', { text: p });
        }
      }
    }
    showNotification('OCR text inserted into the document', 'success');
  } else {
    showNotification('No editor instance or no OCR results', 'warning');
  }
}


// ================= Compliance preferences & KV =================
const compliancePrefs = {
  sector: 'construction',
  jurisdiction: 'us-osha',
  tone: 'professional'
};

async function setCompliancePref(key, value) {
  compliancePrefs[key] = value;
  try { await puter?.kv?.set?.(`cw_pref_${key}`, value); } catch (e) { /* ignore */ }
}

async function loadCompliancePrefs() {
  try {
    const sector = await puter?.kv?.get?.('cw_pref_sector');
    const jur = await puter?.kv?.get?.('cw_pref_jurisdiction');
    const tone = await puter?.kv?.get?.('cw_pref_tone');
    if (sector) compliancePrefs.sector = sector;
    if (jur) compliancePrefs.jurisdiction = jur;
    if (tone) compliancePrefs.tone = tone;
  } catch (e) { /* ignore */ }
}

// ================= Evidence gatherers =================
function getSelectedEditorText() {
  try {
    const sel = window.getSelection();
    return sel && sel.toString() ? sel.toString() : '';
  } catch (_) { return ''; }
}

async function getRecentDocumentTextFallback() {
  // Try pulling the last few Editor.js paragraph blocks to form field notes
  try {
    const data = await window.editorjs.save();
    const paras = data.blocks.filter(b => b.type === 'paragraph' && b.data?.text).slice(-6).map(b => b.data.text);
    return paras.join('\n');
  } catch (_) { return ''; }
}

async function gatherEvidence() {
  const notesSel = getSelectedEditorText();
  const notes = notesSel || await getRecentDocumentTextFallback();
  const photos = (chatAttachments || []).map(a => ({ name: a.file?.name || 'file', type: a.file?.type || '', hasPreview: !!a.preview }));
  const hasOcrText = false; // placeholder; could be enhanced to pull OCR text from doc if needed
  return { notes, photos, hasOcrText };
}

// ================= Prompt builders =================
function buildPromptForType(type, evidence) {
  const { sector, jurisdiction, tone } = compliancePrefs;
  const titleMap = {
    'daily-log': 'Daily Site Log',
    'safety-narrative': 'Safety Narrative',
    'incident-report': 'Incident Report',
    'permit-justification': 'Permit Justification',
    'inspection-explanation': 'Inspection Explanation'
  };

  const mustInclude = {
    'daily-log': [
      'Weather and site conditions', 'Personnel and subcontractors', 'Work activities and locations', 'Equipment/materials highlights', 'Safety observations', 'Issues/delays and resolutions'
    ],
    'safety-narrative': [
      'Safety programs and measures', 'Risk assessment and mitigations', 'Training and certifications', 'PPE compliance', 'Emergency readiness'
    ],
    'incident-report': [
      'Incident date, time, specific location', 'What happened (factual sequence)', 'Persons involved/witnesses', 'Immediate actions', 'Root cause and contributing factors', 'Corrective and preventive actions'
    ],
    'permit-justification': [
      'Project scope and safety plan', 'Regulation references (jurisdiction)', 'Hazards and controls', 'Competencies and responsibilities', 'Community/environmental considerations'
    ],
    'inspection-explanation': [
      'Inspector agency/date', 'Findings summary', 'Corrective actions and timeline', 'Preventive measures', 'Professional acknowledgement'
    ]
  };

  const constraints = `
- Role: You are a ${sector} compliance specialist preparing a regulator-ready document.
- Jurisdiction: ${jurisdiction} (apply references at a high level; do not cite inaccurate clauses).
- Tone: ${tone}; objective, factual, legally defensible. Avoid speculation/blame.
- Temperature: 0.2.
- Forbidden: slang, emotional or accusatory language, unsupported claims.
- Formatting: Return ONLY the final document body between lines starting with :::DOCUMENT_CONTENT and ending with :::.
- Do not include markdown fences. Use clear headings and short paragraphs appropriate for business/legal documents.
`;

  const includeList = (mustInclude[type] || []).map((i, idx) => `${idx + 1}. ${i}`).join('\n');

  const evSummary = `
FIELD NOTES (may be partial):\n${evidence.notes || '(none)'}\n\nATTACHMENTS:\n${(evidence.photos || []).map(p => `- ${p.name} (${p.type || 'unknown'})`).join('\n') || '(none)'}
`;

  return `Generate a ${titleMap[type]} for the ${sector} industry.
${constraints}
Required coverage:\n${includeList}
\n${evSummary}
Now produce the submission-ready narrative. Wrap ONLY the body in :::DOCUMENT_CONTENT ... :::.`;
}

// ================= Compliance generation =================
async function generateComplianceDocument(type) {
  if (!(window.puter && puter.ai)) {
    showNotification('Puter.ai unavailable', 'error');
    return;
  }
  await loadCompliancePrefs();
  const evidence = await gatherEvidence();

  try {
    showNotification(`Generating ${type}...`, 'info');
    const prompt = buildPromptForType(type, evidence);
    const text = await puter.ai.chat(prompt, { model: 'gpt-4o', temperature: 0.2, stream: false });

    // Light compliance validation
    const quickCheck = await puter.ai.chat(`Check the following text for professional, objective tone and absence of speculation/blame. Answer PASS or FAIL with one short sentence reason.\n\nTEXT:\n${text.substring(0, 8000)}`,
      { model: 'gpt-4o-mini', temperature: 0.0, stream: false });

    // Insert into Editor.js from :::DOCUMENT_CONTENT :::
    const body = extractDocContent(text);
    if (body) {
      await insertDocumentBodyToEditor(body);
    } else {
      // fallback: insert entire text as paragraphs
      await insertDocumentBodyToEditor(text);
    }

    // Save audit trail
    await saveComplianceAudit({ type, evidence, prefs: { ...compliancePrefs }, validation: quickCheck, model: 'gpt-4o' });

    showNotification(`Generated ${type}. Validation: ${quickCheck}`, quickCheck.startsWith('PASS') ? 'success' : 'warning');
  } catch (err) {
    console.error(err);
    showNotification(`Generation failed: ${err.message || err}`, 'error');
  }
}

function extractDocContent(text) {
  const m = text.match(/:::DOCUMENT_CONTENT\s*\n([\s\S]*?)\n\s*:::/);
  return m ? m[1].trim() : '';
}

async function insertDocumentBodyToEditor(body) {
  if (!window.editorjs) {
    showNotification('Editor not ready', 'warning');
    return;
  }
  // Simple heuristic split into headings/paragraphs/lists
  const lines = body.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
  for (const chunk of lines) {
    if (/^#{1,6}\s+/.test(chunk)) {
      const txt = chunk.replace(/^#{1,6}\s+/, '');
      await window.editorjs.blocks.insert('header', { text: txt, level: 3 });
    } else if (/^[-•]\s+/.test(chunk)) {
      const items = chunk.split(/\n/).map(s => s.replace(/^[-•]\s+/, '')).filter(Boolean);
      await window.editorjs.blocks.insert('list', { style: 'unordered', items });
    } else {
      await window.editorjs.blocks.insert('paragraph', { text: chunk });
    }
  }
}

async function insertCAPTemplateBlock() {
  const template = `Corrective Action Plan\n\nAction Item: [Describe the corrective action]\nOwner: [Name/Role]\nDue Date: [YYYY-MM-DD]\nVerification Method: [Describe how you will verify completion]\nStatus: [Planned/In Progress/Complete]`;
  await insertDocumentBodyToEditor(template);
  showNotification('Inserted Corrective Action Plan template', 'success');
}

async function saveComplianceAudit(entry) {
  try {
    const log = { ...entry, ts: new Date().toISOString() };
    await puter?.kv?.set?.(`cw_audit_${Date.now()}`, JSON.stringify(log));
  } catch (e) { /* ignore */ }
}

// Initialize when DOM is ready
// Quill removed in favor of Editor.js

// ================= Regulatory Response Writer (Puter.js) =================
const REG_TEMPLATES = {
  OSHA: `You are an OSHA compliance specialist. Draft a formal response letter that:
- Acknowledges receipt and cites the reference
- Summarizes the cited conditions without admissions
- Outlines immediate and longer-term corrective actions (with owners and target dates)
- Describes employee communication/training and monitoring
- Closes with cooperative, professional tone.
Use legally cautious language.`,
  EPA: `You are an environmental compliance specialist. Draft a response that:
- Acknowledges the notice and identifies site/facility
- Provides factual context and compliance position
- Details remediation and monitoring with timelines
- States third-party verification if relevant
- Uses precise, non-admitting language.`,
  EEOC: `You are an employment law specialist. Draft a response that:
- Acknowledges the inquiry
- Describes anti-discrimination policies and training
- Addresses each allegation factually and neutrally
- Outlines corrective steps and safeguards
- Maintains a respectful, careful tone.`,
  SEC: `You are a securities law specialist. Draft a response that:
- Acknowledges staff inquiry and cites file number
- Explains controls and disclosures
- Addresses each request point-by-point
- Describes remedial enhancements and timelines
- Maintains accuracy and avoids speculative statements.`,
  DOT: `You are a transportation compliance specialist (DOT/FMCSA). Draft a response that:
- Acknowledges inquiry
- Addresses hours of service/safety issues factually
- Provides corrective measures, training, audit steps
- Includes timelines and monitoring.`,
  FDA: `You are a healthcare/pharma regulatory specialist (FDA). Draft a response that:
- Acknowledges 483/notice
- Addresses each observation factually
- Provides CAPA with owners and dates
- Describes verification and effectiveness checks.`,
  FCC: `You are a telecom regulatory specialist (FCC). Draft a response that:
- Acknowledges NAL/notice
- Addresses compliance posture and corrective actions
- Provides timelines and monitoring
- Keeps language precise and non-admitting.`,
  default: `You are a regulatory compliance specialist. Draft a submission-ready response letter with:
- Acknowledgment and reference details
- Factual background and compliance position
- Corrective Action Plan (owners, dates)
- Monitoring/verification and training
- Professional, cooperative closing.`
};

function setupRegWriter() {
  const browseBtn = document.getElementById('regBrowseBtn');
  const fileInput = document.getElementById('regFile');
  const fileName = document.getElementById('regFileName');
  const noticeText = document.getElementById('regNoticeText');
  const genBtn = document.getElementById('regGenerateBtn');
  const clearBtn = document.getElementById('regClearBtn');
  const statusEl = document.getElementById('regStatus') || { set textContent(v) { }, get textContent() { return ''; } };

  if (!browseBtn || !fileInput || !genBtn) return;

  // Restore form from KV if available
  (async () => {
    try {
      const saved = await puter.kv.get('regwriter_form');
      if (saved) {
        const s = JSON.parse(saved);
        document.getElementById('chatCompany').value = s.company || '';
        document.getElementById('chatRegulator').value = s.regulator || '';
        document.getElementById('chatJurisdiction').value = s.jurisdiction || '';
        document.getElementById('chatTone').value = s.tone || 'formal';
        noticeText.value = s.notice || '';
      }
    } catch { }
  })();

  const persist = async () => {
    try {
      const s = {
        company: document.getElementById('regCompany').value.trim(),
        regulator: document.getElementById('regRegulator').value,
        jurisdiction: document.getElementById('regJurisdiction').value.trim(),
        tone: document.getElementById('regTone').value,
        notice: noticeText.value
      };
      await puter.kv.set('regwriter_form', JSON.stringify(s));
    } catch { }
  };

  ['regCompany', 'regRegulator', 'regJurisdiction', 'regTone'].forEach(id => {
    const el = document.getElementById(id);
    el?.addEventListener('change', persist);
  });
  noticeText?.addEventListener('input', () => { debounce(() => persist(), 500); });

  // Also allow slash commands in chatInput to set fields quickly


  browseBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    fileName.textContent = `${f.name} · ${(f.size / 1024).toFixed(1)} KB`;
    try {
      statusEl.textContent = 'Reading file...';
      if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
        const text = await extractPdfText(f);
        noticeText.value = text.slice(0, 20000);
      } else {
        const t = await f.text();
        noticeText.value = t.slice(0, 20000);
      }
      await persist();
      statusEl.textContent = 'Notice loaded.';
    } catch (err) {
      console.error(err);
      statusEl.textContent = 'Failed to read file.';
    }
  });

  // Clear button not present in chat panel; user can manually adjust inputs

  genBtn.addEventListener('click', async () => {
    const company = document.getElementById('regCompany').value.trim();
    const regulator = document.getElementById('regRegulator').value || 'default';
    const jurisdiction = document.getElementById('regJurisdiction').value.trim();
    const tone = document.getElementById('regTone').value || 'formal';
    const notice = noticeText.value.trim();

    if (!company || !regulator || !notice) {
      statusEl.textContent = 'Please provide company, regulator, and notice text.';
      showNotification('Missing required fields', 'warning');
      return;
    }

    await persist();

    const template = REG_TEMPLATES[regulator] || REG_TEMPLATES.default;
    const prompt = `${template}\n\nCONTEXT:\nCompany: ${company}\nRegulator: ${regulator}\nJurisdiction: ${jurisdiction || 'N/A'}\nTone: ${tone}\n\nNOTICE TEXT:\n${notice}\n\nRESPONSE REQUIREMENTS:\n- Submission-ready formal letter with letterhead placeholders\n- Reference the notice and cite any provided reference numbers if present\n- Address issues point-by-point, avoid admissions of liability\n- Include a clear Corrective Action Plan with owners and target dates\n- Add monitoring/verification and training details\n- Professional closing and signature block\n\nOUTPUT FORMAT:\nReturn ONLY a Markdown block wrapped between:\n:::DOCUMENT_CONTENT\n...markdown...\n:::`;

    try {
      statusEl.textContent = 'Generating with AI...';
      const model = selectedChatModel || 'gpt-5.2-chat';
      const aiResp = await puter.ai.chat(prompt, { model, stream: false });

      // Ensure we have a document block; if not, wrap it
      const txt = (typeof aiResp === 'string') ? aiResp : (aiResp?.text || '');
      let wrapped = txt;
      if (!/:::DOCUMENT_CONTENT[\s\S]*:::/m.test(txt)) {
        wrapped = `:::DOCUMENT_CONTENT\n${txt}\n:::`;
      }

      const ok = await processDocumentContent(wrapped);
      if (!ok && window.editorjs) {
        await window.editorjs.blocks.insert('paragraph', { text: txt });
      }
      statusEl.textContent = 'Inserted into document.';
      showNotification('Response inserted into document', 'success');
    } catch (err) {
      console.error('Generation error:', err);
      statusEl.textContent = 'Generation failed. Please try again.';
      showNotification('AI generation failed', 'error');
    }
  });
}

function debounce(fn, ms) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

async function extractPdfText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        if (!window.pdfjsLib) { throw new Error('PDF.js not loaded'); }
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(e.target.result) }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(it => it.str).join(' ');
          text += pageText + '\n\n';
        }
        resolve(text);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsArrayBuffer(file);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Uppy Drag & Drop for document editor
  try {
    if (window.Uppy && document.getElementById('drag-drop')) {
      const uppy = new Uppy.Uppy({ autoProceed: true, restrictions: { maxNumberOfFiles: 10 } });
      uppy.use(Uppy.DragDrop, { target: '#drag-drop', note: 'Drop files to insert into the document' });

      uppy.on('file-added', async (file) => {
        try {
          const f = file.data; // File object
          const ext = (f.name.split('.').pop() || '').toLowerCase();
          const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const puterPath = `~/Plara/${Date.now()}_${safeName}`;

          // Write file to Puter FS so we can get a stable URL
          const pf = await puter.fs.write(puterPath, f);
          const url = await puter.fs.getReadURL(pf.path);

          if (f.type && f.type.startsWith('image/')) {
            if (window.editorjs) {
              await window.editorjs.blocks.insert('image', {
                url,
                caption: f.name,
                withBorder: false,
                withBackground: false,
                stretched: false
              });
              showNotification('Image inserted into document', 'success');
            }
          } else {
            // Insert a link to the file in the document
            if (window.editorjs) {
              const text = `Attached file: <a href="${url}" target="_blank" rel="noopener">${safeName}</a>`;
              await window.editorjs.blocks.insert('paragraph', { text });
              showNotification('File link inserted into document', 'success');
            }
          }
        } catch (e) {
          console.error('Uppy insert error:', e);
          showNotification('Failed to insert dropped file', 'error');
        }
      });
    }
  } catch (e) {
    console.warn('Uppy not initialized:', e);
  }
  init();
  // Initialize Editor.js if holder exists
  initEditorJS();
  // Initialize Regulatory Writer UI (removed)
});

/**
 * Initialize Editor.js instance
 */
// Document history stacks for undo/redo
let docUndoStack = [];
let docRedoStack = [];
const DOC_HISTORY_LIMIT = 50;
let pushSnapshotDebounce;

function snapshotEquals(a, b) {
  try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
}

async function pushDocSnapshot() {
  if (!window.editorjs) return;
  try {
    const data = await window.editorjs.save();
    const last = docUndoStack[docUndoStack.length - 1];
    if (!last || !snapshotEquals(last, data)) {
      docUndoStack.push(data);
      if (docUndoStack.length > DOC_HISTORY_LIMIT) docUndoStack.shift();
      // Clearing redo stack on new change
      docRedoStack = [];
    }
  } catch { }
}

function debouncedPushSnapshot() {
  if (pushSnapshotDebounce) clearTimeout(pushSnapshotDebounce);
  pushSnapshotDebounce = setTimeout(pushDocSnapshot, 400);
}

async function handleUndo() {
  if (docUndoStack.length <= 1 || !window.editorjs) return;
  const current = docUndoStack.pop();
  const prev = docUndoStack[docUndoStack.length - 1];
  if (current) docRedoStack.push(current);
  await window.editorjs.render(prev);
}

async function handleRedo() {
  if (docRedoStack.length === 0 || !window.editorjs) return;
  const next = docRedoStack.pop();
  if (!next) return;
  docUndoStack.push(next);
  await window.editorjs.render(next);
}

function initEditorJS() {
  try {
    const holder = document.getElementById('editorjs');
    const saveBtn = document.getElementById('ejSaveBtn');
    if (!holder || typeof EditorJS === 'undefined') {
      console.warn('Editor.js or holder not found. Waiting for load or skipping.');
      return;
    }

    // Comprehensive global tool resolution with safety checks
    const tools = {
      header: {
        class: window.Header,
        inlineToolbar: ['link', 'bold', 'italic', 'inlineTranslate', 'inlineAIEnhance', 'highlightPlus', 'citation'],
        config: { placeholder: 'Enter a header' }
      },
      list: {
        class: window.List || window.EditorjsList,
        inlineToolbar: true,
        config: { defaultStyle: 'unordered' }
      },
      quote: {
        class: window.Quote,
        inlineToolbar: true
      },
      delimiter: window.Delimiter,
      inlineCode: window.InlineCode,
      code: window.CodeTool || window.Code,
      table: window.Table,
      marker: window.Marker,
      embed: {
        class: window.Embed,
        inlineToolbar: true,
        config: { services: { youtube: true, vimeo: true, codepen: true } }
      },
      // Enhanced inline tools
      inlineTranslate: window.InlineTranslate,
      inlineAIEnhance: window.InlineAIEnhance,
      highlightPlus: window.InlineHighlightPlus,
      citation: window.InlineCitation,
      stats: window.InlineStats,
      define: window.InlineDefine
    };

    // Add Image tool only if SimpleImage is defined
    if (typeof SimpleImage !== 'undefined') {
      tools.image = { class: SimpleImage };
    } else {
      console.warn('SimpleImage tool not found. Image features will be missing.');
    }

    // Filter out undefined tools
    const filteredTools = {};
    for (const [key, tool] of Object.entries(tools)) {
      if (tool && (typeof tool === 'function' || tool.class)) {
        filteredTools[key] = tool;
      }
    }

    // Set global tools for pagination system
    window.editorTools = filteredTools;

    // Initialize Document Pagination System
    window.documentPagination = new DocumentPagination({
      maxBlocksPerPage: 50,
      autoCreatePages: true
    });

    // Proxy window.editorjs for backward compatibility
    // This allows existing calls like window.editorjs.blocks.insert to still work
    const editorProxy = new Proxy({}, {
      get: (target, prop) => {
        const currentEditor = window.documentPagination.getCurrentEditor();
        if (!currentEditor) return undefined;

        // Handle method calls
        if (typeof currentEditor[prop] === 'function') {
          return currentEditor[prop].bind(currentEditor);
        }

        return currentEditor[prop];
      }
    });

    window.editorjs = editorProxy;

    console.log('📄 Document Pagination System integrated with Editor.js');

    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        try {
          const data = await window.editorjs.save();
          console.log('Editor.js output:', data);
          const out = document.getElementById('ejOutput');
          if (out) {
            out.textContent = JSON.stringify(data, null, 2);
            out.parentElement.classList.add('visible');
          }

          // ✨ ENHANCED: Save to Puter FS using PuterFS Manager
          if (window.puterFS && window.puterFS.isInitialized) {
            try {
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const filename = `document_${timestamp}.json`;
              const saved = await window.puterFS.saveDocument(data, filename, 'json');

              // ✨ ENHANCED: Save document metadata to KV store
              if (window.puterKV && window.puterKV.isInitialized) {
                try {
                  const metadata = {
                    filename: saved.name,
                    path: saved.path,
                    size: saved.size,
                    blockCount: data.blocks ? data.blocks.length : 0,
                    preview: data.blocks && data.blocks.length > 0
                      ? (data.blocks[0].data?.text || 'Untitled Document').substring(0, 100)
                      : 'Empty Document',
                    savedAt: Date.now()
                  };
                  await window.puterKV.saveDocumentMetadata(saved.name, metadata);
                } catch (kvError) {
                  console.warn('Failed to save document metadata to KV:', kvError);
                }
              }

              showNotification(`💾 Saved to cloud: ${saved.name}`, 'success');
            } catch (fsError) {
              console.warn('Cloud save failed:', fsError);
              showNotification('Document saved locally (cloud save failed)', 'warning');
            }
          } else {
            showNotification('Document saved successfully', 'success');
          }
        } catch (err) {
          console.error('Saving failed:', err);
          showNotification('Failed to save document', 'error');
        }
      });
    }
  } catch (error) {
    console.error('Failed to initialize Editor.js:', error);
    showNotification('Editor loading issue. Please refresh the page.', 'error');
  }
}

// ✨ ENHANCED: Load KV-based features on startup
window.addEventListener('load', async () => {
  // Wait for KV to initialize
  if (window.puterKV && window.puterKV.isInitialized) {
    try {
      // Track page load
      await window.puterKV.trackEvent('app_load', {
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      });

      // Restore session state
      const sessionState = await window.puterKV.loadSessionState();
      if (sessionState && sessionState.conversationId) {
        currentConversationId = sessionState.conversationId;
        const history = await window.puterKV.loadChatHistory(currentConversationId);
        if (history && history.length > 0) {
          popupChatHistory = history;
          console.log('✅ Restored chat history:', history.length, 'messages');
        }
      }
    } catch (error) {
      console.warn('KV startup features failed:', error);
    }
  }
});

// Save session state before page unload
window.addEventListener('beforeunload', async () => {
  if (window.puterKV && window.puterKV.isInitialized) {
    try {
      await window.puterKV.saveSessionState({
        conversationId: currentConversationId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Failed to save session state:', error);
    }
  }
});


// ================= Help Below Chat =================
window.addEventListener('DOMContentLoaded', () => {
  const copyBtn = document.getElementById('copyHelpPathBtn');
  const textEl = document.getElementById('helpPathText');
  copyBtn?.addEventListener('click', async () => {
    try {
      const text = textEl?.textContent || '';
      await navigator.clipboard.writeText(text);
      showNotification('Path copied to clipboard', 'success');
    } catch (e) {
      console.warn('Copy failed', e);
      showNotification('Failed to copy', 'error');
    }
  });
});

// ================= Folder Upload & Viewer =================
let currentFolderView = null; // { name, files: [{file, path, url, type}] }

function humanSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let i = -1, b = bytes;
  do { b /= 1024; i++; } while (b >= 1024 && i < units.length - 1);
  return `${b.toFixed(b < 10 ? 2 : 1)} ${units[i]}`;
}

function renderFolderChip() {
  const bar = document.getElementById('folderChipBar');
  if (!bar) return;
  bar.innerHTML = '';
  if (!currentFolderView) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  const chip = document.createElement('button');
  chip.setAttribute('type', 'button');
  chip.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid #e5e7eb;border-radius:16px;background:#fff;cursor:pointer;';
  chip.innerHTML = `
    <span style="font-size:14px">📁</span>
    <span style="font-weight:600;color:#111827;">${currentFolderView.name}</span>
    <span style="color:#6b7280;font-size:12px;">(${currentFolderView.files.length} items)</span>
  `;
  chip.addEventListener('click', () => {
    showFolderViewer();
  });
  bar.appendChild(chip);
}

function showFolderViewer() {
  if (!currentFolderView) return;
  const panel = document.getElementById('folderViewer');
  const title = document.getElementById('folderViewerTitle');
  const body = document.getElementById('folderViewerBody');
  if (!panel || !body || !title) return;
  title.textContent = currentFolderView.name;
  body.innerHTML = '';
  for (const item of currentFolderView.files) {
    const card = document.createElement('div');
    card.style.cssText = 'border:1px solid #e5e7eb;border-radius:8px;padding:10px;background:#fafafa;display:flex;gap:10px;align-items:center;';
    const icon = document.createElement(item.type.startsWith('image/') ? 'img' : (item.type.startsWith('video/') ? 'video' : 'div'));
    if (icon.tagName.toLowerCase() === 'img') {
      icon.src = item.url; icon.style.width = '48px'; icon.style.height = '48px'; icon.style.objectFit = 'cover'; icon.alt = item.path;
    } else if (icon.tagName.toLowerCase() === 'video') {
      icon.src = item.url; icon.style.width = '64px'; icon.style.height = '48px'; icon.muted = true; icon.loop = true; icon.autoplay = false; icon.controls = false; icon.style.objectFit = 'cover';
    } else {
      icon.textContent = '📄'; icon.style.fontSize = '22px';
    }
    const meta = document.createElement('div');
    meta.style.cssText = 'display:flex;flex-direction:column;min-width:0;';
    const nameEl = document.createElement('div');
    nameEl.style.cssText = 'font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%';
    nameEl.textContent = item.path.split('/').pop();
    const pathEl = document.createElement('div');
    pathEl.style.cssText = 'color:#6b7280;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%';
    pathEl.textContent = item.path;
    const sizeEl = document.createElement('div');
    sizeEl.style.cssText = 'color:#6b7280;font-size:12px;';
    sizeEl.textContent = humanSize(item.file.size);
    meta.appendChild(nameEl); meta.appendChild(pathEl); meta.appendChild(sizeEl);
    card.appendChild(icon); card.appendChild(meta);
    body.appendChild(card);
  }
  panel.style.display = 'block';
}

function hideFolderViewer() {
  const panel = document.getElementById('folderViewer');
  if (panel) panel.style.display = 'none';
}

function clearFolderView() {
  // revoke object URLs
  if (currentFolderView && currentFolderView.files) {
    for (const f of currentFolderView.files) { if (f.url) URL.revokeObjectURL(f.url); }
  }
  currentFolderView = null;
  renderFolderChip();
  hideFolderViewer();
}

function handleFolderFiles(fileList) {
  if (!fileList || fileList.length === 0) return;
  // Determine root folder name from first file's webkitRelativePath
  const first = fileList[0];
  const rel = first.webkitRelativePath || first.name; // fallback
  const root = rel.includes('/') ? rel.split('/')[0] : first.name;
  const items = [];
  for (const file of fileList) {
    const path = file.webkitRelativePath || file.name;
    const url = URL.createObjectURL(file);
    items.push({ file, path, url, type: file.type || 'application/octet-stream' });
  }
  currentFolderView = { name: root, files: items };
  renderFolderChip();
  showFolderViewer();
}

window.addEventListener('DOMContentLoaded', () => {
  const folderBtn = document.getElementById('folderUploadBtn');
  const folderInput = document.getElementById('hiddenFolderInput');
  const hideBtn = document.getElementById('hideFolderViewerBtn');
  const closeBtn = document.getElementById('closeFolderBtn');
  folderBtn?.addEventListener('click', () => folderInput?.click());
  folderInput?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    handleFolderFiles(files);
    // reset input to allow re-upload of same folder
    e.target.value = '';
  });
  hideBtn?.addEventListener('click', hideFolderViewer);
  closeBtn?.addEventListener('click', clearFolderView);
});

// ================= Plara Intelligence Suite Modal Logic =================

function toggleFeaturesModal(show) {
  if (show) {
    if (window.openFeaturesModal) window.openFeaturesModal();
  } else {
    if (window.closeFeaturesModal) window.closeFeaturesModal();
  }
}

// Global Modal Functions (Moved from inline script)
window.openFeaturesModal = function () {
  const modal = document.getElementById('featuresModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

window.closeFeaturesModal = function () {
  const modal = document.getElementById('featuresModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

window.filterFeatures = function () {
  const searchTerm = document.getElementById('featureSearch').value.toLowerCase();
  const cards = document.querySelectorAll('.feature-card');

  cards.forEach(card => {
    const title = card.querySelector('h3').textContent.toLowerCase();
    const desc = card.querySelector('.feature-desc').textContent.toLowerCase();
    const tags = card.getAttribute('data-tags') ? card.getAttribute('data-tags').toLowerCase() : '';

    if (title.includes(searchTerm) || desc.includes(searchTerm) || tags.includes(searchTerm)) {
      card.style.display = 'block'; {/* Use flex if your CSS uses flex for cards, but block works for grid child visibility usually, or just remove display:none */ }
      // Actually grid items don't have display:block usually, they just exist. 
      // Better to toggle hidden class or just let them display default. 
      // The Original script used block/none.
      card.style.display = 'flex'; // Feature cards use flex in CSS
    } else {
      card.style.display = 'none';
    }
  });
};

window.filterByCategory = function (category) {
  // Update active filter chip
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.classList.remove('active');
  });
  // Add active class to clicked button
  const buttons = document.querySelectorAll('.filter-chip');
  buttons.forEach(btn => {
    if (btn.textContent.toLowerCase().includes(category) || (category === 'all' && btn.textContent === 'All')) {
      btn.classList.add('active');
    }
  });

  const categories = document.querySelectorAll('.feature-category');

  if (category === 'all') {
    categories.forEach(cat => cat.style.display = 'block');
  } else {
    categories.forEach(cat => {
      const catAttr = cat.getAttribute('data-category');
      if (catAttr && catAttr.includes(category)) {
        cat.style.display = 'block';
      } else {
        cat.style.display = 'none';
      }
    });
  }
};

// Close modal on ESC key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    window.closeFeaturesModal();
  }
});

window.useFeature = function (command) {
  // Close modal
  toggleFeaturesModal(false);

  // Set input
  const input = document.getElementById('chatInput');
  if (input) {
    input.value = command + ' '; // Add space for user convenience
    input.focus();

    // Optional: animate input to draw attention
    input.style.transition = 'background 0.3s';
    input.style.background = '#e0f2fe';
    setTimeout(() => input.style.background = '', 500);
  }
};

// Event Listeners for Features Modal
document.addEventListener('DOMContentLoaded', () => {
  // UPDATED: Target the new nav button ID
  const btn = document.getElementById('features-nav-btn');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.openFeaturesModal) {
        window.openFeaturesModal();
      } else {
        console.error("openFeaturesModal not defined");
      }
    });
  }

  // Close on click outside (featuresModal is the new ID)
  const modal = document.getElementById('featuresModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      // The overlay is the parent container in the new design?
      // No, in the new styling structure:
      // <div id="featuresModal" class="features-modal">
      //    <div class="modal-overlay" onclick="closeFeaturesModal()"></div>
      //    <div class="modal-container"> ...
      //
      // The overlay is a sibling of container, inside the parent.
      // So checking e.target === modal (the parent wrapper) might work if padding is involved,
      // but the overlay div covers the background.
      // Since the overlay div has an onclick="closeFeaturesModal()" in the HTML, we don't strictly need this JS listener for background click.
      // But keeping it safe:
      if (e.target === modal) {
        if (window.closeFeaturesModal) window.closeFeaturesModal();
      }
    });
  }

  // Also listen for escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (window.closeFeaturesModal) window.closeFeaturesModal();
    }
  });
});


function toggleModelDropdown() {
  const dropdown = document.getElementById('modelDropdown');
  const btn = document.getElementById('modelSelector');
  if (!dropdown || !btn) return;

  if (dropdown.style.display === 'none') {
    // Show and position
    dropdown.style.display = 'block';
    const rect = btn.getBoundingClientRect();
    // Position above the button (bottom of dropdown aligned with top of button - spacing)
    // using fixed positioning relative to viewport
    dropdown.style.left = rect.left + 'px';
    dropdown.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
  } else {
    dropdown.style.display = 'none';
  }
}

function setSelectedModel(model) {
  selectedChatModel = model;

  // Update active class in dropdown
  document.querySelectorAll('.dropdown-item-dark').forEach(item => {
    if (item.getAttribute('data-model') === model) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update button text
  updateModelButtonUI(model);
}

function updateModelButtonUI(model) {
  const btn = document.getElementById('modelSelector');
  if (!btn) return;

  let label = '🚀 Gemini 3.0 Pro';
  if (model === 'claude-sonnet-4') label = '🧠 Sonnet 4.5';
  if (model === 'gemini-3-pro-preview') label = '🚀 Gemini 3.0 Pro';

  const span = btn.querySelector('span');
  if (span) span.textContent = label;
}
