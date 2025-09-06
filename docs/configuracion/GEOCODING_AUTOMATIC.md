# Geocodificación Automática con Nominatim

Este documento explica la nueva funcionalidad de geocodificación automática implementada en el sistema.

## ¿Qué hace la geocodificación automática?

- ✅ **Conversión automática**: Convierte direcciones de texto en coordenadas geográficas
- ✅ **Usando Nominatim**: Utiliza la API gratuita de OpenStreetMap (Nominatim)
- ✅ **Múltiples intentos**: Implementa fallbacks para mejorar la precisión
- ✅ **Manejo de errores**: Graceful degradation cuando falla la geocodificación

## Cómo funciona

### 1. **Al crear un proyecto**
- El usuario solo ingresa la **ubicación como texto** (ej: "Av. Providencia 123, Santiago")
- El backend automáticamente obtiene las coordenadas usando Nominatim
- Se guardan tanto la dirección como las coordenadas en la base de datos

### 2. **Al editar un proyecto**
- Si la ubicación cambió, se recalculan las coordenadas automáticamente
- Si no cambió, se mantienen las coordenadas existentes
- Optimizado para no hacer peticiones innecesarias

### 3. **En el mapa**
- Los proyectos aparecen en sus ubicaciones reales
- Información clara sobre el estado de la geocodificación en los popups

## Estrategia de fallbacks

La geocodificación intenta varios métodos para obtener las mejores coordenadas:

### Intento 1: Dirección original
```
"Av. Providencia 123, Las Condes"
```

### Intento 2: Añadir país
```
"Av. Providencia 123, Las Condes, Chile"
```

### Intento 3: Solo primera parte
```
"Av. Providencia 123, Chile"
```

### Intento 4: Búsqueda global
```
"Av. Providencia 123, Las Condes" (sin restricción de país)
```

### Fallback final
Si todos fallan, se usan coordenadas por defecto (Santiago, Chile).

## Ejemplos de direcciones que funcionan bien

### ✅ **Direcciones específicas**
- `Av. Providencia 123, Santiago`
- `Av. Las Condes 456, Las Condes`
- `Calle Moneda 789, Santiago Centro`

### ✅ **Solo comuna/ciudad**
- `Las Condes, Santiago`
- `Valparaíso`
- `Concepción`

### ✅ **Con región**
- `Temuco, Araucanía`
- `La Serena, Coquimbo`
- `Antofagasta, Chile`

## Información de respuesta

Cuando se crea o actualiza un proyecto, la respuesta incluye información sobre la geocodificación:

```json
{
  "id_proyecto": 1,
  "nombre": "Proyecto Ejemplo",
  "ubicacion": "Av. Providencia 123, Santiago",
  "latitud": -33.4489,
  "longitud": -70.6693,
  "geocoding_info": {
    "status": "success",
    "display_name": "123, Avenida Providencia, Providencia, Santiago, Chile",
    "confidence": 0.8,
    "updated": true
  }
}
```

### Estados posibles:

- **`success`**: Geocodificación exitosa
- **`fallback`**: No se encontraron coordenadas, usando por defecto
- **`error`**: Error durante la geocodificación
- **`unchanged`**: Ubicación no modificada (solo en actualizaciones)

## Respeto a las políticas de Nominatim

- ✅ **User-Agent apropiado**: Identificamos nuestras peticiones
- ✅ **Rate limiting**: Respetamos los límites de uso
- ✅ **Timeout**: 10 segundos máximo por petición
- ✅ **Fallbacks**: No saturamos el servicio con reintentos

## Logs del sistema

El backend genera logs detallados para debuggear:

```
🌍 Geocoding: Buscando coordenadas para "Av. Providencia 123, Santiago"
✅ Geocodificación exitosa: -33.4489, -70.6693
   Dirección normalizada: 123, Avenida Providencia, Providencia, Santiago, Chile
```

## Migración desde sistema anterior

Si ya tenías proyectos con coordenadas manuales:

1. Los proyectos existentes **mantienen sus coordenadas actuales**
2. Solo se recalculan si cambias la ubicación
3. No se pierden datos existentes

## Ventajas del nuevo sistema

- 🚀 **Más fácil para el usuario**: Solo escribir la dirección
- 🎯 **Más preciso**: Nominatim es muy preciso para direcciones chilenas
- 🔄 **Automático**: Sin necesidad de buscar coordenadas manualmente
- 🌍 **Estándar**: Usa datos de OpenStreetMap, reconocido mundialmente
