# Registro de fuerza Grupo 14

Prototipo de la Entrega 2 de IIC3182. Permite registrar sesiones, revisar referencias antiguas y corregir cargas con actualización de su evolución. Preparado con asistencia de IA, declarada en el informe del proyecto.

## Publicar en Render desde GitHub

1. Crea un repositorio en GitHub llamado registro-fuerza-g14. Público permite que profesora y ayudante vean el código sin cuenta.
2. Sube el contenido de esta carpeta al repositorio. package.json, render.yaml y README.md deben quedar en la raíz; dist, tests y scripts deben conservar sus carpetas.
3. En Render, inicia sesión y elige New > Static Site.
4. Conecta el repositorio GitHub.
5. Usa estos valores:

| Campo | Valor |
| --- | --- |
| Name | registro-fuerza-g14, o el nombre disponible que prefieras |
| Branch | main |
| Root Directory | Dejar vacío |
| Build Command | npm run build |
| Publish Directory | dist |

6. Crea el sitio. Cuando el despliegue termine, abre la URL real que muestre Render. El nombre exacto puede variar según disponibilidad.
7. Prueba registrar, corregir y consultar la evolución. Reemplaza en el informe la URL del sitio por la de Render y la del repositorio por la URL real de GitHub.

También se incluye render.yaml para crear el servicio desde New > Blueprint. El flujo manual anterior permite revisar todos los campos.

## Desarrollo

Se requiere Node 20 o superior para las comprobaciones. No hay dependencias externas.

```bash
npm test
npm run build
python3 -m http.server 8000 --directory dist
```

El visor /codigo/ se genera al construir. Las rutas del sitio son relativas y la navegación usa fragmentos de URL, por lo que no requiere una regla de reescritura general.

## Datos

Los registros se guardan en localStorage, dentro de este navegador y este dominio. Las sesiones iniciales son ejemplos. Al abrir desde un dominio nuevo se inicia un almacenamiento independiente: los registros del dominio anterior no se trasladan automáticamente.

## Dominio propio

Si ya tienes un dominio, puedes asociarlo desde Settings > Custom Domains del sitio en Render y seguir las instrucciones DNS. La URL asignada por Render funciona sin comprar un dominio.

## Referencias

- https://render.com/docs/static-sites
- https://render.com/docs/blueprint-spec
