// middleware/version.middleware.js
exports.requireVersion = (requiredVersion) => {
    try {
        return (req, res, next) => {
        
        const apiVersion = req.headers['x-api-version'];
        
        if (!apiVersion) {
            return res.status(400).json({
                status: false,
                message: 'API version header required'
            });
        }
        
        if (apiVersion !== requiredVersion) {
            return res.status(400).json({
                status: false,
                message: `API version ${requiredVersion} required`
            });
        }
        
        next();
    };

    } catch (error) {
       return res.status(400).json({
            status: false,
            message: "An error occurred while validating API version",
            error: error.message
        })
        
    }
};