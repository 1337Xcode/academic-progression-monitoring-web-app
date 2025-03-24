const { forbidden } = require('./errorMiddleware');

// Check if the user role is set to ADMIN
function isAdmin(req, res, next) {
    if (req.session.userId && req.session.role === 'ADMIN') { // Only allow admin role
        return next();
    } else {
        return forbidden(req, res, next, 'Access denied. Administrator privileges required.');
    }
}

// Check if the user role is set to STUDENT
function isStudent(req, res, next) {
    if (req.session.userId && req.session.role === 'STUDENT') { // Only allow student role
        return next();
    } else {
        return forbidden(req, res, next, 'Access denied. Student privileges required.');
    }
}

module.exports = { isAdmin, isStudent }; // Export the middleware functions
