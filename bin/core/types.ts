export interface Outputs {
  acceptanceCriteria: Array<AcceptanceCriteria>;
  maxMessages: number;
}

export interface Inputs {
  assumedIdentity: string;
  additionalFacts: Array<AdditionalFacts>;
}

export interface AcceptanceCriteria {
  alias: string;
  criteria: string;
  isRequired: boolean;
  isCompleted: boolean;
  failureReasoning: string;
}

export interface AdditionalFacts {
  trigger: string;
  response: string;
}

export interface RawTestCase {
  outputs: {
    acceptance_criteria: Array<Partial<AcceptanceCriteria>>;
    max_messages: number;
  };
  inputs: {
    assumed_identity: string;
    additional_facts: Array<AdditionalFacts>;
  };
}
