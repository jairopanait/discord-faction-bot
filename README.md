# Bot de salidas de facción

Cuando aparecen menciones nuevas en el canal configurado, el bot procesa a todos los usuarios mencionados:

1. Quita todos sus roles editables, salvo el rol conservado.
2. Añade los dos roles configurados.
3. Elimina su apodo del servidor.
4. Publica la plantilla en el canal de salida.
5. Reacciona con ✅ si termina o con ❌ si encuentra un error.

El bot escucha únicamente eventos nuevos: no lee ni procesa mensajes anteriores al arranque.

## Preparación

En Discord Developer Portal, activa **Intención de contenido del mensaje**. En el servidor, el bot necesita **Ver canales**, **Enviar mensajes**, **Añadir reacciones**, **Gestionar roles** y **Gestionar apodos**. Su rol debe estar por encima de los usuarios y roles que modificará.

## Ejecución local

1. Instala Node.js 20 o superior.
2. Ejecuta `npm install` dentro de esta carpeta.
3. Copia `.env.example` como `.env`.
4. Sustituye el texto de ejemplo por el token real, sin comillas.
5. Ejecuta `npm start`.

Nunca compartas ni subas el archivo `.env`.

## Railway

Configura una variable privada llamada `DISCORD_TOKEN` con el token del bot. Railway utilizará `npm start` para iniciar el servicio.
