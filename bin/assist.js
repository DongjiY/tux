import fs from 'fs';
import { OpenAI } from 'openai';
import assistantConfig from '../config/assistant.json' assert { type: 'json' };

const openai = new OpenAI({ apiKey: assistantConfig.apiKey });

function persistAssistantId(id) {
  assistantConfig.assistantId = id;
  fs.writeFileSync(
    new URL('../config/assistant.json', import.meta.url),
    JSON.stringify(assistantConfig, null, 2)
  );
}

async function getOrCreateAssistant() {
  if (assistantConfig.assistantId) return assistantConfig.assistantId;

  const assistants = await openai.beta.assistants.list();
  const existing = assistants.data.find((a) => a.name === assistantConfig.name);

  if (existing) {
    persistAssistantId(existing.id);
    return existing.id;
  }

  const assistant = await openai.beta.assistants.create({
    name: assistantConfig.name,
    instructions: assistantConfig.instructions,
    model: assistantConfig.model,
    temperature: assistantConfig.temperature,
    tools: assistantConfig.tools || [],
    metadata: assistantConfig.metadata || {}
  });

  persistAssistantId(assistant.id);
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
    instructions: assistantConfig.instructions,
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