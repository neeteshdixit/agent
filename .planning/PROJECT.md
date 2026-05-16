# NEXUS AI

## What This Is
NEXUS AI is a fully autonomous personal AI Agent designed to reduce mobile addiction and perform digital tasks on behalf of the user. It operates via voice and text commands, serving as a smart assistant, productivity manager, and digital brain.

## Core Value
"Human speaks once -> AI handles everything" — autonomous task execution to maximize human focus and minimize digital distraction.

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
- [ ] **Smart Notification Filtering**: AI checks WhatsApp, Telegram, Instagram, and Gmail to notify only when important.
- [ ] **Email Automation**: Drafting and sending professional emails automatically based on user intent.
- [ ] **WhatsApp Automation**: Reading messages, sending replies, and detecting priority conversations.
- [ ] **Food Ordering**: Autonomous restaurant comparison, price matching, and ordering.
- [ ] **Productivity Lock**: Limiting social media and blocking distractions to reduce mobile usage.
- [ ] **Coding Assistant Agent (Phase 2)**: Pipeline generation, auto-debugging, and deployment automation (Vercel, Docker).

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
