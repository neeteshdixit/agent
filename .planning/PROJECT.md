# NEXUS AI

## What This Is
NEXUS AI is a privacy-first, fully autonomous digital operator that lives as a browser/mobile extension. It handles the user's repetitive communication (Email, WhatsApp), filters notification clutter, and manages complex digital tasks using Reinforcement Learning to adapt to user habits and daily data.

## Core Value
"Human speaks once -> AI handles everything" — reducing mobile addiction by delegating digital life to a private, self-learning agent.

## Requirements

### Validated
- ✓ Email/password and Google OAuth authentication — existing
- ✓ Chat dashboard with saved conversation history — existing
- ✓ Basic voice input using Web Speech API — existing
- ✓ Python ML-based intent classification (scikit-learn/RapidFuzz) — existing
- ✓ PostgreSQL data persistence — existing
- ✓ Automated email sending (Nodemailer) — existing
- ✓ Browser automation foundation (Puppeteer-core) — existing

### Active
- [ ] **Extension-Based Automation**: Browser/mobile extension to automate Email and WhatsApp directly from the UI.
- [ ] **Reinforcement Learning (RL)**: Self-learning system that adapts intent classification and task priority based on user feedback and daily patterns.
- [ ] **Smart Notification Filtering**: AI-driven importance classification for WhatsApp, Telegram, Instagram, and Gmail.
- [ ] **Autonomous Call Handling**: Agent-managed coordination and summarization of important calls.
- [ ] **Privacy Sandbox**: Local-first processing and zero-knowledge encryption for all user communications.
- [ ] **Shadow Mode**: Safe "suggestion-first" execution to build user trust and train the RL model.
- [ ] **Contextual Awareness**: Location and activity sensing to filter notifications smarter.

### Out of Scope
- [Traditional Chatbot] — Explicitly moving beyond hardcoded command systems to autonomous agents.
- [Training LLMs from Scratch] — Using open-source models (Llama 3, Mistral, Qwen) or OpenAI APIs instead.

## Context
The project aims to solve modern problems like notification overload and manual digital work. It leverages an existing React/Node.js/Python stack but needs to evolve into a more agentic and autonomous system.

## Constraints
- **Tech Stack**: Must use React, Node.js, Python, and PostgreSQL as the core foundation.
- **Privacy/Security**: Agent handles sensitive messages and emails; must include encryption and user approval systems.
- **Hardware**: Goal of low hardware usage to ensure the agent is accessible.

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid AI Strategy | Use Python scikit-learn for intent and LLMs (Llama 3/Mistral/OpenAI) for reasoning. | — Pending |
| Multi-Repo Approach | Separate frontend, backend, and AI service for cleaner separation of concerns. | ✓ Good |

## Evolution
This document evolves at phase transitions and milestone boundaries.

**After each phase transition**:
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone**:
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-16 after initialization*
