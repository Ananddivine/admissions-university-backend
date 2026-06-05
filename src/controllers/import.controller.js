import Student from '../models/student.model.js';
import ImportAudit from '../models/import.model.js';
import { StatusCodes } from 'http-status-codes';

function parseRow(row) {
  return {
    firstName: row['First Name'] || row.firstName || row.first_name || '',
    lastName: row['Last Name'] || row.lastName || row.last_name || '',
    email: row.Email || row.email || row.email_address || '',
    mobileNumber: row['Mobile Number'] || row.mobileNumber || row.mobile_number || '',
    country: row.Country || row.country || '',
    programInterest: row['Program Interest'] || row.programInterest || row.program || '',
    intake: row.Intake || row.intake || '',
    sponsorType: row['Sponsor Type'] || row.sponsorType || 'Self Sponsored',
    notes: row.Notes || row.notes || '',
    source: 'Import Wizard',
   leadStatus: (
  row['Lead Status'] ||
  row['Application Stages'] ||
  row['Status'] ||
  row.leadStatus ||
  'NEW_LEAD'
)
  .trim()
  .toUpperCase()
  .replace(/\s+/g, '_'),
  };
}

export async function previewImport(req, res) {
  const { rows, universityId } = req.body;
  if (!Array.isArray(rows) || !universityId) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Rows and universityId are required.' });
  }

  const preview = rows.slice(0, 12).map(parseRow);
  const duplicateCount = preview.filter((row) => row.email || row.mobileNumber).length;

  res.status(StatusCodes.OK).json({ preview, universityId, duplicateCount });
}

export async function createImport(req, res) {
  const { rows, universityId } = req.body;
  if (!Array.isArray(rows) || !universityId) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Rows and universityId are required.' });
  }

 let imported = 0;
let duplicates = 0;
const inserted = [];
const duplicateRecords = [];

  for (const row of rows) {
    const candidate = parseRow(row);
    
    // Skip rows without at least a name and contact method
    const hasName = candidate.firstName || candidate.lastName;
    const hasContact = candidate.email || candidate.mobileNumber;
    if (!hasName || !hasContact) {
      continue;
    }

    // Check for duplicates only on fields that exist
    const duplicateQuery = [];
    if (candidate.email) duplicateQuery.push({ email: candidate.email });
    if (candidate.mobileNumber) duplicateQuery.push({ mobileNumber: candidate.mobileNumber });
    
    const exists = duplicateQuery.length > 0 
      ? await Student.findOne({ $or: duplicateQuery })
      : null;
  if (exists) {
  duplicates += 1;

  duplicateRecords.push({
    name: `${candidate.firstName} ${candidate.lastName}`.trim(),
    email: candidate.email,
    mobileNumber: candidate.mobileNumber,
    existingStudentId: exists._id,
    duplicateBy: candidate.email === exists.email
      ? 'Email'
      : 'Mobile Number',
  });

  continue;
}

    const student = await Student.create({
      ...candidate,
      university: universityId,
    });
    imported += 1;
    inserted.push(student);
  }

  await ImportAudit.create({
    university: universityId,
    recordCount: rows.length,
    duplicates,
    invalidRows: rows.length - imported - duplicates,
    sampleRows: inserted.slice(0, 5),
  });

 res.status(StatusCodes.CREATED).json({
  imported,
  duplicates,
  total: rows.length,
  duplicateRecords,
});
}
