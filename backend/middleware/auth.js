const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No hay token, autorización denegada.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = decoded; 

    next();
  } catch (err) {
    res.status(401).json({ message: 'El token no es válido.' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.rol === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acceso denegado. Se requiere rol de administrador.' });
  }
};

const authorize = (allowedRoles) => {
  return (req, res, next) => {
    // Admin and Gerente have all permissions
    if (req.user && (req.user.rol === 'admin' || req.user.rol === 'gerente')) {
      return next();
    }
    if (req.user && allowedRoles.some(role => role === req.user.rol)) {
      return next();
    }
    res.status(403).json({ message: 'Acceso denegado. No tiene los permisos necesarios.' });
  };
};

module.exports = { authMiddleware, adminOnly, authorize };
