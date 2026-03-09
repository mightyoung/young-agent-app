/**
 * AI Service Test Script
 *
 * Run with: npx ts-node --project tsconfig.json tests/ai-service-test.ts
 * Or import and call in app
 */

import { secureStorage, initializeAIService } from '../src/features/ai/services';
import { getDeepSeekProvider } from '../src/features/ai/services/provider';
import { toolRegistry } from '../src/features/ai/services/tools';

async function runTests() {
  console.log('=== AI Service Test ===\n');

  // Test 1: Initialize API Key
  console.log('Test 1: Initialize API Key');
  console.log('---------------------------');
  try {
    const initialized = await initializeAIService();
    console.log('Initialized:', initialized);

    const hasKey = await secureStorage.hasApiKey();
    console.log('Has API Key:', hasKey);
    console.log('✓ Test 1 PASSED\n');
  } catch (error) {
    console.error('✗ Test 1 FAILED:', error);
  }

  // Test 2: DeepSeek Provider
  console.log('Test 2: DeepSeek Provider');
  console.log('---------------------------');
  try {
    const provider = getDeepSeekProvider();
    console.log('Provider created:', !!provider);
    console.log('Default model:', provider.getDefaultModel());

    // Test simple chat
    const response = await provider.chat([
      { id: '1', role: 'user', content: '你好', timestamp: Date.now() },
    ], {
      temperature: 0.7,
      maxTokens: 100,
    });

    console.log('Response received:', !!response.content);
    console.log('Content:', response.content?.substring(0, 100));
    console.log('✓ Test 2 PASSED\n');
  } catch (error) {
    console.error('✗ Test 2 FAILED:', error);
  }

  // Test 3: Tools
  console.log('Test 3: Tools');
  console.log('---------------------------');
  try {
    const tools = toolRegistry.getAllTools();
    console.log('Registered tools:', tools.map(t => t.name));

    // Execute device query tool
    const result = await toolRegistry.execute('query_devices', { status: 'all' });
    console.log('Device query result:', result.result?.substring(0, 100));
    console.log('✓ Test 3 PASSED\n');
  } catch (error) {
    console.error('✗ Test 3 FAILED:', error);
  }

  // Test 4: Full Chat with Tools
  console.log('Test 4: Chat with Tools');
  console.log('---------------------------');
  try {
    const provider = getDeepSeekProvider();
    const tools = toolRegistry.getToolsForLLM();

    const response = await provider.chat([
      { id: '1', role: 'system', content: '你是Young-agentAI助手。', timestamp: Date.now() },
      { id: '2', role: 'user', content: '查询所有设备状态', timestamp: Date.now() },
    ], {
      temperature: 0.7,
      maxTokens: 500,
      tools: tools as any,
    });

    console.log('Response received:', !!response.content);
    console.log('Content:', response.content?.substring(0, 200));
    if (response.toolCalls) {
      console.log('Tool calls:', response.toolCalls.map(tc => tc.name));
    }
    console.log('✓ Test 4 PASSED\n');
  } catch (error) {
    console.error('✗ Test 4 FAILED:', error);
  }

  console.log('=== All Tests Complete ===');
}

// Export for use in app
export { runTests };

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}
