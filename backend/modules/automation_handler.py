"""
Automation Handler Module
Manages automation tasks, execution, and state
"""

import uuid
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import json
import os

logger = logging.getLogger(__name__)


class AutomationHandler:
    """Handles automation tasks and execution"""

    def __init__(self):
        """Initialize the automation handler"""
        self.automations: Dict[str, Dict[str, Any]] = {}
        self.execution_history: List[Dict] = []
        self.data_file = 'automations_data.json'
        self._load_automations()

    def _load_automations(self):
        """Load automations from file"""
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r') as f:
                    data = json.load(f)
                    self.automations = data.get('automations', {})
                    logger.info(f"Loaded {len(self.automations)} automations")
        except Exception as e:
            logger.warning(f"Could not load automations: {str(e)}")

    def _save_automations(self):
        """Save automations to file"""
        try:
            with open(self.data_file, 'w') as f:
                json.dump({'automations': self.automations}, f, indent=2)
        except Exception as e:
            logger.error(f"Could not save automations: {str(e)}")

    def create_automation(self, name: str, description: str = '', 
                         trigger: str = 'manual', actions: List[str] = None) -> Dict[str, Any]:
        """
        Create a new automation
        
        Args:
            name: Automation name
            description: Automation description
            trigger: Trigger type (manual, scheduled, event-based)
            actions: List of actions to execute
        
        Returns:
            Created automation dict
        """
        automation_id = str(uuid.uuid4())

        automation = {
            'id': automation_id,
            'name': name,
            'description': description,
            'trigger': trigger,
            'actions': actions or [],
            'status': 'idle',
            'created_at': datetime.now().isoformat(),
            'last_run': None,
            'run_count': 0
        }

        self.automations[automation_id] = automation
        self._save_automations()

        logger.info(f"Created automation: {name} ({automation_id})")
        return automation

    def run_automation(self, automation_id: str) -> Dict[str, Any]:
        """
        Run a specific automation
        
        Args:
            automation_id: ID of automation to run
        
        Returns:
            Result dict with execution details
        """
        if automation_id not in self.automations:
            return {'success': False, 'error': f'Automation not found: {automation_id}'}

        automation = self.automations[automation_id]

        try:
            logger.info(f"Running automation: {automation['name']}")

            # Update automation status
            automation['status'] = 'running'

            # Execute actions
            results = self._execute_actions(automation['actions'])

            # Update automation info
            automation['status'] = 'completed'
            automation['last_run'] = datetime.now().isoformat()
            automation['run_count'] = automation.get('run_count', 0) + 1

            self._save_automations()

            # Log execution
            execution_log = {
                'automation_id': automation_id,
                'automation_name': automation['name'],
                'timestamp': datetime.now().isoformat(),
                'status': 'completed',
                'results': results
            }
            self.execution_history.append(execution_log)

            return {
                'success': True,
                'automation_id': automation_id,
                'automation_name': automation['name'],
                'status': 'completed',
                'results': results,
                'message': f'Automation "{automation["name"]}" executed successfully'
            }

        except Exception as e:
            automation['status'] = 'failed'
            logger.error(f"Error running automation: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'automation_id': automation_id
            }

    def run_automation_by_name(self, automation_name: str) -> Dict[str, Any]:
        """
        Run automation by name
        
        Args:
            automation_name: Name of automation to run
        
        Returns:
            Result dict
        """
        for automation_id, automation in self.automations.items():
            if automation['name'].lower() == automation_name.lower():
                return self.run_automation(automation_id)

        return {'success': False, 'error': f'Automation not found: {automation_name}'}

    def stop_automation(self, automation_id: str) -> Dict[str, Any]:
        """
        Stop a running automation
        
        Args:
            automation_id: ID of automation to stop
        
        Returns:
            Result dict
        """
        if automation_id not in self.automations:
            return {'success': False, 'error': f'Automation not found: {automation_id}'}

        automation = self.automations[automation_id]
        automation['status'] = 'stopped'

        self._save_automations()
        logger.info(f"Stopped automation: {automation['name']}")

        return {
            'success': True,
            'automation_id': automation_id,
            'message': f'Automation "{automation["name"]}" stopped'
        }

    def delete_automation(self, automation_id: str) -> Dict[str, Any]:
        """
        Delete an automation
        
        Args:
            automation_id: ID of automation to delete
        
        Returns:
            Result dict
        """
        if automation_id not in self.automations:
            return {'success': False, 'error': f'Automation not found: {automation_id}'}

        automation_name = self.automations[automation_id]['name']
        del self.automations[automation_id]

        self._save_automations()
        logger.info(f"Deleted automation: {automation_name}")

        return {
            'success': True,
            'automation_id': automation_id,
            'message': f'Automation "{automation_name}" deleted'
        }

    def get_automation(self, automation_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific automation
        
        Args:
            automation_id: ID of automation to retrieve
        
        Returns:
            Automation dict or None
        """
        return self.automations.get(automation_id)

    def get_all_automations(self) -> List[Dict[str, Any]]:
        """
        Get all automations
        
        Returns:
            List of automation dicts
        """
        return list(self.automations.values())

    def get_automations_by_status(self, status: str) -> List[Dict[str, Any]]:
        """
        Get automations by status
        
        Args:
            status: Status to filter by
        
        Returns:
            List of automation dicts
        """
        return [auto for auto in self.automations.values() 
                if auto['status'] == status]

    def update_automation(self, automation_id: str, 
                         **kwargs) -> Dict[str, Any]:
        """
        Update an automation
        
        Args:
            automation_id: ID of automation to update
            **kwargs: Fields to update
        
        Returns:
            Updated automation dict
        """
        if automation_id not in self.automations:
            return {'success': False, 'error': f'Automation not found: {automation_id}'}

        automation = self.automations[automation_id]

        # Update allowed fields
        allowed_fields = ['name', 'description', 'trigger', 'actions']
        for field, value in kwargs.items():
            if field in allowed_fields:
                automation[field] = value

        self._save_automations()
        logger.info(f"Updated automation: {automation_id}")

        return {'success': True, 'automation': automation}

    def _execute_actions(self, actions: List[str]) -> List[Dict[str, Any]]:
        """
        Execute a list of actions
        
        Args:
            actions: List of action descriptions
        
        Returns:
            List of action results
        """
        results = []

        for action in actions:
            result = self._execute_action(action)
            results.append(result)

        return results

    def _execute_action(self, action: str) -> Dict[str, Any]:
        """
        Execute a single action
        
        Args:
            action: Action description
        
        Returns:
            Action result dict
        """
        logger.info(f"Executing action: {action}")

        try:
            # Simulate action execution
            # In a real system, you would map actions to actual functions

            action_lower = action.lower()

            if 'backup' in action_lower:
                return {'action': action, 'status': 'completed', 'result': 'Backup completed'}
            elif 'sync' in action_lower:
                return {'action': action, 'status': 'completed', 'result': 'Data synced'}
            elif 'report' in action_lower:
                return {'action': action, 'status': 'completed', 'result': 'Report generated'}
            elif 'email' in action_lower:
                return {'action': action, 'status': 'completed', 'result': 'Email sent'}
            else:
                return {'action': action, 'status': 'completed', 'result': 'Action executed'}

        except Exception as e:
            logger.error(f"Error executing action: {str(e)}")
            return {'action': action, 'status': 'failed', 'error': str(e)}

    def get_execution_history(self, limit: int = 50) -> List[Dict]:
        """
        Get execution history
        
        Args:
            limit: Number of recent executions to return
        
        Returns:
            List of execution logs
        """
        return self.execution_history[-limit:]

    def reset_automation_state(self, automation_id: str) -> Dict[str, Any]:
        """
        Reset automation to idle state
        
        Args:
            automation_id: ID of automation to reset
        
        Returns:
            Result dict
        """
        if automation_id not in self.automations:
            return {'success': False, 'error': f'Automation not found: {automation_id}'}

        self.automations[automation_id]['status'] = 'idle'
        self._save_automations()

        return {'success': True, 'message': 'Automation state reset to idle'}
