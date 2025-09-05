require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
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