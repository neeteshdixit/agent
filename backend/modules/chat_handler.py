"""
Chat Handler Module
Manages chatbot responses and conversation
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import os

logger = logging.getLogger(__name__)


class ChatHandler:
    """Handles chat interactions and responses"""

    def __init__(self):
        """Initialize the chat handler"""
        self.conversation_history: List[Dict[str, Any]] = []
        self.knowledge_base = self._load_knowledge_base()
        self.intents = self._initialize_intents()

    def _load_knowledge_base(self) -> Dict[str, List[str]]:
        """Load knowledge base for responses"""
        return {
            'greeting': [
                'Hello! How can I assist you today?',
                'Hi there! What can I help you with?',
                'Greetings! What do you need help with?'
            ],
            'farewell': [
                'Goodbye! Feel free to ask if you need anything else.',
                'See you later! Have a great day!',
                'Bye! Don\'t hesitate to come back if you need help.'
            ],
            'help': [
                'I can help you with:\n• Creating and managing automations\n• Answering questions\n• Managing tasks\n• Providing recommendations',
                'I\'m here to assist with automation management, task handling, and answering your questions.',
                'You can ask me about automations, tasks, or any other questions you have!'
            ],
            'automation': [
                'I can help you set up automations! What would you like to automate?',
                'Which automation would you like me to run or create?',
                'Tell me what automation task you\'d like to execute.'
            ],
            'time': [
                f'The current time is {datetime.now().strftime("%H:%M:%S")}',
                f'It is currently {datetime.now().strftime("%I:%M %p")}',
            ],
            'date': [
                f'Today is {datetime.now().strftime("%A, %B %d, %Y")}',
                f'The current date is {datetime.now().strftime("%Y-%m-%d")}',
            ],
            'thanks': [
                'You\'re welcome! Let me know if you need anything else.',
                'Happy to help! Feel free to ask any other questions.',
                'My pleasure! Anything else I can assist with?'
            ],
            'confused': [
                'I\'m not sure I understood that. Could you please rephrase?',
                'I didn\'t quite catch that. Can you explain more?',
                'I\'m having trouble understanding. Could you provide more details?'
            ]
        }

    def _initialize_intents(self) -> Dict[str, List[str]]:
        """Initialize intent patterns for matching"""
        return {
            'greeting': ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
            'farewell': ['bye', 'goodbye', 'see you', 'take care', 'farewell', 'exit', 'quit'],
            'help': ['help', 'assist', 'support', 'how can you help', 'what can you do'],
            'automation': ['automation', 'automate', 'run', 'execute', 'start', 'create task'],
            'time': ['time', 'current time', 'what time', 'tell me the time'],
            'date': ['date', 'today', 'current date', 'what day', 'what\'s today'],
            'thanks': ['thanks', 'thank you', 'appreciate', 'grateful', 'much obliged'],
            'status': ['status', 'check', 'how are you', 'how\'s it going', 'what\'s up']
        }

    def get_response(self, user_message: str) -> str:
        """
        Get a response to user message
        
        Args:
            user_message: User's input message
        
        Returns:
            Agent's response text
        """
        # Log conversation
        self.conversation_history.append({
            'timestamp': datetime.now().isoformat(),
            'sender': 'user',
            'message': user_message
        })

        logger.info(f"User message: {user_message}")

        # Detect intent
        intent = self._detect_intent(user_message)

        # Generate response
        response = self._generate_response(intent, user_message)

        # Log response
        self.conversation_history.append({
            'timestamp': datetime.now().isoformat(),
            'sender': 'agent',
            'message': response
        })

        logger.info(f"Agent response: {response}")

        return response

    def _detect_intent(self, message: str) -> str:
        """
        Detect user intent from message
        
        Args:
            message: User message
        
        Returns:
            Detected intent
        """
        message_lower = message.lower()

        # Score each intent
        scores = {}
        for intent, keywords in self.intents.items():
            score = sum(1 for keyword in keywords if keyword in message_lower)
            scores[intent] = score

        # Get highest scoring intent
        best_intent = max(scores, key=scores.get) if max(scores.values()) > 0 else 'confused'

        logger.info(f"Detected intent: {best_intent} (scores: {scores})")

        return best_intent

    def _generate_response(self, intent: str, user_message: str) -> str:
        """
        Generate response based on intent
        
        Args:
            intent: Detected intent
            user_message: Original user message
        
        Returns:
            Generated response
        """
        import random

        # Get responses for intent
        responses = self.knowledge_base.get(intent, self.knowledge_base['confused'])

        # Select random response
        response = random.choice(responses)

        # Add contextual information if needed
        if intent == 'automation':
            response += f"\n\nDid you want to: {self._extract_action(user_message)}"

        return response

    def _extract_action(self, message: str) -> str:
        """
        Extract action from message
        
        Args:
            message: User message
        
        Returns:
            Extracted action
        """
        # Remove common words
        words = message.lower().split()
        action_words = [w for w in words 
                       if w not in ['the', 'my', 'a', 'an', 'and', 'or', 'to', 'run', 'execute', 'automate']]

        if action_words:
            return ' '.join(action_words[:3])
        
        return 'a task'

    def add_to_knowledge_base(self, intent: str, responses: List[str]):
        """
        Add responses to knowledge base
        
        Args:
            intent: Intent category
            responses: List of responses to add
        """
        if intent not in self.knowledge_base:
            self.knowledge_base[intent] = []

        self.knowledge_base[intent].extend(responses)
        logger.info(f"Added {len(responses)} responses to intent: {intent}")

    def get_conversation_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get conversation history
        
        Args:
            limit: Number of recent messages to return
        
        Returns:
            List of conversation messages
        """
        return self.conversation_history[-limit:]

    def clear_conversation_history(self):
        """Clear conversation history"""
        self.conversation_history.clear()
        logger.info("Conversation history cleared")

    def get_intent_info(self) -> Dict[str, List[str]]:
        """Get information about available intents"""
        return self.intents

    def add_custom_response(self, keywords: List[str], response: str, intent: str = 'custom'):
        """
        Add a custom response pattern
        
        Args:
            keywords: Keywords to match
            response: Response text
            intent: Intent category
        """
        if intent not in self.intents:
            self.intents[intent] = []

        self.intents[intent].extend(keywords)

        if intent not in self.knowledge_base:
            self.knowledge_base[intent] = []

        self.knowledge_base[intent].append(response)
        logger.info(f"Added custom response for intent: {intent}")

    def analyze_sentiment(self, message: str) -> str:
        """
        Analyze sentiment of message
        
        Args:
            message: User message
        
        Returns:
            Sentiment (positive, negative, neutral)
        """
        positive_words = ['great', 'good', 'excellent', 'amazing', 'wonderful', 'perfect', 'thank', 'love']
        negative_words = ['bad', 'terrible', 'awful', 'hate', 'problem', 'error', 'fail', 'broken']

        message_lower = message.lower()

        positive_count = sum(1 for word in positive_words if word in message_lower)
        negative_count = sum(1 for word in negative_words if word in message_lower)

        if positive_count > negative_count:
            return 'positive'
        elif negative_count > positive_count:
            return 'negative'
        else:
            return 'neutral'

    def get_contextual_response(self, user_message: str, context: Dict[str, Any]) -> str:
        """
        Generate contextual response based on system state
        
        Args:
            user_message: User message
            context: System context (automations running, etc.)
        
        Returns:
            Contextual response
        """
        response = self.get_response(user_message)

        # Add context information if relevant
        if 'automations' in user_message.lower() and context.get('automations_count', 0) > 0:
            response += f"\n\nYou currently have {context['automations_count']} automations configured."

        return response
