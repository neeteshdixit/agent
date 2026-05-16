# REQUIREMENTS.md — NEXUS AI (Whole PRD)

## 1. Product Vision & Introduction
**NEXUS AI** is designed to be a personal digital operator that acts as a buffer between the human and their digital environment. By automating repetitive tasks (Email, WhatsApp) and filtering distractions, it enables users to regain control over their time and focus.

### Goal
"One command, total execution." Minimize the time spent on mobile/browser interactions while maximizing productivity.

---

## 2. Core Functional Requirements

### 2.1 Voice & Text Interface (Omni-Channel)
- **Voice-First Interaction**: High-accuracy Speech-to-Text (Whisper) for hands-free operation.
- **Natural Language Understanding**: Advanced intent extraction using a hybrid model (Local ML + LLM).
- **Multi-Modal Input**: Support for text commands via a minimalist chat interface.

### 2.2 Autonomous Automation (Extension-Based)
- **Browser/Mobile Extension**: A persistent agent that "lives" in the user's browser/phone to automate:
    - **Email**: Drafting, summarizing, and sending professional emails based on brief voice prompts.
    - **WhatsApp**: Reading priority messages, drafting intelligent replies, and managing group clutter.
    - **Web Tasks**: Performing multi-step actions like food ordering, flight booking, or pipeline deployment.
- **Human-in-the-Loop Approval**: Critical actions (sending money, final email send, food ordering) require a simple user "OK" (voice or tap).

### 2.3 Smart Notification Filtering (The Distraction Buffer)
- **Real-Time Classification**: Every notification is intercepted and classified by importance.
- **Urgency Detection**: Detects recruiters, emergencies, or time-sensitive work messages.
- **Quiet Mode**: Silent blocking of social media distractions while allowing priority alerts.

### 2.4 Call Handling & Coordination
- **Call Interpretation**: Agent listens to the user's direction regarding upcoming or missed calls.
- **Automated Coordination**: "Tell my manager I'll be 5 mins late" -> Agent sends a WhatsApp/SMS or prepares to handle a call.
- **Call Summary**: Summarizes important points from calls (with user permission).

### 2.5 Reinforcement Learning (The Self-Learning Brain)
- **Feedback Loops**: User can say "That was wrong" or "Perfect" to provide immediate reinforcement.
- **Daily Data Learning**: The agent analyzes daily interaction patterns to anticipate user needs.
- **Personalized Reward Function**: The RL model (likely Q-Learning or Policy Gradient) adjusts priorities based on user-specific "utility" (e.g., user values family messages over LinkedIn).

---

## 3. Non-Functional Requirements

### 3.1 Privacy & Security (The Private Digital Brain)
- **Local-First Processing**: Sensitive data (emails, chats) is processed locally whenever possible.
- **Zero-Knowledge Architecture**: Encryption of all personal memory stored in the database.
- **OAuth & Permissions**: Granular permission management for the extension.

### 3.2 Performance & Reliability
- **Low Hardware Usage**: Optimized for mobile devices and background browser execution.
- **Fallback Mechanisms**: If the primary LLM is offline, basic local ML (scikit-learn) handles common commands.
- **Sub-Second Response**: Minimal latency from voice input to action initiation.

---

## 4. Enhanced Features (The "WOW" Factor)

### 4.1 Shadow Mode (The Training Phase)
Before going fully autonomous, the agent operates in "Shadow Mode" — it shows the user what it *would* do and asks for feedback. This builds trust and trains the RL model safely.

### 4.2 Contextual Awareness
The agent senses:
- **Location**: Home vs. Office vs. Gym.
- **Activity**: Driving (read aloud) vs. Meeting (silent/auto-reply).
- **Time of Day**: Winding down (block all but family) vs. Deep Work (block everything).

### 4.3 Coding Assistant (Professional Mode)
- **Pipeline Automation**: "Deploy this repo" -> Agent handles Vercel/Docker config.
- **Auto-Debugging**: Monitors terminal errors and suggests/applies fixes.

---

## 5. Technical Stack (Proposed)
- **Frontend**: React (Extension UI), Electron (Desktop).
- **Backend**: Node.js (Orchestrator), Python (RL & ML Service).
- **Database**: PostgreSQL (Relational), ChromaDB (Vector/Memory).
- **AI Models**: Whisper (STT), Llama 3 / Qwen (Reasoning), scikit-learn (Fast Intent).
- **Automation**: Playwright / Puppeteer (Web), Mobile Overlay (Android Accessibility Services).

---

## 6. Success Metrics
- **Digital Well-being**: 30% reduction in average mobile screen time.
- **Task Velocity**: 2x faster completion of repetitive communication tasks.
- **User Trust**: 95% accuracy in "Important" vs. "Spam" classification.
- **Learning Rate**: RL model converges to user preferences within 7 days of active use.
