const express = require('express');
const router = express.Router();
const StudentController = require('../../controllers/AdminController/students');
const ModuleController = require('../../controllers/AdminController/modules');
const GradeController = require('../../controllers/AdminController/grades');

const { isAdmin } = require('../../middlewares/authMiddleware'); // Import the isAdmin middleware
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' }); // Configure multer for file uploads

// Define admin routes here
router.get('/dashboard', isAdmin, (req, res) => {
    res.render('admin/dashboard');
});

router.get('/manageStudents', isAdmin, StudentController.manageStudents);
router.get('/manageModules', isAdmin, ModuleController.manageModules);
router.get('/manageGrades', isAdmin, GradeController.manageGrades);

router.get('/manageStudents/addStudent', isAdmin, (req, res) => {
    res.render('admin/manageStudents/addStudent');
});

router.get('/manageStudents/updateStudent', isAdmin, StudentController.renderUpdateStudent);

router.get('/manageStudents/deleteStudent', isAdmin, (req, res) => {
    res.render('admin/manageStudents/deleteStudent');
});

router.post('/students/add', isAdmin, StudentController.addStudent);
router.post('/students/update', isAdmin, StudentController.updateStudent);
router.post('/students/delete', isAdmin, StudentController.deleteStudent);

router.get('/manageModules/addModule', isAdmin, (req, res) => {
    res.render('admin/manageModules/addModule');
});

router.get('/manageModules/updateModule', isAdmin, ModuleController.renderUpdateModule);

router.get('/manageModules/deleteModule', isAdmin, (req, res) => {
    res.render('admin/manageModules/deleteModule');
});

router.post('/modules/add', isAdmin, ModuleController.addModule);
router.post('/modules/update', isAdmin, ModuleController.updateModule);
router.post('/modules/delete', isAdmin, ModuleController.deleteModule);

router.post('/grades/update', isAdmin, GradeController.updateGrade);
router.post('/grades/upload', isAdmin, upload.single('csvFile'), GradeController.uploadGrades);
router.post('/grades/delete', isAdmin, GradeController.deleteGrade);
router.get('/grades/upload', isAdmin, GradeController.uploadGradesPage);

module.exports = router;
