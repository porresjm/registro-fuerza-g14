# Registro de fuerza

Prototipo de registro de entrenamientos de fuerza para IIC3182 Interfaces Humano-Computador, Pontificia Universidad Católica de Chile, semestre 2026-2.

**Grupo 14:** Juan Porres, Camilo Rivera, Thomas Jorquera y Martín Orellana.

La interfaz permite registrar cargas con su convención, recuperar sesiones anteriores y corregirlas conservando el contexto. La versión 2.0.0 corresponde a la iteración de la Entrega 3, a partir del informe de las sesiones del 20 de noviembre.

## Cambios de la E3

- Sesiones nuevas vacías: la persona añade únicamente los ejercicios y series que realizó.
- Un solo botón **Guardar sesión** para incorporar todas las series al historial. El borrador automático se identifica como tal.
- Consulta opcional de referencias anteriores, con explicación visible de su efecto y sin ventana que bloquee el guardado.
- Catálogo ampliado de 7 a 16 ejercicios y creación de ejercicios personalizados, indicando convención de carga y grupos musculares.
- Fecha editable. Las sesiones nuevas usan la fecha local y los borradores antiguos conservan su fecha de forma visible.
- Filtros del historial por tipo de entrenamiento y músculo, con resumen de ejercicios y orden de más reciente a más antiguo.
- Corrección de una sesión completa: fecha, series, ejercicios, notas y etiqueta se guardan conjuntamente, sin duplicar la sesión.
- Cancelación con opción de conservar o descartar el borrador y deshacer un descarte.
- Ayuda breve dentro del registro y botón principal visible desde el mapa muscular.
- Conservación de los datos de la E2. Los borradores antiguos se mantienen y ofrecen retirar las series no confirmadas en una sola acción.

El mapa muscular y la evolución siguen usando las mismas sesiones guardadas. Los ejercicios personalizados también aparecen en ambas vistas.

## Convenciones de carga

| Equipo | Valor que se registra |
| --- | --- |
| Mancuernas | Kilogramos de una mancuerna |
| Barra | Kilogramos totales, incluyendo barra y discos |
| Máquina o polea | Valor indicado en ese equipo |
| Peso corporal o lastre, en ejercicios personalizados | Kilogramos adicionales; 0 cuando no hay lastre |

Cada ejercicio muestra la convención junto a los campos. Las series requieren repeticiones enteras entre 1 y 100 y una carga positiva; los ejercicios de carga adicional admiten 0.

## Ejecución y pruebas

Se requiere Node.js 20 o superior. Dentro de la carpeta registro-fuerza-render:

    npm ci
    npm test
    npm run build
    python3 -m http.server 8000 --directory dist

Abrir http://localhost:8000. La aplicación usa módulos ES y debe servirse mediante HTTP.

Las comprobaciones abarcan 13 casos de lógica y 12 casos de integración del DOM. El ejecutor informa 26 pruebas contando el bloque que agrupa los 12 casos de interacción. Cubren las tres tareas del informe recibido, persistencia, ejercicios propios, migración de datos y cancelación. jsdom es una dependencia de desarrollo; la aplicación publicada no carga librerías externas.

Estas pruebas no sustituyen la evaluación con personas ni una revisión visual en navegadores reales. No se ha medido un nuevo SUS tras las correcciones.

## Archivos

| Archivo | Función |
| --- | --- |
| dist/index.html | Navegación y estructura principal |
| dist/style.css | Presentación y estilos adaptables |
| dist/app.js | Interacciones y persistencia |
| dist/model.js | Catálogo, validaciones, migración y cálculos |
| tests/model.test.js | Pruebas originales del modelo |
| tests/e3.test.js | Regresiones del modelo para la E3 |
| tests/dom.test.js | Recorridos de interacción con DOM simulado |
| scripts/prepare-source.mjs | Generación del visor de código en /codigo/ |

## Publicación en Render

La URL del servicio existente es https://registro-fuerza-g14.onrender.com/.

El repositorio contiene esta aplicación en la carpeta registro-fuerza-render. En el servicio estático de Render:

- **Root Directory:** registro-fuerza-render.
- **Build Command:** npm ci && npm test && npm run build.
- **Publish Directory:** dist.

El render.yaml permite crear un servicio equivalente mediante un Blueprint. Subir archivos al repositorio no garantiza por sí solo que se haya publicado una versión: hay que comprobar el resultado del despliegue y que la cabecera muestre **Prototipo E3 · v2**.

## Datos y límites

Los datos permanecen en localStorage del mismo navegador y dominio. No hay cuentas ni sincronización entre dispositivos. La migración mantiene las sesiones existentes y los borradores de la E2. Cambiar de dominio o eliminar el almacenamiento no traslada ni conserva esos registros.

El primer acceso incluye seis sesiones ficticias identificadas como ejemplos. El mapa combina antigüedad y carga relativa a registros propios; no mide recuperación, fatiga ni capacidad física. En ejercicios personalizados, los músculos elegidos se consideran asociaciones manuales para el mapa.

## Uso de IA

ChatGPT asistió en la revisión del código, las modificaciones, las pruebas y la documentación. Las observaciones de participantes y el SUS de referencia proceden del informe recibido del grupo evaluador. No se generaron nuevas sesiones con personas ni testimonios para atribuirles a los evaluadores.
