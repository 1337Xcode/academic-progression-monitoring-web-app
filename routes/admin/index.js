const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });

const StudentController = require('../../controllers/AdminController/students');
const ModuleController = require('../../controllers/AdminController/modules');
const GradeController = require('../../controllers/AdminController/grades');
const ProgressionController = require('../../controllers/AdminController/progression'); // Import the new controller
const { isAdmin } = require('../../middlewares/authMiddleware');
const dashboardController = require('../../controllers/AdminController/dashboard');
const messageService = require('../../services/messageService');

// Define admin routes - no CSRF middleware (handled globally in app.js)
router.get('/dashboard', isAdmin, dashboardController.dashboard);

// Main management pages
router.get('/manageStudents', isAdmin, StudentController.manageStudents);
router.get('/manageModules', isAdmin, ModuleController.manageModules);
router.get('/manageGrades', isAdmin, GradeController.manageGrades);
router.get('/manageProgression', isAdmin, ProgressionController.manageProgression); // Add route for progression management
router.get('/manageProgression/view/:sId', isAdmin, ProgressionController.viewStudentProgression); // Route for viewing individual student progression

// Progression routes
router.get('/manageProgression/edit', isAdmin, ProgressionController.renderEditProgression); // Show edit form for progression rules
router.post('/progression/add', isAdmin, ProgressionController.addProgressionRule); // Add new progression rule
router.post('/progression/update', isAdmin, ProgressionController.updateProgressionRule); // Update existing progression rule
router.post('/progression/delete', isAdmin, ProgressionController.deleteProgressionRule); // delete progression rule

// Mitigation routes
router.get('/manageProgression/applyMitigation/:sId', isAdmin, ProgressionController.renderApplyMitigation); // Apply for specific student
router.get('/manageProgression/applyMitigation', isAdmin, ProgressionController.renderApplyMitigation); // General apply mitigation page
router.post('/mitigation/apply', isAdmin, ProgressionController.applyMitigation); // Handle mitigation form submission

// Mitigation Management Routes
router.get('/manageMitigations', isAdmin, ProgressionController.manageMitigations); // List all mitigations
router.get('/mitigation/edit/:id', isAdmin, ProgressionController.renderEditMitigation); // Show edit form
router.post('/mitigation/update', isAdmin, ProgressionController.updateMitigation); // Handle update
router.post('/mitigation/delete', isAdmin, ProgressionController.deleteMitigation); // Handle delete

// Students routes
router.get('/manageStudents/addStudent', isAdmin, (req, res) => { res.render('admin/manageStudents/addStudent'); });
router.get('/manageStudents/updateStudent', isAdmin, StudentController.renderUpdateStudent);
router.get('/manageStudents/deleteStudent', isAdmin, (req, res) => { res.render('admin/manageStudents/deleteStudent'); });
router.post('/students/add', isAdmin, StudentController.addStudent);
router.post('/students/update', isAdmin, StudentController.updateStudent);
router.post('/students/delete', isAdmin, StudentController.deleteStudent);

// Modules routes
router.get('/manageModules/addModule', isAdmin, (req, res) => { res.render('admin/manageModules/addModule'); });
router.get('/manageModules/updateModule', isAdmin, ModuleController.renderUpdateModule);
router.get('/manageModules/deleteModule', isAdmin, (req, res) => { res.render('admin/manageModules/deleteModule'); });
router.post('/modules/add', isAdmin, ModuleController.addModule);
router.post('/modules/update', isAdmin, ModuleController.updateModule);
router.post('/modules/delete', isAdmin, ModuleController.deleteModule);

// Grades routes
router.post('/grades/update', isAdmin, GradeController.updateGrade);
router.post('/grades/delete', isAdmin, GradeController.deleteGrade);
router.get('/grades/upload', isAdmin, GradeController.uploadGradesPage);
router.post('/grades/upload', isAdmin, upload.single('csvFile'), GradeController.uploadGrades);

// Send notification route
router.post('/notifications/send', isAdmin, dashboardController.sendNotification);

// View messages sent by students (to advisor/admin)
router.get('/messages/from-students', isAdmin, async (req, res) => {
    try {
        const messages = await messageService.getAdvisorMessages(); // Fetch messages sent by students to the advisor/admin
        res.render('admin/messages-from-students', { messages });
    } catch (err) {
        console.error('Error fetching messages from students:', err);
        res.status(500).send('Error fetching messages from students');
    }
});

// Message management routes (now separate pages)
router.get('/manageMessages/inbox', isAdmin, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const notifications = await messageService.getNotifications({ // Fetch notifications for the admin inbox
        userId: req.session.userId,
        role: 'ADMIN'
    });
    const totalMessages = notifications.filter(m => m.Sender.role === 'STUDENT').length; // Count messages sent by students
    const totalPages = Math.ceil(totalMessages / 10) || 1;
    res.render('admin/manageMessages/inbox', {
        notifications,
        csrfToken: req.csrfToken(),
        totalPages,
        currentPage: page
    });
});

// Sent messages page
router.get('/manageMessages/sent', isAdmin, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const notifications = await messageService.getNotifications({
        userId: req.session.userId,
        role: 'ADMIN'
    });
    const totalMessages = notifications.filter(m => m.Sender.role === 'ADMIN').length;
    const totalPages = Math.ceil(totalMessages / 10) || 1;
    res.render('admin/manageMessages/sent', {
        notifications,
        csrfToken: req.csrfToken(),
        totalPages,
        currentPage: page
    });
});

// compose message page
router.get('/manageMessages/compose', isAdmin, async (req, res) => {
    res.render('admin/manageMessages/compose', {
        csrfToken: req.csrfToken()
    });
});

// redirect /manageMessages to /manageMessages/inbox
router.get('/manageMessages', (req, res) => res.redirect('/admin/manageMessages/inbox'));

module.exports = router;
