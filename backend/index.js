const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// GET all tasks
app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Parse tags back to array
    const tasks = rows.map(row => ({
      ...row,
      tags: row.tags ? JSON.parse(row.tags) : []
    }));
    res.json(tasks);
  });
});

// POST a new task
app.post('/api/tasks', (req, res) => {
  const { id, title, assignee, estimateHours, status, dueDate, completedDate, priority, tags } = req.body;
  const tagsStr = tags ? JSON.stringify(tags) : '[]';

  db.run(
    `INSERT INTO tasks (id, title, assignee, estimateHours, status, dueDate, completedDate, priority, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, title, assignee, estimateHours, status, dueDate, completedDate, priority, tagsStr],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ id });
    }
  );
});

// PUT (update) a task
app.put('/api/tasks/:id', (req, res) => {
  const { title, assignee, estimateHours, status, dueDate, completedDate, priority, tags } = req.body;
  const tagsStr = tags ? JSON.stringify(tags) : '[]';

  db.run(
    `UPDATE tasks SET title = ?, assignee = ?, estimateHours = ?, status = ?, dueDate = ?, completedDate = ?, priority = ?, tags = ? WHERE id = ?`,
    [title, assignee, estimateHours, status, dueDate, completedDate, priority, tagsStr, req.params.id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ updated: this.changes });
    }
  );
});

// DELETE a task
app.delete('/api/tasks/:id', (req, res) => {
  db.run(`DELETE FROM tasks WHERE id = ?`, req.params.id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ deleted: this.changes });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
