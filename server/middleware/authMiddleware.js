const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // --- Read the Authorization header ---
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Access denied. No token provided.',
    });
  }

  // --- Extract the token (strip "Bearer " prefix) ---
  const token = authHeader.split(' ')[1];

  try {
    // --- Verify the token ---
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // --- Attach user info to the request object ---
    req.user = { id: decoded.id, email: decoded.email };

    next();
  } catch (err) {
    return res.status(401).json({
      error: 'Invalid or expired token',
    });
  }
};

module.exports = authMiddleware;
