# SerBot Control

Interfaz web para supervisar cámaras y conducir robots SerBot. Incluye un panel
independiente para operar las funciones de atención del Robot Mesero.

## Desarrollo

```bash
npm install
npm run dev
```

Comandos disponibles:

- `npm run build`: valida TypeScript y genera la aplicación de producción.
- `npm run lint`: ejecuta ESLint.
- `npm run preview`: sirve localmente el resultado de `dist`.

Copia `.env.example` como `.env` y ajusta las URLs del backend, Socket.IO y
MediaMTX para el entorno de ejecución.

## Vistas

- `/`: dashboard de cámaras, telemetría y conducción.
- `/?popout=driving`: panel de conducción independiente existente.
- `/?app=mesero`: panel de acciones del Robot Mesero.

El panel Mesero también se abre desde **Ajustes → Aplicaciones → Mesero Robot**.
El enlace usa una pestaña nueva y la vista se selecciona antes de montar el
dashboard, por lo que esa pestaña no inicia cámaras ni el socket de conducción.

## Panel Robot Mesero

El panel permite seleccionar Mesero 1–4 o un servidor local y operar:

- expresiones y pantalla de producto;
- pago QR, estado de polling y contador de ventas;
- mensajes y audios locales/remotos;
- texto a voz (TTS);
- configuración, merchants y filtros de productos;
- consola de resultados.

Los servicios del panel Mesero son independientes del backend de conducción:
la API del robot usa el puerto `5050` y TTS usa el puerto `9000`. Los servidores
deben aceptar CORS desde el origen de esta interfaz. Si la interfaz se publica
por HTTPS, esos servicios también deben exponerse por HTTPS o mediante un proxy
seguro para evitar bloqueos por contenido mixto.

Los audios del panel se distribuyen desde
`public/apps/mesero-control/audio`. El token TTS no se guarda en el código; puede
definirse con `VITE_MESERO_TTS_TOKEN` o introducirse para la sesión en el panel.

## Seguridad operativa

La API actual del Robot Mesero no autentica los comandos y permite CORS desde
cualquier origen. Úsala únicamente dentro de una VPN o red confiable; no
publiques los puertos `5050` y `9000` directamente en Internet. Antes de una
exposición pública, el backend debe incorporar autenticación y una lista de
orígenes permitidos. Además, `GET /config` puede devolver el bearer token de la
API comercial, por lo que el acceso de red al servicio debe considerarse
privilegiado.
