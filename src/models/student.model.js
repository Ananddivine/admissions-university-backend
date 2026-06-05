import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  // Personal Information
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  surname: { type: String, trim: true }, // Family name
  fatherFirstName: { type: String, trim: true },
  fatherLastName: { type: String, trim: true },
  motherFirstName: { type: String, trim: true },
  motherLastName: { type: String, trim: true },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Transgender', 'Other'], default: 'Other' },
  
  // Contact Details
  email: { type: String, trim: true, lowercase: true },
  parentGuardianEmail: { type: String, trim: true, lowercase: true },
  mobileNumber: { type: String, trim: true },
  telephoneNumber: { type: String, trim: true },
  countryCode: { type: String, trim: true },
  
  // Address Information
  residentialAddress: {
    street: { type: String, trim: true },
    cityTown: { type: String, trim: true },
    stateProvince: { type: String, trim: true },
    country: { type: String, trim: true },
    zipPostalCode: { type: String, trim: true },
  },
  
  country: { type: String, trim: true }, // Legacy field
  nationality: { type: String, trim: true },
  passportNumber: { type: String, trim: true },
  nationalIdNumber: { type: String, trim: true },
  passportAvailability: { type: String, enum: ['NOT_AVAILABLE', 'AVAILABLE'], default: 'NOT_AVAILABLE' },
  
  // Academic Information
  previousProgrammeLevel: { type: String, trim: true }, // e.g., "High School", "Bachelor's"
  resultsObtained: { type: String, trim: true }, // e.g., "Distinction", "Percentage", "CGPA/GPA"
  highestQualification: { type: String, trim: true },
  institution: { type: String, trim: true },
  percentage: { type: String, trim: true },
  cgpaGpa: { type: String, trim: true },
  graduationYear: { type: String, trim: true },
  
  // Application Details
  programmeAppliedFor: { type: String, trim: true },
  programInterest: { type: String, trim: true },
  university: { type: mongoose.Schema.Types.ObjectId, ref: 'University' },
  intake: { type: String, trim: true }, // e.g., "Fall 2026", "Spring 2027"
  
  // Course Preferences
  coursePreferences: {
    country: { type: String, trim: true },
    university: { type: String, trim: true },
    program: { type: String, trim: true },
    intake: { type: String, trim: true },
  },
  
  // Financial Information
  sponsorType: { 
    type: String, 
    enum: ['Self Sponsored', 'Government Sponsored', 'Scholarship Sponsored', 'Parent Sponsored', 'Company Sponsored'], 
    default: 'Self Sponsored' 
  },
  
  // Residential/Laundry/Meal Plan
  residentialFacilityRequired: { type: String, enum: ['Yes', 'No'], default: 'No' },
  accommodationType: { 
    type: String, 
    enum: ['1 seater', '2 seater', '3 seater', '4 seater', 'Air Cooler', 'Air Conditioner'], 
  },
  standardMeal: { type: String, enum: ['Yes', 'No'], default: 'No' },
  laundryService: { type: String, enum: ['Yes', 'No'], default: 'No' },
  
  // Documents
  requiredDocuments: [{ type: String }],
  pasteRecentPhotograph: { type: String }, // URL to uploaded photo
 additionalDocuments: {
  grade10Certificate: String,
  grade10Transcript: String,

  grade12Certificate: String,
  grade12Transcript: String,

  diploma: String,
  degree: String,
  masters: String,

  passportPhoto: String,
  passportBioPage: String,
  passportBackPages: String,

  visaDocument: String,
  travelTickets: String,
},
  
  // Follow-up and Status
  leadStatus: {
    type: String,
    enum: [
      'NEW_LEAD',
      'CONTACTED', 
      'INTERESTED', 
      'NOT_INTERESTED', 
      'FOLLOW_UP_REQUIRED',
      'DOCUMENTS_PENDING',
      'DOCUMENTS_RECEIVED',
      'APPLICATION_SENT', 
      'APPLICATION_RECEIVED',
      'OFFER_LETTER_RECEIVED',
      'VISA_APPLIED',
      'VISA_APPROVED',
      'VISA_REJECTED',
      'ENROLLED',
      'REJECTED',
      'APPLICATION_INITIATED'
    ],
    default: 'NEW_LEAD',
  },
  
  // Assignment
  assignedCounselor: { type: String, trim: true },
  assignedOfficer: { type: String, trim: true },
  
  // Source and Notes
  source: { type: String, default: 'Public Portal' },
  notes: { type: String, default: '' },
  
  // Follow-up History
  followUpHistory: [{
    date: { type: Date, default: Date.now },
    action: { type: String, trim: true },
    notes: { type: String, trim: true },
    performedBy: { type: String, trim: true },
  }],
  
  // Important Dates
  applicationDate: { type: Date },
  offerLetterDate: { type: Date },
  visaApplicationDate: { type: Date },
  visaApprovalDate: { type: Date },
  enrollmentDate: { type: Date },
  applicationNumber: { type: String, trim: true },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  
  // Soft Delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
});

// Indexes for better search performance
StudentSchema.index({ email: 1, mobileNumber: 1 });
StudentSchema.index({ firstName: 1, lastName: 1 });
StudentSchema.index({ leadStatus: 1 });
StudentSchema.index({ createdAt: -1 });
StudentSchema.index({ university: 1 });

// Update the updatedAt field before saving
StudentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Student', StudentSchema);
