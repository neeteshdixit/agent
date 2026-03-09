import crypto from 'node:crypto';
import { query } from '../config/db.js';

const mapLearningRow = (row) => ({
  id: row.id,
  userId: row.user_id,
  instruction: row.instruction,
  normalizedInstruction: row.normalized_instruction,
  action: row.action,
  parameters: row.parameters ?? {},
  source: row.source,
  usageCount: Number(row.usage_count ?? 0),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const commandLearningRepository = {
  findMapping: async ({ userId, normalizedInstruction }) => {
    const response = await query(
      `SELECT *
       FROM command_learning_examples
       WHERE user_id = $1
         AND normalized_instruction = $2
       LIMIT 1`,
      [userId, normalizedInstruction],
    );

    return response.rows[0] ? mapLearningRow(response.rows[0]) : null;
  },

  incrementUsage: async ({ id }) => {
    await query(
      `UPDATE command_learning_examples
       SET usage_count = usage_count + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [id],
    );
  },

  upsertMapping: async ({ userId, instruction, normalizedInstruction, action, parameters, source }) => {
    const id = crypto.randomUUID();
    const response = await query(
      `INSERT INTO command_learning_examples (
         id, user_id, instruction, normalized_instruction, action, parameters, source,
         usage_count, created_at, updated_at
       ) VALUES (
         $1, $2, $3, $4, $5, $6::jsonb, $7, 0, NOW(), NOW()
       )
       ON CONFLICT (user_id, normalized_instruction)
       DO UPDATE SET
         instruction = EXCLUDED.instruction,
         action = EXCLUDED.action,
         parameters = EXCLUDED.parameters,
         source = EXCLUDED.source,
         updated_at = NOW()
       RETURNING *`,
      [
        id,
        userId,
        instruction,
        normalizedInstruction,
        action,
        JSON.stringify(parameters ?? {}),
        source,
      ],
    );

    return mapLearningRow(response.rows[0]);
  },
};
