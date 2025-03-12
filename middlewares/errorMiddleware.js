// # Note: Make a ejs file in views folder for respective error types
// Fix the error handling to be more nformative and implement a global error handler.

/**
 * Handle 404 errors
 */
exports.notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

/**
 * Handle 500 errors
 */
exports.internalServerError = (err, req, res, next) => {
    // Log the error
    console.error('Internal server error:', err);

    // Special handling for CSRF errors
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).render('error', {
            title: 'CSRF Error',
            message: 'Invalid CSRF token. Please try again.',
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
    }

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.render('error', {
        title: 'Error',
        message: err.message,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
};
