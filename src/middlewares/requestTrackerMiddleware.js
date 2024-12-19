import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';
import { saveLogToDB } from '../utils/logger.js'; // Log utility functions
import { logRequest, logResponse, logHttpRequest } from '../utils/logger.js';

const asyncLocalStorage = new AsyncLocalStorage();

const requestTrackerMiddleware = (req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;

  // Initialize async local storage
  asyncLocalStorage.run(new Map(), () => {
    const store = asyncLocalStorage.getStore();
    store.set('requestId', requestId);

    const startTime = Date.now();

    // Log the incoming request
    logRequest(req);

    // Capture response and log details
    const originalSend = res.send;
    res.send = function (body) {
      res.body = body; // Capture the response body
      const duration = Date.now() - startTime;

      // Log the response
      logResponse(res, duration);

      // Log HTTP request and response details
      logHttpRequest(req, res, duration);

      // Save the log to the database
      const logData = {
        requestId,
        level: res.statusCode >= 400 ? 'error' : 'info',
        message:
          res.statusCode >= 400
            ? 'Error occurred during request processing'
            : 'Request processed successfully',
        request: {
          method: req.method,
          url: req.url,
          headers: req.headers,
          body: req.body,
          timestamp: new Date().toISOString(),
          clientIP: req.ip || req.connection.remoteAddress, // Client IP
        },
        response: {
          statusCode: res.statusCode,
          body: body || '',
          timestamp: new Date().toISOString(),
        },
        error: res.statusCode >= 400
          ? {
              message: body?.message || 'Internal Server Error',
              stack: new Error().stack,
              timestamp: new Date().toISOString(),
            }
          : null,
        duration: `${duration} ms`,
        timestamp: new Date().toISOString(),
        user: req.user
          ? { 
              userId: req.user._id,
              role: req.user.role 
            }
          : null, // Log user info if available
        server: {
          host: req.hostname,
          appVersion: process.env.APP_VERSION || '1.0.0', // Assuming version is in env
        },
      };

      saveLogToDB(logData).catch((error) => {
        console.error('Error saving log to DB:', error);
      });

      return originalSend.call(this, body);
    };

    // Handle cases where res.send is not used (e.g., when response is streamed)
    res.on('finish', () => {
      if (!res.body) {
        const duration = Date.now() - startTime;

        // Log HTTP request and response details
        logHttpRequest(req, res, duration);

        // Save the log to the database
        const logData = {
          requestId,
          level: res.statusCode >= 400 ? 'error' : 'info',
          message:
            res.statusCode >= 400
              ? 'Error occurred during request processing'
              : 'Request completed without explicit response body',
          request: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            timestamp: new Date().toISOString(),
            clientIP: req.ip || req.connection.remoteAddress, // Client IP
          },
          response: {
            statusCode: res.statusCode,
            body: '',
            timestamp: new Date().toISOString(),
          },
          error: res.statusCode >= 400
            ? {
                message: 'Internal Server Error',
                stack: new Error().stack,
                timestamp: new Date().toISOString(),
              }
            : null,
          duration: `${duration} ms`,
          timestamp: new Date().toISOString(),
          user: req.user
            ? { 
                userId: req.user._id,
                role: req.user.role 
              }
            : null, // Log user info if available
          server: {
            host: req.hostname,
            appVersion: process.env.APP_VERSION || '1.0.0',
          },
        };

        saveLogToDB(logData).catch((error) => {
          console.error('Error saving log to DB:', error);
        });
      }
    });

    next();
  });
};

export default requestTrackerMiddleware;
