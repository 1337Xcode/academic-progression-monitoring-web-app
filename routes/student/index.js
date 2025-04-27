const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });
const { isStudent } = require('../../middlewares/authMiddleware');
const ProfileController = require('../../controllers/StudentController/profile');
const ProgressionController = require('../../controllers/StudentController/progression');
const MessagesController = require('../../controllers/StudentController/messages');
const DashboardController = require('../../controllers/StudentController/dashboard');
const EnrollmentsController = require('../../controllers/StudentController/enrollments');

// Dashboard as main page
router.get('/dashboard', isStudent, DashboardController.dashboard);

// Profile routes
router.get('/profile', isStudent, ProfileController.profile); // Direct link to profile page

// Profile update routes (used by dashboard/profile card)
router.post('/profile/email', isStudent, ProfileController.updateSecondaryEmail);
router.post('/profile/image', isStudent, upload.single('profileImage'), ProfileController.updateProfileImage);
router.post('/profile/phone', isStudent, ProfileController.updatePhone);

// Progression/statistics
router.get('/progression', isStudent, ProgressionController.progression);

// Messages/notifications
router.get('/messages', isStudent, MessagesController.messages);
router.post('/contact-advisor', isStudent, MessagesController.contactAdvisor);

// Enrolled modules list
router.get('/enrollments', isStudent, EnrollmentsController.list);

module.exports = router;