import { Assistant } from "../Assistant.js";
import { Model } from "./Model.js";
import { TestCase } from "./TestCase.js";

export class Engine extends Model {
  private testCase: TestCase;
  private messages: Array<{ role: string; content: string }> = [];
  private assistantUnderTest: Assistant;

  private simulationMessages = 0;
  private simulationTokens = 0;
  /** 🆕 track if we ever saw repetition */
  private detectedRepetition = false;

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
      if (message.role === "user") {
        res += `[customer] ${message.content}\n\n`;
      } else if (message.role === "assistant") {
        res += `[support] ${message.content}\n\n`;
      }
    }
    return res;
  }

  private async generateCustomerMessage() {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        this.messages[0],
        { role: "user", content: this.messageToString() },
      ],
    });

    this.simulationMessages++;
    this.simulationTokens += completion.usage?.total_tokens || 0;

    const content = completion.choices[0].message.content;
    this.messages.push({ role: "user", content });
  }

  public async run(): Promise<void> {
    console.log(
      `Assumed Identity: ${this.testCase.getInputs().assumedIdentity}`
    );

    for (let i = 0; i < this.testCase.getOutputs().maxMessages; i++) {
      await this.generateCustomerMessage();

      const resp = await this.assistantUnderTest.submit(
        this.messages[this.messages.length - 1].content
      );
      this.messages.push({ role: "assistant", content: resp });

      await this.testCase.onResponse(this.messages);

      const repetitive = await this.isRepetitive();
      if (repetitive) {
        this.detectedRepetition = true;
      }
      if (repetitive || this.testCase.isAllAccepted()) break;
    }

    console.log(
      `Simulation calls: ${this.simulationMessages} | tokens: ${this.simulationTokens}`
    );

    await this.testCase.printFinalResults(
      this.simulationMessages,
      this.simulationTokens,
      this.detectedRepetition
    );
  }

  private async isRepetitive(): Promise<boolean> {
    if (this.messages.length <= 4) return false;
    const len = this.messages.length;
    const last = this.messages[len - 1].content;
    const second = this.messages[len - 3].content;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "developer",
          content:
            "Your job is to look at two messages and determine if there is sufficient unique content between the two. If the two messages are similar and/or no new information was introduced return SAME, otherwise return DIFF.",
        },
        { role: "user", content: `Message 1: ${second}\nMessage 2: ${last}` },
      ],
    });

    return completion.choices[0].message.content === "SAME";
  }
}

const SYSTEM_PROMPT =
  "You are a customer with a problem and you are speaking with a support agent. You will be provided with a persona to assume, and a conversation summary between yourself and the support agent. The conversation will be annotated with [user] for previous messages that you have sent and [agent] for the responses by the customer support agent. Your objective is to generate text based on what you would say as the customer. Your persona is this:";