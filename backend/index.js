require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// Configuración CORS para desarrollo y producción
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000', 
  'https://2221-six.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean); // Filtrar valores undefined/null

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend del Gestor de Residuos');
});

const authRouter = require('./routes/auth');
app.use('/api/auth', authRouter);

const proyectosRouter = require('./routes/proyectos');
app.use('/api/proyectos', proyectosRouter);

const residuosRouter = require('./routes/residuos');
app.use('/api/residuos', residuosRouter);

const trazabilidadRouter = require('./routes/trazabilidad');
app.use('/api/trazabilidad', trazabilidadRouter);

const usersRouter = require('./routes/users');
app.use('/api/users', usersRouter);

const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});