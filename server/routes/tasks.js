import express from 'express';
import { handleError, sendSuccess } from '../common.js';
import { secureDb } from '../services/db.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Apply Authentication
router.use(authenticateUser);

/**
 * @route GET /api/tasks
 * @desc Get tasks for a user
 */
router.get('/', async (req, res) => {
    try {
        const { assigned_to, assigned_by, status } = req.query;

        const tasks = await secureDb.get('tasks', (query) => {
            if (assigned_to) query = query.eq('assigned_to', assigned_to);
            if (assigned_by) query = query.eq('assigned_by', assigned_by);
            if (status) query = query.eq('status', status);
            return query.order('created_at', { ascending: false });
        });

        sendSuccess(res, tasks);
    } catch (error) {
        handleError(error, res, 'Failed to fetch tasks');
    }
});

/**
 * @route POST /api/tasks
 */
router.post('/', async (req, res) => {
    try {
        const context = {
            user: req.user,
            userProfile: req.userProfile,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            reason: 'Task Assignment'
        };

        const newTask = await secureDb.create('tasks', {
            ...req.body,
            assigned_by: req.user?.id
        }, context);

        sendSuccess(res, newTask);
    } catch (error) {
        handleError(error, res, 'Failed to create task');
    }
});

/**
 * @route PUT /api/tasks/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const context = {
            user: req.user,
            userProfile: req.userProfile,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            reason: 'Task Update'
        };

        const updatedTask = await secureDb.update('tasks', req.params.id, req.body, context);
        sendSuccess(res, updatedTask);
    } catch (error) {
        handleError(error, res, 'Failed to update task');
    }
});

/**
 * @route DELETE /api/tasks/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const context = {
            user: req.user,
            userProfile: req.userProfile,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            reason: 'Task Deletion'
        };

        await secureDb.delete('tasks', req.params.id, context);
        sendSuccess(res, { message: 'Task deleted successfully' });
    } catch (error) {
        handleError(error, res, 'Failed to delete task');
    }
});

export default router;
