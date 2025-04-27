import fs from "fs";
import { OpenAI } from "openai";
import { jsonToObj } from "./utils.js";

export class Assistant {
  private openai: any;
  private path: string;
  private options: any;
  private id?: string;
  private threadId?: string;

  constructor(path: string) {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.path = path;
  }

  async initialize() {
    this.options = await jsonToObj(this.path);
    await this.getOrCreateAssistant();
    const thread = await this.openai.beta.threads.create();
    this.threadId = thread.id;
  }

  persistAssistantId(id: string, path: string) {
    this.id = id;
    this.options.id = this.id;
    fs.writeFileSync(
      new URL(path, import.meta.url),
      JSON.stringify(this.options, null, 2)
    );
  }

  async getOrCreateAssistant() {
    console.log(this.options);
    if (this.options.assistantId) {
      const assistants = await this.openai.beta.assistants.list();
      const existing = assistants.data.find(
        (a: any) => a.id === this.options.assistantId
      );

      this.persistAssistantId(existing.id, this.path);
    } else {
      const assistant = await this.openai.beta.assistants.create({
        name: this.options.name,
        instructions: this.options.instructions,
        model: this.options.model,
        temperature: this.options.temperature,
        tools: this.options.tools || [],
        metadata: this.options.metadata || {},
      });

      this.persistAssistantId(assistant.id, this.path);
    }
  }

  async submit(userMessage: string) {
    console.log("THISIS THE TEHWKJ", this.threadId);
    await this.openai.beta.threads.messages.create(this.threadId, {
      role: "user",
      content: userMessage,
    });

    const run = await this.openai.beta.threads.runs.createAndPoll(
      this.threadId,
      {
        assistant_id: this.id,
        instructions: this.options.instructions,
      }
    );

    if (run.status === "completed") {
      const messages = await this.openai.beta.threads.messages.list(
        run.thread_id
      );
      for (const message of messages.data.reverse()) {
        console.log(`${message.role} > ${message.content[0].text.value}`);
      }
    } else {
      console.log(run.status);
    }
  }
}
