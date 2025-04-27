export class TestCase {
    constructor(raw) {
        this.outputs = this.convertOutputs(raw);
        this.inputs = this.convertInputs(raw);
    }
    convertOutputs(raw) {
        return {
            acceptanceCriteria: raw.outputs.acceptance_criteria.map((ac) => {
                return {
                    alias: ac.alias,
                    criteria: ac.criteria,
                    isRequired: ac.isRequired,
                    isCompleted: false,
                };
            }),
            maxMessages: raw.outputs.max_messages,
        };
    }
    convertInputs(raw) {
        return {
            assumedIdentity: raw.inputs.assumed_identity,
            additionalFacts: raw.inputs.additional_facts,
        };
    }
    onResponse(text) {
        this.outputs.acceptanceCriteria.forEach((ac, index) => {
            // do your logic here
            if (true) {
                ac.isCompleted = true;
            }
        });
    }
}
