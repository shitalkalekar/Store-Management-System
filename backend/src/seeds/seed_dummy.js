/**
 * FULL 10-RECORD DUMMY DATA SEED
 * Seeds: 10 Students, 10 Faculty, 10 Admissions, 10 Notifications,
 *        5 Courses, 5 Departments, 10 Subjects, 5 Certificates
 * Run: node src/seeds/seed_dummy.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const User        = require('../models/user');
const Role        = require('../models/role');
const Department  = require('../models/department');
const Course      = require('../models/course');
const Subject     = require('../models/subject');
const Faculty     = require('../models/faculty');
const Student     = require('../models/student');
const Admission   = require('../models/admission');
const Notification = require('../models/notification');
const Certificate = require('../models/certificate');
const InstituteProfile = require('../models/institute');
const Settings    = require('../models/settings');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sisdb';

const run = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB:', mongoose.connection.name);

  // ── ROLES ─────────────────────────────────────────────────────────────────
  for (const name of ['Admin', 'Faculty', 'Student']) {
    if (!(await Role.findOne({ name }))) await Role.create({ name });
  }

  // ── INSTITUTE ─────────────────────────────────────────────────────────────
  if (!(await InstituteProfile.findOne())) {
    await InstituteProfile.create({
      name: 'SIS Institute of Technology',
      address: 'Pune, Maharashtra, India',
      email: 'contact@sis.edu',
      contact: '9876543210'
    });
    console.log('✅ Institute seeded');
  }

  // ── SETTINGS ──────────────────────────────────────────────────────────────
  if (!(await Settings.findOne())) {
    await Settings.create({ key: 'global', academicYear: '2026-27' });
  }

  // ── ADMIN USER ────────────────────────────────────────────────────────────
  if (!(await User.findOne({ email: 'admin@school.com' }))) {
    await User.create({ name: 'System Admin', email: 'admin@school.com', password: 'admin123', role: 'admin', status: 'Active' });
    console.log('✅ Admin user: admin@school.com / admin123');
  }

  // ── DEPARTMENTS ───────────────────────────────────────────────────────────
  const deptData = [
    { name: 'Computer Engineering',           code: 'CE'   },
    { name: 'Information Technology',         code: 'IT'   },
    { name: 'Electronics & Telecommunication', code: 'EXTC' },
    { name: 'Mechanical Engineering',         code: 'ME'   },
    { name: 'Civil Engineering',             code: 'CV'   },
  ];
  const depts = {};
  for (const d of deptData) {
    let dept = await Department.findOne({ name: d.name });
    if (!dept) dept = await Department.create(d);
    depts[d.code] = dept;
  }
  console.log('✅ Departments seeded');

  // ── COURSES ───────────────────────────────────────────────────────────────
  const courseData = [
    { courseId: 'BTECH-CE',   name: 'B.Tech Computer Engineering',           department: 'Computer Engineering',           duration: 8 },
    { courseId: 'BTECH-IT',   name: 'B.Tech Information Technology',         department: 'Information Technology',         duration: 8 },
    { courseId: 'BTECH-EXTC', name: 'B.Tech Electronics & Telecommunication', department: 'Electronics & Telecommunication', duration: 8 },
    { courseId: 'MTECH-CE',   name: 'M.Tech Computer Engineering',           department: 'Computer Engineering',           duration: 4 },
    { courseId: 'DIP-ENG',    name: 'Diploma in Engineering',                department: 'Mechanical Engineering',         duration: 6 },
  ];
  const courses = {};
  for (const c of courseData) {
    let course = await Course.findOne({ courseId: c.courseId });
    if (!course) course = await Course.create(c);
    courses[c.courseId] = course;
  }
  console.log('✅ Courses seeded');

  // ── SUBJECTS ──────────────────────────────────────────────────────────────
  const subjectData = [
    { subjectId: 'CS101', name: 'Data Structures & Algorithms', code: 'CS101', credits: 4, semester: '1', courseId: courses['BTECH-CE']._id },
    { subjectId: 'CS102', name: 'Database Management Systems',  code: 'CS102', credits: 4, semester: '1', courseId: courses['BTECH-CE']._id },
    { subjectId: 'CS201', name: 'Computer Networks',            code: 'CS201', credits: 3, semester: '2', courseId: courses['BTECH-CE']._id },
    { subjectId: 'CS202', name: 'Operating Systems',            code: 'CS202', credits: 3, semester: '2', courseId: courses['BTECH-CE']._id },
    { subjectId: 'IT101', name: 'Web Technologies',             code: 'IT101', credits: 3, semester: '1', courseId: courses['BTECH-IT']._id },
    { subjectId: 'IT102', name: 'Software Engineering',         code: 'IT102', credits: 3, semester: '1', courseId: courses['BTECH-IT']._id },
    { subjectId: 'IT201', name: 'Cloud Computing',              code: 'IT201', credits: 3, semester: '2', courseId: courses['BTECH-IT']._id },
    { subjectId: 'EX101', name: 'Digital Electronics',          code: 'EX101', credits: 4, semester: '1', courseId: courses['BTECH-EXTC']._id },
    { subjectId: 'ME101', name: 'Engineering Mechanics',        code: 'ME101', credits: 4, semester: '1', courseId: courses['DIP-ENG']._id },
    { subjectId: 'MT101', name: 'Advanced Algorithms',          code: 'MT101', credits: 4, semester: '1', courseId: courses['MTECH-CE']._id },
  ];
  for (const s of subjectData) {
    if (!(await Subject.findOne({ subjectId: s.subjectId }))) await Subject.create(s);
  }
  console.log('✅ 10 Subjects seeded');

  // ── FACULTY USERS & PROFILES (10) ─────────────────────────────────────────
  const facultyData = [
    { id:'FAC001', name:'Dr. Ravi Shankar',    email:'ravi.shankar@sis.edu',   mobile:'9811111111', dept:'Computer Engineering',           qual:'Ph.D Computer Science', exp:'12 Years', emp:'EMP001' },
    { id:'FAC002', name:'Prof. Meena Desai',   email:'meena.desai@sis.edu',    mobile:'9822222222', dept:'Information Technology',         qual:'M.Tech IT',             exp:'8 Years',  emp:'EMP002' },
    { id:'FAC003', name:'Dr. Arjun Mehta',     email:'arjun.mehta@sis.edu',    mobile:'9833333333', dept:'Electronics & Telecommunication', qual:'Ph.D Electronics',      exp:'15 Years', emp:'EMP003' },
    { id:'FAC004', name:'Prof. Sunita Rao',    email:'sunita.rao@sis.edu',     mobile:'9844444444', dept:'Mechanical Engineering',         qual:'M.E. Mechanical',       exp:'6 Years',  emp:'EMP004' },
    { id:'FAC005', name:'Dr. Vikram Patil',    email:'vikram.patil@sis.edu',   mobile:'9855555555', dept:'Computer Engineering',           qual:'Ph.D Networking',       exp:'10 Years', emp:'EMP005' },
    { id:'FAC006', name:'Prof. Anjali Gupta',  email:'anjali.gupta@sis.edu',   mobile:'9866666666', dept:'Information Technology',         qual:'M.Tech Software Eng.',  exp:'7 Years',  emp:'EMP006' },
    { id:'FAC007', name:'Dr. Suresh Kumar',    email:'suresh.kumar@sis.edu',   mobile:'9877777777', dept:'Civil Engineering',             qual:'Ph.D Civil',            exp:'20 Years', emp:'EMP007' },
    { id:'FAC008', name:'Prof. Pooja Sharma',  email:'pooja.sharma@sis.edu',   mobile:'9888888888', dept:'Computer Engineering',           qual:'M.Tech AI',             exp:'4 Years',  emp:'EMP008' },
    { id:'FAC009', name:'Dr. Kiran Joshi',     email:'kiran.joshi@sis.edu',    mobile:'9899999999', dept:'Electronics & Telecommunication', qual:'Ph.D VLSI',             exp:'11 Years', emp:'EMP009' },
    { id:'FAC010', name:'Prof. Rahul Verma',   email:'rahul.verma@sis.edu',    mobile:'9800000000', dept:'Mechanical Engineering',         qual:'M.E. CAD/CAM',          exp:'9 Years',  emp:'EMP010' },
  ];

  for (const f of facultyData) {
    // Create login user if not exists
    let user = await User.findOne({ email: f.email });
    if (!user) {
      user = await User.create({ name: f.name, email: f.email, password: 'faculty123', role: 'faculty', status: 'Active' });
    }
    // Create faculty profile if not exists
    if (!(await Faculty.findOne({ facultyId: f.id }))) {
      await Faculty.create({
        facultyId: f.id, name: f.name, email: f.email,
        mobile: f.mobile, department: f.dept,
        qualification: f.qual, experience: f.exp,
        employeeId: f.emp, userId: user._id
      });
    }
  }
  console.log('✅ 10 Faculty seeded (login: <email> / faculty123)');

  // ── STUDENTS (10) ──────────────────────────────────────────────────────────
  const studentData = [
    { studentId:'STU001', rollNumber:'R001', firstName:'John',    lastName:'Smith',    email:'john.smith@student.com',    mobile:'9101010101', dob:'2001-05-10', gender:'Male',   course:'B.Tech Computer Engineering',            dept:'Computer Engineering',           sem:'1' },
    { studentId:'STU002', rollNumber:'R002', firstName:'Priya',   lastName:'Patel',    email:'priya.patel@student.com',   mobile:'9202020202', dob:'2001-08-15', gender:'Female', course:'B.Tech Computer Engineering',            dept:'Computer Engineering',           sem:'1' },
    { studentId:'STU003', rollNumber:'R003', firstName:'Rahul',   lastName:'Kumar',    email:'rahul.kumar@student.com',   mobile:'9303030303', dob:'2001-03-22', gender:'Male',   course:'B.Tech Information Technology',          dept:'Information Technology',         sem:'2' },
    { studentId:'STU004', rollNumber:'R004', firstName:'Anjali',  lastName:'Sharma',   email:'anjali.sharma@student.com', mobile:'9404040404', dob:'2000-11-05', gender:'Female', course:'B.Tech Information Technology',          dept:'Information Technology',         sem:'2' },
    { studentId:'STU005', rollNumber:'R005', firstName:'Vikram',  lastName:'Singh',    email:'vikram.singh@student.com',  mobile:'9505050505', dob:'2001-01-18', gender:'Male',   course:'B.Tech Electronics & Telecommunication', dept:'Electronics & Telecommunication', sem:'1' },
    { studentId:'STU006', rollNumber:'R006', firstName:'Neha',    lastName:'Verma',    email:'neha.verma@student.com',    mobile:'9606060606', dob:'2001-07-30', gender:'Female', course:'B.Tech Electronics & Telecommunication', dept:'Electronics & Telecommunication', sem:'1' },
    { studentId:'STU007', rollNumber:'R007', firstName:'Arjun',   lastName:'Mehta',    email:'arjun.mehta@student.com',   mobile:'9707070707', dob:'2000-09-12', gender:'Male',   course:'B.Tech Computer Engineering',            dept:'Computer Engineering',           sem:'3' },
    { studentId:'STU008', rollNumber:'R008', firstName:'Sneha',   lastName:'Joshi',    email:'sneha.joshi@student.com',   mobile:'9808080808', dob:'2000-12-25', gender:'Female', course:'M.Tech Computer Engineering',            dept:'Computer Engineering',           sem:'1' },
    { studentId:'STU009', rollNumber:'R009', firstName:'Rohit',   lastName:'Desai',    email:'rohit.desai@student.com',   mobile:'9909090909', dob:'2001-04-08', gender:'Male',   course:'Diploma in Engineering',                 dept:'Mechanical Engineering',         sem:'2' },
    { studentId:'STU010', rollNumber:'R010', firstName:'Kavita',  lastName:'Patil',    email:'kavita.patil@student.com',  mobile:'9010101010', dob:'2001-06-20', gender:'Female', course:'B.Tech Computer Engineering',            dept:'Computer Engineering',           sem:'4' },
  ];

  let studentsSeeded = 0;
  for (const s of studentData) {
    if (!(await Student.findOne({ studentId: s.studentId }))) {
      await Student.create({
        studentId: s.studentId, rollNumber: s.rollNumber,
        firstName: s.firstName, lastName: s.lastName,
        email: s.email, mobile: s.mobile,
        dob: new Date(s.dob), gender: s.gender,
        address: `${s.firstName} Nagar, Pune, Maharashtra`,
        course: s.course, department: s.dept, semester: s.sem,
        status: 'Active',
        parentDetails: {
          fatherName: `${s.firstName}'s Father`,
          motherName: `${s.firstName}'s Mother`,
          parentMobile: s.mobile.replace(/.$/, '0')
        }
      });
      studentsSeeded++;
    }
  }
  console.log(`✅ ${studentsSeeded} new Students seeded (total 10)`);

  // ── ADMISSIONS (10) ───────────────────────────────────────────────────────
  const statuses = ['Pending', 'Approved', 'Approved', 'Rejected', 'Approved', 'Pending', 'Approved', 'Approved', 'Pending', 'Approved'];
  for (let i = 0; i < studentData.length; i++) {
    const s = studentData[i];
    const formNo = `ADM2026${String(i+1).padStart(3,'0')}`;
    if (!(await Admission.findOne({ formNumber: formNo }))) {
      await Admission.create({
        formNumber: formNo,
        status: statuses[i],
        remarks: statuses[i] === 'Approved' ? 'All documents verified' : statuses[i] === 'Rejected' ? 'Incomplete documents' : 'Under review',
        studentDetails: {
          firstName: s.firstName, lastName: s.lastName,
          dob: new Date(s.dob), gender: s.gender,
          mobile: s.mobile, email: s.email,
          address: `${s.firstName} Nagar, Pune, Maharashtra`,
          parentDetails: { fatherName: `${s.firstName}'s Father`, motherName: `${s.firstName}'s Mother`, parentMobile: s.mobile.replace(/.$/, '0') },
          course: s.course, department: s.dept, semester: s.sem
        },
        createdAt: new Date(2026, 0, i + 10)
      });
    }
  }
  console.log('✅ 10 Admissions seeded');

  // ── NOTIFICATIONS (10) ────────────────────────────────────────────────────
  const notifications = [
    { title:'Semester Exam Schedule Released',    message:'Final semester exams will begin from July 15, 2026. Check the timetable on the portal.',     sender:'Admin',          recipientRole:'All' },
    { title:'Fee Payment Deadline',               message:'Last date for fee payment is June 30, 2026. Late fee of ₹500 per day after deadline.',        sender:'Admin',          recipientRole:'Student' },
    { title:'Faculty Meeting Tomorrow',           message:'All faculty members are requested to attend the departmental meeting at 10:00 AM tomorrow.',   sender:'Principal',      recipientRole:'Faculty' },
    { title:'New Library Books Available',        message:'200 new technical books on AI, ML, and Cloud Computing have been added to the library.',       sender:'Library Admin',  recipientRole:'All' },
    { title:'Holiday Notice – Eid',              message:'The institute will remain closed on June 28, 2026 on account of Eid al-Adha.',                 sender:'Admin',          recipientRole:'All' },
    { title:'Sports Day Registration Open',       message:'Register for Sports Day 2026 before June 25. Contact your class representative for details.',  sender:'Sports Dept',    recipientRole:'Student' },
    { title:'Workshop on Cybersecurity',          message:'A 2-day workshop on Ethical Hacking & Cybersecurity is scheduled for July 5-6, 2026.',         sender:'CSE Dept',       recipientRole:'All' },
    { title:'Result Declared – Semester III',     message:'Semester III examination results have been declared. Login to the portal to check your marks.', sender:'Exam Cell',      recipientRole:'Student' },
    { title:'Attendance Warning',                 message:'Students with attendance below 75% will be barred from appearing in final exams.',              sender:'Admin',          recipientRole:'Student' },
    { title:'Placement Drive – TCS',             message:'TCS is conducting campus recruitment on July 10, 2026. Eligible students must register by July 5.', sender:'Placement Cell', recipientRole:'Student' },
  ];
  for (const n of notifications) {
    if (!(await Notification.findOne({ title: n.title }))) {
      await Notification.create(n);
    }
  }
  console.log('✅ 10 Notifications seeded');

  // ── CERTIFICATES (5) ──────────────────────────────────────────────────────
  const certData = [
    { certificateId:'CERT001', type:'Bonafide', studentId:'STU001', studentName:'John Smith',   serialNumber:'BF2026001', reason:'Bank Account Opening', status:'Issued' },
    { certificateId:'CERT002', type:'Leaving',  studentId:'STU003', studentName:'Rahul Kumar',  serialNumber:'LC2026001', reason:'Transfer to Another College', status:'Issued' },
    { certificateId:'CERT003', type:'Bonafide', studentId:'STU005', studentName:'Vikram Singh', serialNumber:'BF2026002', reason:'Scholarship Application', status:'Issued' },
    { certificateId:'CERT004', type:'Bonafide', studentId:'STU007', studentName:'Arjun Mehta',  serialNumber:'BF2026003', reason:'Passport Application', status:'Issued' },
    { certificateId:'CERT005', type:'Leaving',  studentId:'STU009', studentName:'Rohit Desai',  serialNumber:'LC2026002', reason:'Higher Studies Abroad', status:'Issued' },
  ];
  for (const c of certData) {
    if (!(await Certificate.findOne({ certificateId: c.certificateId }))) {
      await Certificate.create({ ...c, issueDate: new Date() });
    }
  }
  console.log('✅ 5 Certificates seeded');

  console.log('\n🎉 ALL DONE! Summary:');
  console.log(`   Students:      ${await Student.countDocuments()}`);
  console.log(`   Faculty:       ${await Faculty.countDocuments()}`);
  console.log(`   Admissions:    ${await Admission.countDocuments()}`);
  console.log(`   Notifications: ${await Notification.countDocuments()}`);
  console.log(`   Certificates:  ${await Certificate.countDocuments()}`);
  console.log(`   Courses:       ${await Course.countDocuments()}`);
  console.log(`   Subjects:      ${await Subject.countDocuments()}`);
  console.log('\n🔑 Login credentials:');
  console.log('   Admin:   admin@school.com / admin123');
  console.log('   Faculty: ravi.shankar@sis.edu / faculty123 (and 9 others)');

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
