import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import { uploadToS3, deleteFromS3 } from '../utils/s3Upload.js';

function buildPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePhoto: user.profilePhoto?.url || '',
    allowedUniversities: user.allowedUniversities || [],
    createdAt: user.createdAt,
  };
}

export async function listUsers(req, res) {
  const role = req.user?.role;

  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    return res
      .status(StatusCodes.OK)
      .json(users.map(buildPublicUser));
  }

  const user = await User.findById(req.user.id)
    .select('-password');

  return res
    .status(StatusCodes.OK)
    .json([buildPublicUser(user)]);
}

export async function createUser(req, res) {
  console.log('===== CREATE USER =====');
console.log('BODY:', req.body);
console.log('FILE:', req.file);

  const role = req.user?.role;

  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'Insufficient permissions.',
    });
  }

  const {
    name,
    email,
    password,
    role: userRole,
  } = req.body;

  const existing = await User.findOne({ email });

  if (existing) {
    return res.status(StatusCodes.CONFLICT).json({
      message: 'Email already exists',
    });
  }

let profilePhoto = {
  url: '',
  key: '',
};

if (req.file) {
  profilePhoto = await uploadToS3(
    req.file,
    'users/profile-photos'
  );
}

  let allowedUniversities = [];

  if (req.body.allowedUniversities) {
    try {
      allowedUniversities =
        typeof req.body.allowedUniversities === 'string'
          ? JSON.parse(req.body.allowedUniversities)
          : req.body.allowedUniversities;
    } catch {
      allowedUniversities = [];
    }
  }

  const hashedPassword = await bcrypt.hash(
    password || 'ChangeMe123!',
    10
  );

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: userRole || 'ADMISSION_OFFICER',
    profilePhoto,
    allowedUniversities,
  });

  return res
    .status(StatusCodes.CREATED)
    .json(buildPublicUser(user));
}
export async function updateUser(req, res) {
  console.log('===== UPDATE USER =====');
  console.log('BODY:', req.body);
  console.log('FILE:', req.file);

  const role = req.user?.role;
  const { id } = req.params;

  if (
    role !== 'SUPER_ADMIN' &&
    role !== 'ADMIN' &&
    req.user.id !== id
  ) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'Insufficient permissions.',
    });
  }

  const user = await User.findById(id);

  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: 'User not found.',
    });
  }

  const payload = {};

  if (req.body.name) {
    payload.name = req.body.name;
  }

  if (req.body.email) {
    payload.email = req.body.email;
  }

  if (req.body.role) {
    payload.role = req.body.role;
  }

  if (req.body.allowedUniversities) {
    try {
      payload.allowedUniversities =
        typeof req.body.allowedUniversities === 'string'
          ? JSON.parse(req.body.allowedUniversities)
          : req.body.allowedUniversities;
    } catch {
      payload.allowedUniversities = [];
    }
  }

  if (
    req.body.password &&
    req.body.password.trim()
  ) {
    payload.password = await bcrypt.hash(
      req.body.password,
      10
    );
  }

  if (req.file) {
    console.log('Uploading file to S3...');
    console.log('Original Name:', req.file.originalname);
    console.log('Mime Type:', req.file.mimetype);
    console.log('Size:', req.file.size);

    try {
      if (user.profilePhoto?.key) {
        await deleteFromS3(user.profilePhoto.key);
        console.log('Old profile photo deleted');
      }
    } catch (error) {
      console.error(
        'Failed deleting old profile photo:',
        error
      );
    }

    payload.profilePhoto = await uploadToS3(
      req.file,
      'users/profile-photos'
    );

    console.log(
      'S3 Upload Result:',
      payload.profilePhoto
    );
  }

  const updated = await User.findByIdAndUpdate(
    id,
    payload,
    {
      new: true,
      runValidators: true,
    }
  ).select('-password');

  return res
    .status(StatusCodes.OK)
    .json(buildPublicUser(updated));
}

export async function deleteUser(req, res) {
  const role = req.user?.role;

  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'Insufficient permissions.',
    });
  }

  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: 'User not found.',
    });
  }

  try {
   if (user.profilePhoto?.key) {
  await deleteFromS3(user.profilePhoto.key);
}
  } catch (error) {
    console.error(
      'Failed deleting profile photo:',
      error
    );
  }

  await User.findByIdAndDelete(id);

  return res.status(StatusCodes.OK).json({
    message: 'User deleted successfully.',
  });
}

