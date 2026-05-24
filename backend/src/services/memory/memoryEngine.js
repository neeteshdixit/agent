import { query } from '../../config/db.js';
import crypto from 'node:crypto';
import { env } from '../../config/env.js';

export const memoryEngine = {
  /**
   * Retrieves all key-value memory data for a user.
   */
  getUserPreferences: async (userId) => {
    const res = await query(
      'SELECT key, value FROM ai_memory WHERE user_id = $1',
      [userId]
    );
    return res.rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
  },

  /**
   * Saves a single preference key-value pair.
   */
  savePreference: async (userId, key, value) => {
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO ai_memory (id, user_id, key, value, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, NOW())
       ON CONFLICT (user_id, key)
       DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [id, userId, key, JSON.stringify(value)]
    );
    return { key, value };
  },

  /**
   * Fetches the user routines.
   */
  getRoutines: async (userId) => {
    const res = await query(
      'SELECT * FROM routines WHERE user_id = $1 AND is_active = TRUE',
      [userId]
    );
    return res.rows.map((row) => ({
      id: row.id,
      name: row.name,
      triggerType: row.trigger_type,
      triggerValue: row.trigger_value,
      workflowId: row.workflow_id,
      isActive: row.is_active,
    }));
  },

  /**
   * Registers a reinforcement learning feedback event.
   */
  logRlFeedback: async ({ userId, command, correctedCommand, stateVector, selectedAction, reward, source }) => {
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO rl_feedback (
        id, user_id, command, corrected_command, state_vector, selected_action, reward, source, created_at
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, NOW())`,
      [
        id,
        userId,
        command,
        correctedCommand || null,
        JSON.stringify(stateVector || {}),
        selectedAction,
        reward,
        source || 'ui',
      ]
    );

    // Call Python Flask ML service to update the reinforcement memory (Q-values)
    try {
      const response = await fetch(`${env.aiServiceUrl || 'http://127.0.0.1:5100'}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          corrected_command: correctedCommand,
          action: selectedAction,
          reward,
          retrain: reward > 0,
        }),
      });
      if (!response.ok) {
        console.warn('Flask RL feedback callback returned non-OK code:', response.status);
      }
    } catch (error) {
      console.error('Failed to trigger Flask service RL update:', error.message);
    }

    return { id, reward };
  },
};
