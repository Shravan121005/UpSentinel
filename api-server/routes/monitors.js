const express = require('express');
const MonitorController = require('../controllers/MonitorController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// POST /monitors - Create a new monitor
router.post('/', MonitorController.createMonitor);

// GET /monitors - List all monitors for a user
router.get('/', MonitorController.getMonitors);

// GET /monitors/:id - Get a specific monitor
router.get('/:id', MonitorController.getMonitor);

// GET /monitors/:id/history - Get ping history for a monitor
router.get('/:id/history', MonitorController.getMonitorHistory);

// DELETE /monitors/:id - Delete a monitor
router.delete('/:id', MonitorController.deleteMonitor);

module.exports = router;
