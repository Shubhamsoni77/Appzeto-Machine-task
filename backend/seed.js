const fs = require('fs');
const path = require('path');
const db = require('./db');
const { parse, isValid, parseISO } = require('date-fns');

function parseCustomDate(dateStr) {
  if (!dateStr) return null;
  const d1 = parseISO(dateStr);
  if (isValid(d1)) return d1.toISOString();
  const d2 = parse(dateStr, 'dd/MM/yyyy', new Date());
  if (isValid(d2)) return d2.toISOString();
  const d3 = parse(dateStr, 'MMMM d, yyyy', new Date());
  if (isValid(d3)) return d3.toISOString();
  return null;
}

const rawDataPath = path.resolve(__dirname, '../public/tasks.json');
const rawTasks = JSON.parse(fs.readFileSync(rawDataPath, 'utf8'));

const taskMap = new Map();
for (const raw of rawTasks) {
  taskMap.set(raw.id, raw);
}

const uniqueTasks = Array.from(taskMap.values());
const validStatuses = ['Backlog', 'In Progress', 'Review', 'Done'];

db.serialize(() => {
  db.run('DELETE FROM tasks'); // Clear table first
  
  const stmt = db.prepare(`INSERT INTO tasks (id, title, assignee, estimateHours, status, dueDate, completedDate, priority, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  uniqueTasks.forEach(raw => {
    let assignee = raw.assignee;
    if (!assignee || assignee === '' || assignee.toLowerCase() === 'n/a') {
      assignee = 'Unassigned';
    }
    
    let est = 0;
    const estParsed = Number(raw.estimateHours);
    if (!isNaN(estParsed) && estParsed >= 0) {
      est = estParsed;
    }
    
    let status = raw.status;
    if (!validStatuses.includes(status)) {
      status = 'Backlog';
    }
    
    const dueDate = parseCustomDate(raw.dueDate);
    const completedDate = parseCustomDate(raw.completedDate);
    const tagsStr = raw.tags ? JSON.stringify(raw.tags) : '[]';
    
    stmt.run(raw.id, raw.title, assignee, est, status, dueDate, completedDate, raw.priority || 'Medium', tagsStr);
  });
  
  stmt.finalize();
  console.log(`Seeded ${uniqueTasks.length} tasks into SQLite database.`);
});
