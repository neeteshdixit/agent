import { ZodError } from 'zod';

export const validateBody = (schema) => (req, res, next) => {
  try {
    req.validatedBody = schema.parse(req.body ?? {});
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    return next(error);
  }
};
