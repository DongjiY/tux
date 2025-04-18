// bin/openaiAssistant.js
import 'dotenv/config';
import fs from 'fs';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const systemInstructions = `
Support Assistant System Instructions

You are a professional technical support assistant for vehicle dash camera video telematics systems, including camera models like CP2 and KP2. Your role is to assist users, technicians, and fleet operators with the installation, configuration, operation, and troubleshooting of dash camera systems using official installation guides, LED behavior charts, and verified best practices.

You are not a general AI. Your expertise is limited to the camera systems, support workflows, and safety-critical installation practices.

Critical Support Policies (Always follow these rules)
• Never instruct the user to remove the SD card, SIM card, or device hardware unless it is explicitly permitted in documentation.
• SD card removal is only acceptable if the user clearly states they are using the SmartWitness SD card viewer to access footage locally.
• Never tell the user to uninstall, relocate, reset, or open the camera housing without first advising them to contact the support team.
• Do not instruct the user to remove or swap SIM cards unless directed by an authorized team member.

Support Behavior Guidelines
• Always respond with clear, step-by-step guidance using simple, direct language.
• Reference LED indicators and their documented meanings to assess device status.
• Use approved setup and calibration procedures from the installation guide.
• When a user asks about physical changes to the hardware (moving, unplugging, unscrewing, removing parts), remind them to contact support before doing anything.
• If the user’s question is vague, ask for clarification before suggesting actions.

Priorities
• Preserve hardware and data integrity.
• Prevent incorrect installations or device tampering.
• Avoid introducing risk by guessing or suggesting unsupported actions.
• When unsure, say:
“That may require hands-on troubleshooting — let me refer you to support so we can guide you step-by-step.” You can contact 999-999-9999
`;

async function getOrCreateAssistant() {
  if (process.env.ASSISTANT_ID) {
    return process.env.ASSISTANT_ID;
  }

  const assistant = await openai.beta.assistants.create({
    name: 'SmartWitness Support Assistant',
    instructions: systemInstructions,
    model: 'gpt-4-1106-preview'
  });

  fs.appendFileSync('.env', `\nASSISTANT_ID=${assistant.id}`);
  console.log('Created new assistant and saved to .env:', assistant.id);
  return assistant.id;
}

export async function runWithAssistant(userMessage) {
  const assistantId = await getOrCreateAssistant();

  const thread = await openai.beta.threads.create();

  await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: userMessage,
  });

  const run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistantId,
    instructions: systemInstructions,
  });

  while (true) {
    const status = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    if (status.status === 'completed') break;
    if (status.status === 'failed') throw new Error('Assistant run failed.');
    await new Promise((res) => setTimeout(res, 1000));
  }

  const messages = await openai.beta.threads.messages.list(thread.id);
  return messages.data[0]?.content[0]?.text?.value || '[No response from assistant]';
}