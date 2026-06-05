import Task from '../models/task.model.js';
import { StatusCodes } from 'http-status-codes';

export async function listTasks(req, res) {
  const role = req.user?.role;
  const query = {};

  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    query.assignedTo = req.user.email;
  }

  const tasks = await Task.find(query).sort({ dueDate: 1, createdAt: -1 });
  res.status(StatusCodes.OK).json(tasks);
}

export async function createTask(req, res) {
  const role = req.user?.role;
  if (!['SUPER_ADMIN', 'ADMIN', 'ADMISSION_OFFICER', 'COUNSELOR', 'DOCUMENT_OFFICER', 'VISA_OFFICER'].includes(role)) {
    return res.status(StatusCodes.FORBIDDEN).json({ message: 'Insufficient permissions.' });
  }

  const payload = { ...req.body, createdBy: req.user.id };
  const task = await Task.create(payload);
  res.status(StatusCodes.CREATED).json(task);
}

export async function updateTask(req, res) {
  const { id } = req.params;
  const role = req.user?.role;
  const task = await Task.findById(id);
  if (!task) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Task not found.' });
  }

  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN' && task.assignedTo !== req.user.email) {
    return res.status(StatusCodes.FORBIDDEN).json({ message: 'Insufficient permissions.' });
  }

  const updated = await Task.findByIdAndUpdate(id, req.body, { new: true });
  res.status(StatusCodes.OK).json(updated);
}

export async function deleteTask(req, res) {
  const { id } = req.params;
  const role = req.user?.role;
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return res.status(StatusCodes.FORBIDDEN).json({ message: 'Insufficient permissions.' });
  }

  const deleted = await Task.findByIdAndDelete(id);
  if (!deleted) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: 'Task not found.' });
  }

  res.status(StatusCodes.OK).json({ message: 'Task deleted.' });
}
