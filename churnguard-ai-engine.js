/**
 * ========================================
 * CHURNGUARD AI ENGINE
 * ========================================
 * AI-powered customer success churn prevention
 * Integrated with Gemini 3.0 Pro and Claude Sonnet 4.5
 */

(function() {
    'use strict';

    // ====================================
    // AI Model Configuration
    // ====================================
    
    const AI_MODELS = {
        'claude-sonnet-4.5': {
            puterModel: 'claude-sonnet',
            name: 'Claude Sonnet 4.5',
            bestFor: 'Complex sentiment analysis and empathetic responses',
            temperature: 0.7,
            maxTokens: 2500
        },
        'gemini-3-pro': {
            puterModel: 'gemini-3-pro-preview',
            name: 'Gemini 3.0 Pro',
            bestFor: 'Comprehensive churn analysis and strategic recommendations',
            temperature: 0.7,
            maxTokens: 2500
        },
        'gpt-4o': {
            puterModel: 'gpt-4o',
            name: 'GPT-4o',
            bestFor: 'Fast sentiment scoring and quick responses',
            temperature: 0.6,
            maxTokens: 2000
        }
    };

    // ====================================
    // Sentiment Analysis Engine
    // ====================================

    /**
     * Analyze customer support ticket sentiment
     * @param {string} ticketContent - Support ticket text
     * @param {string} model - AI model to use
     * @returns {Promise<Object>} Sentiment analysis results
     */
    window.analyzeCustomerSentiment = async function(ticketContent, model = 'claude-sonnet-4.5') {
        const modelConfig = AI_MODELS[model];
        const puterModel = modelConfig.puterModel;

        const systemPrompt = `You are an expert customer sentiment analyst for SaaS businesses. 
Analyze support tickets to detect churn risk indicators.

Analyze the following dimensions:
1. Overall sentiment (-1.0 to 1.0, where -1 is very negative, 1 is very positive)
2. Frustration level (0-10, where 10 is extremely frustrated)
3. Urgency level (low/medium/high/critical)
4. Churn risk indicators (specific phrases suggesting customer may leave)
5. Key pain points (array of specific issues mentioned)
6. Emotional tone (professional/frustrated/angry/disappointed/desperate)
7. Action items (what needs immediate attention)

Return ONLY valid JSON in this exact format:
{
  "sentiment": -0.5,
  "frustrationLevel": 7,
  "urgencyLevel": "high",
  "churnRisk": 0.75,
  "churnIndicators": ["mentions competitor", "threatening cancellation"],
  "painPoints": ["slow performance", "missing features", "poor support"],
  "emotionalTone": "frustrated",
  "actionItems": ["immediate call", "technical review", "escalate to CSM"],
  "summary": "Brief one-sentence summary"
}`;

        const userPrompt = `Analyze this customer support ticket for churn risk:

"${ticketContent}"

Provide detailed sentiment analysis with churn risk assessment.`;

        try {
            console.log(`🧠 Analyzing sentiment with ${modelConfig.name}...`);

            const response = await puter.ai.chat(userPrompt, {
                model: puterModel,
                system: systemPrompt,
                temperature: 0.3, // Low temp for consistent JSON
                stream: false
            });

            // Parse AI response
            let analysisText = response;
            if (typeof response === 'object' && response.message) {
                analysisText = response.message.content || response.message;
            }

            // Extract JSON from response
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const analysis = JSON.parse(jsonMatch[0]);
                console.log('✅ Sentiment analysis complete:', analysis);
                return analysis;
            }

            throw new Error('Failed to parse sentiment analysis JSON');

        } catch (error) {
            console.error('❌ Sentiment analysis failed:', error);
            
            // Fallback to heuristic analysis
            return fallbackSentimentAnalysis(ticketContent);
        }
    };

    /**
     * Fallback sentiment analysis using keyword matching
     */
    function fallbackSentimentAnalysis(text) {
        const textLower = text.toLowerCase();
        
        // Negative indicators
        const negativeWords = ['frustrated', 'angry', 'disappointed', 'terrible', 'awful', 
                               'broken', 'useless', 'hate', 'worst', 'never', 'cancel', 
                               'refund', 'switching', 'competitor', 'leaving'];
        
        // Urgency indicators
        const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 
                            'deadline', 'losing', 'cost us'];
        
        // Churn indicators
        const churnWords = ['cancel', 'cancellation', 'switching', 'competitor', 'alternative',
                           'leaving', 'moving to', 'ending contract', 'not renewing'];

        const negCount = negativeWords.filter(w => textLower.includes(w)).length;
        const urgentCount = urgentWords.filter(w => textLower.includes(w)).length;
        const churnCount = churnWords.filter(w => textLower.includes(w)).length;

        const sentiment = -0.1 - (negCount * 0.15);
        const frustration = Math.min(10, negCount * 2 + urgentCount);
        const churnRisk = Math.min(1.0, 0.3 + (churnCount * 0.2) + (negCount * 0.05));

        return {
            sentiment: Math.max(-1, sentiment),
            frustrationLevel: frustration,
            urgencyLevel: urgentCount > 2 ? 'critical' : urgentCount > 0 ? 'high' : 'medium',
            churnRisk: churnRisk,
            churnIndicators: churnWords.filter(w => textLower.includes(w)),
            painPoints: negativeWords.filter(w => textLower.includes(w)),
            emotionalTone: frustration > 7 ? 'angry' : frustration > 4 ? 'frustrated' : 'concerned',
            actionItems: churnRisk > 0.6 ? ['immediate call', 'escalate to CSM'] : ['follow up within 24h'],
            summary: 'Customer showing signs of dissatisfaction',
            fallback: true
        };
    }

    // ====================================
    // Churn Risk Scoring Engine
    // ====================================

    /**
     * Calculate comprehensive churn risk score
     * @param {Object} customerData - Customer metrics and behavior data
     * @param {Object} sentimentData - Sentiment analysis from ticket
     * @returns {Object} Churn risk assessment
     */
    window.calculateChurnRisk = function(customerData, sentimentData) {
        const {
            usageChange = 0,          // -100 to 100 (percentage change)
            daysSinceLastLogin = 0,   // Days
            supportTicketCount = 0,   // Count
            npsScore = 0,             // -100 to 100
            contractValue = 0,        // Dollar amount
            daysUntilRenewal = 365,   // Days
            featureAdoption = 50,     // Percentage
            paymentDelays = 0,        // Count
            hasChampion = true        // Boolean
        } = customerData;

        let riskScore = 0;
        const riskFactors = [];

        // Usage decline (0-25 points)
        if (usageChange < -30) {
            const usageRisk = Math.min(25, Math.abs(usageChange) / 3);
            riskScore += usageRisk;
            riskFactors.push({
                factor: 'Usage Decline',
                impact: 'critical',
                detail: `Usage dropped ${Math.abs(usageChange)}% in last 30 days`,
                points: usageRisk,
                recommendation: 'Schedule immediate check-in call to understand cause'
            });
        }

        // Engagement decline (0-20 points)
        if (daysSinceLastLogin > 14) {
            const engagementRisk = Math.min(20, daysSinceLastLogin / 3);
            riskScore += engagementRisk;
            riskFactors.push({
                factor: 'Low Engagement',
                impact: daysSinceLastLogin > 30 ? 'critical' : 'high',
                detail: `No login for ${daysSinceLastLogin} days`,
                points: engagementRisk,
                recommendation: 'Send personalized re-engagement campaign with value highlights'
            });
        }

        // Support ticket sentiment (0-25 points)
        if (sentimentData) {
            const sentimentRisk = (1 + sentimentData.sentiment) * 12.5; // Convert -1,1 to 0,25
            riskScore += sentimentRisk;
            
            if (sentimentData.sentiment < -0.3) {
                riskFactors.push({
                    factor: 'Negative Support Sentiment',
                    impact: sentimentData.sentiment < -0.6 ? 'critical' : 'high',
                    detail: `Frustration level: ${sentimentData.frustrationLevel}/10`,
                    points: sentimentRisk,
                    recommendation: 'Assign dedicated CSM for personalized resolution'
                });
            }
        }

        // NPS detractors (0-15 points)
        if (npsScore < 30) {
            const npsRisk = Math.min(15, (50 - npsScore) / 5);
            riskScore += npsRisk;
            riskFactors.push({
                factor: 'Low NPS Score',
                impact: npsScore < 0 ? 'critical' : 'medium',
                detail: `NPS: ${npsScore}`,
                points: npsRisk,
                recommendation: 'Conduct win-back interview to identify root causes'
            });
        }

        // Feature adoption (0-10 points)
        if (featureAdoption < 40) {
            const adoptionRisk = (40 - featureAdoption) / 4;
            riskScore += adoptionRisk;
            riskFactors.push({
                factor: 'Poor Feature Adoption',
                impact: 'medium',
                detail: `Only ${featureAdoption}% features used`,
                points: adoptionRisk,
                recommendation: 'Offer product training and highlight underutilized features'
            });
        }

        // Payment issues (0-10 points)
        if (paymentDelays > 0) {
            const paymentRisk = Math.min(10, paymentDelays * 5);
            riskScore += paymentRisk;
            riskFactors.push({
                factor: 'Payment Delays',
                impact: 'high',
                detail: `${paymentDelays} late payment(s)`,
                points: paymentRisk,
                recommendation: 'Discuss budget constraints and flexible payment options'
            });
        }

        // Renewal proximity (0-10 points)
        if (daysUntilRenewal < 90) {
            const renewalRisk = Math.min(10, (90 - daysUntilRenewal) / 9);
            riskScore += renewalRisk;
            riskFactors.push({
                factor: 'Renewal Approaching',
                impact: 'medium',
                detail: `${daysUntilRenewal} days until renewal`,
                points: renewalRisk,
                recommendation: 'Proactive renewal outreach with ROI review'
            });
        }

        // Champion loss (0-5 points)
        if (!hasChampion) {
            riskScore += 5;
            riskFactors.push({
                factor: 'No Internal Champion',
                impact: 'medium',
                detail: 'Key stakeholder departed or disengaged',
                points: 5,
                recommendation: 'Identify and cultivate new champion within organization'
            });
        }

        // Normalize to 0-100
        const normalizedScore = Math.min(100, riskScore);

        // Determine risk level
        let riskLevel, riskColor, riskLabel;
        if (normalizedScore >= 75) {
            riskLevel = 'critical';
            riskColor = '#dc2626';
            riskLabel = '🔴 Critical Risk';
        } else if (normalizedScore >= 50) {
            riskLevel = 'high';
            riskColor = '#ea580c';
            riskLabel = '🟠 High Risk';
        } else if (normalizedScore >= 25) {
            riskLevel = 'medium';
            riskColor = '#ca8a04';
            riskLabel = '🟡 Medium Risk';
        } else {
            riskLevel = 'low';
            riskColor = '#16a34a';
            riskLabel = '🟢 Low Risk';
        }

        // Sort factors by impact
        riskFactors.sort((a, b) => {
            const impactOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return impactOrder[a.impact] - impactOrder[b.impact];
        });

        return {
            score: normalizedScore,
            level: riskLevel,
            color: riskColor,
            label: riskLabel,
            factors: riskFactors,
            calculatedAt: new Date().toISOString()
        };
    };

    // ====================================
    // Retention Response Generator
    // ====================================

    /**
     * Generate AI-powered retention response
     * @param {Object} params - Customer data, ticket, sentiment, churn risk
     * @returns {Promise<Object>} Generated response with recommendations
     */
    window.generateRetentionResponse = async function(params) {
        const {
            customerName,
            companyName,
            ticketContent,
            sentimentAnalysis,
            churnRisk,
            customerTier = 'professional',
            contractValue,
            issueType = 'support',
            selectedModel = 'claude-sonnet-4.5'
        } = params;

        const modelConfig = AI_MODELS[selectedModel];
        const puterModel = modelConfig.puterModel;

        // Build comprehensive context
        const systemPrompt = `You are an expert Customer Success Manager specializing in churn prevention.

Your goal: Write a personalized, empathetic retention response that:
1. Acknowledges the customer's specific frustration with genuine empathy
2. Takes accountability for any issues without being defensive
3. Offers concrete, actionable solutions (not vague promises)
4. Demonstrates deep understanding of their use case and goals
5. Includes a clear next step (call, meeting, demo, etc.)
6. Maintains professional warmth without corporate jargon

CRITICAL RULES:
- Address specific pain points mentioned in the ticket
- Reference their tier/value to show they're important
- Suggest product features that solve their exact problem
- Keep response 3-4 paragraphs maximum (not an essay)
- End with a specific action item and timeline
- Use "I" not "we" for personal accountability

Tone: Professional but warm, accountable, solution-focused`;

        const userPrompt = `Generate a retention response for this situation:

**CUSTOMER CONTEXT:**
- Customer: ${customerName}
- Company: ${companyName || 'their organization'}
- Tier: ${customerTier}
- Contract Value: ${contractValue ? '$' + contractValue.toLocaleString() + '/year' : 'Not specified'}
- Churn Risk: ${churnRisk.label} (${churnRisk.score.toFixed(0)}%)

**TICKET/ISSUE:**
"${ticketContent}"

**SENTIMENT ANALYSIS:**
- Sentiment: ${sentimentAnalysis.sentiment.toFixed(2)} (${sentimentAnalysis.emotionalTone})
- Frustration Level: ${sentimentAnalysis.frustrationLevel}/10
- Urgency: ${sentimentAnalysis.urgencyLevel}
- Key Pain Points: ${sentimentAnalysis.painPoints.join(', ')}

**CHURN RISK FACTORS:**
${churnRisk.factors.slice(0, 3).map(f => `- ${f.factor}: ${f.detail}`).join('\n')}

**TOP RECOMMENDATIONS:**
${churnRisk.factors.slice(0, 3).map(f => `- ${f.recommendation}`).join('\n')}

Write a complete retention response email that addresses their specific concerns and prevents churn.`;

        try {
            console.log(`🤖 Generating retention response with ${modelConfig.name}...`);

            // Call Puter AI with streaming
            let fullResponse = '';
            
            if (window.onChurnGuardStreamUpdate) {
                // Streaming mode
                const stream = await puter.ai.chat(userPrompt, {
                    model: puterModel,
                    system: systemPrompt,
                    temperature: modelConfig.temperature,
                    stream: true
                });

                for await (const chunk of stream) {
                    const text = chunk?.text || '';
                    fullResponse += text;
                    window.onChurnGuardStreamUpdate(text);
                }
            } else {
                // Non-streaming mode
                const response = await puter.ai.chat(userPrompt, {
                    model: puterModel,
                    system: systemPrompt,
                    temperature: modelConfig.temperature,
                    stream: false
                });

                if (typeof response === 'object' && response.message) {
                    fullResponse = response.message.content || response.message;
                } else {
                    fullResponse = response;
                }
            }

            // Generate escalation recommendation
            const escalation = generateEscalationRecommendation(churnRisk, sentimentAnalysis);

            // Generate product solutions
            const solutions = generateProductSolutions(sentimentAnalysis.painPoints, churnRisk);

            console.log('✅ Retention response generated');

            return {
                response: fullResponse,
                escalation: escalation,
                solutions: solutions,
                model: selectedModel,
                generatedAt: new Date().toISOString(),
                wordCount: fullResponse.split(/\s+/).length
            };

        } catch (error) {
            console.error('❌ Response generation failed:', error);
            throw new Error(`Failed to generate retention response: ${error.message}`);
        }
    };

    /**
     * Generate escalation recommendation
     */
    function generateEscalationRecommendation(churnRisk, sentimentAnalysis) {
        const score = churnRisk.score;
        const sentiment = sentimentAnalysis.sentiment;
        const urgency = sentimentAnalysis.urgencyLevel;

        if (score >= 75 && sentiment < -0.5) {
            return {
                escalate: true,
                level: 'executive',
                to: 'VP Customer Success + Account Executive',
                reason: 'Critical churn risk with very negative sentiment. Executive intervention required.',
                action: 'Schedule emergency call within 24 hours with senior leadership',
                priority: 'P0 - Critical'
            };
        } else if (score >= 60 || urgency === 'critical') {
            return {
                escalate: true,
                level: 'management',
                to: 'Customer Success Manager + Solutions Architect',
                reason: 'High churn risk or critical issue. Needs immediate senior attention.',
                action: 'Assign dedicated CSM and schedule technical deep-dive call',
                priority: 'P1 - Urgent'
            };
        } else if (score >= 40 || sentiment < -0.3) {
            return {
                escalate: true,
                level: 'team-lead',
                to: 'CS Team Lead + Support Manager',
                reason: 'Moderate churn risk. Requires guided intervention.',
                action: 'CSM-led resolution with product team support',
                priority: 'P2 - High'
            };
        } else {
            return {
                escalate: false,
                level: 'standard',
                to: 'Assigned Customer Success Manager',
                reason: 'Standard follow-up appropriate. No immediate escalation needed.',
                action: 'CSM handle with standard retention playbook',
                priority: 'P3 - Normal'
            };
        }
    }

    /**
     * Generate product solution recommendations
     */
    function generateProductSolutions(painPoints, churnRisk) {
        const solutions = [];
        const painPointsLower = painPoints.map(p => p.toLowerCase());

        // Map pain points to solutions
        if (painPointsLower.some(p => p.includes('slow') || p.includes('performance') || p.includes('speed'))) {
            solutions.push({
                title: 'Performance Optimization',
                description: 'Enable advanced caching and CDN acceleration',
                benefit: 'Up to 10x faster load times',
                implementation: 'Can be enabled in < 5 minutes',
                impact: 'high'
            });
        }

        if (painPointsLower.some(p => p.includes('integration') || p.includes('api') || p.includes('sync'))) {
            solutions.push({
                title: 'Premium Integration Support',
                description: 'Dedicated integration engineer for custom API setup',
                benefit: 'Seamless data flow between systems',
                implementation: 'Schedule 1-hour technical call',
                impact: 'critical'
            });
        }

        if (painPointsLower.some(p => p.includes('feature') || p.includes('missing') || p.includes('need'))) {
            solutions.push({
                title: 'Feature Gap Analysis',
                description: 'Review product roadmap and beta access to upcoming features',
                benefit: 'Early access to requested capabilities',
                implementation: 'Product team meeting within 48 hours',
                impact: 'high'
            });
        }

        if (painPointsLower.some(p => p.includes('support') || p.includes('response') || p.includes('help'))) {
            solutions.push({
                title: 'Dedicated Support Channel',
                description: 'Priority support with dedicated Slack channel',
                benefit: '< 1 hour response time SLA',
                implementation: 'Immediate activation',
                impact: 'high'
            });
        }

        if (painPointsLower.some(p => p.includes('training') || p.includes('onboarding') || p.includes('learn'))) {
            solutions.push({
                title: 'Custom Training Program',
                description: 'Personalized onboarding and team training sessions',
                benefit: 'Maximize product value and adoption',
                implementation: 'Weekly 1-hour sessions starting this week',
                impact: 'medium'
            });
        }

        // If no specific pain points, suggest general value-adds
        if (solutions.length === 0) {
            solutions.push({
                title: 'Account Health Review',
                description: 'Comprehensive review of your usage and optimization opportunities',
                benefit: 'Identify quick wins and growth opportunities',
                implementation: 'Schedule 30-minute call',
                impact: 'medium'
            });
        }

        return solutions;
    }

    // ====================================
    // Model Selection Helper
    // ====================================

    /**
     * Get recommended model for specific use case
     */
    window.getRecommendedChurnGuardModel = function(useCase) {
        switch (useCase) {
            case 'sentiment':
                return 'claude-sonnet-4.5'; // Best for nuanced sentiment
            case 'strategy':
                return 'gemini-3-pro'; // Best for complex analysis
            case 'quick':
                return 'gpt-4o'; // Fastest
            default:
                return 'claude-sonnet-4.5';
        }
    };

    /**
     * Get all available models
     */
    window.getChurnGuardModels = function() {
        return Object.keys(AI_MODELS).map(key => ({
            id: key,
            ...AI_MODELS[key]
        }));
    };

    console.log('✅ ChurnGuard AI Engine loaded - Gemini 3.0 Pro & Claude Sonnet 4.5 ready');

})();
