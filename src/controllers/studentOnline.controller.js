import Student from '../models/student.model.js';
import { StatusCodes } from 'http-status-codes';
import { uploadToS3 } from '../utils/s3Upload.js';

export const createStudentOnline = async (req, res) => {
  try {
    const files = req.files || {};

    // helper function
    const getFileUrl = async (file, folder = 'student-docs') => {
      if (!file) return null;
      const uploaded = await uploadToS3(file, folder);
      return uploaded.url;
    };

    const uploadedDocs = {
      grade10Certificate: await getFileUrl(files.grade10Certificate?.[0]),
      grade10Transcript: await getFileUrl(files.grade10Transcript?.[0]),

      grade12Certificate: await getFileUrl(files.grade12Certificate?.[0]),
      grade12Transcript: await getFileUrl(files.grade12Transcript?.[0]),

      diploma: await getFileUrl(files.diploma?.[0]),
      degree: await getFileUrl(files.degree?.[0]),
      masters: await getFileUrl(files.masters?.[0]),

      passportPhoto: await getFileUrl(files.passportPhoto?.[0], 'student-photos'),
      passportBioPage: await getFileUrl(files.passportBioPage?.[0]),
      passportBackPages: await getFileUrl(files.passportBackPages?.[0]),

      visaDocument: await getFileUrl(files.visaDocument?.[0]),
      travelTickets: await getFileUrl(files.travelTickets?.[0]),
    };

    const {
      email,
      firstName,
      lastName,
      fatherFirstName,
      fatherLastName,
      motherFirstName,
      motherLastName,
      dateOfBirth,
      gender,
      parentGuardianEmail,
      mobileNumber,
      telephoneNumber,
      countryCode,
      residentialAddress,
      nationality,
      passportNumber,
      previousProgrammeLevel,
      percentage,
      programmeAppliedFor,
      residentialFacilityRequired,
      accommodationType,
      standardMeal,
      laundryService,
    } = req.body;

    const normalizedAccommodationType =
      residentialFacilityRequired === 'Yes' && accommodationType?.trim()
        ? accommodationType
        : undefined;

    const existingStudent = await Student.findOne({
      email: email.toLowerCase(),
    });

    // =========================
    // UPDATE
    // =========================
    if (existingStudent) {
      Object.assign(existingStudent, {
        firstName,
        lastName,
        fatherFirstName,
        fatherLastName,
        motherFirstName,
        motherLastName,
        dateOfBirth,
        gender,
        parentGuardianEmail,
        mobileNumber,
        telephoneNumber,
        countryCode,
        residentialAddress,
        nationality,
        passportNumber,
        previousProgrammeLevel,
        percentage,
        programmeAppliedFor,
        residentialFacilityRequired,
        accommodationType: normalizedAccommodationType,
        standardMeal,
        laundryService,
      });

      existingStudent.additionalDocuments = {
        ...existingStudent.additionalDocuments,
        ...uploadedDocs,
      };

      await existingStudent.save();

      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Application updated successfully',
        student: existingStudent,
      });
    }

    // =========================
    // CREATE
    // =========================
    const student = await Student.create({
      firstName,
      lastName,
      fatherFirstName,
      fatherLastName,
      motherFirstName,
      motherLastName,
      dateOfBirth,
      gender,

      email: email.toLowerCase(),
      parentGuardianEmail,
      mobileNumber,
      telephoneNumber,
      countryCode,

      residentialAddress,
      nationality,
      passportNumber,

      previousProgrammeLevel,
      percentage,
      programmeAppliedFor,

      residentialFacilityRequired,
      accommodationType: normalizedAccommodationType,
      standardMeal,
      laundryService,

      additionalDocuments: uploadedDocs,

      source: 'Public Portal',
      applicationDate: new Date(),
      leadStatus: 'APPLICATION_INITIATED',
    });

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Application submitted successfully',
      student,
    });
  } catch (error) {
    console.error(error);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};