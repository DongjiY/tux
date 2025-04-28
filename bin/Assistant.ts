import fs from "fs";
import { jsonToObj } from "./utils.js";
import { Model } from "./core/Model.js";

export class Assistant extends Model {
  private path: string;
  private options: any;
  private id?: string;
  private threadId?: string;

  constructor(path: string) {
    super();
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

      // Return the assistant's last message
      for (const message of messages.data) {
        if (message.role === "assistant")
          return message.content[0]?.text?.value;
      }
    } else {
      return null;
    }
  }
}
