const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

// Load Models
const User = require('../models/user');
const Role = require('../models/role');
const Department = require('../models/department');
const Course = require('../models/course');
const Semester = require('../models/semester');
const Subject = require('../models/subject');
const Faculty = require('../models/faculty');
const Student = require('../models/student');
const InstituteProfile = require('../models/instituteProfile');
const SystemSetting = require('../models/settings');

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sisdb';
    console.log('Connecting to', mongoUri);
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log(`MongoDB Connected Successfully. Database: ${mongoose.connection.name}`);

    // Seed Roles
    const roles = [{ name: 'Admin' }, { name: 'Faculty' }, { name: 'Student' }];
    for (const r of roles) {
      if (!(await Role.findOne({ name: r.name }))) {
        await Role.create(r);
      }
    }
    const adminRole = await Role.findOne({ name: 'Admin' });
    const facultyRole = await Role.findOne({ name: 'Faculty' });

    // Seed Admin User
    const adminEmail = 'admin@school.com';
    const adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      await User.create({
        name: 'System Admin',
        email: adminEmail,
        password: 'admin123',
        role: 'admin',
        status: 'Active'
      });
      console.log('Admin user created');
    }

    // Seed Default Faculty User
    const facultyEmail = 'faculty@school.com';
    let facultyUser = await User.findOne({ email: facultyEmail });
    if (!facultyUser) {
      const hashedPassword = await bcrypt.hash('faculty123', 10);
      facultyUser = await User.create({ email: facultyEmail, password: hashedPassword, role: 'faculty', name: 'Sample Faculty' });
      console.log('Faculty user created');
    }

    // Seed Institute
    if (!(await InstituteProfile.findOne())) {
      await InstituteProfile.create({
        name: 'Demo Institute of Technology',
        code: 'DIT',
        contactEmail: 'contact@demo.com',
        contactPhone: '1234567890'
      });
      console.log('Institute seeded');
    }

    // Seed Departments
    const deptNames = ['Computer Engineering', 'Information Technology'];
    let depts = [];
    for (const dName of deptNames) {
      let dept = await Department.findOne({ name: dName });
      if (!dept) dept = await Department.create({ name: dName, code: dName.substring(0, 2).toUpperCase() });
      depts.push(dept);
    }

    // Seed Courses
    let courses = [];
    for (const dept of depts) {
      const cName = `B.Tech ${dept.name}`;
      let course = await Course.findOne({ name: cName });
      if (!course) course = await Course.create({ name: cName, courseId: dept.code + '101', department: dept.name, duration: 8 });
      courses.push(course);
    }

    // Seed Semesters & Subjects
    if (courses.length > 0) {
      let sem = await Semester.findOne({ courseId: courses[0]._id, number: 1 });
      if (!sem) sem = await Semester.create({ courseId: courses[0]._id, name: 'Semester 1', number: 1 });

      if (!(await Subject.findOne({ subjectId: 'SUBJ01' }))) {
        await Subject.create({ courseId: courses[0]._id, semester: '1', name: 'Data Structures', code: 'CS101', credits: 4, subjectId: 'SUBJ01' });
      }
      if (!(await Subject.findOne({ subjectId: 'SUBJ02' }))) {
        await Subject.create({ courseId: courses[0]._id, semester: '1', name: 'Database Systems', code: 'CS102', credits: 4, subjectId: 'SUBJ02' });
      }
    }

    // Seed Sample Faculty Profile
    if (!(await Faculty.findOne({ email: facultyEmail }))) {
      await Faculty.create({
        name: 'Jane Doe',
        facultyId: 'FAC001',
        qualification: 'Ph.D',
        experience: '10 Years',
        email: facultyEmail,
        department: depts[0].name,
        employeeId: 'EMP001',
        mobile: '9876543210',
        userId: facultyUser._id
      });
      console.log('Faculty profile seeded');
    }

    // Seed Sample Student
    if (!(await Student.findOne({ email: 'student@sis.com' }))) {
      await Student.create({
        firstName: 'John',
        lastName: 'Smith',
        email: 'student@sis.com',
        rollNumber: 'ROLL001',
        studentId: 'STU001',
        course: courses[0].name,
        semester: 'Semester 1',
        department: depts[0].name,
        mobile: '1122334455',
        dob: '2000-01-01',
        gender: 'Male',
        address: '123 Main St',
        parentDetails: {
          fatherName: 'Robert Smith',
          motherName: 'Mary Smith',
          parentMobile: '9988776655'
        }
      });
      console.log('Student seeded');
    }

    console.log('Database Seeding Complete!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seedDB();
