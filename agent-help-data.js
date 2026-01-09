/**
 * Agent Help Data
 * Contains "How to Use" instructions for all Plara AI Agents
 */

const AGENT_HELP_DATA = {
    "regulatory": {
        "title": "AI Regulatory Response Writer",
        "icon": "📋",
        "summary": "Bureaucratic Navigator that turns high-stakes government notices into professional response drafts.",
        "problem": "Small businesses often miss deadlines or send poorly worded replies because lawyers are too expensive, leading to fines or shutdowns.",
        "solution": "An AI that converts complex regulatory 'legalese' into a formal, structured, and legally-toned response letter.",
        "steps": [
            {
                "title": "1. Input Phase",
                "content": "Upload the Notice (PDF/text). Provide Facts (evidence like 'Fixed railing Jan 5th'). Define Tone (Conciliatory, Defensive, or Clarifying)."
            },
            {
                "title": "2. Drafting Phase",
                "content": "Use specific prompts: 'Draft response to Section 3.2 acknowledging oversight but highlighting corrective action' or 'Cite specific reference numbers'."
            },
            {
                "title": "3. Review & Export",
                "content": "Compare levels of assertiveness. AI adds a standard legal disclaimer footer. Export as formatted PDF or Word doc."
            }
        ],
        "market": "SMBs in Construction, Healthcare, Logistics ($99–$399/mo)."
    },
    "dispute": {
        "title": "AI Dispute & Chargeback Response Writer",
        "icon": "💳",
        "summary": "Digital Claims Advocate that bridges the gap between merchant evidence and persuasive logic.",
        "problem": "Merchants lose disputes because of emotional or disorganized responses that don't meet bank evidentiary standards.",
        "solution": "AI analyzes reason codes (Stripe 10.4, etc.) and generates structured, evidence-backed rebuttals.",
        "steps": [
            {
                "title": "1. Identify Reason Code",
                "content": "Input the specific code (e.g. Stripe 10.4). AI pulls the correct legal/policy levers based on this code."
            },
            {
                "title": "2. Supply Evidence Stack",
                "content": "Upload tracking info, customer chat logs, IP addresses, signed contracts, or TOS checkboxes."
            },
            {
                "title": "3. Generate Rebuttal",
                "content": "AI transforms facts into concise arguments (Visa/Mastercard guidelines). Bank reps often only spend 60 seconds reviewing."
            }
        ],
        "market": "E-commerce and SaaS providers needing ROI on profit recovery."
    },
    "insurance": {
        "title": "AI Insurance Claim Response Writer",
        "icon": "🚑",
        "summary": "Claims Advocate designed to break through 'Insurance Stall Tactics' and hostile legalese.",
        "problem": "Insurers use complex language to delay or deny payouts. Most people give up faced with 10-page rejections.",
        "solution": "AI deconstructs rejections, identifies 'policy triggers', and cites policy language back at the insurer.",
        "steps": [
            {
                "title": "1. Deconstruction Phase",
                "content": "Upload Rejection Letter + Insurance Policy (SPD). Ask AI to find contradictions between coverage and denial."
            },
            {
                "title": "2. Gap Filling Phase",
                "content": "Paste 'Request for Evidence' list. AI creates a Checklist of Proof (photos, receipts, statements) to make response 'denial-proof'."
            },
            {
                "title": "3. Assertive Draft",
                "content": "Generate response quoting specific Sections. Use 'Status Inquiry' letters referencing 'Prompt Payment' laws if they don't reply in 10 days."
            }
        ],
        "market": "B2C and SMBs facing 6-12 month claim cycles."
    },
    "appeal": {
        "title": "AI Academic / Institutional Appeal Response Writer",
        "icon": "🎓",
        "summary": "Crisis Navigator that translates student situations into professional, rubric-aligned appeals.",
        "problem": "Students respond with emotional 'over-sharing' or accidental admissions of guilt that hurt their case.",
        "solution": "AI turns narratives into structured appeals focusing on Accountability, Remediation, and Evidence.",
        "steps": [
            {
                "title": "1. Context Upload",
                "content": "Paste Allegation Notice + University Policy link/text. Provide your 'Raw Narrative' (e.g. sick with doctor's note)."
            },
            {
                "title": "2. Strategic Tone Setting",
                "content": "AI drafts response acknowledging oversight (Accountability), explaining illness (Evidence), and proposing a plan (Remediation)."
            },
            {
                "title": "3. Financial/Exam Appeals",
                "content": "AI analyzes 'Satisfactory Academic Progress' (SAP) criteria. Drafts letters for financial hardship or grade disputes."
            }
        ],
        "market": "High-volume student market, especially international students."
    },
    "pushback": {
        "title": "AI Vendor & Contract Pushback Response Writer",
        "icon": "🛡️",
        "summary": "Virtual Procurement Officer that turns B2B confrontation into standardized commercial logic.",
        "problem": "SMBs/Freelancers accept unfair price hikes or terms because they don't know how to push back professionally.",
        "solution": "AI drafts counter-offers based on market rates, SLA failures, or budget constraints.",
        "steps": [
            {
                "title": "1. Leverage Input",
                "content": "Upload price hike notice + performance data (outages, missed deadlines) + competitor pricing."
            },
            {
                "title": "2. Strategic Drafting",
                "content": "Choose strategy: 'Bundle' (lock rate for 12mo), 'SLA Call-out' (cite outages), or 'Budget Hardball'."
            },
            {
                "title": "3. Tone Calibration",
                "content": "Set to 'Soft but Firm' (long-term partners) or 'Strictly Contractual'. Draft 'Walk-Away' letters to trigger Retention Dept."
            }
        ],
        "market": "B2B SaaS and Agencies looking for direct savings."
    },
    "patient": {
        "title": "Healthcare Patient Portal Response Assistant",
        "icon": "⚕️",
        "summary": "Clinical Scribe and Patient Liaison designed to prevent medical provider burnout.",
        "problem": "Portal messages have tripled. Doctors quit because they spend more time typing than treating.",
        "solution": "AI ingests charts + patient queries to draft medically sound, compassionate responses for review.",
        "steps": [
            {
                "title": "1. Contextual Loading",
                "content": "Paste Patient Message + Lab Results + Chart Notes. AI reviews the 'full story' before drafting."
            },
            {
                "title": "2. Layman Translation",
                "content": "AI explains CBC or lab results in simple terms. E.g. 'high WBC is expected given your recent cold'."
            },
            {
                "title": "3. Triage & Follow-up",
                "content": "AI categorizes urgency and drafts follow-up questions about symptoms. Doctor performs final 'Safety Check'."
            }
        ],
        "market": "Clinics, Hospitals, Independent Practices (B2B)."
    },
    "rfp": {
        "title": "Government RFP Response Writer",
        "icon": "🏛️",
        "summary": "Technical Proposal Lead that ensures 100% compliance with rigid government response matrices.",
        "problem": "Single missing checkboxes lead to disqualification. Manual cross-referencing is grueling.",
        "solution": "AI cross-references SOW against Company Past Performance using exact evaluator terminology.",
        "steps": [
            {
                "title": "1. Requirement Shredding",
                "content": "Upload Sections C, L, and M. AI extracts all 'Shall' statements into a compliance matrix."
            },
            {
                "title": "2. DNA Loading",
                "content": "Upload winning proposals, Capability Statements, and Resumes. AI maps past success to current needs."
            },
            {
                "title": "3. Evaluator Drafting",
                "content": "AI uses exact SOW terminology. Removes 'marketing fluff'; replaces with 'we will' and 'documented results'."
            }
        ],
        "market": "GovCon (Government Contractors) chasing multi-million dollar contracts."
    },
    "churn": {
        "title": "Customer Success Churn Prevention Response Engine",
        "icon": "🔄",
        "summary": "Strategic Account Manager that moves from 'closing tickets' to 'closing gap in value'.",
        "problem": "Support treats 'can't find feature' as tech tickets; it's actually a churn signal. Generic replies fail.",
        "solution": "AI analyzes frustration + health scores + contract value to draft 'Success Path' responses.",
        "steps": [
            {
                "title": "1. Risk Assessment",
                "content": "Paste Angry Ticket + Usage Stats (e.g. login drop) + Contract Value. Identity if user is 'VIP'."
            },
            {
                "title": "2. Prescriptive Drafting",
                "content": "Draft response with API documentation, call offer, or Special Offer (free month) to save account."
            },
            {
                "title": "3. Internal Escalation",
                "content": "AI suggests internal notes: 'Champion Departure detected. Suggest VP Sales outreach immediately'."
            }
        ],
        "market": "B2B SaaS focused on LTV (Lifetime Value) protection."
    },
    "discovery": {
        "title": "Legal Discovery Response Generator",
        "icon": "⚖️",
        "summary": "Senior Litigation Paralegal that automates the 'billable hour' grunt work of discovery.",
        "problem": "Manual cross-referencing of case files for Interrogatories takes hundreds of hours and risks error.",
        "solution": "AI searches 'Case Universe' and drafts responses citing Bates-stamped documents.",
        "steps": [
            {
                "title": "1. Evidence Ingestion",
                "content": "Upload Case Universe (depositions, emails, contracts) + Opposing Counsel's Interrogatories."
            },
            {
                "title": "2. Objection Layer",
                "content": "AI suggests standard objections ('Overly broad', 'Attorney-client privilege') before factual answers."
            },
            {
                "title": "3. Verified Response",
                "content": "AI synthesizes answers citing specific Bates numbers (e.g. DEF001). Performs 'Privilege Audit' scan."
            }
        ],
        "market": "Law Firms and In-house Legal Departments looking for margin expansion."
    },
    "exec": {
        "title": "Executive Email Ghostwriter",
        "icon": "✒️",
        "summary": "Digital Chief of Staff for nuanced, high-stakes C-Suite political communication.",
        "problem": "Single poorly worded emails can tank stock or morale. Leaders lack time for nuanced drafting.",
        "solution": "AI mirrors executive voice while factoring in organizational power dynamics and politics.",
        "steps": [
            {
                "title": "1. Voice Calibration",
                "content": "Upload 5-10 past emails/memos. AI analyzes sentence length, tone ('Commanding' vs 'Collaborative')."
            },
            {
                "title": "2. Political Context",
                "content": "Input 'Who' and 'Why'. (e.g. 'Board member unhappy with Q3'). AI drafts to reassure without defensive tone."
            },
            {
                "title": "3. Edit-and-Learn",
                "content": "Refine draft; AI learns preferences (e.g. prefers 'Partners' over 'Employees')."
            }
        ],
        "market": "Mid-to-Large Enterprises (500+ employees)."
    },
    "safe": {
        "title": "AI Response Generator for Online Harassment",
        "icon": "🛡️",
        "summary": "Digital Shield that provides 'calm-as-a-service' to reclaim digital safety.",
        "problem": "Harassment provokes emotional reactions. Responding in anger escalates; silence feels powerless.",
        "solution": "AI strips emotion, providing neutral 'Gray Rock' or firm boundary responses to protect mental health.",
        "steps": [
            {
                "title": "1. Input (Safe Exposure)",
                "content": "Paste harassing comment/DM. Briefly state context (Public post vs Private email)."
            },
            {
                "title": "2. Tone Selection",
                "content": "Pick strategy: 'Gray Rock' (boring/neutral), 'Firm Boundary' (warning), or 'Professional Pivot'."
            },
            {
                "title": "3. Generation & Reporting",
                "content": "Generate 3 options. Ask AI to summarize why it violates Community Guidelines for your report."
            }
        ],
        "market": "Mass-market B2C, influencers, and Brand Managers."
    },
    "scam": {
        "title": "AI Response Generator for Scam Baiting",
        "icon": "🎣",
        "summary": "Digital Vigilante Persona designed to waste scammers' time with adversarial design.",
        "problem": "Scammers target vulnerable people; response is often defensive or silent.",
        "solution": "Adversarial AI that creates believable, high-friction distractions to keep scammers busy.",
        "steps": [
            {
                "title": "1. Paste the Hook",
                "content": "Paste the scam email or 'I have your password' message. AI identifies the scam type."
            },
            {
                "title": "2. Pick Persona",
                "content": "Select 'Elderly & Confused', 'Tech Newbie', or 'Difficult Skeptic'. AI generates friction."
            },
            {
                "title": "3. Loop & Friction",
                "content": "AI generates questions to prolong the chat. Share logs to help security communities."
            }
        ],
        "market": "Security enthusiasts and individuals wanting to fight back."
    },
    "civil": {
        "title": "AI Civil Political Discourse Generator",
        "icon": "🗣️",
        "summary": "Neutral Moderator that transforms polarized attacks into objective, value-based dialogue.",
        "problem": "Online political discourse devolves into ad hominem attacks. People fear toxic engagement.",
        "solution": "AI deconstructs hostile arguments, finds shared values, and drafts nuanced counterpoints.",
        "steps": [
            {
                "title": "1. Deconstruction Input",
                "content": "Paste the hostile political post. Briefly state your own position for context."
            },
            {
                "title": "2. Strategy Dial",
                "content": "Choose: 'Socratic Method' (questions), 'Common Ground Bridge', or 'Steel-Man' (strongest version of their view)."
            },
            {
                "title": "3. Fact Weaving",
                "content": "AI filters 'trigger words' and weaves in your provided stats/facts naturally, not as a lecture."
            }
        ],
        "market": "Civic Leaders, Educators, and Public-Facing Professionals."
    },
    "mortgage": {
        "title": "Mortgage Denial/Appeal Response Writing",
        "icon": "🏠",
        "summary": "B2B Compliance Engine for standardizing Adverse Action Notices and Path-to-Approval.",
        "problem": "Manual drafting of denial letters is a bottleneck. Errors trigger CFPB audits and lawsuits.",
        "solution": "AI ingests AUS findings and credit data to generate legally compliant, explainable denial letters.",
        "steps": [
            {
                "title": "1. Data Ingestion",
                "content": "Ingest DU/LP findings (DTI, LTV, Credit). Mapping raw data to CFPB Reason Codes."
            },
            {
                "title": "2. Regulatory Alignment",
                "content": "AI drafts Adverse Action Notice strictly adhering to Regulation B and FCRA requirements."
            },
            {
                "title": "3. Path to Approval",
                "content": "AI suggests steps (e.g. 'Pay down $5k debt') to help applicant qualify in the future."
            }
        ],
        "market": "Mid-sized Lenders and Fintech Infrastructure (B2B)."
    },
    "patent": {
        "title": "Patent Office Response Writing",
        "icon": "🔬",
        "summary": "Senior Patent Strategist for Claim-to-Prior-Art mapping and Office Action rebuttals.",
        "problem": "Drafting responses is labor-intensive ($2k-$5k+). Mapping claims to prior art is manual and slow.",
        "solution": "AI ingests Office Actions (§101, §102, §103) and drafts amendments + technical arguments.",
        "steps": [
            {
                "title": "1. Rejection Shredder",
                "content": "Upload Office Action + Cited Prior Art. AI creates tables of element-to-reference mappings."
            },
            {
                "title": "2. Strategic Novelty",
                "content": "AI suggests amendments that incorporate specs features NOT in prior art to overcome rejections."
            },
            {
                "title": "3. Remarks Drafting",
                "content": "Formal 'Remarks' section drafted for USPTO/EPO rules. Antecedent basis and §112 support check."
            }
        ],
        "market": "Law Firms and In-house IP Departments."
    },
    "health-b2b": {
        "title": "Healthcare Claim Denial/Appeal (B2B)",
        "icon": "🏥",
        "summary": "Revenue Recovery specialist for hospitals battling AI-driven payer denials.",
        "problem": "Payers use AI to deny 10-20% of claims. Staff suffer 'denial fatigue', abandoning billions.",
        "solution": "AI analyzes EOBs + clinical charts to generate multi-page, medically-necessary appeals.",
        "steps": [
            {
                "title": "1. Triage Phase",
                "content": "Export denial lists from Epic/Cerner. AI prioritizes based on 'Likelihood of Overturn' and Value."
            },
            {
                "title": "2. Clinical Mapping",
                "content": "AI extracts vitals, diagnoses, and failed trial data to prove medical necessity for CO-50 codes."
            },
            {
                "title": "3. Heavy-Duty Appeal",
                "content": "Draft formal Level 1 Appeal citing Payer Medical Policy. Includes lab tables and external review requests."
            }
        ],
        "market": "Health Systems and RCM (Revenue Cycle Management) companies."
    },
    "prior-auth": {
        "title": "Healthcare Prior Authorization Denial Response",
        "icon": "📋",
        "summary": "Utilization Management Specialist for medical practices reversing PA rejections.",
        "problem": "Submission is solved, but denials hit a wall. Manual data hunting causes surgery delays.",
        "solution": "AI ingests Payer Clinical Policy Bulletins (CPB) to 'check the boxes' the insurer says were missed.",
        "steps": [
            {
                "title": "1. Logic Gap Analysis",
                "content": "Compare submission to CPB. Identify exactly what criteria (e.g. 'Step Therapy') is missing."
            },
            {
                "title": "2. Data Mining",
                "content": "AI searches chart for evidence of failed alternatives. Extracts dates and reasons for treatment failure."
            },
            {
                "title": "3. Urgency Rebuttal",
                "content": "Drafts Appeal citing clinical risk of delay. Generates 'Doctor Talking Points' for Peer-to-Peer calls."
            }
        ],
        "market": "Medical Practices and Surgical Centers."
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AGENT_HELP_DATA;
} else {
    window.AGENT_HELP_DATA = AGENT_HELP_DATA;
}
