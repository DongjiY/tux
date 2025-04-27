import OpenAI from "openai";

export class Model {
  protected openai: any;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
}
