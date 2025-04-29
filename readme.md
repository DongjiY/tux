# Tux: A CLI tool to validate and test agents

## Contribution Guide

After cloning the repository, run:

```sh
npm install
npm run build
npm start
```

This builds the project and starts the frontend viewer at http://localhost:3000.

If the `tux` CLI command is not recognized after building, link it globally:

```sh
npm link
```

## Running the CLI

To test the CLI:

```sh
tux -t ./config/test_cases.json -a ./config/assistant.json
```