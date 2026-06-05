import University from '../models/university.model.js';

export async function seedUniversities() {
  try {
    const count = await University.countDocuments();
    
    if (count > 0) {
      console.log('Universities already exist in database');
      return;
    }

    const universities = [
      {
        name: 'Lovely Professional University',
        country: 'India',
        contact: {
          phone: '+91-1800-123-456',
          email: 'contact@lpu.edu.in',
          address: 'Jalandhar - Delhi G.T. Road, Phagwara, Punjab',
        },
      },
      {
        name: 'Acharya Institute of Technology',
        country: 'India',
        contact: {
          phone: '+91-80-1234-5678',
          email: 'info@acharya.ac.in',
          address: 'Soladevanahalli, Bangalore',
        },
      },
     ];

    await University.insertMany(universities);
    console.log('Universities seeded successfully');
  } catch (error) {
    console.error('Error seeding universities:', error.message);
  }
}
