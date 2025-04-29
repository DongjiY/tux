import { Model } from "./Model.js";
import { Outputs, Inputs, RawTestCase } from "./types.js";
import { OpenAI } from "openai";
import { writeJsonResults } from "../results.js";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable.");
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class TestCase extends Model {
  private outputs: Outputs;
  private inputs: Inputs;
  private history: Array<{ role: string; content: string }> = [];
  private checkedMessages: Map<string, Set<string>> = new Map();
  /** 🆕 Collect every moderation check here */
  private moderationViolations: Array<{
    role: string;
    content: string;
    flagged: boolean;
    categories: Record<string, boolean>;
  }> = [];

  private evaluationMessages = 0;
  private evaluationTokens = 0;

  private finalResultsPrinted = false;
  private startTime = Date.now();
  private endTime = 0;

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
      acceptanceCriteria: raw.outputs.acceptance_criteria.map((ac) => ({
        alias: ac.alias!,
        criteria: ac.criteria!,
        isRequired: ac.isRequired!,
        isCompleted: false,
        failureReasoning: "",
      })),
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
    // append to history
    this.history.push(...messages);

    // 🆕 run moderation on every new message
    for (const m of messages) {
      console.log("Running moderation for message:", m.content); // Debug log
      const mod = await openai.moderations.create({ input: m.content });
      const result = mod.results[0];
      console.log("Moderation result:", result); // Debug log
      this.moderationViolations.push({
        role: m.role,
        content: m.content,
        flagged: result.flagged,
        categories: Object.fromEntries(
          Object.entries(result.categories).map(([key, value]) => [key, !!value])
        ),
      });
    }

    const assistantMsgs = this.history.filter((m) => m.role === "assistant");
    console.log("Filtered assistant messages:", assistantMsgs); // Debug log
    if (assistantMsgs.length === 0) return;

    // acceptance criteria checks
    for (const ac of this.outputs.acceptanceCriteria) {
      console.log("Checking acceptance criteria:", ac.alias); // Debug log
      if (ac.isCompleted) {
        console.log("Criteria already completed:", ac.alias); // Debug log
        continue;
      }

      for (const m of assistantMsgs) {
        const response = m.content.trim();
        console.log("Evaluating response:", response); // Debug log
        if (!response) continue;
        if (this.checkedMessages.get(response)?.has(ac.alias)) {
          console.log("Response already checked for criteria:", ac.alias); // Debug log
          continue;
        }

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

        console.log("Completion result:", completion); // Debug log
        this.evaluationMessages += 1;
        this.evaluationTokens += completion.usage?.total_tokens || 0;

        const args =
          completion.choices[0].message.tool_calls?.[0]?.function?.arguments;
        if (!args) {
          console.log("No arguments returned from tool call."); // Debug log
          continue;
        }
        const parsed = JSON.parse(args) as {
          satisfied: boolean;
          reasoning: string;
        };

        if (!this.checkedMessages.has(response)) {
          this.checkedMessages.set(response, new Set());
        }
        this.checkedMessages.get(response)!.add(ac.alias);

        if (parsed.satisfied) {
          console.log("Criteria satisfied:", ac.alias); // Debug log
          ac.isCompleted = true;
        } else {
          console.log("Criteria not satisfied:", ac.alias, "Reason:", parsed.reasoning); // Debug log
          ac.failureReasoning = parsed.reasoning;
        }
      }
    }
  }

  public isAllAccepted(): boolean {
    return this.outputs.acceptanceCriteria.every((ac) => ac.isCompleted);
  }

  public async printFinalResults(
    simulationMessages: number,
    simulationTokens: number,
    detectedRepetition: boolean
  ): Promise<void> {
    console.log("DEBUG: Entering printFinalResults method"); // Debug log
    if (this.finalResultsPrinted) return;
    this.endTime = Date.now();

    console.log("\nFinal Acceptance Criteria Results:");
    for (const ac of this.outputs.acceptanceCriteria) {
      const status = ac.isCompleted ? "PASSED" : "FAILED";
      console.log(`- [${status}] ${ac.alias}`);
      if (!ac.isCompleted && ac.failureReasoning) {
        console.log(`  Reason: ${ac.failureReasoning}`);
      }
    }

    const seconds = ((this.endTime - this.startTime) / 1000).toFixed(2);
    console.log("\nJudge-Model Summary:");
    console.log(`- evaluation calls:  ${this.evaluationMessages}`);
    console.log(`- evaluation tokens: ${this.evaluationTokens}`);
    console.log(`- duration:           ${seconds} s\n`);
    console.log(detectedRepetition ? "Detected repetition!" : "No repetition detected.");
    console.log("Moderation Violations:");
    for (const violation of this.moderationViolations) {
      console.log(`- [${violation.role}] ${violation.content}`);
      console.log(`  Flagged: ${violation.flagged}`);
      console.log(`  Categories: ${JSON.stringify(violation.categories)}`);
    }
    // 🆕 Build the full result object
    const resultObject = {
      identity: this.inputs.assumedIdentity,
      acceptance: this.outputs.acceptanceCriteria.map((ac) => ({
        alias: ac.alias,
        passed: ac.isCompleted,
        reason: ac.isCompleted ? undefined : ac.failureReasoning,
      })),
      serviceagentCalls: this.evaluationMessages,
      serviceagentTokens: this.evaluationTokens,
      simulationCalls: simulationMessages,
      simulationTokens: simulationTokens,
      conversation: this.history,
      detectedRepetition,
      moderationViolations: this.moderationViolations,
    };

    // 🆕 debug log
    console.log("\nDEBUG: About to write result:\n", JSON.stringify(resultObject, null, 2));

    await writeJsonResults(resultObject);

    this.finalResultsPrinted = true;
  }
}
