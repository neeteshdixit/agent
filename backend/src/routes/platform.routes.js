import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { memoryEngine } from '../services/memory/memoryEngine.js';
import { query } from '../config/db.js';
import crypto from 'node:crypto';

const router = Router();

router.use(requireAuth);

// 1. Memory / Preferences Routes
router.get(
  '/preferences',
  asyncHandler(async (req, res) => {
    const preferences = await memoryEngine.getUserPreferences(req.user.id);
    return res.json({ preferences });
  })
);

router.post(
  '/preferences',
  asyncHandler(async (req, res) => {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required.' });
    }
    const preference = await memoryEngine.savePreference(req.user.id, key, value);
    return res.status(201).json({ preference });
  })
);

// 2. Routines Routes
router.get(
  '/routines',
  asyncHandler(async (req, res) => {
    const routines = await memoryEngine.getRoutines(req.user.id);
    return res.json({ routines });
  })
);

router.post(
  '/routines',
  asyncHandler(async (req, res) => {
    const { name, triggerType, triggerValue } = req.body;
    if (!name || !triggerType || !triggerValue) {
      return res.status(400).json({ error: 'Name, triggerType, and triggerValue are required.' });
    }
    const id = crypto.randomUUID();
    const result = await query(
      `INSERT INTO routines (id, user_id, name, trigger_type, trigger_value, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, TRUE, NOW())
       RETURNING *`,
      [id, req.user.id, name, triggerType, JSON.stringify(triggerValue)]
    );
    return res.status(201).json({ routine: result.rows[0] });
  })
);

// 3. Recommendations Routes
router.get(
  '/recommendations',
  asyncHandler(async (req, res) => {
    let response = await query(
      'SELECT * FROM recommendations WHERE user_id = $1 ORDER BY score DESC, created_at DESC',
      [req.user.id]
    );

    if (response.rowCount === 0) {
      const recs = [
        {
          id: crypto.randomUUID(),
          title: 'Find Flights to Delhi',
          description: 'Search flight options to Delhi matching your travel budget preference.',
          action_payload: { command: 'search flights from Bangalore to Delhi next Monday' },
          score: 0.9450,
        },
        {
          id: crypto.randomUUID(),
          title: 'Compare Cabs to Airport',
          description: 'Compare Rapido and Uber pricing to select the best option for your airport trip.',
          action_payload: { command: 'compare cabs from Indiranagar to Kempegowda Airport' },
          score: 0.8920,
        }
      ];

      for (const r of recs) {
        await query(
          `INSERT INTO recommendations (id, user_id, title, description, action_payload, score, status, created_at)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, 'pending', NOW())`,
          [r.id, req.user.id, r.title, r.description, JSON.stringify(r.action_payload), r.score]
        );
      }

      response = await query(
        'SELECT * FROM recommendations WHERE user_id = $1 ORDER BY score DESC, created_at DESC',
        [req.user.id]
      );
    }

    return res.json({ recommendations: response.rows });
  })
);

router.post(
  '/recommendations/:id/status',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'accepted', 'dismissed'
    if (!['accepted', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be accepted or dismissed.' });
    }
    const result = await query(
      'UPDATE recommendations SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [status, id, req.user.id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Recommendation not found.' });
    }
    return res.json({ recommendation: result.rows[0] });
  })
);

// 4. Reinforcement Learning Feedback Endpoint
router.post(
  '/feedback',
  asyncHandler(async (req, res) => {
    const { command, correctedCommand, selectedAction, reward, source } = req.body;
    if (!command || !selectedAction || reward === undefined) {
      return res.status(400).json({ error: 'Command, selectedAction, and reward are required.' });
    }

    const feedback = await memoryEngine.logRlFeedback({
      userId: req.user.id,
      command,
      correctedCommand,
      stateVector: {},
      selectedAction,
      reward: Number(reward),
      source,
    });

    return res.status(201).json({ feedback });
  })
);

export default router;
