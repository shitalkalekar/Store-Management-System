const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DocumentSetup = require('../models/documentSetup');

dotenv.config();

const defaultDocuments = [
  { documentTitle: 'Aadhaar Card', description: 'Student Identity Proof', isMandatory: true, displayOrder: 1 },
  { documentTitle: 'Admission Form', description: 'Signed Admission Form', isMandatory: true, displayOrder: 2 },
  { documentTitle: 'Leaving Certificate (LC)', description: 'LC or TC from previous institute', isMandatory: true, displayOrder: 3 },
  { documentTitle: '10th Marksheet', description: 'SSC Marksheet', isMandatory: true, displayOrder: 4 },
  { documentTitle: '12th Marksheet', description: 'HSC Marksheet', isMandatory: true, displayOrder: 5 },
  { documentTitle: 'Domicile Certificate', description: 'Proof of residence', isMandatory: false, displayOrder: 6 },
  { documentTitle: 'Caste Certificate', description: 'If applicable', isMandatory: false, displayOrder: 7 },
  { documentTitle: 'Caste Validity', description: 'If applicable', isMandatory: false, displayOrder: 8 },
  { documentTitle: 'Income Certificate', description: 'For EBC/Scholarships', isMandatory: false, displayOrder: 9 },
  { documentTitle: 'Non-Creamy Layer (NCL)', description: 'If applicable', isMandatory: false, displayOrder: 10 },
  { documentTitle: 'Passport Size Photo', description: 'Recent photograph', isMandatory: true, displayOrder: 11 },
  { documentTitle: 'Bank Passbook', description: 'Front page for scholarship accounts', isMandatory: false, displayOrder: 12 },
  { documentTitle: 'Gap Certificate', description: 'If there is an education gap', isMandatory: false, displayOrder: 13 },
  { documentTitle: 'Migration Certificate', description: 'If from another university', isMandatory: false, displayOrder: 14 }
];

const seedDocuments = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_information_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to Database. Checking DocumentSetup entries...');
    
    for (const doc of defaultDocuments) {
      const exists = await DocumentSetup.findOne({ documentTitle: doc.documentTitle });
      if (!exists) {
        await DocumentSetup.create(doc);
        console.log(`Created: ${doc.documentTitle}`);
      } else {
        console.log(`Already exists: ${doc.documentTitle}`);
      }
    }
    
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding documents:', err);
    process.exit(1);
  }
};

seedDocuments();
