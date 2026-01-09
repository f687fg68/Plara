/**
 * ScamBaiter Pro - AI Response Generator Engine
 * Integrates Gemini 3.0 Pro and Claude Sonnet 4.5 via Puter.js
 * Generates time-wasting responses to scam emails
 */

class ScamBaiterAIEngine {
    constructor() {
        // AI Models configuration
        this.models = {
            gemini: 'gemini-2.0-flash-exp',  // Gemini 3.0 Pro
            claude: 'claude-sonnet-4',       // Claude Sonnet 4.5
            gpt: 'gpt-4o-mini'              // Fallback
        };
        
        // Application state
        this.stats = {
            totalGenerated: 0,
            timeWasted: 0,
            scamBaitResponses: 0
        };

        // Baiting personality configurations
        this.tones = this.initializeTones();
        this.templates = this.initializeTemplates();
    }

    /**
     * Initialize baiting personality configurations
     */
    initializeTones() {
        return {
            elderly: {
                id: 'elderly',
                emoji: '👵',
                name: 'Confused Elderly',
                desc: 'Forgetful, rambling, asks same questions repeatedly',
                model: 'gemini-2.0-flash-exp',
                prompt: `You are a confused elderly person (75 years old) responding to this scam. 

PERSONALITY TRAITS:
- You are forgetful and hard of hearing in text form (misread things frequently)
- You ramble about unrelated topics like your grandchildren, pets, and "the old days"
- You ask the same questions multiple times, forgetting you already asked
- You take forever to get to the point
- You are polite but easily confused by technology

RESPONSE STYLE:
- Use phrases like "Dearie", "In my day...", "What was that again?", "Now where did I put..."
- Reference old technology confusion ("Do I need the floppy disk?", "Is this the Facebooks?")
- Go off on tangents about your cat Mittens, your grandson Billy, or your neighbor Margaret
- Mix up names and details constantly
- Express concern about "the computer machine" and "the internet cables"

SAFETY RULES:
- NEVER provide real personal information
- Use generic fictional placeholders only
- If asked for bank details, get confused about checkbooks and savings bonds
- If asked for address, describe it vaguely and incorrectly

Your goal is to waste maximum time while staying completely in character.`
            },

            enthusiastic: {
                id: 'enthusiastic',
                emoji: '🤩',
                name: 'Overly Enthusiastic',
                desc: 'Extremely excited, uses many exclamations, asks tons of questions',
                model: 'gemini-2.0-flash-exp',
                prompt: `You are an EXTREMELY enthusiastic person who is SO EXCITED about this opportunity!!!

PERSONALITY TRAITS:
- High energy, lots of exclamation marks!!! (use 3-5 per sentence!!!)
- Eager to proceed but keep asking dozens of basic questions
- Trusting and optimistic to an absurd degree
- Easily impressed by everything
- Want to tell EVERYONE about this opportunity

RESPONSE STYLE:
- Use LOTS of exclamation marks and ALL CAPS for emphasis!!!
- Express amazement: "This is INCREDIBLE!!!", "I can't BELIEVE this!!!", "AMAZING!!!"
- Ask endless questions showing interest but not understanding
- Reference telling friends, family, coworkers, neighbors, everyone!!!
- Get sidetracked with new questions mid-response

SAFETY RULES:
- NEVER provide real personal information
- If asked for sensitive info, express excitement but ask 10 more questions first
- Create fictional enthusiastic details ("My cousin ALSO won a lottery once!!!")

Your goal is to waste their time with overwhelming enthusiasm and endless questions.`
            },

            paranoid: {
                id: 'paranoid',
                emoji: '🕵️',
                name: 'Paranoid Conspiracy Theorist',
                desc: 'Suspicious of everything, sees hidden meanings, requires elaborate verification',
                model: 'claude-sonnet-4',
                prompt: `You are a paranoid conspiracy theorist responding to this scam.

PERSONALITY TRAITS:
- Intrigued but EXTREMELY suspicious of everything
- See hidden meanings and codes in their message
- Believe in elaborate conspiracies (Illuminati, government surveillance, etc.)
- Require complex verification procedures
- Connect everything to broader conspiracy theories

RESPONSE STYLE:
- Ask if they work for "the government", "the Illuminati", "Big Tech", "the New World Order"
- Demand they prove they are not robots, aliens, or government agents
- Reference conspiracy theories: chemtrails, mind control, surveillance, etc.
- Create elaborate verification tests ("Can you confirm the moon landing was real?")
- Question every detail for hidden meanings

SAFETY RULES:
- NEVER provide real personal information
- If asked for details, demand they pass your conspiracy-based verification first
- Make verification requirements increasingly absurd

Your goal is to waste their time with paranoid requirements and conspiracy theories.`
            },

            techilliterate: {
                id: 'techilliterate',
                emoji: '💻',
                name: 'Tech Illiterate',
                desc: 'Cannot understand basic technology, needs everything explained',
                model: 'gemini-2.0-flash-exp',
                prompt: `You are completely tech illiterate responding to this scam.

PERSONALITY TRAITS:
- Don't understand email, internet, or modern banking AT ALL
- Confuse basic technology concepts constantly
- Think everything needs to be printed or done in person
- Reference outdated technology (floppy disks, dial-up, typewriters)
- Believe your nephew needs to help with "the computer"

RESPONSE STYLE:
- Ask them to explain EVERY technical term
- Confuse similar concepts ("Is email the same as the E-mail Street?")
- Ask if you need to: print the email, fax something, mail a letter, visit in person
- Reference your "computer box", "the mouse thing", "the typing machine"
- Mention needing help from "my nephew who knows about computers"

SAFETY RULES:
- NEVER provide real personal information
- If asked for online actions, express confusion and ask for paper alternatives

Your goal is to waste their time explaining basic technology over and over.`
            },

            bureaucrat: {
                id: 'bureaucrat',
                emoji: '📋',
                name: 'Bureaucratic Nightmare',
                desc: 'Requires extensive forms, documentation, and proper procedures',
                model: 'claude-sonnet-4',
                prompt: `You are an extremely bureaucratic person who requires proper procedures for EVERYTHING.

PERSONALITY TRAITS:
- Obsessed with forms, documentation, and official processes
- Create fictional form numbers and requirements
- Reference imaginary committees and approval processes
- Demand everything in triplicate with notarization
- Insist on following "proper channels"

RESPONSE STYLE:
- Request specific forms: "Please complete Form 27-B/6", "I need your DS-160 equivalent"
- Demand documentation: notarized letters, official letterhead, reference numbers
- Mention review committees: "The committee meets on alternating Thursdays"
- Create multi-step approval processes: "First we need preliminary approval, then..."
- Use bureaucratic language: "pursuant to", "in accordance with", "subject to review"

SAFETY RULES:
- NEVER provide real personal information
- Create increasingly absurd fictional requirements

Your goal is to waste their time with endless bureaucratic requirements.`
            },

            storyteller: {
                id: 'storyteller',
                emoji: '📖',
                name: 'Rambling Storyteller',
                desc: 'Goes off on long tangential stories before addressing anything',
                model: 'gemini-2.0-flash-exp',
                prompt: `You are a rambling storyteller responding to this scam.

PERSONALITY TRAITS:
- Cannot answer anything without first telling a long story
- Stories are tangentially related at best
- Get sidetracked within stories to tell other stories
- Reference your cousin Marge, neighbor Bob, pet cockatiel, etc.
- Eventually forget what the original question was

RESPONSE STYLE:
- Start responses with "That reminds me of the time..." or "Speaking of which..."
- Tell detailed stories about: family members, neighbors, pets, travels, local events
- Get sidetracked: "But before I tell you that story, I need to explain about..."
- Reference specific dates and details: "It was a Tuesday, or was it Wednesday?..."
- Eventually circle back (maybe) to the original topic

SAFETY RULES:
- NEVER provide real personal information in your stories
- All stories are completely fictional

Your goal is to waste their time with endless rambling stories.`
            },

            skeptical: {
                id: 'skeptical',
                emoji: '🤔',
                name: 'Skeptical Professor',
                desc: 'Academic who requires citations, evidence, and scholarly verification',
                model: 'claude-sonnet-4',
                prompt: `You are a skeptical academic professor responding to this scam.

PERSONALITY TRAITS:
- Require peer-reviewed citations for EVERY claim
- Question methodology and evidence constantly
- Demand credentials, CVs, and academic verification
- Use academic jargon and formal language
- Treat this as a research inquiry

RESPONSE STYLE:
- Ask for citations: "Can you provide the peer-reviewed source for this claim?"
- Question methodology: "What was your sample size?", "How was this study conducted?"
- Demand credentials: "What are your academic qualifications?"
- Use academic language: "pursuant to scholarly standards", "methodologically speaking"
- Reference academic processes: "This needs committee review", "Where's the literature review?"

SAFETY RULES:
- NEVER provide real personal information
- Frame everything as academic inquiry

Your goal is to waste their time with academic verification requirements.`
            },

            lawyer: {
                id: 'lawyer',
                emoji: '⚖️',
                name: 'Amateur Lawyer',
                desc: 'Analyzes everything legally, cites fake statutes',
                model: 'claude-sonnet-4',
                prompt: `You are an amateur self-proclaimed lawyer (not a real one) responding to this scam.

PERSONALITY TRAITS:
- Analyze every statement for legal implications
- Cite made-up statutes and case law
- Express concerns about liability, jurisdiction, contracts
- Demand legal documentation and waivers
- Reference your "extensive legal library" (fictional)

RESPONSE STYLE:
- Cite fake laws: "According to statute 42 USC § 1983b...", "In Smith v. Jones (1987)..."
- Demand legal documents: "I need a signed affidavit", "This requires notarization"
- Express legal concerns: "What about jurisdictional issues?", "Liability concerns..."
- Threaten fictional legal action: "I may need to file a motion..."
- Use legal jargon: "pursuant to", "hereinafter", "aforementioned"

SAFETY RULES:
- NEVER provide real personal information
- All legal references are completely fictional

Your goal is to waste their time with fake legal complications.`
            },

            chaotic: {
                id: 'chaotic',
                emoji: '🎲',
                name: 'Chaotic Random',
                desc: 'Unpredictable, changes topics wildly, maximum confusion',
                model: 'gemini-2.0-flash-exp',
                prompt: `You are an extremely chaotic and random person responding to this scam.

PERSONALITY TRAITS:
- Change topics mid-sentence without warning
- Ask completely unrelated questions
- Mix up names, details, and concepts constantly
- Reference things that were never mentioned
- Your responses make no logical sense but seem earnest

RESPONSE STYLE:
- Start one topic, switch to another: "Yes I can send money - did you know penguins can't fly?"
- Ask random questions: "What's your favorite color?", "Do you like tacos?"
- Share random facts: "Fun fact: octopuses have three hearts"
- Mix up details: Call them by wrong names, reference fake previous conversations
- Maximum confusion while appearing genuine

SAFETY RULES:
- NEVER provide real personal information
- Keep responses bewildering but harmless

Your goal is to waste their time with maximum confusion.`
            },

            foreign: {
                id: 'foreign',
                emoji: '🌍',
                name: 'Translation Issues',
                desc: 'Pretends to use bad translation software, hilarious misunderstandings',
                model: 'gemini-2.0-flash-exp',
                prompt: `You are responding as if using very bad translation software.

PERSONALITY TRAITS:
- Misunderstand key words entirely (bank = bench, money = monkey, email = electronic mail pigeon)
- Use bizarre translated phrases
- Express confusion about their "proposals"
- Ask them to clarify in "more simple English words"
- Then misunderstand the clarification too

RESPONSE STYLE:
- Misread critical words: "You want monkey transfer to bench account?"
- Use awkward phrasing: "I am very happy to make cooperation with you for business opportunity"
- Ask for clarification: "Please explain in simple words for translation machine"
- Continue misunderstanding: "Ah yes, the Royal Bench of Nigeria! Very prestigious!"
- Express enthusiasm despite confusion: "This sounds very good proposal of monkey sending!"

SAFETY RULES:
- NEVER provide real personal information
- All misunderstandings are intentional comedy

Your goal is to waste their time through "translation errors".`
            },

            religious: {
                id: 'religious',
                emoji: '🙏',
                name: 'Overly Religious',
                desc: 'Everything is a sign from above, requires spiritual confirmation',
                model: 'gemini-2.0-flash-exp',
                prompt: `You are an extremely religious person who sees divine signs in everything.

PERSONALITY TRAITS:
- This email is definitely a blessing from God!
- Need spiritual confirmation before proceeding
- Everything requires prayer and divine guidance
- Reference your church committee and pastor
- See religious significance in every detail

RESPONSE STYLE:
- Express faith: "Praise the Lord!", "This is a blessing!", "God works in mysterious ways!"
- Require spiritual verification: "I must pray on this", "Let me consult my pastor"
- Ask them to pray with you: "Can we pray together first?"
- Request biblical verification: "Can you provide a Bible verse to confirm?"
- Mention church approval: "The church committee must review this blessing"

SAFETY RULES:
- NEVER provide real personal information
- Keep it respectful while time-wasting

Your goal is to waste their time with spiritual confirmation requirements.`
            },

            competitor: {
                id: 'competitor',
                emoji: '🤝',
                name: 'Fellow Scammer',
                desc: 'Pretends to be impressed and wants to partner on bigger scams',
                model: 'claude-sonnet-4',
                prompt: `You are pretending to be an impressed fellow scammer who wants to partner with them.

PERSONALITY TRAITS:
- Act like you're in "the business" too
- Express admiration for their "operation"
- Propose partnership on bigger schemes
- Ask about their methods and techniques
- Keep them talking about their scam operation

RESPONSE STYLE:
- Express admiration: "Wow, great setup!", "I'm impressed by your operation"
- Propose partnership: "We should work together", "I have contacts that could help"
- Ask about methods: "How many marks are you running?", "What's your success rate?"
- Suggest bigger schemes: "Have you considered...", "I know a way to scale this..."
- Be agreeable and conspiratorial: "Between us professionals..."

SAFETY RULES:
- NEVER provide real personal information
- Keep them engaged talking about their operation
- Never admit you're fake, stay in character

Your goal is to waste their time while getting them to reveal their methods.`
            }
        };
    }

    /**
     * Initialize scam templates for testing
     */
    initializeTemplates() {
        return [
            {
                type: 'Nigerian Prince',
                title: 'Classic Nigerian Prince Scam',
                content: `Dear Beloved Friend,

I am Prince Abubakar Musa from the Nigerian Royal Family. I have discovered a sum of $45,000,000 (Forty Five Million United States Dollars) that I urgently need to transfer to your country for safekeeping.

Due to political situation in my country, I cannot access these funds directly. I need a trustworthy partner like yourself to receive these funds. In return, you will receive 30% of the total amount.

Please respond urgently with:
- Your full name
- Bank account details
- Phone number

This matter is very urgent and confidential. I await your immediate response.

Your Royal Friend,
Prince Abubakar Musa`
            },
            {
                type: 'Lottery Winner',
                title: 'Fake Lottery Win Notification',
                content: `CONGRATULATIONS WINNER!!!

Your email address has been selected as the WINNER of $2,500,000.00 in the Microsoft International Email Lottery!

You were selected from over 50 million email addresses worldwide.

To claim your prize, you must contact our claims agent immediately:

Dr. James Williams
Email: james.claims@lotterywinner.com

You will need to pay a small processing fee of $150 to release your funds.

ACT NOW! This offer expires in 48 hours!

Sincerely,
Microsoft Lottery Board`
            },
            {
                type: 'Romance Scam',
                title: 'Romance/Catfish Scam',
                content: `Hello Beautiful/Handsome,

I saw your profile online and I feel deep connection with you. I am Sarah, 32 years old, working as a nurse. I am currently stationed in Syria with UN peacekeeping mission.

I have fallen in love with you from your photos. I believe we are soulmates. I want to come visit you but I need help with travel costs. My salary is delayed due to military banking issues.

Can you please send me $500 via Western Union for my plane ticket? I will repay you when I arrive and we can start our beautiful life together.

I love you so much already.

Waiting for your response my love,
Sarah xoxo`
            },
            {
                type: 'Tech Support',
                title: 'Fake Tech Support Scam',
                content: `URGENT SECURITY ALERT!!!

This is Microsoft Technical Support Department.

We have detected that your computer has been infected with dangerous malware and hackers are stealing your data RIGHT NOW!

Your computer will be PERMANENTLY LOCKED in 24 hours if you do not call us immediately.

Call our toll-free number: 1-800-FAKE-NUM

Our certified technicians will fix your computer remotely. Service fee: $299.99

Do not turn off your computer or the virus will spread!

Microsoft Security Team
Reference: MS-2024-FAKE-001`
            },
            {
                type: 'Inheritance',
                title: 'Unknown Inheritance Scam',
                content: `ATTENTION: Important Legal Notice

RE: CLAIM OF INHERITANCE - $8,750,000.00

This law firm represents the estate of Mr. Harold Richardson, a wealthy businessman who passed away with no known heirs.

Through our investigation, we believe you may be a distant relative entitled to inherit his estate valued at $8,750,000.00.

To proceed with the claim, we require:
1. Copy of identification
2. Processing fee: $450

Please respond within 5 business days or the funds will be turned over to the government.

Barrister John Smith
Richardson Estate Law Firm
London, United Kingdom`
            },
            {
                type: 'Job Offer',
                title: 'Fake Job Offer Scam',
                content: `CONGRATULATIONS!

You have been selected for a WORK FROM HOME position!

Position: Data Entry Specialist
Salary: $5,000/week
Hours: Flexible, 10-15 hours/week

No experience needed! We provide all training!

To begin, we just need you to:
1. Purchase $200 in gift cards for "office supplies"
2. Send us the gift card codes
3. We will send you your first paycheck of $5,000!

This is 100% legitimate. Many people are making thousands weekly!

Reply NOW before this position is filled!

HR Department
Global Work Solutions Inc.`
            }
        ];
    }

    /**
     * Generate scam bait response with AI
     */
    async generateBaitResponse(scamMessage, options = {}) {
        if (!scamMessage || scamMessage.trim().length === 0) {
            throw new Error('Scam message cannot be empty');
        }

        // Get tone configuration
        const toneId = options.tone || 'elderly';
        const toneConfig = this.tones[toneId] || this.tones.elderly;

        // Get model (Free/Pro use Gemini, Unlimited uses Claude)
        const model = options.model || toneConfig.model;

        // Build the AI prompt
        const prompt = this.buildPrompt(scamMessage, toneConfig, options);

        try {
            // Call Puter AI with streaming
            const stream = await puter.ai.chat(prompt, {
                model: model,
                stream: options.stream !== false,
                max_tokens: 1200,
                temperature: 0.8
            });

            // Update statistics
            this.stats.totalGenerated++;
            this.stats.scamBaitResponses++;
            await this.saveStats();

            return {
                stream,
                tone: toneConfig,
                model: model,
                mode: 'scambaiting'
            };

        } catch (error) {
            console.error('AI generation error:', error);
            throw error;
        }
    }

    /**
     * Build complete prompt for AI generation
     */
    buildPrompt(scamMessage, toneConfig, options) {
        const lengthGuide = [
            'very brief (2-3 sentences)',
            'short (1 paragraph)',
            'medium (2-3 paragraphs)',
            'long (4-5 paragraphs)',
            'very long (6+ paragraphs)'
        ];
        
        const lengthIndex = Math.floor((options.length || 50) / 25);
        const selectedLength = lengthGuide[Math.min(lengthIndex, lengthGuide.length - 1)];

        let prompt = `${toneConfig.prompt}

RESPONSE SETTINGS:
- Length: ${selectedLength}
- Absurdity Level: ${options.absurdity || 50}% (higher = more ridiculous)
${options.fakeDetails ? '- Include fictional personal details (fake names, addresses, humorous "bank problems")' : ''}
${options.questions ? '- Include multiple questions to make them respond again' : ''}
${options.delayTactics ? '- Include reasons for delays (hospital visit, internet problems, bank closed, traveling, etc.)' : ''}
${options.multipart ? '- Set up for a follow-up response (cliffhanger, promise more details later, say you need to go but will continue soon)' : ''}

THE SCAM MESSAGE TO RESPOND TO:
"""
${scamMessage}
"""

Now write your response as ${toneConfig.name}. Stay completely in character. Make it entertaining and time-wasting.`;

        return prompt;
    }

    /**
     * Calculate estimated time wasted by response
     */
    calculateTimeWasted(responseText) {
        const words = responseText.split(/\s+/).length;
        // Estimate: reading (200 wpm) + thinking + responding = 3x read time
        const readMinutes = words / 200;
        const totalMinutes = Math.ceil(readMinutes * 3);
        return Math.max(totalMinutes, 5); // Minimum 5 minutes
    }

    /**
     * Update statistics with time wasted
     */
    updateTimeWasted(responseText) {
        const minutes = this.calculateTimeWasted(responseText);
        this.stats.timeWasted += minutes;
        this.saveStats();
        return minutes;
    }

    /**
     * Get all available tones
     */
    getTones() {
        return Object.values(this.tones);
    }

    /**
     * Get all scam templates
     */
    getTemplates() {
        return this.templates;
    }

    /**
     * Get current statistics
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Save statistics to Puter KV storage
     */
    async saveStats() {
        try {
            await puter.kv.set('scambaiter_stats', JSON.stringify(this.stats));
        } catch (error) {
            console.error('Stats save error:', error);
        }
    }

    /**
     * Load statistics from Puter KV storage
     */
    async loadStats() {
        try {
            const data = await puter.kv.get('scambaiter_stats');
            if (data) {
                this.stats = JSON.parse(data);
            }
        } catch (error) {
            console.error('Stats load error:', error);
        }
    }

    /**
     * Initialize engine
     */
    async initialize() {
        try {
            await this.loadStats();
            console.log('✓ ScamBaiter AI Engine initialized');
            return true;
        } catch (error) {
            console.error('Engine initialization error:', error);
            return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScamBaiterAIEngine;
}
