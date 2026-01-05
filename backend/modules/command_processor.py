"""
Command Processor Module
Processes voice commands and determines action type
"""

import re
import logging
from typing import Tuple, Dict, Any

logger = logging.getLogger(__name__)


class CommandProcessor:
    """Processes voice commands and extracts intents"""

    def __init__(self):
        """Initialize the command processor"""
        self.automation_keywords = [
            'automate', 'automation', 'run', 'execute', 'start',
            'create', 'setup', 'schedule', 'trigger'
        ]
        self.chat_keywords = [
            'ask', 'tell', 'what', 'how', 'why', 'when', 'where',
            'who', 'help', 'chat', 'talk', 'question', 'explain'
        ]
        self.status_keywords = [
            'status', 'state', 'check', 'list', 'show', 'get',
            'report', 'info', 'information'
        ]
        self.control_keywords = [
            'stop', 'pause', 'cancel', 'delete', 'remove', 'clear'
        ]

    def process_command(self, command_text: str) -> Tuple[str, Dict[str, Any]]:
        """
        Process a voice command and determine its type and action
        
        Args:
            command_text: The transcribed voice command
        
        Returns:
            Tuple of (command_type, result_dict)
        """
        logger.info(f"Processing command: {command_text}")

        command_lower = command_text.lower().strip()

        # Determine command type
        if self._is_automation_command(command_lower):
            return self._handle_automation_command(command_text)
        elif self._is_status_command(command_lower):
            return self._handle_status_command(command_text)
        elif self._is_control_command(command_lower):
            return self._handle_control_command(command_text)
        else:
            return self._handle_chat_command(command_text)

    def _is_automation_command(self, command: str) -> bool:
        """Check if command is automation-related"""
        return any(keyword in command for keyword in self.automation_keywords)

    def _is_chat_command(self, command: str) -> bool:
        """Check if command is chat-related"""
        return any(keyword in command for keyword in self.chat_keywords)

    def _is_status_command(self, command: str) -> bool:
        """Check if command is status-related"""
        return any(keyword in command for keyword in self.status_keywords)

    def _is_control_command(self, command: str) -> bool:
        """Check if command is control-related"""
        return any(keyword in command for keyword in self.control_keywords)

    def _handle_automation_command(self, command_text: str) -> Tuple[str, Dict[str, Any]]:
        """Handle automation-related commands"""
        logger.info(f"Handling automation command: {command_text}")

        # Extract automation name/details
        automation_name = self._extract_automation_name(command_text)

        result = {
            'command_type': 'automation',
            'action': 'execute',
            'automation_name': automation_name,
            'original_command': command_text,
            'status': 'pending'
        }

        return 'automation', result

    def _handle_chat_command(self, command_text: str) -> Tuple[str, Dict[str, Any]]:
        """Handle chat-related commands"""
        logger.info(f"Handling chat command: {command_text}")

        result = {
            'command_type': 'chat',
            'message': command_text,
            'status': 'pending'
        }

        return 'chat', result

    def _handle_status_command(self, command_text: str) -> Tuple[str, Dict[str, Any]]:
        """Handle status-related commands"""
        logger.info(f"Handling status command: {command_text}")

        # Determine what status is requested
        status_type = self._extract_status_type(command_text)

        result = {
            'command_type': 'status',
            'action': 'check',
            'status_type': status_type,
            'original_command': command_text
        }

        return 'status', result

    def _handle_control_command(self, command_text: str) -> Tuple[str, Dict[str, Any]]:
        """Handle control-related commands"""
        logger.info(f"Handling control command: {command_text}")

        # Determine the control action
        control_action = self._extract_control_action(command_text)
        target = self._extract_target(command_text)

        result = {
            'command_type': 'control',
            'action': control_action,
            'target': target,
            'original_command': command_text
        }

        return 'control', result

    def _extract_automation_name(self, text: str) -> str:
        """Extract automation name from command"""
        # Remove common prefixes
        text = re.sub(r'(run|execute|start|automate|automation)\s+', '', text, flags=re.IGNORECASE)
        
        # Extract the first meaningful phrase
        words = text.split()
        if words:
            return ' '.join(words[:3]).strip()
        
        return 'unknown'

    def _extract_status_type(self, text: str) -> str:
        """Extract what status is being requested"""
        text_lower = text.lower()
        
        if 'automation' in text_lower:
            return 'automations'
        elif 'system' in text_lower or 'health' in text_lower:
            return 'system'
        elif 'task' in text_lower or 'tasks' in text_lower:
            return 'tasks'
        else:
            return 'general'

    def _extract_control_action(self, text: str) -> str:
        """Extract the control action"""
        text_lower = text.lower()
        
        if 'stop' in text_lower or 'pause' in text_lower:
            return 'stop'
        elif 'delete' in text_lower or 'remove' in text_lower:
            return 'delete'
        elif 'clear' in text_lower:
            return 'clear'
        elif 'cancel' in text_lower:
            return 'cancel'
        else:
            return 'unknown'

    def _extract_target(self, text: str) -> str:
        """Extract the target of control action"""
        # Simple extraction of what should be controlled
        words = text.split()
        
        if len(words) > 1:
            return ' '.join(words[1:]).strip()
        
        return 'unknown'

    def validate_command(self, command_text: str) -> bool:
        """
        Validate if command text is valid
        
        Args:
            command_text: The command to validate
        
        Returns:
            True if valid, False otherwise
        """
        if not command_text or len(command_text.strip()) == 0:
            return False
        
        if len(command_text) < 2:
            return False
        
        return True

    def get_command_help(self) -> Dict[str, list]:
        """Get help information about available commands"""
        return {
            'automation': self.automation_keywords,
            'chat': self.chat_keywords,
            'status': self.status_keywords,
            'control': self.control_keywords
        }
