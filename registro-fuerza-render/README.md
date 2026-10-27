# Registro de fuerza

Prototipo funcional para registrar y consultar entrenamientos de fuerza, desarrollado para la **Entrega 2 de IIC3182 Interfaces Humano-Computador**, Pontificia Universidad Católica de Chile, semestre 2026-2.

**Grupo 14:** Juan Porres, Camilo Rivera, Thomas Jorquera y Martín Orellana.

## Propósito

El proyecto aborda dificultades identificadas en las entrevistas de la Entrega 1: ambigüedad al registrar pesos, esfuerzo para recuperar información de sesiones anteriores y falta de contexto al consultar registros antiguos.

La interfaz busca que la persona comprenda qué carga está anotando, disponga de una referencia fechada y pueda corregir errores sin reconstruir toda la sesión. Las mejoras de usabilidad propuestas se deben contrastar en la evaluación de la Entrega 3.

## Tareas principales

| Tarea                                     | Resultado esperado                                                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Registrar una sesión de fuerza           | Conservar cargas, repeticiones y notas en el historial, con la convención de peso correspondiente a cada ejercicio. |
| Retomar el registro después de una pausa | Revisar las referencias anteriores y guardar una nueva sesión con cargas elegidas por la persona.                   |
| Corregir un registro equivocado           | Editar una serie guardada y comprobar su actualización en el historial y la evolución personal.                    |

## Funcionalidades

- **Registro por series:** ingreso de cargas y repeticiones, confirmación de cada serie y finalización de la sesión.
- **Convenciones explícitas:** peso por mancuerna, peso total con barra y peso indicado en la máquina.
- **Referencias fechadas:** consulta del último registro de cada ejercicio junto a los campos de entrada.
- **Revisión de referencias antiguas:** aviso cuando transcurren siete días o más desde la última sesión registrada. No modifica automáticamente las cargas.
- **Borrador persistente:** conserva el avance en el mismo navegador antes de finalizar la sesión.
- **Contexto de la sesión:** notas y etiqueta personal opcionales, con posibilidad de añadir o quitar series.
- **Historial editable:** corrección de cargas y repeticiones, con una opción temporal para deshacer el último cambio.
- **Evolución personal:** gráfica y tabla de la mayor carga registrada por sesión para el ejercicio seleccionado.
- **Datos de ejemplo:** tres sesiones iniciales y una acción para restablecerlas.
- **Visor de código:** página `/codigo/` generada durante la construcción.

## Decisiones de interacción

La propuesta incorpora seis decisiones justificadas en el informe de la E2:

1. Mostrar la convención de carga junto al campo para aclarar qué número se espera.
2. Presentar el último registro con su fecha para reducir la dependencia de la memoria.
3. Hacer visible la antigüedad de las referencias y mantener la decisión de carga bajo control del usuario.
4. Diferenciar los valores precargados de las series confirmadas mediante estados visibles.
5. Permitir correcciones y reflejarlas en las vistas derivadas.
6. Explicar la comparación personal sin presentar rankings ni percentiles normativos.

## Tecnologías

| Componente               | Implementación                                 |
| ------------------------ | ----------------------------------------------- |
| Estructura               | HTML                                            |
| Presentación            | CSS con diseño adaptable                       |
| Interacción y cálculos | JavaScript con módulos ES                      |
| Persistencia             | `localStorage` del navegador                  |
| Comprobaciones           | Herramientas nativas de Node.js y `node:test` |
| Publicación             | Sitio estático compatible con Render           |

El proyecto no utiliza dependencias externas de JavaScript ni requiere un servidor de datos.

## Organización del código

Los siguientes archivos se encuentran dentro de `registro-fuerza-render/` en este repositorio:

| Ruta                           | Función                                                             |
| ------------------------------ | -------------------------------------------------------------------- |
| `dist/index.html`            | Estructura principal y navegación.                                  |
| `dist/style.css`             | Estilos y adaptación a distintos tamaños de pantalla.              |
| `dist/app.js`                | Interacciones, navegación y persistencia.                           |
| `dist/model.js`              | Catálogo de ejercicios, validación y cálculos sobre las sesiones. |
| `tests/model.test.js`        | Pruebas de corrección de datos, antigüedad y validación.          |
| `scripts/prepare-source.mjs` | Generación del visor de archivos en `dist/codigo/`.               |
| `package.json`               | Comandos de construcción y comprobación.                           |
| `render.yaml`                | Configuración básica de publicación estática.                    |

## Ejecución local

Se requiere **Node.js 20 o superior** para construir y comprobar el proyecto. Para el servidor estático de este ejemplo se utiliza Python 3.

Desde la raíz del repositorio:

```bash
cd registro-fuerza-render
npm run build
python3 -m http.server 8000 --directory dist
```

Abrir `http://localhost:8000` en el navegador. Si ya se está dentro de la carpeta `registro-fuerza-render`, se omite el primer comando.

La aplicación utiliza módulos JavaScript, por lo que debe abrirse mediante un servidor HTTP y no directamente como archivo local.

## Comprobaciones

Desde `registro-fuerza-render/`:

```bash
npm run check
npm test
```

Las pruebas comprueban que una corrección actualice la evolución y la referencia sin modificar otras sesiones, que se calcule el tiempo desde un registro y que se rechacen cargas o repeticiones inválidas. Estas comprobaciones técnicas no sustituyen una evaluación con usuarios.

## Publicación

Para la estructura actual del repositorio, configurar un **Static Site** en Render con:

| Campo             | Valor                      |
| ----------------- | -------------------------- |
| Branch            | `main`                   |
| Root Directory    | `registro-fuerza-render` |
| Build Command     | `npm run build`          |
| Publish Directory | `dist`                   |

El archivo `README.md` debe estar junto a `package.json`, dentro de `registro-fuerza-render/`: el script de construcción lo lee para incluirlo en el visor de código. La navegación principal utiliza fragmentos de URL y no requiere una reescritura general de rutas.

## Datos y alcance de la versión

Los datos se almacenan en el navegador y dominio desde el que se usa la aplicación. No se sincronizan entre dispositivos ni se trasladan automáticamente al cambiar de dominio. Limpiar el almacenamiento del navegador elimina los registros.

En el primer acceso se cargan sesiones ficticias fechadas a 28, 21 y 14 días antes. Estos datos permiten recorrer las tareas del prototipo y se identifican como ejemplos en la interfaz.

La versión incluye tres ejercicios: curl de bíceps con mancuernas, press de banca con barra y remo sentado en máquina. No implementa un planificador completo, gestión de alumnos, sincronización con relojes ni temporizador de descanso.

La antigüedad de un registro no demuestra que la persona haya dejado de entrenar. El aviso tras siete días es una decisión de interacción provisional; no estima pérdida de fuerza ni prescribe cargas. La evolución representa datos registrados y no una medición validada de capacidad física.

## Uso de inteligencia artificial

La preparación del prototipo y de la documentación contó con asistencia de ChatGPT diseño, programación, redacción de READ.me y comprobaciones técnicas. Su uso se declara en el anexo de IA del informe de la E2. Las entrevistas de la E1 constituyen la base empírica del proyecto; no se generaron nuevos testimonios ni resultados de evaluación con usuarios.
