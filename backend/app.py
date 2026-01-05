"""
Main Flask backend server for Agent application
Handles voice recognition, command processing, and automation
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging
from datetime import datetime

from modules.speech_recognition_service import SpeechRecognitionService
from modules.command_processor import CommandProcessor
from modules.automation_handler import AutomationHandler
from modules.chat_handler import ChatHandler

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize services
speech_service = SpeechRecognitionService()
command_processor = CommandProcessor()
automation_handler = AutomationHandler()
chat_handler = ChatHandler()


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': 'Agent Backend'
    }), 200


@app.route('/api/voice/transcribe', methods=['POST'])
def transcribe_voice():
    """
    Transcribe voice audio to text
    Expects audio file in request
    """
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400

        audio_file = request.files['audio']
        
        if audio_file.filename == '':
            return jsonify({'error': 'No audio file selected'}), 400

        # Save temporarily and transcribe
        temp_path = os.path.join('/tmp', audio_file.filename)
        audio_file.save(temp_path)

        # Transcribe audio
        text = speech_service.transcribe_audio(temp_path)

        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)

        logger.info(f"Transcribed audio: {text}")

        return jsonify({
            'success': True,
            'transcribed_text': text,
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Error transcribing voice: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/voice/listen-and-process', methods=['POST'])
def listen_and_process():
    """
    Listen to voice, transcribe, and process the command
    """
    try:
        duration = request.json.get('duration', 10) if request.json else 10
        
        # Listen to voice
        logger.info(f"Listening for {duration} seconds...")
        audio_text = speech_service.listen_and_transcribe(duration)

        if not audio_text:
            return jsonify({'error': 'Could not understand audio'}), 400

        # Process the command
        command_type, result = command_processor.process_command(audio_text)

        logger.info(f"Command type: {command_type}, Result: {result}")

        return jsonify({
            'success': True,
            'transcribed_text': audio_text,
            'command_type': command_type,
            'result': result,
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Error in listen and process: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/automation/create', methods=['POST'])
def create_automation():
    """Create a new automation task"""
    try:
        data = request.json
        automation_name = data.get('name')
        automation_description = data.get('description')
        automation_trigger = data.get('trigger', 'manual')

        if not automation_name:
            return jsonify({'error': 'Automation name is required'}), 400

        automation = automation_handler.create_automation(
            name=automation_name,
            description=automation_description,
            trigger=automation_trigger
        )

        logger.info(f"Created automation: {automation_name}")

        return jsonify({
            'success': True,
            'automation': automation,
            'message': f'Automation "{automation_name}" created successfully'
        }), 201

    except Exception as e:
        logger.error(f"Error creating automation: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/automation/run/<automation_id>', methods=['POST'])
def run_automation(automation_id):
    """Run a specific automation"""
    try:
        result = automation_handler.run_automation(automation_id)

        if result['success']:
            logger.info(f"Running automation: {automation_id}")
            return jsonify(result), 200
        else:
            return jsonify(result), 404

    except Exception as e:
        logger.error(f"Error running automation: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/automation/list', methods=['GET'])
def list_automations():
    """List all automations"""
    try:
        automations = automation_handler.get_all_automations()
        return jsonify({
            'success': True,
            'automations': automations,
            'count': len(automations)
        }), 200

    except Exception as e:
        logger.error(f"Error listing automations: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/automation/delete/<automation_id>', methods=['DELETE'])
def delete_automation(automation_id):
    """Delete an automation"""
    try:
        result = automation_handler.delete_automation(automation_id)

        if result['success']:
            logger.info(f"Deleted automation: {automation_id}")
            return jsonify(result), 200
        else:
            return jsonify(result), 404

    except Exception as e:
        logger.error(f"Error deleting automation: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/chat/message', methods=['POST'])
def chat_message():
    """Send a chat message and get a response"""
    try:
        data = request.json
        user_message = data.get('message')

        if not user_message:
            return jsonify({'error': 'Message is required'}), 400

        response = chat_handler.get_response(user_message)

        logger.info(f"Chat - User: {user_message}, Bot: {response}")

        return jsonify({
            'success': True,
            'user_message': user_message,
            'agent_response': response,
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Error in chat: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/voice/command/<command_type>', methods=['POST'])
def execute_voice_command(command_type):
    """Execute a specific voice command"""
    try:
        data = request.json or {}
        
        if command_type == 'automation':
            automation_name = data.get('automation_name')
            result = automation_handler.run_automation_by_name(automation_name)
        elif command_type == 'chat':
            message = data.get('message')
            result = {'response': chat_handler.get_response(message)}
        else:
            return jsonify({'error': f'Unknown command type: {command_type}'}), 400

        return jsonify({
            'success': True,
            'command_type': command_type,
            'result': result,
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Error executing command: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/status', methods=['GET'])
def get_status():
    """Get current system status"""
    try:
        status = {
            'backend_running': True,
            'speech_recognition_available': speech_service.is_available(),
            'automations_count': len(automation_handler.get_all_automations()),
            'timestamp': datetime.now().isoformat()
        }
        return jsonify(status), 200

    except Exception as e:
        logger.error(f"Error getting status: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True').lower() == 'true'

    logger.info(f"Starting Agent Backend on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
