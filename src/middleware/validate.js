
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req.body = result.data; 
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid query parameters',
        details: result.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    req.query = result.data;
    next();
  };
}
