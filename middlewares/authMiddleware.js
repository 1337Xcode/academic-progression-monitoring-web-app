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
        res.status(403).send('Access denied!');
        // # Note : Redirect to a better 403 error page
    }
}

function isStudent(req, res, next) {
    if (req.session.role === 'STUDENT') { // Only allow student role
        return next();
    } else {
        res.status(403).send('Need to Login as a student first!');
        // # Note : Redirect to a better 403 error page
    }
}

module.exports = { isAuthenticated, isAdmin, isStudent };
