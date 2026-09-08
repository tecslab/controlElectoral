# Documentación de Usuario – Sistema de Control Electoral

Esta documentación proporciona una guía detallada para el usuario final sobre el uso del módulo de **Importación Masiva vía Archivos CSV**. A través de esta funcionalidad, los operadores pueden registrar de forma rápida y eficiente parroquias, recintos electorales y colaboradores en el sistema.

---

## 📋 Tabla de Contenidos
1. [Consideraciones Generales de la Importación CSV](#-consideraciones-generales-de-la-importación-csv)
2. [Orden Recomendado para la Carga de Datos](#-orden-recomendado-para-la-carga-de-datos)
3. [Importación de Parroquias](#1-importación-de-parroquias)
4. [Importación de Recintos Electorales](#2-importación-de-recintos-electorales)
5. [Importación de Colaboradores](#3-importación-de-colaboradores)
6. [Gestión y Corrección de Registros Rechazados](#-gestión-y-corrección-de-registros-rechazados)

---

## ⚙️ Consideraciones Generales de la Importación CSV

* **Formato de Archivo:** Los archivos deben guardarse en formato **CSV (Valores Separados por Comas)** codificado en **UTF-8**.
* **Fila de Encabezados:** La primera fila puede incluir los nombres de las columnas. El sistema detecta automáticamente los encabezados estándar y omite la primera fila si corresponde.
* **Separadores y Limpieza:** El sistema remueve automáticamente los espacios al inicio y al final de cada celda (`trim`).
* **Manejo de Errores Parciales:** Si una o más filas dentro del CSV contienen errores de validación, **las filas válidas se importan correctamente** y las filas con falla son aisladas para su revisión y corrección.

---

## 🔄 Orden Recomendado para la Carga de Datos

Debido a las dependencias de datos en la base de datos (relaciones jerárquicas), se recomienda seguir este orden estricto durante la carga inicial:

```
┌─────────────────────────┐
│   1. Parroquias         │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   2. Recintos           │ (Requiere el ID de Parroquia)
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   3. Colaboradores      │ (Requiere los IDs de Recintos de votación / asignados)
└─────────────────────────┘
```

---

## 1. Importación de Parroquias

### 📍 Ubicación en el Sistema
Vaya a la barra lateral de navegación: **Ingresar información** ➔ **Parroquias** (o acceda a la ruta `/parroquias/nueva`). Haga clic en el botón **`Importar de CSV`**.

### 📄 Estructura de Columnas del CSV

| Columna | Nombre de Campo | Requerido | Valores Permitidos / Reglas |
| :--- | :--- | :---: | :--- |
| **Columna 1** | `Nombre` | **Sí** | Nombre de la parroquia (ej. *Tarqui*, *Ximena*, *Febres Cordero*). No puede estar vacío. |
| **Columna 2** | `Tipo` | No | `Urbana` o `Rural`. (Si se omite o está vacío, se asignará `Urbana` por defecto). Sensible a mayúsculas/minúsculas normalizadas (*urbano*, *urbana*, *rural*). |

### 📝 Ejemplo del Archivo CSV (`parroquias.csv`)
```csv
Nombre,Tipo
Tarqui,Urbana
Ximena,Urbana
Puná,Rural
Chongón,Rural
```

### ⚠️ Validaciones y Errores Posibles
* **`Falta Nombre`**: La primera celda de la fila está vacía.
* **`Tipo inválido (debe ser Urbana o Rural)`**: El valor ingresado no corresponde ni a Urbana ni a Rural.

---

## 2. Importación de Recintos Electorales

### 📍 Ubicación en el Sistema
Vaya a la barra lateral de navegación: **Ingresar información** ➔ **Recintos** (o acceda a la ruta `/recintos/nuevo`). Haga clic en el botón **`Importar de CSV`**.

### 📄 Estructura de Columnas del CSV

| Columna | Nombre de Campo | Requerido | Valores Permitidos / Reglas |
| :--- | :--- | :---: | :--- |
| **Columna 1** | `Nombre` | **Sí** | Nombre del recinto electoral (ej. *Unidad Educativa Eloy Alfaro*). |
| **Columna 2** | `Parroquia` | **Sí** | **ID único** de la Parroquia existente en la base de datos (UUID registrado previamente). |
| **Columna 3** | `Juntas Masculinas` | **Sí** | Número entero entre `0` y `70`. |
| **Columna 4** | `Juntas Femeninas` | **Sí** | Número entero entre `0` y `70`. |

> 💡 **Nota importante sobre Juntas:** El recinto debe contar con al menos 1 junta en total (la suma de juntas masculinas + femeninas debe ser mayor a 0). Al crearse el recinto, el sistema creará automáticamente la secuencia de juntas asociadas.

### 📝 Ejemplo del Archivo CSV (`recintos.csv`)
```csv
Nombre,Parroquia,Juntas Masculinas,Juntas Femeninas
Escuela Fiscal Eloy Alfaro,c8a1b2c3-4567-89ab-cdef-0123456789ab,10,12
Colegio Vicente Rocafuerte,c8a1b2c3-4567-89ab-cdef-0123456789ab,15,15
Unidad Educativa Chongón,f9b2c3d4-5678-90ab-cdef-123456789abc,5,5
```

### ⚠️ Validaciones y Errores Posibles
* **`Falta Nombre`**: El nombre del recinto está vacío.
* **`ID Parroquia no presente o inválido`**: El ID de parroquia especificado no existe o está desactivado en la base de datos.
* **`Juntas Masculinas inválidas (debe ser número 0-70)`**: Valor no numérico, negativo o superior a 70.
* **`Juntas Femeninas inválidas (debe ser número 0-70)`**: Valor no numérico, negativo o superior a 70.
* **`Debe haber al menos una junta (M o F)`**: Se ingresaron 0 juntas masculinas y 0 juntas femeninas.

---

## 3. Importación de Colaboradores

### 📍 Ubicación en el Sistema
Vaya a la barra lateral de navegación: **Ingresar información** ➔ **Colaboradores** (o acceda a la ruta `/colaboradores/nuevo`). Haga clic en el botón **`Importar de CSV`**.

### 📄 Estructura de Columnas del CSV

| Columna | Nombre de Campo | Requerido | Valores Permitidos / Reglas |
| :--- | :--- | :---: | :--- |
| **Columna 1** | `Apellidos` | No | Apellidos del colaborador. |
| **Columna 2** | `Nombres` | **Sí** | Nombres del colaborador. No puede estar vacío. |
| **Columna 3** | `Whatsapp` | **Sí** | Número telefónico de 10 dígitos numéricos (ej. `0991234567`). Se filtran caracteres no numéricos. |
| **Columna 4** | `ya_contactado` | No | `Sí` o `No` (Por defecto: `No`). |
| **Columna 5** | `rol` | No | `MJRV` o `Coordinador` (Por defecto: `MJRV`). |
| **Columna 6** | `id_recinto_votacion` | No | ID del Recinto donde vota el colaborador. Debe ser un ID de recinto válido existente. |
| **Columna 7** | `id_recinto_asignado` | No | ID del Recinto asignado para trabajar. Debe ser un ID de recinto válido existente. |
| **Columna 8** | `asiste_capacitacion`| No | `Sí` o `No` (Por defecto: `No`). |
| **Columna 9** | `desde` | No | Número entero correspondiente a la junta inicial del rango asignado (solo aplica para rol `MJRV`). |
| **Columna 10** | `hasta` | No | Número entero correspondiente a la junta final del rango asignado (solo aplica para rol `MJRV`). |

### 📝 Ejemplo del Archivo CSV (`colaboradores.csv`)
```csv
Apellidos,Nombres,Whatsapp,ya_contactado,rol,id_recinto_votacion,id_recinto_asignado,asiste_capacitacion,desde,hasta
Pérez Gómez,Juan Carlos,0991234567,Sí,MJRV,a1b2c3d4-e5f6-7890-abcd-ef1234567890,a1b2c3d4-e5f6-7890-abcd-ef1234567890,No,1,5
Rodríguez,Ana María,0987654321,No,Coordinador,a1b2c3d4-e5f6-7890-abcd-ef1234567890,a1b2c3d4-e5f6-7890-abcd-ef1234567890,Sí,,
Mendoza,Carlos,0951122334,No,MJRV,,,No,,
```

### ⚠️ Validaciones y Errores Posibles
* **`Falta Nombres`**: La celda de nombres está vacía.
* **`WhatsApp es obligatorio y debe tener exactamente 10 dígitos numéricos`**: El número ingresado no tiene 10 dígitos tras limpiar caracteres especiales.
* **`Rango de juntas (X-Y) inválido o fuera de límite (máx N) para el recinto`**: Se especificó un rango `desde`/`hasta` inconsistente (ej. `desde` > `hasta`, `desde` < 1 o `hasta` mayor al total de juntas del recinto asignado).

---

## 🛠️ Gestión y Corrección de Registros Rechazados

Cuando se procesa la importación de un archivo CSV, la plataforma realiza un informe en pantalla inmediatamente después de procesar los datos:

1. **Resumen de Importación**: Muestra la cantidad total de registros agregados exitosamente a la base de datos.
2. **Errores de Importación**: Si existieron filas con errores, se mostrará una tarjeta informativa con el número de filas rechazadas.
3. **Descarga de Rechazados**: Se habilita el botón **`Descargar rechazados`**. Al presionarlo, el sistema descargará automáticamente un archivo CSV que contiene **todas las columnas originales de la fila fallida más una última columna llamada `Error`**, donde se detalla el motivo exacto del rechazo.

### 🔄 Flujo de Corrección
```
 1. Cargar CSV original
       │
       ├──► Registros válidos ──► Insertados en el Sistema
       │
       └──► Registros con error ──► Click en "Descargar rechazados"
                                         │
                                         ▼
                                   Abrir CSV descargado
                                         │
                                         ▼
                                  Corregir datos según la columna "Error"
                                         │
                                         ▼
                                  Eliminar la columna "Error" y Guardar
                                         │
                                         ▼
                                  Volver a importar el CSV corregido
```

Con este proceso, el usuario no pierde tiempo volviendo a procesar todo el lote, sino únicamente aquellas filas que requerían ajustes de información.
