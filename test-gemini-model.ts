import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY not set');
  process.exit(1);
}

const modelNamesToTest = [
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-pro-latest',
  'models/gemini-1.5-flash-latest',
  'models/gemini-1.5-pro-latest',
  'models/gemini-1.5-flash',
  'models/gemini-1.5-pro',
  'models/gemini-pro',
];

async function testModel(modelName: string): Promise<boolean> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey!);
    const model = genAI.getGenerativeModel({ model: modelName });

    console.log(`Testing model: ${modelName}...`);
    const result = await model.generateContent('Hello, respond with just "OK"');
    const response = await result.response;
    const text = response.text();

    console.log(`✓ SUCCESS: ${modelName} works!`);
    console.log(`  Response: ${text.substring(0, 50)}`);
    return true;
  } catch (error: any) {
    console.log(`✗ FAILED: ${modelName}`);
    if (error.message) {
      console.log(`  Error: ${error.message.substring(0, 100)}`);
    }
    return false;
  }
}

async function findWorkingModel() {
  console.log('Testing Gemini model names...\n');

  for (const modelName of modelNamesToTest) {
    const success = await testModel(modelName);
    if (success) {
      console.log(`\n=================================`);
      console.log(`WORKING MODEL FOUND: ${modelName}`);
      console.log(`=================================\n`);
      return modelName;
    }
    console.log('');
  }

  console.log('\nNo working model found. You may need to:');
  console.log('1. Check if your API key is valid');
  console.log('2. Verify you have access to Gemini API');
  console.log('3. Check the Gemini API documentation for current model names');
  return null;
}

findWorkingModel().then((model) => {
  if (model) {
    console.log(`Update src/gemini.ts line 15 to use: '${model}'`);
  }
  process.exit(model ? 0 : 1);
});
