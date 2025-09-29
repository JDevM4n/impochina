# Imagen oficial de Playwright (incluye Chrome/Chromium + deps)
FROM mcr.microsoft.com/playwright:v1.46.0-jammy

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# instala browsers si la imagen base cambiase
RUN npx playwright install --with-deps chromium

COPY src ./src

# variables por defecto (puedes sobreescribir en compose)
ENV USE_PLAYWRIGHT=1 \
    TRANSLATE_ES=0

CMD ["node","src/worker.js"]
