// Quick Translation Test Script
// Run this in browser console to test translation integration

async function quickTranslationTest() {
    console.log('🌐 Starting Quick Translation Test...\n');
    
    // Test 1: Check if backend is loaded
    console.log('Test 1: Backend loaded?');
    if (window.regulatoryTranslation) {
        console.log('✅ Translation backend found');
    } else {
        console.log('❌ Translation backend NOT found');
        return;
    }
    
    // Test 2: Check if initialized
    console.log('\nTest 2: Backend initialized?');
    if (window.regulatoryTranslation.state) {
        console.log('✅ Backend state exists');
        console.log(`   Languages: ${window.regulatoryTranslation.state.supportedLanguages.length}`);
        console.log(`   Default model: ${window.regulatoryTranslation.state.defaultModel}`);
    } else {
        console.log('⚠️ Backend not initialized, initializing now...');
        await window.regulatoryTranslation.initialize();
    }
    
    // Test 3: Check Regulatory Writer integration
    console.log('\nTest 3: Regulatory Writer integration?');
    if (window.RegulatoryResponseWriter) {
        console.log('✅ RegulatoryResponseWriter found');
        if (window.RegulatoryResponseWriter.translationBackend) {
            console.log('✅ Translation backend integrated');
        } else {
            console.log('⚠️ Translation backend not yet integrated');
        }
    } else {
        console.log('❌ RegulatoryResponseWriter NOT found');
    }
    
    // Test 4: Check command handler
    console.log('\nTest 4: Command handler registered?');
    if (window.translateCommandHandler) {
        console.log('✅ /translate command handler registered');
    } else {
        console.log('❌ /translate command handler NOT found');
    }
    
    // Test 5: Quick translation test
    console.log('\nTest 5: Quick translation test...');
    try {
        const testText = "This is a compliance notice.";
        console.log(`   Translating: "${testText}"`);
        
        const result = await window.regulatoryTranslation.translateText(
            testText,
            'Spanish',
            { model: 'gemini-3-pro-preview', stream: false }
        );
        
        console.log('✅ Translation successful!');
        console.log(`   Result: "${result}"`);
    } catch (error) {
        console.log('❌ Translation failed:', error.message);
    }
    
    console.log('\n🎉 Quick test complete!');
    console.log('\nTo test in chat, try:');
    console.log('  /translate help');
    console.log('  /translate Spanish');
    console.log('  /translate compare French');
}

// Auto-run after 2 seconds
setTimeout(() => {
    quickTranslationTest().catch(err => console.error('Test error:', err));
}, 2000);

console.log('Translation test will run in 2 seconds...');
