function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    } else {
        res.redirect('/auth/login'); // Redirect to login page
    }
}

function isAdmin(req, res, next) {
    if (req.session.role === 'ADMIN') { // Only allow admin role
        return next();
    } else {
        res.status(403).send('Access denied');
        // # Note : Redirect to a better 403 error page
    }
}

function isStudent(req, res, next) {
    if (req.session.role === 'ADMIN' || req.session.role === 'STUDENT') { // Allow both admin and student roles
        return next();
    } else {
        res.status(403).send('Access denied');
        // # Note : Redirect to a better 403 error page
    }
}

module.exports = { isAuthenticated, isAdmin, isStudent };
