FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/src/ ./src/
COPY skills/ ./skills/

# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./static/

# Create runtime directories
RUN mkdir -p data workspace

ENV PYTHONPATH=/app/src

# Serve frontend static files from FastAPI
RUN pip install --no-cache-dir aiofiles

EXPOSE 8006

CMD ["uvicorn", "controlcenter.main:app", "--host", "0.0.0.0", "--port", "8006"]
