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
    console.log(
      `Assumed Identity: ${this.testCase.getInputs().assumedIdentity}`
    );

    for (let i = 0; i < this.testCase.getOutputs().maxMessages; i++) {
      //   console.log(this.messages);
      await this.generateCustomerMessage(); // appends the user message

      const resp = await this.assistantUnderTest.submit(
        this.messages[this.messages.length - 1].content
      );

      this.messages.push({
        role: "assistant",
        content: resp,
      });

      await this.testCase.onResponse(this.messages);
      const repetitive = await this.isRepetitive();

      if (repetitive || this.testCase.isAllAccepted()) break;
    }
    console.log(this.messages);
    this.testCase.printFinalResults();
  }

  private async isRepetitive(): Promise<boolean> {
    if (this.messages.length > 4) {
      const len = this.messages.length;
      const lastAssistantMessage = this.messages[len - 1].content;
      const twoLastAssistantMessage = this.messages[len - 3].content;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "developer",
            content:
              "Your job is to look at two messages and determine if there is sufficient unique content between the two. If the two messages are similar and/or no new information was introduced return SAME, otherwise return DIFF.",
          },
          {
            role: "user",
            content: `Message 1: ${twoLastAssistantMessage}\nMessage 2: ${lastAssistantMessage}`,
          },
        ],
      });

      return completion.choices[0].message.content === "SAME";
    }

    return false;
  }
}

const SYSTEM_PROMPT =
  "You are a customer with a problem and you are speaking with a support agent. You will be provided with a persona to assume, and a conversation summary between yourself and the support agent. The conversation will be annotated with [user] for previous messages that you have sent and [agent] for the responses by the customer support agent. Your objective is to generate text based on what you would say as the customer. Your persona is this:";
