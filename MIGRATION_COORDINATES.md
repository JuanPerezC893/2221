# Migración de Coordenadas para Proyectos

Este documento explica cómo aplicar la migración para añadir funcionalidad de coordenadas geográficas a los proyectos existentes.

## ¿Qué hace esta migración?

- Añade campos `latitud` y `longitud` a la tabla `proyectos`
- Permite que los proyectos aparezcan en sus ubicaciones reales en el mapa
- Mantiene compatibilidad con proyectos existentes

## Pasos para la migración

### 1. Actualizar la base de datos

Ejecuta el script SQL en tu base de datos PostgreSQL:

```bash
# Desde el directorio del proyecto
psql -d nombre_tu_base_de_datos -f backend/migrations/add_coordinates_to_proyectos.sql
```

### 2. Migrar proyectos existentes (opcional)

Si tienes proyectos existentes, puedes asignarles coordenadas por defecto:

```bash
# Desde el directorio backend
cd backend
node utils/migrate-existing-projects.js
```

Esto asignará coordenadas de Santiago, Chile (-33.4489, -70.6693) a todos los proyectos que no tengan coordenadas.

### 3. Reiniciar la aplicación

Reinicia tanto el backend como el frontend para que los cambios surtan efecto.

## Funcionalidades añadidas

### En el formulario de proyectos:
- ✅ Campos opcionales de **Latitud** y **Longitud**
- ✅ Validación automática de rangos de coordenadas
- ✅ Ayudas visuales con ejemplos

### En el mapa:
- ✅ Los proyectos con coordenadas aparecen en su ubicación real
- ✅ Los proyectos sin coordenadas aparecen en Santiago por defecto
- ✅ Información clara en los popups sobre el estado de las coordenadas

## Cómo obtener coordenadas

### Manualmente:
- Ve a [Google Maps](https://maps.google.com)
- Busca la ubicación de tu proyecto
- Haz clic derecho y selecciona "¿Qué hay aquí?"
- Copia las coordenadas que aparecen

### Ejemplos de coordenadas chilenas:
- **Santiago**: -33.4489, -70.6693
- **Valparaíso**: -33.0472, -71.6127
- **Concepción**: -36.8270, -73.0498
- **La Serena**: -29.9027, -71.2519
- **Temuco**: -38.7359, -72.5904

## Notas técnicas

- Los campos de coordenadas son **opcionales**
- Rango válido de **latitud**: -90 a 90
- Rango válido de **longitud**: -180 a 180
- Los proyectos sin coordenadas siguen funcionando normalmente
- Se mantiene la compatibilidad completa con versiones anteriores
