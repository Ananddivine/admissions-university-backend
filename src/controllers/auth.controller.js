import { StatusCodes } from 'http-status-codes';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function createToken(user) {
  const payload = { id: user._id, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET || 'change_this', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

export async function register(req, res) {
  const { email, password, name, role = 'ADMIN', profilePhoto, allowedUniversities = [] } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(StatusCodes.CONFLICT).json({ message: 'Email already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    password: hashedPassword,
    name,
    role,
    profilePhoto: profilePhoto || '',
    allowedUniversities: Array.isArray(allowedUniversities) ? allowedUniversities : [],
  });

  res.status(StatusCodes.CREATED).json({
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    profilePhoto: user.profilePhoto || '',
    allowedUniversities: user.allowedUniversities || [],
    token: createToken(user),
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid credentials' });
  }

  res.status(StatusCodes.OK).json({
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    profilePhoto: user.profilePhoto || '',
    allowedUniversities: user.allowedUniversities || [],
    token: createToken(user),
  });
}

export async function me(req, res) {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const user = await User.findById(userId).select('-password')
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  res.status(StatusCodes.OK).json({
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    profilePhoto: user.profilePhoto || '',
    allowedUniversities: user.allowedUniversities || [],
  })
}
