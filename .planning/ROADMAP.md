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

### Phase 2: Smart Notification Filtering
**Goal**: Implement the filtering layer to reduce mobile distraction.
**Depends on**: Phase 1
**Requirements**: Notification Filtering
**Success Criteria**:
  1. System can ingest notifications from Gmail and WhatsApp.
  2. AI classifies notifications into "Important", "Ignore", or "Notify Urgently".
  3. User is only alerted for "Urgently" classified items.
**Plans**: 2 plans

### Phase 3: Communication Automation
**Goal**: Enable the agent to handle outgoing and incoming communication autonomously.
**Depends on**: Phase 2
**Requirements**: Email Automation, WhatsApp Automation
**Success Criteria**:
  1. User can command "Draft an email to HR about X" and have it executed.
  2. Agent can reply to priority WhatsApp conversations intelligently.
  3. All communications require user confirmation before final "send" (MVP).
**Plans**: 3 plans

### Phase 4: Autonomous Task Execution
**Goal**: Expand capabilities to web-based tasks and productivity management.
**Depends on**: Phase 3
**Requirements**: Food Ordering, Productivity Lock
**Success Criteria**:
  1. User can command "Order a burger under 200" and the agent compares options and prepares an order.
  2. Productivity lock can block distractions and limit social media usage based on user-set rules.
**Plans**: 2 plans

### Phase 5: Coding Assistant Agent
**Goal**: Support developer workflows with deployment and debugging tools.
**Depends on**: Phase 4
**Requirements**: Coding Assistant, CI/CD, Deployment
**Success Criteria**:
  1. User can command "Deploy this project to Vercel".
  2. Agent can detect and suggest fixes for build errors.
**Plans**: 3 plans

### Phase 6: Personalization & Self-Learning
**Goal**: Implement long-term memory and reinforcement learning for habits.
**Depends on**: Phase 5
**Requirements**: Self-learning Personalization
**Success Criteria**:
  1. Agent remembers user preferences (favorite food, frequent contacts).
  2. Intent classification improves based on user feedback/corrections.
**Plans**: 2 plans

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation | v0.1 | 1/1 | Complete | 2026-05-16 |
| 2. Notifications | v1.0 | 0/2 | Not started | - |
| 3. Communication | v1.0 | 0/3 | Not started | - |
| 4. Execution | v1.0 | 0/2 | Not started | - |
| 5. Coding Agent | v2.0 | 0/3 | Not started | - |
| 6. Personalization | v2.0 | 0/2 | Not started | - |
