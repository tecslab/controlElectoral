# App web para organizar Logística para el Control Electoral.

Objetivo: crear una app web para manejar los diferentes aspectos de la logística necesaria para organizar un evento de control electoral.

Uso: La app será usada por varios operadores simultáneamente accediendo a datos de contacto y censo de los posibles colaboradores. Los operadores tienen por meta organizar a todos los colaboradores para que cubran todas las juntas de cada recinto electoral. Existen colaboradores denominados MJRVs que son quienes recabarán la información de grupos de Juntas y otros denominados Coordinadores encargados de dar soporte a los MJRVs en cada Recinto. Antes del evento electoral se debe confirmar la predisposición de los colaboradores mediante llamadas telefónicas o mensajes al WhatsApp. Los operadores además organizarán eventos de capacitación y se debe tener control de asistencia.

## Especificaciones

Al entrar la aplicación se observará un formulario de login. Por el momento solo se usará una cuenta para todos los operadores.

Luego de entrar se verá una barra lateral a la izquierda y un panel a la derecha que apuntará al Dashboard,

En la barra lateral se mostrará las opciones: 

- Ingresar información con su submenú(Colaboradores, Recintos, Parroquias)
- Colaboradores (ver)
- Parroquias(ver)
- Recintos(ver)
- Dashboard.

## Ingreso de Información

Las opciones de Ingresar Parroquias, Recintos y Colaboradores dirigirán a formularios de ingreso de datos según lo especificado

### Ingresar Parroquias

Formulario 

- Nombre
- Tipo (Switch control: Urbana(Default) / Rural).

Ambos campos obligatorios. Estado es por defecto “Activo”

Botón “Ingresar” creará nuevo registro de parroquia.

### Ingresar Recinto

Formulario:

- Nombre
- Parroquia(Dropdown con las Parroquias Ingresadas)
- Juntas M(masculinas, número entero < 70) y juntas F(femeninas, entero < 70).

Todos los campos obligatorios.

Cuando se de clic en el botón Ingresar, se creará el nuevo registro de Recinto junto con las nuevas Juntas masculinas y femeninas en forma transaccional. Si la creación falla mostrar el mensaje de error en la página dentro de un toast.

### Ingresar Colaboradores

- Apellidos ( obligatorio)
- Nombres (obligatorio)
- Whatsapp (string/obligatorio, validar 10 dígitos)
- Rol(Radio Button: Coordinador, MJRV)
- Recinto Votación y Recinto Asignado(Dropdowns con lista de Recintos ingresados)
- Juntas ( M y F ) asignadas. Se debe manejar un control de selección de rango de números de acuerdo al Recinto seleccionado. Solo se activa si el Rol es MJRV
- Observaciones(opción para ingresar múltiples observaciones)

al dar clic en Ingresar se creará el nuevo Colaborador, las nuevas asignaciones de juntas y los nuevos registros de observaciones si son necesarios. En el campo ya_contado inicializar con “No”, y asiste_capacitacion en “No”

## Visualización de Información

Las opciones Colaboradores, Recintos y Parroquias mostrarán paneles con la principal información de cada entidad

### Colaboradores

La página Colaboradores mostrará una tabla los datos de los colaboradores: Nombre + Apellidos, WhatsApp, ya contactado, rol, recinto(Si no tiene mostrar: No asignado), parroquia(mediante join al recinto), Rango juntas asignadas (Formato: “5M-10M, 5F-10F”). A la derecha de cada fila habrá las opciones ver y editar. Los resultados mostrados se obtendrán mediante paginación en grupos de 100.

Se tendrán filtros de nombres, ya contactado, rol, recinto, parroquia, asiste capacitación.

### Parroquias

Mostrará una lista con la siguiente información de las Parroquias: Nombre, tipo, Número Recintos, Número de juntas(Suma de las juntas de cada recinto), Estado, Junto con las opciones para ver y editar. Mostrará por defecto todas las Parroquias activas

Se Podrá filtrar por Estado(Activa, Desactiva, todos) y Tipo

### Recintos

Mostrará una lista con la siguiente Información de los Recintos: Nombre, Parroquia, Número de juntas y Estado. Se mostrará por defecto todos los Recintos Activos

Se Podrá filtrar por Estado(Activa, Desactiva, todos), Parroquia y Nombre

## Ver y Editar Parroquias

La opción de Ver Parroquias permitirá la visualización de ciertos datos de las Parroquias. 

- Nombre (Editable)
- Tipo (Editable)
- Número Recintos (Conteo de los recintos)
- Número de juntas(Suma de las juntas de cada recinto).

Para poder Editarlos se tendrá que entrar en la opción de Editar.

### Ver y Editar Recintos

La opción de Ver Recintos permitirá la visualización de ciertos datos de los Recintos. 

- Nombre (Editable)
- Parroquia (Editable, mostrar Dropdown)
- Número de juntas Hombres(Editable)
- Número de juntas Mujeres(Editable)

Para poder Editarlos se tendrá que entrar en la opción de Editar.

Si se edita el número de juntas a uno menor se debe colocar las juntas como inactivas

### Ver y Editar Colaboradores

La opción de Ver Colaboradores permitirá la visualización de ciertos datos de los Colaboradores.

- Apellidos(Editable)
- Nombres(Editable)
- WhatsApp(Editable)
- Ya contactado(Editable, Radio buttons: si, no, no responde, volver a contactar)
- Asiste_capacitacion(Si, no)
- Rol (Editable)
- Recinto(Editable, Dropdown con los Recintos y la opción No Asignado)
- Parroquia
- Juntas asignadas (Mostrar 2 controles para seleccionar un rango de números).
- Observaciones (Editable, Se podrán ingresar varias observaciones)

Para poder Editarlos se tendrá que entrar en la opción de Editar.

# Estructura de la Base de datos

## Autenticación y Autorización

Por el momento se contará con un solo usuario que podrá usar todas las opciones del sistema. El sistema de Autenticación y Autorización estará implementado en Supabase.

## Tables

### Colaboradores

- ID
- Apellidos →String
- Nombres →String
- WhatsApp →String
- ya_contactado →String
- rol →String
- id_recinto →String
- Asiste_Capacitacion →String

### Parroquias

- ID
- Nombre →String
- Tipo →String
- Estado

### Recintos

- ID
- Nombre →String
- ID_Parroquia

### Juntas

- ID
- ID_Recinto
- Numero →Numeric
- Sexo → String
- Estado → usado para borrado lógico

Set unique(id_recinto, número, sexo)

### AsignacionJunta

- ID
- ID_colaborador
- id_junta
- Estado → usar para borrado lógico

### ObservacionesColaboradores

ID

Id_Colaborador

### Tecnologías a Usarse

- Next.js
- Tailwind
- Supabase for Authorization
- Supabase as DB
- The IDE already has an MCP connection with Supabase
- In future the app will be deployed on Vercel

For the moment we will not to implement the dashboard.