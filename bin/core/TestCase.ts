import { Outputs, Inputs, RawTestCase } from "./types";

export class TestCase {
  private outputs: Outputs;
  private inputs: Inputs;

  constructor(raw: RawTestCase) {
    this.outputs = this.convertOutputs(raw);
    this.inputs = this.convertInputs(raw);
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

  public onResponse(text: string) {
    this.outputs.acceptanceCriteria.forEach((ac, index) => {
      // do your logic here
      if (true) {
        ac.isCompleted = true;
      }
    });
  }
}
