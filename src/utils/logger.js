import winston from 'winston';
import chalk from 'chalk';
import Log from '../models/logModel.js';

// Define log levels with associated colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// Mapping log levels to colors
const levelColors = {
  error: chalk.red,
  warn: chalk.yellow,
  info: chalk.green,
  http: chalk.blue,
  verbose: chalk.magenta,
  debug: chalk.cyan,
  silly: chalk.gray
};

// Custom logger format function
const customFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  const coloredLevel = levelColors[level] ? levelColors[level](level) : level;

  let logMessage = `${timestamp} - [${coloredLevel}] : ${message}`;

  if (Object.keys(metadata).length) {
    logMessage += ` ${JSON.stringify(metadata, null, 2)}`;
  }

  return logMessage;
});

// Create the logger
const logger = winston.createLogger({
  level: 'info',
  levels,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        customFormat
      )
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});


//Save log to db
const saveLogToDB = async (logData) => {
  try {
    const log = new Log(logData); // Use the Log model to create a new document
    await log.save(); // Save the log document to MongoDB
    console.log('Log saved to database');
  } catch (error) {
    console.error('Failed to save log to database', error.message);
  }
};




// Function to log request information
const logRequest = (req) => {
  const logData = {
    requestId: req.requestId, 
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString(),
  };

  logger.info(`Request: ${JSON.stringify(logData)}`);
};

// Function to log response information
const logResponse = (res, duration) => {
  const logData = {
    statusCode: res.statusCode,
    body: res.body || '', // Capture the response body dynamically
    duration: `${duration} ms`,
    timestamp: new Date().toISOString(),
  };

  logger.info(`Response: ${JSON.stringify(logData)}`);
};

// Function to log errors
const logError = (error) => {
  const logData = {
    level: 'error',
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  };

  logger.error(`Error: ${JSON.stringify(logData)}`);
};

// Function to log HTTP request and response details
const logHttpRequest = (req, res, duration) => {
  const logData = {
    requestId: req.requestId,
    level: res.statusCode >= 400 ? 'error' : 'info',
    message: res.statusCode >= 400 ? 'Error occurred during request processing' : 'Request processed successfully',
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString(),
    },
    response: {
      statusCode: res.statusCode,
      body: res.body || '', // Capture response body if available
      timestamp: new Date().toISOString(),
    },
    error: res.statusCode >= 400 ? {
      message: 'Internal Server Error',
      stack: new Error().stack,
      timestamp: new Date().toISOString(),
    } : null,
    duration: `${duration} ms`,
    timestamp: new Date().toISOString(),
  };

  logger.info(`HTTP Request & Response: ${JSON.stringify(logData)}`);
};




export {saveLogToDB, logRequest, logResponse, logError, logHttpRequest };
