# Tux: A CLI Tool for Validating and Testing Agents

## Contribution Guide

1. Clone the repository.
2. Install dependencies, build the project, and start the frontend viewer:

```sh
npm install
npm run build
npm start
```

The frontend viewer will be available at [http://localhost:3000](http://localhost:3000).

If the `tux` CLI command is not recognized, link it globally:

```sh
npm link
```

## Running the CLI

Run the CLI with:

```sh
tux -t ./config/test_cases.json -a ./config/assistant.json
```

## Configuring the Assistant and Test Cases

Configuration files are located in the `./config/` directory:

- **`assistant.json`**: Defines the assistant's behavior, rules, and constraints.
- **`test_cases.json`**: Contains test scenarios, user contexts, acceptance criteria, and interaction triggers.

Customize these files as needed.

## Exporting the API Key

Export your OpenAI API key to enable the assistant:

```sh
export OPENAI_API_KEY='your-api-key-here'
```

Replace `'your-api-key-here'` with your actual API key. Keep it secure and private.

> **Important**: Keep your API key secure and do not share it publicly.