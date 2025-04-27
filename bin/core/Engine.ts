import { Assistant } from "../Assistant.js";
import { Model } from "./Model.js";
import { TestCase } from "./TestCase.js";

export class Engine extends Model {
  private testCase: TestCase;
  private messages: Array<{ role: string; content: string }> = [];
  private assistantUnderTest: Assistant;

  constructor(testCase: TestCase, assistant: Assistant) {
    super();
    this.testCase = testCase;
    this.assistantUnderTest = assistant;
    this.messages.push({
      role: "developer",
      content: `${SYSTEM_PROMPT} ${testCase.getInputs().assumedIdentity}`,
    });
  }

  private messageToString() {
    let res = "";
    for (const message of this.messages) {
      switch (message.role) {
        case "user":
          res += `[customer] ${message.content}\n\n`;
          break;
        case "assistant":
          res += `[support] ${message.content}\n\n`;
          break;
      }
    }
    return res;
  }

  private async generateCustomerMessage() {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        this.messages[0],
        {
          role: "user",
          content: this.messageToString(),
        },
      ],
    });

    const content = completion.choices[0].message.content;
    this.messages.push({
      role: "user",
      content: content,
    });
  }

  public async run(): Promise<void> {
    for (let i = 0; i < this.testCase.getOutputs().maxMessages; i++) {
      await this.generateCustomerMessage(); // appends the user message
      const resp = await this.assistantUnderTest.submit(
        this.messages[this.messages.length - 1].content
      );
      this.messages.push({
        role: "assistant",
        content: resp,
      });
      await this.testCase.onResponse(this.messages);
    }
    console.log(this.messages);
  }
}

const SYSTEM_PROMPT =
  "You are a customer with a problem and you are speaking with a support agent. You will be provided with a persona to assume, and a conversation summary between yourself and the support agent. The conversation will be annotated with [user] for previous messages that you have sent and [agent] for the responses by the customer support agent. Your objective is to generate text based on what you would say as the customer. Your persona is this:";
