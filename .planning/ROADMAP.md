# Roadmap: NEXUS AI

## Overview
NEXUS AI evolves from a basic voice assistant foundation into a fully autonomous digital agent capable of filtering the world for the user and executing complex tasks across platforms (Email, WhatsApp, Web).

## Milestones
- ✅ **v0.1 Foundation** - Phases 1 (shipped 2026-05-16)
- 🚧 **v1.0 Autonomous Agent** - Phases 2-4 (in progress)
- 📋 **v2.0 Developer Pro** - Phases 5-6 (planned)

## Phases

### Phase 1: Foundation (COMPLETE)
**Goal**: Establish the core full-stack foundation with auth, chat, and basic voice command interpretation.
**Depends on**: Nothing
**Requirements**: Auth, Chat, Voice Input, ML Intent Detection
**Success Criteria**:
  1. User can sign up and log in via email or Google.
  2. User can send text/voice commands.
  3. Commands are classified into intents by the AI service.
  4. Task execution logs are persisted.
**Plans**: 1 plan (Initial setup)

### Phase 2: Extension & Automation Foundation
**Goal**: Build the browser extension and the automation layer for Email and WhatsApp.
**Depends on**: Phase 1
**Requirements**: Extension-Based Automation, Privacy Sandbox
**Success Criteria**:
  1. Browser extension can read and interact with Email/WhatsApp UIs.
  2. Agent executes "Draft email" and "Reply WhatsApp" commands directly in-browser.
  3. Sensitive data is stored in a local encrypted vault.
**Plans**: 3 plans

### Phase 3: Reinforcement Learning & Feedback
**Goal**: Implement the self-learning brain that adapts to user feedback and daily data.
**Depends on**: Phase 2
**Requirements**: Reinforcement Learning (RL), Shadow Mode
**Success Criteria**:
  1. Agent operates in "Shadow Mode", suggesting actions for user approval.
  2. Reward function updates based on user "Good/Bad" feedback.
  3. Intent classification accuracy increases over 7 days of active feedback.
**Plans**: 3 plans

### Phase 4: Smart Filtering & Contextual Awareness
**Goal**: Intelligent notification management and location/activity sensing.
**Depends on**: Phase 3
**Requirements**: Smart Notification Filtering, Contextual Awareness
**Success Criteria**:
  1. System filters notifications based on current activity (Driving/Meeting).
  2. Priority alerts (Recruiters/Emergencies) bypass silence modes.
**Plans**: 2 plans

### Phase 5: Autonomous Call Handling
**Goal**: Agent-managed call coordination and summarization.
**Depends on**: Phase 4
**Requirements**: Autonomous Call Handling
**Success Criteria**:
  1. Agent can summarize missed calls and coordinate follow-up messages.
  2. User can delegate coordination tasks (e.g., "Tell X I'm late").
**Plans**: 2 plans

### Phase 6: Pro Developer Mode (Coding Assistant)
**Goal**: Advanced automation for developer workflows and autonomous task execution.
**Depends on**: Phase 5
**Requirements**: Coding Assistant, Autonomous Task Execution
**Success Criteria**:
  1. Agent automates complex multi-step web tasks (Food ordering/Booking).
  2. Pipeline generation and auto-debugging work for project repos.
**Plans**: 3 plans

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v0.1 | 1/1 | Complete | 2026-05-16 |
| 2. Extension | v1.0 | 0/3 | Not started | - |
| 3. RL & Feedback | v1.0 | 0/3 | Not started | - |
| 4. Smart Filtering | v1.0 | 0/2 | Not started | - |
| 5. Call Handling | v1.0 | 0/2 | Not started | - |
| 6. Coding Agent | v2.0 | 0/3 | Not started | - |
