/**
 * HealthGuard AI Engine
 * Handles AI generation with Gemini 3.0 Pro and Claude 4.5 Sonnet
 * Focus: HIPAA compliance, clinical accuracy, and empathy.
 */

(function () {
    'use strict';

    const SYSTEM_PROMPTS = {
        base: `You are an expert AI Medical Assistant designed to draft responses for healthcare providers (doctors, nurses, PA/NPs) to send to patients via a secure portal.
        
CORE PRINCIPLES:
1. **Safety First**: Never advise ignoring severe symptoms. If symptoms sound critical (chest pain, shortness of breath, etc.), advise calling emergency services immediately.
2. **Scope of Practice**: You are drafting ON BEHALF of the provider. You are not diagnosing. You are explaining established diagnosis, results, or following standard protocols provided in context.
3. **HIPAA/Privacy**: Do not generate fake identifying information. Use placeholders like [Patient Name] if needed.
4. **Tone**: Professional, empathetic, clear, and concise. Avoid overly complex jargon unless defining it.
5. **Accuracy**: Stick strictly to the medical context provided. Do not hallucinate medications or results.`,

        structure: `
RESPONSE STRUCTURE:
1. **Greeting**: Professional and warm (e.g., "Hello [Patient Name],").
2. **Acknowledge**: Validate their question or concern.
3. **The "Meat"**: Clear answer or explanation. Use bullet points for instructions.
4. **Safety Net**: "If symptoms worsen..." or specific warning signs to watch for.
5. **Next Steps**: Follow-up plan, appointment, or confirmation of refill.
6. **Closing**: Professional sign-off (e.g., "Best regards, Dr. [Name] / [Clinic Name]").`,

        typeGuidance: {
            'lab-results': `
TASK: Explain lab results.
- Translate numbers into meaning (e.g., "Your cholesterol is 240, which is higher than our target of 200").
- Contextualize: Is this mild? Severe? Expected?
- Action plan: Diet change? Med adjustment? Retest?
- Reassure if results are normal or only slightly off but not concerning.`,

            'general-inquiry': `
TASK: Answer general health question.
- Provide general medical information relevant to their context.
- caveat: "Every patient is different..."
- If asking about drug interactions, check standard contradictions (knowledge base) but advise "We will check your chart to be sure."`,

            'appointment': `
TASK: Appointment guidance.
- Confirm need for visit.
- Specify urgency (today? this week? next month?).
- Prepare them: "Please bring your medication list" or "Fast for 12 hours before."`,

            'prescription': `
TASK: Prescription handling.
- Confirm refill sent OR explain why denied (need appointment, labs due).
- Instructions: "Take with food," "May cause drowsiness."
- Safety: "Stop taking if you experience rash/swelling."`,

            'referral': `
TASK: Referral processing.
- Confirm referral placed to [Specialty].
- Timeline: "They should contact you within X days."
- What to do if they don't hear back.`,

            'reassurance': `
TASK: Emotional support / Reassurance.
- Validate anxiety: "It is normal to feel worried about..."
- Focus on the plan: "We are monitoring this closely."
- Open door: "Call us if..."`
        }
    };

    /**
     * Generate HealthGuard Response
     */
    window.generateHealthResponseWithAI = async function () {
        const state = window.healthState || {};
        const input = document.getElementById('health-patient-input')?.value || '';
        const context = document.getElementById('health-clinical-context')?.value || '';

        if (!input) throw new Error("Patient message is required.");

        // Build User Prompt
        const userPrompt = `
PATIENT MESSAGE:
"${input}"

CLINICAL CONTEXT:
${context || 'No specific context provided. Assume standard healthy adult protocol unless specified.'}

TASK:
Draft a ${state.tone} response for a ${state.type} scenario.
        `;

        // Select Prompt Components
        let systemContent = SYSTEM_PROMPTS.base + '\n\n' + SYSTEM_PROMPTS.structure + '\n\n';
        if (SYSTEM_PROMPTS.typeGuidance[state.type]) {
            systemContent += SYSTEM_PROMPTS.typeGuidance[state.type];
        }

        // Add Tone Modifier
        // Accessing the tone config from response writer if available, or using simple mapping
        const instructions = {
            'empathetic': 'Focus heavily on empathy and validation.',
            'professional': 'Keep it strictly professional and objective.',
            'simplified': 'Use 5th-grade reading level. Explain all terms.',
            'firm': 'Be direct and firm about compliance/policy.'
        };
        systemContent += `\n\nTONE INSTRUCTION: ${instructions[state.tone] || ''}`;

        // Model Selection
        const modelId = state.selectedModel || 'claude-sonnet-4';
        // Map to Puter IDs
        const modelMap = {
            'claude-sonnet-4': 'claude-sonnet', // Maps to 3.5 Sonnet in Puter (closest proxy) or updated ID
            'gemini-3-pro-preview': 'gemini-3-pro-preview'
        };
        const puterModel = modelMap[modelId] || 'claude-sonnet';

        // Execute API Call
        const messages = [
            { role: 'system', content: systemContent },
            { role: 'user', content: userPrompt }
        ];

        try {
            console.log(`⚕️ Generating with ${puterModel}...`);
            const stream = await puter.ai.chat(messages, {
                model: puterModel,
                stream: true,
                temperature: 0.3 // Lower temp for medical safety
            });

            let fullResponse = '';
            for await (const chunk of stream) {
                const text = chunk?.text || '';
                fullResponse += text;
                if (window.onHealthStreamUpdate) {
                    window.onHealthStreamUpdate(text);
                }
            }
            return fullResponse;

        } catch (error) {
            console.error("Health AI Error:", error);
            throw error;
        }
    };

    console.log('✅ HealthGuard AI Engine loaded');
})();
