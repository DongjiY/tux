import { Outputs, Inputs, RawTestCase } from "./types";
import { OpenAI } from "openai"; // Ensure this is the correct library for OpenAI

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable.");
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class TestCase {
  private outputs: Outputs;
  private inputs: Inputs;
  private history: Array<{ role: string; content: string }> = [];
  private checkedMessages: Map<string, Set<string>> = new Map();

  constructor(raw: RawTestCase) {
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

        // Check if this message has already been evaluated for this acceptance alias
        const alreadyChecked = this.checkedMessages
          .get(response)
          ?.has(ac.alias);
        if (alreadyChecked) continue;

        const completion = await openai.chat.completions.create({
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

        const toolOutput =
          completion.choices[0]?.message?.tool_calls?.[0]?.function?.arguments;
        if (!toolOutput) continue;

        const parsed = JSON.parse(toolOutput) as {
          satisfied: boolean;
          reasoning: string;
        };

        // Mark this assistant message as checked for this specific acceptance criterion
        if (!this.checkedMessages.has(response)) {
          this.checkedMessages.set(response, new Set());
        }
        this.checkedMessages.get(response)!.add(ac.alias);

        if (parsed.satisfied) {
          ac.isCompleted = true;
          console.log(`[${ac.alias}] Reasoning: ${parsed.reasoning}`);
          break; // stop checking this AC once it's satisfied
        }
      }
    }
  }
}
