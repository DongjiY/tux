import { Model } from "./Model.js";
import { Outputs, Inputs, RawTestCase } from "./types";

export class TestCase extends Model {
  private outputs: Outputs;
  private inputs: Inputs;
  private history: Array<{ role: string; content: string }> = [];
  private checkedMessages: Map<string, Set<string>> = new Map();
  private finalResultsPrinted: boolean = false;

  private totalMessagesSent: number = 0; // added
  private totalTokensUsed: number = 0; // added
  private startTime: number = Date.now(); // added
  private endTime: number = 0; // added

  constructor(raw: RawTestCase) {
    super();
    this.outputs = this.convertOutputs(raw);
    this.inputs = this.convertInputs(raw);
  }

  public getOutputs(): Outputs {
    return this.outputs;
  }

  public getInputs(): Inputs {
    return this.inputs;
  }

  private convertOutputs(raw: RawTestCase): Outputs {
    return {
      acceptanceCriteria: raw.outputs.acceptance_criteria.map((ac) => {
        return {
          alias: ac.alias!,
          criteria: ac.criteria!,
          isRequired: ac.isRequired!,
          isCompleted: false,
          failureReasoning: "", // added
        };
      }),
      maxMessages: raw.outputs.max_messages,
    };
  }

  private convertInputs(raw: RawTestCase): Inputs {
    return {
      assumedIdentity: raw.inputs.assumed_identity,
      additionalFacts: raw.inputs.additional_facts,
    };
  }

  public async onResponse(
    messages: Array<{ role: string; content: string }>
  ): Promise<void> {
    this.history.push(...messages);

    const assistantMessages = this.history.filter(
      (m) => m.role === "assistant"
    );
    if (assistantMessages.length === 0) return;

    for (const ac of this.outputs.acceptanceCriteria) {
      if (ac.isCompleted) continue;

      for (const message of assistantMessages) {
        const response = message.content.trim();
        if (!response) continue;

        const alreadyChecked = this.checkedMessages
          .get(response)
          ?.has(ac.alias);
        if (alreadyChecked) continue;

        const completion = await this.openai.chat.completions.create({
          model: "gpt-4-1106-preview",
          temperature: 0,
          messages: [
            {
              role: "system",
              content:
                "You are a strict evaluator checking if an assistant response meets the acceptance criteria.",
            },
            {
              role: "user",
              content: `Acceptance Criteria: "${ac.criteria}"\nAssistant Response: "${response}"`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "validate_response",
                description:
                  "Evaluate if the assistant response satisfies the acceptance criteria and explain why.",
                parameters: {
                  type: "object",
                  properties: {
                    satisfied: {
                      type: "boolean",
                      description: "Whether criteria is satisfied.",
                    },
                    reasoning: {
                      type: "string",
                      description: "Explain why it satisfies or not.",
                    },
                  },
                  required: ["satisfied", "reasoning"],
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "validate_response" },
          },
        });

        this.totalMessagesSent++; // count each OpenAI call
        this.totalTokensUsed += completion.usage?.total_tokens || 0; // count tokens used

        const toolOutput =
          completion.choices[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (!toolOutput) continue;

        const parsed = JSON.parse(toolOutput) as {
          satisfied: boolean;
          reasoning: string;
        };

        if (!this.checkedMessages.has(response)) {
          this.checkedMessages.set(response, new Set());
        }
        this.checkedMessages.get(response)!.add(ac.alias);

        if (parsed.satisfied) {
          ac.isCompleted = true;
        } else {
          ac.failureReasoning = parsed.reasoning;
        }
      }
    }
  }

  public isAllAccepted(): boolean {
    for (const ac of this.outputs.acceptanceCriteria) {
      if (!ac.isCompleted) return false;
    }
    return true;
  }

  public printFinalResults(): void {
    if (this.finalResultsPrinted) return;

    this.endTime = Date.now(); // capture test end time

    console.log("\nFinal Acceptance Criteria Results:");
    for (const ac of this.outputs.acceptanceCriteria) {
      const status = ac.isCompleted ? "PASSED" : "FAILED";
      console.log(`- [${status}] ${ac.alias}`);
      if (!ac.isCompleted && ac.failureReasoning) {
        console.log(`  Reason: ${ac.failureReasoning}`);
      }
    }
    console.log();

    const totalSeconds = ((this.endTime - this.startTime) / 1000).toFixed(2);
    console.log("Test Summary:");
    console.log(`- Total Messages Sent: ${this.totalMessagesSent}`);
    console.log(`- Total Tokens Used: ${this.totalTokensUsed}`);
    console.log(`- Total Test Duration: ${totalSeconds} seconds\n`);

    this.finalResultsPrinted = true;
  }
}
