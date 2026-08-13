require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const { fakerEN_IN: faker } = require('@faker-js/faker');

// Import all models
const User = require('../src/models/user');
const Student = require('../src/models/student');
const Faculty = require('../src/models/faculty');
const Department = require('../src/models/department');
const Course = require('../src/models/course');
const Semester = require('../src/models/semester');
const StudentAttendance = require('../src/models/studentAttendance');
const PassingRemark = require('../src/models/passingRemark');
const Application = require('../src/models/application');
const Certificate = require('../src/models/certificate');
const Notification = require('../src/models/notification');

const NUM_STUDENTS = 350;
const NUM_FACULTY = 40;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sisdb');
    console.log('MongoDB connected.');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    console.log('Clearing existing bulk collections (except core Users)...');
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await Department.deleteMany({});
    await Course.deleteMany({});
    await Semester.deleteMany({});
    await StudentAttendance.deleteMany({});
    await PassingRemark.deleteMany({});
    await Application.deleteMany({});
    await Certificate.deleteMany({});
    await Notification.deleteMany({});

    // 1. Departments & Courses
    console.log('Seeding Departments & Courses...');
    const depts = [
      { name: 'Computer Engineering', code: 'CE' },
      { name: 'Information Technology', code: 'IT' },
      { name: 'Electronics', code: 'EXTC' }
    ];
    for (const d of depts) await Department.create(d);

    const courses = [
      { courseId: 'BTECH-CE', name: 'B.Tech', department: 'Computer Engineering', duration: 8 },
      { courseId: 'BTECH-IT', name: 'B.Tech', department: 'Information Technology', duration: 8 },
      { courseId: 'DIP-EXTC', name: 'Diploma', department: 'Electronics', duration: 6 }
    ];
    for (const c of courses) await Course.create(c);

    // 2. Faculty
    console.log(`Seeding ${NUM_FACULTY} Faculty members...`);
    const facultyDocs = [];
    for (let i = 0; i < NUM_FACULTY; i++) {
      const f = await Faculty.create({
        facultyId: `FAC${2000 + i}`,
        name: `${faker.person.firstName()} ${faker.person.lastName()}`,
        email: faker.internet.email(),
        mobile: '9' + faker.string.numeric(9),
        department: faker.helpers.arrayElement(['Computer Engineering', 'Information Technology', 'Electronics']),
        designation: faker.helpers.arrayElement(['Professor', 'Assistant Professor', 'Lecturer']),
        qualification: faker.helpers.arrayElement(['Ph.D', 'M.Tech', 'B.Tech']),
        experience: faker.number.int({ min: 1, max: 20 }) + ' Years',
        subjects: [faker.helpers.arrayElement(['Data Structures', 'Database Systems', 'Machine Learning', 'Network Security'])],
        assignedClasses: ['Semester 3', 'Semester 5']
      });
      facultyDocs.push(f);
      
      // Also create a user account for them
      await User.create({
        name: f.name,
        email: f.email,
        password: 'password123',
        role: 'faculty',
        status: 'Active'
      });
    }

    // 3. Students
    console.log(`Seeding ${NUM_STUDENTS} Students...`);
    const studentDocs = [];
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'O+', 'O-'];
    const categories = ['Open', 'OBC', 'SC', 'ST', 'NT'];
    const syncModulesOptions = ["Attendance Management", "Fee Collection System", "Result Analysis", "Teacher Guardian", "Student Portal", "Library Management", "Hostel Management", "Placement Cell", "Alumni Management"];
    
    for (let i = 0; i < NUM_STUDENTS; i++) {
      const s = await Student.create({
        studentId: `STU2026${String(i).padStart(4, '0')}`,
        admissionNumber: `ADM${String(i).padStart(4, '0')}`,
        rollNumber: `R${faker.number.int({ min: 1, max: 150 })}`,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        dob: faker.date.birthdate({ min: 18, max: 24, mode: 'age' }),
        gender: faker.helpers.arrayElement(['Male', 'Female']),
        bloodGroup: faker.helpers.arrayElement(bloodGroups),
        category: faker.helpers.arrayElement(categories),
        religion: faker.helpers.arrayElement(['Hindu', 'Muslim', 'Christian', 'Sikh']),
        nationality: 'Indian',
        aadhaarNumber: faker.string.numeric(12),
        mobile: '9' + faker.string.numeric(9),
        email: faker.internet.email(),
        currentAddress: faker.location.streetAddress(),
        permanentAddress: faker.location.streetAddress(),
        city: faker.location.city(),
        state: 'Maharashtra',
        pinCode: faker.location.zipCode('######'),
        
        // Parent details
        parentDetails: {
          fatherName: faker.person.fullName({ sex: 'male' }),
          fatherOccupation: faker.helpers.arrayElement(['Business', 'Service', 'Farmer', 'Doctor']),
          fatherMobile: '9' + faker.string.numeric(9),
          motherName: faker.person.fullName({ sex: 'female' }),
          annualIncome: faker.number.int({ min: 100000, max: 1500000 })
        },
        
        // Academic
        academicYear: '2026-27',
        admissionYear: '2026',
        admissionType: faker.helpers.arrayElement(['CAP', 'Management', 'TFWS']),
        department: faker.helpers.arrayElement(['Computer Engineering', 'Information Technology', 'Electronics']),
        course: faker.helpers.arrayElement(['B.Tech', 'Diploma']),
        semester: `Semester ${faker.number.int({ min: 1, max: 8 })}`,
        division: faker.helpers.arrayElement(['A', 'B', 'C']),
        section: 'Section 1',
        batch: `B${faker.number.int({ min: 1, max: 4 })}`,
        previousPercentage: faker.number.int({ min: 55, max: 99 }),
        
        // Medical
        height: faker.number.int({ min: 150, max: 190 }),
        weight: faker.number.int({ min: 45, max: 90 }),
        
        // Fee & Modules
        feeStructure: 'Standard Tuition 2026',
        feeCategory: faker.helpers.arrayElement(['Open', 'OBC', 'SC']),
        totalFee: 85000,
        paidFee: faker.number.int({ min: 10000, max: 85000 }),
        scholarshipAmount: 0,
        
        // Hostel
        hostelRequired: faker.datatype.boolean(),
        transportRequired: faker.datatype.boolean(),
        
        // Documents
        documents: [
          { type: 'Aadhaar Card', url: '/dummy/aadhaar.pdf' },
          { type: 'SSC Marksheet', url: '/dummy/ssc.pdf' },
          { type: 'HSC Marksheet', url: '/dummy/hsc.pdf' }
        ],
        synchronizedModules: faker.helpers.arrayElements(syncModulesOptions, 4),
        status: 'Active'
      });
      studentDocs.push(s);
    }

    // 4. Student Applications, Remarks & Certificates
    console.log('Seeding Applications, Remarks, Certificates, Attendance, Notifications...');
    
    for (let i = 0; i < 50; i++) {
      const randomStudent = faker.helpers.arrayElement(studentDocs);
      
      // Application
      await Application.create({
        applicationId: `APP${202600 + i}`,
        studentId: randomStudent.studentId,
        studentName: `${randomStudent.firstName} ${randomStudent.lastName}`,
        type: faker.helpers.arrayElement(['Bonafide Certificate', 'Leaving Certificate', 'Railway Concession', 'Character Certificate', 'NOC', 'General Document']),
        details: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(['Pending', 'Approved', 'Rejected'])
      });

      // Remark
      await PassingRemark.create({
        studentId: randomStudent._id,
        passingRemark: faker.helpers.arrayElement(['Excellent performance', 'Needs improvement in Maths', 'Good conduct', 'Irregular attendance']),
        remarkBy: 'Admin'
      });
      
      // Certificate
      await Certificate.create({
        certificateId: `CERT${1000 + i}`,
        type: faker.helpers.arrayElement(['Leaving', 'Bonafide']),
        studentId: randomStudent.studentId,
        studentName: `${randomStudent.firstName} ${randomStudent.lastName}`,
        serialNumber: `SN-${1000 + i}`,
        status: 'Issued'
      });
    }
    
    // Notifications
    const notices = ['Exam Timetable Released', 'Holiday on Monday', 'Fees Submission Deadline', 'Placement Drive for Final Year'];
    for (const title of notices) {
      await Notification.create({
        title,
        message: faker.lorem.sentences(2),
        targetRole: 'All',
        sender: 'Admin',
        datePosted: new Date()
      });
    }

    console.log('Seeding Complete! MongoDB is now populated with rich relational data.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

connectDB().then(seedData);
