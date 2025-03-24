const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });

const StudentController = require('../../controllers/AdminController/students');
const ModuleController = require('../../controllers/AdminController/modules');
const GradeController = require('../../controllers/AdminController/grades');
const { isAdmin } = require('../../middlewares/authMiddleware');
const dashboardController = require('../../controllers/AdminController/dashboard');
const messageService = require('../../services/messageService');

// Define admin routes - no CSRF middleware (handled globally in app.js)
router.get('/dashboard', isAdmin, dashboardController.dashboard);

// Main management pages
router.get('/manageStudents', isAdmin, StudentController.manageStudents);
router.get('/manageModules', isAdmin, ModuleController.manageModules);
router.get('/manageGrades', isAdmin, GradeController.manageGrades);

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
        const messages = await messageService.getAdvisorMessages();
        res.render('admin/messages-from-students', { messages });
    } catch (err) {
        console.error('Error fetching messages from students:', err);
        res.status(500).send('Error fetching messages from students');
    }
});

// Message management routes
router.get('/manageMessages', isAdmin, async (req, res) => {
    try {
        const notifications = await messageService.getNotifications({
            userId: req.session.userId,
            role: 'ADMIN'
        });

        res.render('admin/manageMessages/index', {
            notifications,
            csrfToken: req.csrfToken()
        });
    } catch (err) {
        console.error('Error loading messages:', err);
        res.status(500).send('Error loading messages');
    }
});

module.exports = router;
