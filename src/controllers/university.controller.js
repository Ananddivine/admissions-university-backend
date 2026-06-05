import University from '../models/university.model.js';
import { StatusCodes } from 'http-status-codes';

export async function listUniversities(req, res) {
  const universities = await University.find().sort({ name: 1 });
  res.status(StatusCodes.OK).json(universities);
}

export async function createUniversity(req, res) {
  const payload = req.body;
  const university = await University.create(payload);
  res.status(StatusCodes.CREATED).json(university);
}
