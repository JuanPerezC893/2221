const express = require('express');
const router = express.Router();
const asyncHandler = require('../utils/asyncHandler');
const { authMiddleware } = require('../middleware/auth');
const { getSuggestions, retrieveAddress } = require('../services/geocoding');
const { v4: uuidv4 } = require('uuid');

// Todas las rutas en este archivo requieren autenticación
router.use(authMiddleware);

/**
 * @swagger
 * /api/geocoding/suggest:
 *   get:
 *     summary: Obtiene sugerencias de autocompletado para direcciones.
 *     description: Utiliza el servicio de Mapbox para obtener sugerencias de direcciones basadas en una consulta de texto. Se recomienda enviar un token de sesión para agrupar las solicitudes.
 *     tags: [Geocoding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: El texto de búsqueda para autocompletar.
 *       - in: query
 *         name: session_token
 *         schema:
 *           type: string
 *         description: Un token de sesión único (UUID) para agrupar la búsqueda y optimizar costos. Si no se provee, se genera uno nuevo.
 *     responses:
 *       200:
 *         description: Una lista de sugerencias de Mapbox.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: La consulta 'q' es requerida.
 *       500:
 *         description: Error del servidor.
 */
router.get('/suggest', asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ message: 'El parámetro de consulta \'q\' es requerido.' });
  }

  // El token de sesión es recomendado por Mapbox para la facturación por sesión.
  // El cliente debería generar un UUID y mantenerlo durante la sesión de autocompletado.
  const sessionToken = req.query.session_token || uuidv4();

  const suggestions = await getSuggestions(q, sessionToken);
  
  res.json({ suggestions, session_token: sessionToken });
}));

/**
 * @swagger
 * /api/geocoding/retrieve:
 *   post:
 *     summary: Obtiene los detalles completos de una dirección a partir de una sugerencia.
 *     description: A partir de un `mapbox_id` obtenido de una sugerencia, este endpoint devuelve el objeto completo de la dirección, incluidas las coordenadas.
 *     tags: [Geocoding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mapbox_id:
 *                 type: string
 *                 description: El ID de la sugerencia devuelto por el endpoint /suggest.
 *               session_token:
 *                 type: string
 *                 description: El mismo token de sesión que se usó para la solicitud /suggest.
 *             required:
 *               - mapbox_id
 *               - session_token
 *     responses:
 *       200:
 *         description: El objeto de la dirección completa con coordenadas.
 *       400:
 *         description: Faltan `mapbox_id` o `session_token`.
 *       404:
 *         description: No se encontraron detalles para el ID proporcionado.
 */
router.post('/retrieve', asyncHandler(async (req, res) => {
  const { mapbox_id, session_token } = req.body;

  if (!mapbox_id || !session_token) {
    return res.status(400).json({ message: 'Los campos `mapbox_id` y `session_token` son requeridos.' });
  }

  const addressDetails = await retrieveAddress(mapbox_id, session_token);

  if (!addressDetails) {
    return res.status(404).json({ message: 'No se encontraron detalles para la dirección seleccionada.' });
  }

  res.json(addressDetails);
}));

module.exports = router;
