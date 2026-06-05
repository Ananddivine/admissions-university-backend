import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) {
    return res.status(401).json({ message: 'Authorization token required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_this');
    const user = await User.findById(payload.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }
    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      allowedUniversities: user.allowedUniversities || [],
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token.' });
  }
}
