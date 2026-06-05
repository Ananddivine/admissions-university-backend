import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export async function fetchUser(request, response, next) {
  try {
    const authorization = request.headers.authorization || '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

    if (!token) {
      response.status(401).json({ success: false, message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_this');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      response.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    request.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      allowedUniversities: user.allowedUniversities || [],
    };
    next();
  } catch (error) {
    response.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
