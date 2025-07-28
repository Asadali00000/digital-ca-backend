import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (err instanceof PrismaClientKnownRequestError) {
    let message = 'Database error';
    let statusCode = 400;

    switch (err.code) {
      case 'P2002':
        message = 'Duplicate entry found';
        statusCode = 409;
        break;
      case 'P2025':
        message = 'Record not found';
        statusCode = 404;
        break;
      case 'P2003':
        message = 'Foreign key constraint failed';
        statusCode = 400;
        break;
      case 'P2014':
        message = 'Invalid ID provided';
        statusCode = 400;
        break;
    }

    return res.status(statusCode).json({
      success: false,
      error: message
    });
  }

  if (err instanceof PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Invalid data provided'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      error: message
    });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server error'
  });
};

process.on('unhandledRejection', (err, promise) => {
  process.exit(1);
});


export default errorHandler;
