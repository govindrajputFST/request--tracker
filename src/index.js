import express from 'express';
import requestTrackerMiddleware from './middlewares/requestTrackerMiddleware.js';
import connectDB from './utils/connectDB.js';
import logModel from './models/logModel.js';

const app = express();

// Parse incoming JSON requests
app.use(express.json());

// Use the request tracker middleware to track all incoming requests
app.use(requestTrackerMiddleware);

//API's :- 

// GET method example
app.get('/api/data', (req, res) => {
  res.json({ message: "Hello, World!" });
});


// POST method example
app.post('/api/data', (req, res) => {
  const { name, age } = req.body;
  if (!name || !age) {
    return res.status(400).json({ message: "Name and age are required." });
  }
  res.status(201).json({ message: "Data created successfully", data: { name, age } });
});

// PUT method example
app.put('/api/data/:id', (req, res) => {
  const { id } = req.params;
  const { name, age } = req.body;
  if (!id || !name || !age) {
    return res.status(400).json({ message: "ID, name, and age are required." });
  }
  res.json({ message: "Data updated successfully", data: { id, name, age } });
});

// DELETE method example
app.delete('/api/data/:id', (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "ID is required." });
  }
  res.json({ message: "Data deleted successfully", id });
});

// Simulate an error route for testing the error handler
app.get('/api/error', (req, res) => {
  throw new Error('Something went wrong!');
});

// Connect to the database
connectDB();

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// Export the app for use in other modules
export default app;