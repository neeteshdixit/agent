# Agent Backend - Python Voice Assistant

A Python-based backend for the Agent application that listens to voice commands and performs automation and chat operations.

## Features

✅ **Voice Recognition** - Listen to microphone and transcribe audio to text using Google Speech Recognition
✅ **Command Processing** - Intelligently process voice commands and determine action type
✅ **Automation Management** - Create, run, and manage automation tasks
✅ **Chat Interface** - Conversational AI with intent detection and contextual responses
✅ **REST API** - RESTful endpoints for all operations
✅ **State Persistence** - Save and load automation states
✅ **Execution Logging** - Track automation execution history

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- FFmpeg (for audio processing)
- Microphone for voice input

### Installing FFmpeg

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from: https://ffmpeg.org/download.html
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

## Installation

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create virtual environment (recommended):**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

## Configuration

Create a `.env` file in the backend directory with your settings:

```env
FLASK_ENV=development
DEBUG=True
PORT=5000
HOST=0.0.0.0
SPEECH_LANGUAGE=en-US
SPEECH_RECOGNITION_TIMEOUT=10
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Running the Server

```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health & Status

**GET** `/api/health`
- Check if backend is running

**GET** `/api/status`
- Get current system status

### Voice Operations

**POST** `/api/voice/transcribe`
- Transcribe audio file to text
- Expects: Audio file in multipart/form-data

**POST** `/api/voice/listen-and-process`
- Listen to microphone and process command
- Body: `{ "duration": 10 }`

**POST** `/api/voice/command/<command_type>`
- Execute voice command
- Types: `automation`, `chat`

### Automation Management

**POST** `/api/automation/create`
- Create new automation
- Body: `{ "name": "string", "description": "string", "trigger": "manual|scheduled|event" }`

**GET** `/api/automation/list`
- List all automations

**POST** `/api/automation/run/<automation_id>`
- Run specific automation

**DELETE** `/api/automation/delete/<automation_id>`
- Delete automation

### Chat Operations

**POST** `/api/chat/message`
- Send chat message and get response
- Body: `{ "message": "string" }`

## Project Structure

```
backend/
├── app.py                          # Main Flask application
├── requirements.txt               # Python dependencies
├── .env                          # Environment variables
├── automations_data.json         # Persisted automations
└── modules/
    ├── __init__.py
    ├── speech_recognition_service.py    # Voice handling
    ├── command_processor.py              # Command parsing
    ├── automation_handler.py             # Automation logic
    └── chat_handler.py                   # Chat responses
```

## Module Documentation

### SpeechRecognitionService
Handles all voice input and transcription:
- `listen_and_transcribe()` - Listen to microphone
- `transcribe_audio()` - Transcribe audio file
- `is_available()` - Check service availability

### CommandProcessor
Processes and classifies commands:
- `process_command()` - Parse voice command
- `validate_command()` - Validate command text
- `get_command_help()` - Get available commands

### AutomationHandler
Manages automation tasks:
- `create_automation()` - Create new automation
- `run_automation()` - Execute automation
- `get_all_automations()` - List all automations
- `delete_automation()` - Remove automation
- `get_execution_history()` - View run logs

### ChatHandler
Manages chat interactions:
- `get_response()` - Get AI response
- `get_conversation_history()` - View chat history
- `analyze_sentiment()` - Analyze message sentiment
- `get_contextual_response()` - Context-aware responses

## Usage Examples

### Using cURL

**Start listening:**
```bash
curl -X POST http://localhost:5000/api/voice/listen-and-process \
  -H "Content-Type: application/json" \
  -d '{"duration": 10}'
```

**Create automation:**
```bash
curl -X POST http://localhost:5000/api/automation/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Email Backup",
    "description": "Daily email backup",
    "trigger": "scheduled"
  }'
```

**Send chat message:**
```bash
curl -X POST http://localhost:5000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "What automations do I have?"}'
```

### Using Python

```python
import requests

BASE_URL = "http://localhost:5000"

# Listen to voice command
response = requests.post(
    f"{BASE_URL}/api/voice/listen-and-process",
    json={"duration": 10}
)
print(response.json())

# Create automation
response = requests.post(
    f"{BASE_URL}/api/automation/create",
    json={
        "name": "Daily Report",
        "description": "Generate daily report"
    }
)
print(response.json())

# Chat
response = requests.post(
    f"{BASE_URL}/api/chat/message",
    json={"message": "Hello!"}
)
print(response.json())
```

## Command Examples

Voice commands the system can understand:

**Automation Commands:**
- "Run email backup"
- "Execute data sync"
- "Start report generation"
- "Automate my daily tasks"

**Chat Commands:**
- "What time is it?"
- "Tell me the date"
- "Help me with automations"
- "How are you?"

**Control Commands:**
- "Stop the automation"
- "Delete email backup"
- "Clear all tasks"

## Troubleshooting

### Microphone not detected
- Check microphone is plugged in and working
- Run `python -c "import pyaudio; print(pyaudio.PyAudio().get_device_count())"`
- Adjust permissions for audio devices

### Speech recognition not working
- Ensure internet connection (uses Google Speech Recognition API)
- Check audio quality
- Adjust energy threshold: `speech_service.set_energy_threshold(4000)`

### FFmpeg errors
- Verify FFmpeg is installed: `ffmpeg -version`
- Add FFmpeg to system PATH

### CORS errors
- Update CORS_ORIGINS in .env file
- Ensure frontend is running on allowed port

## Development

### Testing Speech Recognition

```python
from modules.speech_recognition_service import SpeechRecognitionService

service = SpeechRecognitionService()
if service.is_available():
    text = service.listen_and_transcribe(duration=5)
    print(f"Transcribed: {text}")
else:
    print("Speech recognition not available")
```

### Testing Commands

```python
from modules.command_processor import CommandProcessor

processor = CommandProcessor()
command_type, result = processor.process_command("Run email backup")
print(f"Type: {command_type}")
print(f"Result: {result}")
```

## Performance Tips

1. **Reduce latency** - Run backend on same machine as frontend during development
2. **Optimize audio** - Improve microphone quality for better recognition
3. **Cache responses** - Responses are logged and can be cached
4. **Batch operations** - Group automation executions when possible

## Security Considerations

1. Set `DEBUG=False` in production
2. Use environment variables for sensitive data
3. Implement authentication for API endpoints
4. Validate all user inputs
5. Use HTTPS in production
6. Set proper CORS policies

## Contributing

To extend the system:

1. **Add new command types** - Modify `CommandProcessor`
2. **Add new automations** - Extend `AutomationHandler._execute_action()`
3. **Improve chat** - Enhance `ChatHandler.knowledge_base`
4. **Add new voice features** - Extend `SpeechRecognitionService`

## License

MIT License

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review logs in terminal output
3. Check environment configuration
4. Verify all dependencies are installed
