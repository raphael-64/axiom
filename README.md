# Axiom (LOCAL BRANCH)

An editor interface for George, for [SE212 (Logic and Computation)](https://student.cs.uwaterloo.ca/~se212/notes.html) at the University of Waterloo.

## Features

- **Intelligent language support**
  - Auto-incrementing line numbers
  - Auto-decrementing line numbers (`⌘+X`)
  - Auto-updating rule references
  - Auto-closing braces and indentations
  - Comments (`⌘+/`)
  - Jump to line definition (`⌘+Click`)
  - Hover tooltip for rule definitions
  - Boundaries above and below at `#check {x}`
  - Remove empty lines with line numbers with `⏎`
- **User interface**
  - Tabs for opening multiple files
  - Collapsible and resizable panels
    - Sidebar explorer (`⌘+B`)
    - George output (`⌘+J`)
  - Keyboard shortcuts for all major features
  - VSCode-like editor features and shortcuts (we use the same editor library as VSCode)
  - Local assignment and project files, persisted in local storage
  - Upload a `.grg` file into the current tab (`⌘+U`)
  - Download the current file
- **Settings menu (`⌘+K`)**
  - Light/dark mode
  - Toggle autocomplete
  - Individually customizable editor colours

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for information on contributing to Axiom.

## Running Locally

### Frontend

We use Next.js 14 + Typescript, as well as these libraries:

- Monaco editor
- Y.js
- Socket.io
- Tanstack Query
- TailwindCSS
- Shadcn UI

Run the frontend:

```
cd frontend
npm i
npm run dev
```
