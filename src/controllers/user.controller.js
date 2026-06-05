import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';

function buildPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePhoto: user.profilePhoto || '',
    allowedUniversities: user.allowedUniversities || [],
    createdAt: user.createdAt,
  };
}

export async function listUsers(req, res) {
  const role = req.user?.role;
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(StatusCodes.OK).json(users.map(buildPublicUser));
  }

  const user = await User.findById(req.user.id).select('-password');
  return res.status(StatusCodes.OK).json([buildPublicUser(user)]);
}

export async function createUser(req, res) {
  const role = req.user?.role;
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return res.status(StatusCodes.FORBIDDEN).json({ message: 'Insufficient permissions.' });
  }

  const { name, email, password, role: userRole, profilePhoto, allowedUniversities } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(StatusCodes.CONFLICT).json({ message: 'Email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password || 'ChangeMe123!', 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: userRole || 'ADMISSION_OFFICER',
    profilePhoto: profilePhoto || '',
    allowedUniversities: Array.isArray(allowedUniversities) ? allowedUniversities : [],
  });

  res.status(StatusCodes.CREATED).json(buildPublicUser(user));
}

export async function updateUser(req, res) {
  const role = req.user?.role;
  const { id } = req.params;
  const payload = req.body;

  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN' && req.user.id !== id) {
    return res.status(StatusCodes.FORBIDDEN).json({ message: 'Insufficient permissions.' });
  }

  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 10);
  } else {
    delete payload.password;
  }

  const updated = await User.findByIdAndUpdate(id, payload, { new: true }).select('-password');
  if (!updated) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found.' });
  }

  res.status(StatusCodes.OK).json(buildPublicUser(updated));
}

export async function deleteUser(req, res) {
  const role = req.user?.role;
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return res.status(StatusCodes.FORBIDDEN).json({ message: 'Insufficient permissions.' });
  }

  const { id } = req.params;
  const deleted = await User.findByIdAndDelete(id);
  if (!deleted) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: 'User not found.' });
  }

  res.status(StatusCodes.OK).json({ message: 'User deleted.' });
}
