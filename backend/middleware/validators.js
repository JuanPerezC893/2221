const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const registerValidationRules = () => {
  return [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Debe ser un email válido'),
    body('password')
      .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
      .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una letra mayúscula')
      .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una letra minúscula')
      .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número')
      .matches(/[^A-Za-z0-9]/).withMessage('La contraseña debe contener al menos un carácter especial'),
    body('empresa_rut').notEmpty().withMessage('El RUT de la empresa es requerido'),
  ];
};

const loginValidationRules = () => {
  return [
    body('email').isEmail().withMessage('Debe ser un email válido'),
    body('password').notEmpty().withMessage('La contraseña es requerida'),
  ];
};

const projectValidationRules = () => {
  return [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('ubicacion').notEmpty().withMessage('La ubicación es requerida'),
    body('fecha_inicio').isISO8601().toDate().withMessage('La fecha de inicio debe ser una fecha válida'),
    body('empresa_rut').notEmpty().withMessage('El RUT de la empresa es requerido'),
  ];
};

const wasteValidationRules = () => {
  return [
    body('tipo').notEmpty().withMessage('El tipo de residuo es requerido'),
    body('cantidad').isFloat({ gt: 0 }).withMessage('La cantidad debe ser un número positivo'),
    body('unidad').notEmpty().withMessage('La unidad es requerida'),
    body('reciclable').isBoolean().withMessage('El valor de reciclable debe ser booleano'),
    body('estado').notEmpty().withMessage('El estado es requerido'), // Corrected validation for estado (VARCHAR)
    body('id_proyecto').isInt({ gt: 0 }).withMessage('El ID del proyecto debe ser un número entero positivo'),
  ];
};

module.exports = {
  validateRequest,
  registerValidationRules,
  loginValidationRules,
  projectValidationRules,
  wasteValidationRules,
};