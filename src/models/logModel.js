import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  requestId: { type: String },
  level: { type: String, required: true }, // 'info' or 'error'
  message: { type: String, required: true },
  request: {
    method: { type: String },
    url: { type: String },
    headers: { type: Object },
    body: { type: Object },
    timestamp: { type: Date },
    clientIP: { type: String }, // Client IP
  },
  response: {
    statusCode: { type: Number },
    body: { type: Object },
    timestamp: { type: Date },
  },
  error: {
    message: { type: String },
    stack: { type: String },
    timestamp: { type: Date },
  },
  duration: { type: String },
  timestamp: { type: Date, default: Date.now },
  user: { 
    userId: { type: String }, // User information
    role: { type: String }
  },
  server: { 
    host: { type: String }, // Server information
    appVersion: { type: String }
  }
});

export default mongoose.model('Log', logSchema);
