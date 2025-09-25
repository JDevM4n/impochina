FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=/app
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Compilar el proto (cliente)
COPY protos ./protos
RUN python -m grpc_tools.protoc -I./protos \
    --python_out=./app/grpc \
    --grpc_python_out=./app/grpc \
    ./protos/auth.proto

# Copiar app
COPY app ./app

EXPOSE 8000
CMD ["sh","-c","uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
