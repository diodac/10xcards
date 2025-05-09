# 10xCards

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-0.0.1-green.svg)

A web application for creating educational flashcards using AI technology or manually by users.

## Table of Contents
- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

10xCards is a web application that enables users to create educational flashcards using AI technology or manually. The application combines bulk flashcard generation with an interface for browsing, editing (including adding comments), and deleting them. The system is based on a simple user account management mechanism using Supabase and integration with a ready-made spaced repetition algorithm. Additionally, the application logs information about the source of flashcards and their generation process, which will allow for cost and usage analysis in the future.

### Problem Statement

Users often give up on manually creating high-quality educational flashcards due to the time and effort required, which limits the effectiveness of learning using the spaced repetition method. This problem is particularly acute in situations where quick and effective learning materials are needed, and manual creation becomes a barrier to a systematic approach to learning.

## Tech Stack

### Frontend
- **Astro 5**: For creating fast, efficient pages and applications with minimal JavaScript
- **React 19**: Provides interactivity where needed
- **TypeScript 5**: For static code typing and better IDE support
- **Tailwind 4**: Allows for convenient application styling
- **Shadcn/ui**: Provides a library of accessible React components for the UI

### Backend
- **Supabase**: Comprehensive backend solution
  - PostgreSQL database
  - SDKs in multiple languages serving as Backend-as-a-Service
  - Open-source solution that can be hosted locally or on your server
  - Built-in user authentication

### AI
- **Openrouter.ai**: Communication with AI models
  - Access to a wide range of models (OpenAI, Anthropic, Google, and many others)
  - Allows setting financial limits on API keys

### CI/CD and Hosting
- **GitHub Actions**: For creating CI/CD pipelines
- **DigitalOcean**: For application hosting via docker image

## Getting Started Locally

### Prerequisites
- Node.js (v22.14.0)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/10xcards.git
   cd 10xcards
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Copy the example environment file and configure as needed
   ```bash
   cp .env.example .env
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:4321`

## Available Scripts

- `npm run dev`: Starts the development server
- `npm run build`: Builds the application for production
- `npm run preview`: Previews the built application
- `npm run astro`: Runs Astro CLI commands
- `npm run lint`: Lints the codebase
- `npm run lint:fix`: Lints and fixes issues
- `npm run format`: Formats code with Prettier

## Project Scope

### Included Features
1. **AI Flashcard Generation**:
   - Bulk generation of flashcards from text input
   - Individual editing and commenting on generated flashcards
   - Approval or modification of generated flashcards

2. **Manual Flashcard Creation**:
   - Creating, editing, and deleting flashcards

3. **Flashcard Browsing**:
   - Displaying a list of flashcards with easy access to editing and deletion

4. **User Account System**:
   - Basic registration and login system using Supabase
   - Secure access to user data

5. **Spaced Repetition Integration**:
   - Integration with an existing spaced repetition algorithm

6. **Onboarding**:
   - Instructions modal displayed on first launch
   - Option to reopen the modal from the interface

7. **Event Logging**:
   - Recording logs about flashcard generation, including source and generation costs

### Limitations
1. No advanced spaced repetition algorithm (like SuperMemo, Anki)
2. No support for importing from multiple formats (PDF, DOCX, etc.)
3. No functionality for sharing flashcard sets between users
4. No integration with other educational platforms
5. No mobile app in the MVP - product will be available only as a web application

## Project Status

This project is currently in early development stage (version 0.0.1).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
