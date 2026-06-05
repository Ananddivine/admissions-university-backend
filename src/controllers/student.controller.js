import Student from '../models/student.model.js';
import University from '../models/university.model.js';
import { StatusCodes } from 'http-status-codes';

import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3 from '../config/s3.js';

async function generateSignedUrl(key) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3, command, {
    expiresIn: 3600,
  });
}

function extractKeyFromUrl(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    return decodeURIComponent(
      parsed.pathname.replace(/^\/+/, '')
    );
  } catch {
    return null;
  }
}


export async function listStudents(req, res) {
  const role = req.user?.role;

  const query = {
    $or: [
      { isDeleted: false },
      { isDeleted: { $exists: false } },
    ],
  };

  if (
    role !== 'SUPER_ADMIN' &&
    role !== 'ADMIN' &&
    Array.isArray(req.user.allowedUniversities) &&
    req.user.allowedUniversities.length > 0
  ) {
    query['coursePreferences.university'] = {
      $in: req.user.allowedUniversities,
    };
  }

  const students = await Student.find(query)
    .sort({ createdAt: -1 })
    .populate('university', 'name country');

  res.status(StatusCodes.OK).json(students);
}

export async function getStudentById(req, res) {
  const { id } = req.params;

  const student = await Student.findById(id)
    .populate('university', 'name country')
    .lean();

  if (!student) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: 'Student not found',
    });
  }

  // SIGN additionalDocuments URLs
  if (student.additionalDocuments) {
    const signedDocs = {};

    for (const [field, url] of Object.entries(
      student.additionalDocuments
    )) {
      if (!url) continue;

      try {
        const key = extractKeyFromUrl(url);

        signedDocs[field] = await generateSignedUrl(key);
      } catch (err) {
        console.error(
          `Failed signing ${field}:`,
          err.message
        );

        signedDocs[field] = url;
      }
    }

    student.additionalDocuments = signedDocs;
  }

  res.status(StatusCodes.OK).json(student);
}

export async function registerStudent(req, res) {
  const payload = req.body;

  if (payload.coursePreferences?.university) {
    const university = await University.findOne({
      name: payload.coursePreferences.university,
    });

    if (university) {
      payload.university = university._id;
    }
  }

  const existing = await Student.findOne({
    $or: [
      { email: payload.email },
      { mobileNumber: payload.mobileNumber },
    ],
  });

  if (existing) {
    return res.status(StatusCodes.CONFLICT).json({
      message:
        'A student with this email or mobile number already exists.',
    });
  }

  const student = await Student.create(payload);

  res.status(StatusCodes.CREATED).json(student);
}

export async function updateStudent(req, res) {
  const { id } = req.params;
  const payload = req.body;

  if (payload.coursePreferences?.university) {
    const university = await University.findOne({
      name: payload.coursePreferences.university,
    });

    if (university) {
      payload.university = university._id;
    }
  }

  payload.updatedAt = new Date();

  const student = await Student.findByIdAndUpdate(
    id,
    payload,
    { new: true }
  ).populate('university', 'name country');

  if (!student) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: 'Student not found',
    });
  }

  res.status(StatusCodes.OK).json(student);
}

export async function softDeleteStudent(req, res) {
  const { id } = req.params;

  const student = await Student.findByIdAndUpdate(
    id,
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    { new: true }
  );

  if (!student) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: 'Student not found',
    });
  }

  res.status(StatusCodes.OK).json({
    message: 'Student moved to trash successfully',
    student,
  });
}

export async function listDeletedStudents(req, res) {
  const role = req.user?.role;

  const query = {
    isDeleted: true,
    deletedAt: { $exists: true },
  };

  if (
    role !== 'SUPER_ADMIN' &&
    role !== 'ADMIN' &&
    Array.isArray(req.user.allowedUniversities) &&
    req.user.allowedUniversities.length > 0
  ) {
    query['coursePreferences.university'] = {
      $in: req.user.allowedUniversities,
    };
  }

  const students = await Student.find(query)
    .sort({ deletedAt: -1 })
    .populate('university', 'name country');

  res.status(StatusCodes.OK).json(students);
}

export async function restoreStudent(req, res) {
  const { id } = req.params;

  const student = await Student.findByIdAndUpdate(
    id,
    {
      isDeleted: false,
      deletedAt: null,
    },
    { new: true }
  ).populate('university', 'name country');

  if (!student) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: 'Student not found',
    });
  }

  res.status(StatusCodes.OK).json({
    message: 'Student restored successfully',
    student,
  });
}

export async function permanentDeleteStudent(req, res) {
  const { id } = req.params;

  const student = await Student.findByIdAndDelete(id);

  if (!student) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: 'Student not found',
    });
  }

  res.status(StatusCodes.OK).json({
    message: 'Student permanently deleted',
  });
}