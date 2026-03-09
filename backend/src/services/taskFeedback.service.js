import { commandLearningRepository } from '../repositories/commandLearning.repository.js';
import { taskHistoryRepository } from '../repositories/taskHistory.repository.js';

const RETRY_WINDOW_MS = 60 * 60 * 1000;
const CORRECTION_LOOKBACK_HOURS = 24;

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'be',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'my',
  'of',
  'on',
  'or',
  'please',
  'the',
  'to',
  'with',
]);

const normalizeCommand = (value) => String(value ?? '').toLowerCase().replace(/\s+/g, ' ').trim();

const inferRoute = (action, args = {}) => {
  if (['open_browser_app', 'youtube_play', 'search_web'].includes(action)) {
    return 'browser';
  }

  if (action === 'send_whatsapp_message' && String(args.browser ?? '').toLowerCase() === 'chrome') {
    return 'browser';
  }

  if (action === 'chat_only') {
    return 'chat';
  }

  return 'local';
};

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const tokenize = (value) =>
  normalizeCommand(value)
    .split(' ')
    .map((token) => token.replace(/[^a-z0-9]/g, ''))
    .filter((token) => token && !STOP_WORDS.has(token));

const tokenSimilarity = (a, b) => {
  const left = tokenize(a);
  const right = tokenize(b);
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const leftSet = new Set(left);
  const rightSet = new Set(right);
  let overlap = 0;
  for (const token of leftSet) {
    if (rightSet.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(leftSet.size, rightSet.size);
};

const inferFailureReason = ({ errorMessage, action }) => {
  const lower = String(errorMessage ?? '').toLowerCase();
  if (lower.includes('not installed') || lower.includes('allow-list')) {
    return 'application_not_installed';
  }
  if (
    lower.includes('connection') ||
    lower.includes('network') ||
    lower.includes('econn') ||
    lower.includes('timed out')
  ) {
    return 'network_unavailable';
  }
  if (lower.includes('email') && (lower.includes('invalid') || lower.includes('required'))) {
    return 'invalid_email';
  }
  if (lower.includes('chrome') || lower.includes('browser')) {
    return 'browser_unavailable';
  }
  if (lower.includes('contact') && lower.includes('required')) {
    return 'invalid_contact';
  }
  if (action === 'send_whatsapp_message' && lower.includes('whatsapp')) {
    return 'whatsapp_unavailable';
  }

  return 'unknown_failure';
};

const buildFailureSuggestion = ({ action, failureReason, errorMessage, attempts }) => {
  const lower = String(errorMessage ?? '').toLowerCase();
  if (
    attempts >= 2 &&
    (failureReason === 'application_not_installed' || failureReason === 'whatsapp_unavailable') &&
    (action === 'send_whatsapp_message' || action === 'open_local_app' || lower.includes('whatsapp'))
  ) {
    return {
      action: 'open_browser_app',
      parameters: {
        app: 'whatsapp_web',
        browser: 'chrome',
      },
      message: 'WhatsApp Desktop appears unavailable. Try WhatsApp Web in Chrome.',
    };
  }

  if (attempts >= 2 && failureReason === 'browser_unavailable') {
    return {
      action: 'open_local_app',
      parameters: {
        app: 'chrome',
      },
      message: 'Launch Chrome first, then retry this command.',
    };
  }

  if (attempts >= 2 && failureReason === 'invalid_email') {
    return {
      action: 'send_email',
      parameters: {
        to: 'user@example.com',
        message: 'Hello',
      },
      message: 'Provide a valid recipient email and message body.',
    };
  }

  return null;
};

const getRetryWaitText = (retryAfter) => {
  const parsed = parseDate(retryAfter);
  if (!parsed) {
    return '1 hour';
  }

  const remainingMs = Math.max(0, parsed.getTime() - Date.now());
  const remainingMinutes = Math.ceil(remainingMs / 60000);

  if (remainingMinutes >= 60) {
    return '1 hour';
  }

  if (remainingMinutes <= 1) {
    return '1 minute';
  }

  return `${remainingMinutes} minutes`;
};

const createRetryAfterDate = () => new Date(Date.now() + RETRY_WINDOW_MS);

const isLikelyCorrection = ({ failedCommand, successCommand }) => {
  const similarity = tokenSimilarity(failedCommand, successCommand);
  if (similarity >= 0.2) {
    return true;
  }

  const sharedKeywords = [
    'whatsapp',
    'email',
    'mail',
    'youtube',
    'search',
    'folder',
    'music',
    'chrome',
  ];

  const failed = normalizeCommand(failedCommand);
  const corrected = normalizeCommand(successCommand);
  return sharedKeywords.some((keyword) => failed.includes(keyword) && corrected.includes(keyword));
};

export const taskFeedbackService = {
  normalizeCommand,

  resolveLearnedCommand: async ({ userId, command }) => {
    const normalizedCommand = normalizeCommand(command);
    if (!normalizedCommand) {
      return null;
    }

    const mapping = await commandLearningRepository.findMapping({
      userId,
      normalizedInstruction: normalizedCommand,
    });

    if (!mapping) {
      return null;
    }

    await commandLearningRepository.incrementUsage({ id: mapping.id });

    return {
      action: mapping.action,
      args: mapping.parameters ?? {},
      source: 'learning_memory',
      route: inferRoute(mapping.action, mapping.parameters ?? {}),
    };
  },

  checkRetryWindow: async ({ userId, command }) => {
    const normalizedCommand = normalizeCommand(command);
    const latest = normalizedCommand
      ? await taskHistoryRepository.findLatestByCommand({ userId, normalizedCommand })
      : null;

    const retryAfter = parseDate(latest?.retryAfter);
    if (retryAfter && retryAfter.getTime() > Date.now()) {
      return {
        canRetry: false,
        normalizedCommand,
        retryAfter,
        attempts: latest?.attempts ?? 1,
        latest,
      };
    }

    let attempts = 1;
    if (latest?.status === 'failed') {
      attempts = Math.max(1, Number(latest.attempts ?? 1) + 1);
    }

    return {
      canRetry: true,
      normalizedCommand,
      attempts,
      latest,
    };
  },

  logWaitingState: async ({ userId, command, normalizedCommand, action, parameters, retryAfter, attempts }) => {
    const waitText = getRetryWaitText(retryAfter);
    return taskHistoryRepository.create({
      userId,
      command,
      normalizedCommand,
      action: action ?? '',
      parameters: parameters ?? {},
      status: 'pending',
      errorMessage: `This task can be retried in ${waitText}`,
      failureReason: 'retry_window_active',
      retryAfter,
      attempts,
    });
  },

  buildWaitingExecution: ({ retryAfter }) => {
    const waitText = getRetryWaitText(retryAfter);
    return {
      status: 'waiting',
      progress: [
        'Parsing instruction',
        'Checking retry schedule',
        `Retry is blocked until ${new Date(retryAfter).toISOString()}`,
      ],
      result: {
        message: `This task can be retried in ${waitText}`,
        retryAfter: new Date(retryAfter).toISOString(),
      },
    };
  },

  processExecutionFeedback: async ({
    userId,
    command,
    normalizedCommand,
    interpreted,
    execution,
    attempts,
  }) => {
    if (execution.status === 'completed') {
      await taskHistoryRepository.create({
        userId,
        command,
        normalizedCommand,
        action: interpreted.action,
        parameters: interpreted.args ?? {},
        status: 'success',
        attempts: 1,
      });

      await commandLearningRepository.upsertMapping({
        userId,
        instruction: command,
        normalizedInstruction: normalizedCommand,
        action: interpreted.action,
        parameters: interpreted.args ?? {},
        source: 'success',
      });

      const failureCandidate = await taskHistoryRepository.findLatestFailedCandidate({
        userId,
        excludeNormalizedCommand: normalizedCommand,
        withinHours: CORRECTION_LOOKBACK_HOURS,
      });

      let correctedFrom = null;
      if (
        failureCandidate &&
        isLikelyCorrection({
          failedCommand: failureCandidate.command,
          successCommand: command,
        })
      ) {
        await commandLearningRepository.upsertMapping({
          userId,
          instruction: failureCandidate.command,
          normalizedInstruction: failureCandidate.normalizedCommand,
          action: interpreted.action,
          parameters: interpreted.args ?? {},
          source: 'correction',
        });
        correctedFrom = failureCandidate.command;
      }

      const progress = [...(execution.progress ?? []), 'Saving successful command for future learning'];
      if (correctedFrom) {
        progress.push('Learned correction mapping from previous failed command');
      }

      return {
        execution: {
          ...execution,
          progress,
          result: {
            ...(execution.result ?? {}),
            learning: {
              datasetUpdated: true,
              correctedFrom,
            },
          },
        },
        assistantMessage: `Task completed: ${execution.result?.message ?? 'Done.'}`,
      };
    }

    const originalError = execution.result?.message ?? 'Task execution failed.';
    const failureReason = inferFailureReason({
      errorMessage: originalError,
      action: interpreted.action,
    });
    const retryAfter = createRetryAfterDate();
    const cooldown = attempts >= 3;
    const suggestion = buildFailureSuggestion({
      action: interpreted.action,
      failureReason,
      errorMessage: originalError,
      attempts,
    });

    await taskHistoryRepository.create({
      userId,
      command,
      normalizedCommand,
      action: interpreted.action,
      parameters: interpreted.args ?? {},
      status: 'failed',
      errorMessage: originalError,
      failureReason,
      retryAfter,
      attempts,
      suggestion,
    });

    const userMessage = cooldown
      ? 'This task cannot be executed now. You can try again in 1 hour.'
      : 'This task could not be completed right now. You can try again in 1 hour.';

    const progress = [
      ...(execution.progress ?? []),
      'Recording failure in task memory',
      'Setting retry timer: 1 hour',
    ];
    if (suggestion) {
      progress.push('Generated fallback suggestion from failure analysis');
    }

    const result = {
      ...(execution.result ?? {}),
      message: userMessage,
      originalError,
      retryAfter: retryAfter.toISOString(),
      failureReason,
      suggestion,
    };

    const assistantMessage = suggestion
      ? `${userMessage} Suggested alternative: ${suggestion.action}.`
      : userMessage;

    return {
      execution: {
        status: 'failed',
        progress,
        result,
      },
      assistantMessage,
    };
  },
};
