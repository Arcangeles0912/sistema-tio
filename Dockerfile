# Etapa 1: Compilación del frontend y preparación del entorno
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copiar archivos de configuración de dependencias
COPY package*.json ./

# Instalar dependencias necesarias para compilar (desarrollo y producción)
RUN npm install

# Copiar código fuente
COPY . .

# Compilar React a producción (los archivos irán a ./build)
RUN npm run build

# Eliminar dependencias de desarrollo para producción
RUN npm prune --production

# Etapa 2: Imagen final optimizada de ejecución
FROM node:18-alpine

WORKDIR /usr/src/app

# Copiar las dependencias de producción ya listas de la etapa builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package*.json ./

# Copiar compilación del frontend y los archivos requeridos del servidor
COPY --from=builder /usr/src/app/build ./build
COPY --from=builder /usr/src/app/server.js ./
COPY --from=builder /usr/src/app/db.js ./

# Definir variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3001

# Exponer el puerto en el que corre Express
EXPOSE 3001

# Arrancar la aplicación
CMD ["node", "server.js"]
