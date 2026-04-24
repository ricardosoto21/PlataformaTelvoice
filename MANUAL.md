# 📱 TelvoiceSMS Platform - Manual de Uso

Versión 1.0 | Motor SMPP + SMS Messaging Platform

---

## 📖 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Primeros Pasos](#primeros-pasos)
3. [Módulos Principales](#módulos-principales)
4. [Flujo de Mensajes](#flujo-de-mensajes)
5. [Configuración Avanzada](#configuración-avanzada)
6. [Troubleshooting](#troubleshooting)

---

## Introducción

**TelvoiceSMS** es una plataforma completa de gestión y enrutamiento de mensajes SMS y Voice. Funciona como un intermediario entre tus clientes (retail y wholesale) y múltiples operadores de telecomunicaciones (vendors) globales.

### Características principales
- ✅ **Motor SMPP v3.4/5.0** — Servidor y cliente SMPP para comunicación de mensajes
- ✅ **LCR Dinámico** — Selecciona automáticamente el vendor más económico por destino
- ✅ **Gestión de Clientes** — Soporte para retail (prepago) y wholesale (postpago)
- ✅ **Procesamiento Inteligente** — Content translation, block lists, sender ID rules
- ✅ **Reportes Analíticos** — Finance, retail, wholesale, vendor reporting
- ✅ **Voice/SIP** — Gestión de cuentas SIP y reportes CDR
- ✅ **API REST** — Control total del motor vía endpoints HTTP

---

## Primeros Pasos

### 1. Dashboard Principal
Al acceder a la plataforma, verás el **Dashboard** con:
- Estado del motor SMPP (Online/Offline)
- Métricas en tiempo real (mensajes/seg, tasa de entrega)
- Alertas de bajo balance o errores

### 2. Configuración Inicial

#### Configurar tu Empresa (Entity)
**Ruta:** Settings → Entity
- Nombre legal, RFC/Tax ID
- Dirección y datos de contacto
- Información bancaria (para facturas)
- Logo de la empresa

#### Configurar SMTP para Notificaciones
**Ruta:** Settings → SMTP
- Host: `smtp.gmail.com` (ejemplo)
- Puerto: 587 (TLS) o 465 (SSL)
- Credenciales
- Email de origen

#### Agregar Monedas
**Ruta:** Settings → Currencies
- USD, EUR, GBP, CLP, ARS, BRL, etc.
- Tasas de cambio (se actualizan manualmente)

#### Países Habilitados
**Ruta:** Settings → Countries
- Selecciona los países donde operarás
- Activa/desactiva por país dinámicamente

---

## Módulos Principales

### 🚀 SMPP Engine

**Ruta:** SMPP Engine → Control

El corazón de la plataforma. Aquí controlas el servidor SMPP que recibe conexiones de clientes.

#### Estado del Motor
- **Status**: Online/Offline
- **Puerto**: 2775 (default, configurable)
- **Uptime**: Tiempo que lleva activo
- **Sesiones Activas**: Número de clientes conectados

#### Botones de Control
- **Start** — Inicia el servidor SMPP en el puerto configurado
- **Stop** — Detiene el servidor (desconecta todos los clientes)
- **Restart** — Reinicia (reload de configuración)

#### Monitoreo
**Ruta:** SMPP Engine → Sessions
- Lista de clientes conectados (system_id, IP, estado)
- Mensajes por segundo que envían
- Bind mode (Transmitter/Receiver/Transceiver)
- Duración de la conexión

---

### 👥 Clientes (Customers)

**Ruta:** Customers

Gestiona a tus clientes que enviarán mensajes por tu plataforma.

#### Crear un Cliente
1. Click en "New Customer"
2. Ingresa:
   - **Nombre**: Nombre del cliente o empresa
   - **Referencia**: ID interno único (ej: `CLI001`)
   - **Email**: Para notificaciones
   - **Balance Inicial**: Saldo prepago en USD (si es retail)
   - **Tipo**: Retail (prepago) o Wholesale (postpago)
   - **Whitelist de IPs**: IPs autorizadas para conectar al servidor SMPP

#### Datos del Cliente
- **Balance**: Saldo disponible (prepago)
- **Tasa de Envío**: USD por mensaje
- **Límite de Conexiones**: Máximo de sesiones simultáneas
- **Límite de TPS**: Mensajes por segundo máximo

#### Cuentas SMPP del Cliente
Dentro del detail del cliente puedes crear múltiples cuentas SMPP:
- **System ID**: Usuario para SMPP bind (ej: `customer_api_1`)
- **Password**: Contraseña (cifrada en BD)
- **Bind Mode**: TX (envío), RX (recepción), TRX (ambos)
- **Status**: Active/Inactive

---

### 🏢 Vendors

**Ruta:** Vendors

Tus proveedores de mensajería (carriers globales).

#### Crear un Vendor
1. Click en "New Vendor"
2. Ingresa:
   - **Nombre**: Nombre del carrier (ej: "Telefónica", "Claro")
   - **País**: País principal donde opera
   - **Tipo de Conexión**: SMPP, API REST, etc.

#### Cuentas SMPP del Vendor
Dentro del detail puedes agregar credenciales de conexión:
- **System ID**: Login del vendor
- **Password**: Password del vendor
- **Host/IP**: IP del servidor SMPP del vendor
- **Puerto**: Puerto SMPP (default 2775)
- **Status**: Active/Inactive/Connected/Error

#### Conectar/Desconectar Vendor
**Ruta:** SMPP Engine → Vendors
- Click en vendor → "Connect" para iniciar conexión
- La plataforma envía un bind_transceiver al vendor
- Una vez conectado, puede recibir mensajes de clientes

#### Monitoreo de Vendors
**Ruta:** SMPP Engine → Sessions → Vendors
- Estado de conexión
- Mensajes enviados/recibidos
- Latencia
- Tasa de error

---

### 💰 Gestión de Tarifas

#### Rate Plans
**Ruta:** Rate Plans

Define cuánto cobras por mensaje por destino.

- **Nombre**: "Americas Q1 2026"
- **Moneda**: USD, CLP, etc.
- **Tarifas por MCC/MNC**: País/Operador + precio

**Ejemplo:**
```
MCC 310 (USA)   / MNC 410 (AT&T)    = $0.025
MCC 520 (Chile) / MNC 020 (Entel)   = $0.018
```

#### Load Distribution
**Ruta:** Load Distribution

Distribuye % de mensajes por vendor (ej: 60% vendor A, 40% vendor B).

- Útil para balanceo de carga
- Configuración por MCC/MNC
- Priorities (vendor preferido vs fallback)

#### LCR (Least Cost Routing)
**Ruta:** LCR

Motor de selección automática del vendor más económico + disponible.

**Crear Regla LCR:**
1. MCC/MNC destino (ej: 520/020 = Chile/Entel)
2. Orden de vendors: [Vendor A, Vendor B, Vendor C]
3. Prioridad y fallback automático si falla Vendor A

**Simulador LCR:**
**Ruta:** LCR → Simulation
- Ingresa MCC/MNC
- Ve qué vendor se seleccionará
- Útil para debugging

---

### 🛡️ Filtros y Reglas

#### Block Lists
**Ruta:** Block Lists

Palabras clave prohibidas o números sospechosos.

- **Tipo**: Sender ID, Destination, Keyword, Regex
- **Acción**: Block (rechaza), Warn (registra pero envía)
- **Aplicable a**: Clientes específicos o global

**Ejemplo:**
- Bloquear sender ID "XXX" para cliente "Banco"
- Bloquear destino "+55 11 9xxxx" (números brasileños sospechosos)
- Bloquear keyword "viagra", "casino", etc.

#### Content Translation
**Ruta:** Content Translations

Transforma el contenido del mensaje antes de enviar.

- **Retail Translation**: Cambios antes de procesar (reemplazar palabras, agregar prefijo)
- **Vendor Translation**: Cambios específicos para cada vendor (ej: Telefónica requiere "STOP al fin")
- **Regex Rules**: Transformaciones complejas

**Ejemplo:**
```
Retail: "Hola {{name}}" → reemplaza {{name}} por nombre cliente
Vendor: Agregar "STOP XXXX" al final del mensaje para Vodafone
```

#### Sender ID Rules
**Ruta:** Sender IDs

Gestiona qué Sender IDs (remitente) permitir por cliente/país.

- Alphanumeric (texto): "MIBANK", "SHOPPING"
- Numeric (número): "1234", "+56987654321"
- Whitelist por cliente y destino

---

### 📊 Reportes

#### Finance Report
**Ruta:** Reports → Finance

Rentabilidad: dinero cobrado a clientes vs gastado en vendors.

**Filtros:**
- Fecha (desde/hasta)
- Cliente específico
- Vendor específico

**Columnas:**
- Revenue (lo que cobraste al cliente)
- Cost (lo que pagaste al vendor)
- Profit (Revenue - Cost)
- Margen (Profit / Revenue)

#### Retail Report
**Ruta:** Reports → Retail

Desglose por cliente retail (prepago).

- Mensajes enviados/entregados/fallidos
- Balance consumido
- Top destinos (países)

#### Vendor Report
**Ruta:** Reports → Vendor

Performance de cada vendor.

- Mensajes procesados
- Tasa de entrega (DLR %）
- Latencia promedio
- Errores por tipo

#### Wholesale Report
**Ruta:** Reports → Wholesale

Resumen de clientes postpago y facturas.

---

### 📞 Voice/SIP

#### SIP Accounts
**Ruta:** Voice → SIP

Gestiona cuentas SIP para llamadas VoIP.

- **Username**: Usuario SIP
- **Password**: Contrasería SIP
- **Status**: Active/Inactive
- **Proxy/Server**: Servidor SIP destino

#### Voice Rate Plans
**Ruta:** Voice → Rate Plans

Tarifas por minuto de llamada (similar a SMS).

#### CDR (Call Detail Records)
**Ruta:** Voice → CDR

Historial de todas las llamadas.

**Información:**
- Número origen/destino
- Duración
- Costo
- Resultado (Connected, No Answer, etc.)

#### Voice Stats
**Ruta:** Voice → Stats

Estadísticas agregadas de llamadas.

- Minutos totales
- Costo total
- Operador más usado
- Horas pico

---

### 📧 Notificaciones y Plantillas

#### Email Templates
**Ruta:** Settings → Email Templates

Plantillas para notificaciones automáticas.

**Templates disponibles:**
- Welcome Email
- Invoice Generated
- Low Balance Alert
- Password Reset
- New Account Created
- DLR Alert

**Uso de variables:**
```
Asunto: Invoice #{{invoice_number}} Ready
Cuerpo: Hi {{name}}, Your invoice for {{amount}} is ready.
```

---

### 📝 Logs y Auditoría

#### SMPP Logs
**Ruta:** Logs → SMPP

Registro de todos los eventos SMPP.

- bind_transceiver (cliente conecta)
- submit_sm (mensaje enviado)
- deliver_sm (DLR recibido)
- unbind (cliente desconecta)
- Errores (bind fail, delivery fail, etc.)

#### Customer Logs
**Ruta:** Logs → Customer

Historial de acciones de clientes.

- Cambios de balance
- Cambios de tasa
- Cambios de configuración

#### System Logs
**Ruta:** Logs → System

Logs internos de la plataforma.

- Errores de BD
- Errores de Redis
- Alerts críticos

#### Login Traces
**Ruta:** Settings → Login Traces

Auditoría de accesos al panel admin.

- Usuario
- IP
- Timestamp
- Resultado (Success/Fail)
- 2FA status

---

### 🛠️ Herramientas de Desarrollo

#### MCC/MNC Finder
**Ruta:** Tools → MCC/MNC

Busca el código MCC/MNC de un país/operador.

- Ingresa país o operador
- Obtén MCC/MNC para usar en LCR

#### Message Tester
**Ruta:** Tools → Message Tester

Simula envío de un mensaje sin cobrar.

- Cliente
- Destinatario
- Contenido
- Ve qué vendor sería seleccionado (sin enviar realmente)

#### Currency Converter
**Ruta:** Tools → Currency Converter

Convierte monedas para referencias.

- USD → CLP, ARS, BRL, etc.
- Tasas actuales desde la BD

#### Error Code Mapper
**Ruta:** Tools → Error Codes

Decodifica códigos de error SMPP.

- Error 8 = System Error
- Error 11 = ESME_RSUBMITFAIL
- Etc. (47+ códigos cubiertos)

#### Regex Tester
**Ruta:** Tools → Regex Tester

Prueba reglas de bloqueo/transformación.

- Ingresa regex
- Ingresa texto
- Ve si coincide
- Útil para crear Content Translations

#### Re-Push DLR
**Ruta:** Tools → Re-Push DLR

Reenvía un DLR al cliente si se perdió.

- Message ID
- Nuevo status
- Reenvía deliver_sm al cliente original

---

### 💳 Facturas

#### Outgoing Invoices
**Ruta:** Invoices → Outgoing

Facturas que emites a tus clientes (retail/wholesale).

- **Crear**: Click "New Invoice"
- **Detallar**: Líneas (mensajes, tarifas, descuentos)
- **Estado**: Draft, Sent, Paid, Overdue
- **PDF**: Descarga factura para cliente

#### Incoming Invoices
**Ruta:** Invoices → Incoming

Facturas de tus vendors (lo que tienes que pagar).

- Registra facturas de vendors
- Vincula a transacciones reales
- Marca como pagadas

---

### ⚙️ Configuración del Sistema

#### System Settings
**Ruta:** Settings → System

Parámetros globales de la plataforma.

- **Platform Name**: Nombre de tu marca
- **Timezone**: Zona horaria (UTC, -3, -5, etc.)
- **Currency Default**: Moneda por defecto
- **Max TPS**: Límite global de mensajes/seg
- **Session Timeout**: Segundos para desconectar inactivos
- **2FA Required**: Forzar autenticación de dos factores

#### Approval Workflows
**Ruta:** Approvals

Configuración de aprobaciones (para cambios críticos).

- **Requiere aprobación** para: Nuevos vendors, cambios de tarifa, etc.
- **Aprobadores**: Quién puede aprobar

#### Jobs
**Ruta:** Jobs

Tareas programadas (cron jobs).

- **Envío de facturas**: Cada lunes a las 8am
- **Reconciliación de balance**: Diario
- **Limpieza de logs**: Cada semana
- **DLR Timeout**: Marcar como failed si no hay DLR en 24h

---

## Flujo de Mensajes

### Paso a Paso: Cómo un mensaje atraviesa la plataforma

```
1. Cliente conecta → SMPP Bind (autenticación)
   └─ Validar IP en whitelist
   └─ Validar Sender ID permitido
   └─ Crear sesión

2. Cliente envía → submit_sm
   └─ Validar balance disponible
   └─ Validar no más de N TPS
   └─ Validar destinatario (no bloqueado)
   └─ Aplicar Content Translation (Retail)

3. Block Lists → Filtrar
   └─ ¿Keyword prohibida? → Reject o Warn
   └─ ¿Sender ID en whitelist? → OK o Reject
   └─ ¿Destino en lista negra? → Reject o Reroute

4. Sender ID Rules → Asignar remitente válido
   └─ Si cliente pide "BANK" pero no permitido → usar default
   └─ Si país requiere Numeric ID → ajustar

5. LCR Engine → Seleccionar Vendor
   └─ Extraer MCC/MNC del destino
   └─ Consultar rutas LCR
   └─ Evaluar costo, prioridad, disponibilidad
   └─ Elegir vendor óptimo

6. Load Distribution → Distribuir carga
   └─ Si hay load distribution rule → aplicar %
   └─ Ej: 60% Vendor A, 40% Vendor B

7. Content Translation (Vendor) → Transformar para vendor
   └─ Agregar/remover prefijos
   └─ Cumplir requisitos de vendor

8. Enviar → submit_sm a Vendor
   └─ Cliente SMPP conecta a vendor
   └─ Envía mensaje

9. Registrar → Guardar en DB
   └─ messages table: destino, costo, vendor, cliente
   └─ sms_logs table: timestamps

10. Respuesta Vendor → submit_sm_resp
    └─ Message ID del vendor
    └─ Guardar en DB

11. Esperar DLR → deliver_sm del vendor
    └─ Estado final (DELIVERED, FAILED, etc.)

12. Procesar DLR → entregar deliver_sm a cliente
    └─ Enviar deliver_sm a sesión del cliente

13. DLR Override → Aplicar reglas DLR si existen
    └─ ¿Regla que cambia status? → aplicar

14. Billing → Débito de balance
    └─ Restar costo del balance del cliente
    └─ Registrar transacción

15. Estadísticas → Actualizar counters
    └─ Redis counters por destino/vendor/cliente
    └─ Cálculos de tasa de entrega

16. Notificaciones → Enviar alerts si aplica
    └─ Low balance warning
    └─ High error rate alert
    └─ Webhook al cliente (si configurado)
```

---

## Configuración Avanzada

### Multi-Currency y Exchange Rates

1. Agrega monedas en **Settings → Currencies**
2. Ingresa tasas de cambio (ej: 1 USD = 900 ARS)
3. En **Rate Plans**, puedes definir precios en diferentes monedas
4. La plataforma convierte automáticamente al billing

### Wholesale vs Retail Billing

**Retail (Prepago):**
- Cliente deposita $500 USD
- Cada mensaje gasta de ese balance
- Se notifica cuando llega a $50

**Wholesale (Postpago):**
- Cliente envía mensajes sin balance
- Factura mensual al final del período
- Net 30 días para pago

### Webhook Integration (si está habilitado)

Configura webhooks para notificaciones en tiempo real:

```
POST https://tu-servidor.com/webhooks/sms
{
  "event": "sms_delivered",
  "message_id": "123456",
  "status": "DELIVERED",
  "timestamp": "2026-04-20T15:30:00Z"
}
```

### API REST (para integración)

Endpoints principales (documentación completa en `/api/docs`):

```
POST /api/sms/send
- Enviar SMS directamente vía API (en lugar de SMPP)

GET /api/balance/:customerId
- Obtener balance del cliente

POST /api/smpp/start
- Iniciar motor SMPP

GET /api/smpp/status
- Status del motor
```

---

## Troubleshooting

### El motor SMPP no inicia

**Síntoma:** "SMPP Engine Failed to start"

**Soluciones:**
1. Verifica que el puerto 2775 no esté en uso: `lsof -i :2775`
2. Verifica que `REDIS_URL` esté configurado (Settings → Environment Variables)
3. Verifica que `SMPP_ENCRYPTION_KEY` esté configurado
4. Revisa logs: **Logs → System**

### Cliente no puede conectar (BIND_RESP FAIL)

**Síntoma:** Cliente recibe error al conectar

**Causas comunes:**
1. **Invalid password**: Verifica credenciales en **Customers → [Cliente] → SMPP Accounts**
2. **IP not in whitelist**: Agrega IP del cliente a whitelist
3. **Account inactive**: Asegúrate que la cuenta está "Active"
4. **TPS limit**: Cliente alcanzó límite de TPS

### Mensajes no se envían (stuck en queue)

**Síntoma:** Mensajes enviados pero nunca entregados

**Verificar:**
1. ¿El vendor está conectado? **SMPP Engine → Vendors** → debe decir "Connected"
2. ¿Hay balance? **Customers → [Cliente]** → Balance > 0
3. ¿Destinatario bloqueado? **Block Lists** → revisar si destino está en lista negra
4. Revisa **Logs → SMPP** para errores específicos

### Balance no desciende tras enviar

**Síntoma:** Mensaje entregado pero balance no cambió

**Causas:**
1. **DLR no recibido**: El sistema espera deliver_sm del vendor
2. **Billing engine pausado**: Revisa **Settings → System → Billing Status**
3. **Transacción no registrada**: Revisa **Logs → System** para errores de BD

### Vendor desconecta continuamente

**Síntoma:** Conexión al vendor conecta/desconecta cada pocos segundos

**Soluciones:**
1. Verifica host/puerto del vendor en **Vendors → [Vendor] → SMPP Credentials**
2. Verifica credenciales (System ID / Password)
3. Contacta al vendor para verificar que acepta conexiones desde tu IP
4. Revisa **Logs → SMPP** para error específico del bind

### Alto error rate en mensajes

**Síntoma:** Muchos mensajes con status "FAILED"

**Pasos:**
1. Revisa **Reports → Vendor** para ver cuál vendor está fallando
2. Revisa **LCR → Simulation** para confirmar que vendor correcto fue seleccionado
3. Agregar vendor fallido a blocklist temporal o bajar su prioridad
4. Contacta al vendor para diagnosticar

---

## Soporte y Contacto

Para preguntas, errores o sugerencias:

- **Email**: support@telvoicesms.com
- **Documentación**: `/docs` en el panel
- **API Docs**: `/api/docs`
- **Status Page**: `status.telvoicesms.com`

---

**Última actualización:** Abril 2026
**Versión de plataforma:** 1.0.0
