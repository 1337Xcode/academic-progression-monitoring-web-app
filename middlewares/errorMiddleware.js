// # Note: Make a ejs file in views folder for respective error types
module.exports = (err, req, res, next) => {
    console.error('Error details:', err); // Log the error details
    res.status(500).send('Something broke!');
};

// Shows Page not found! when a 404 error occurs
module.exports.notFound = (req, res, next) => {
    res.status(404).send('Page not found!');
};
