const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validarRut = (rut) => {
  const valor = rut.replace(/[\.\-]/g, '');
  const cuerpo = valor.slice(0, -1);
  let dv = valor.slice(-1).toUpperCase();

  if (cuerpo.length < 7) {
      return false;
  }

  let suma = 0;
  let multiplo = 2;

  for (let i = 1; i <= cuerpo.length; i++) {
      let index = multiplo * valor.charAt(cuerpo.length - i);
      suma = suma + index;
      if (multiplo < 7) {
          multiplo = multiplo + 1;
      } else {
          multiplo = 2;
      }
  }

  const dvEsperado = 11 - (suma % 11);
  dv = (dv == 'K') ? 10 : dv;
  dv = (dv == 0) ? 11 : dv;

  return dvEsperado == dv;
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
    body('empresa_rut')
      .notEmpty().withMessage('El RUT de la empresa es requerido')
      .custom(value => {
        if (!validarRut(value)) {
          throw new Error('El RUT de la empresa no es válido');
        }
        return true;
      }),
    body('tipo_empresa')
      .if(body('razon_social').exists()) // Solo validar si se está creando una empresa
      .notEmpty().withMessage('El tipo de empresa es requerido al crear una nueva empresa')
      .isIn(['constructora', 'gestora'])
      .withMessage('El tipo de empresa debe ser "constructora" o "gestora"'),
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
    body('fecha_fin').notEmpty().withMessage('La fecha de fin es obligatoria').isISO8601().toDate().withMessage('La fecha de fin debe ser una fecha válida'),
    // empresa_rut se obtiene del token de autenticación, no del formulario
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

const createUserValidationRules = () => {
  return [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Debe ser un email válido'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('rol').isIn(['gerente', 'subgerente', 'operador']).withMessage('Rol no válido'),
    body('rut_personal').custom(value => {
      if (!validarRut(value)) {
        throw new Error('El RUT personal no es válido');
      }
      return true;
    })
  ];
};

module.exports = {
  validateRequest,
  registerValidationRules,
  loginValidationRules,
  projectValidationRules,
  wasteValidationRules,
  createUserValidationRules,
  validarRut, // Exporting for reuse
};