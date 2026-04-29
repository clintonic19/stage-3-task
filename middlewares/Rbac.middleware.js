// middleware/rbac.middleware.js
exports.authorize = (roles = []) => {
  try {
    return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" });    
  }
}