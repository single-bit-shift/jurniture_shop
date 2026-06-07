const admin = (req, res, next) => {
    if (req.user && req.user.isAdmin === true) {
        next();
    } else {
        res.status(403).json({ success: false, error: 'Not authorized as an admin' });
    }
};

module.exports = { admin };
