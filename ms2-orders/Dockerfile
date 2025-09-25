FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

# Dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código
COPY app ./app

# Asegura que app/grpc sea un paquete
RUN mkdir -p app/grpc && [ -f app/grpc/__init__.py ] || printf "" > app/grpc/__init__.py

# Protos y generación
COPY protos ./protos
RUN python -m grpc_tools.protoc -I./protos \
    --python_out=./app/grpc \
    --grpc_python_out=./app/grpc \
    ./protos/auth.proto

# ⚠️ Parchea import absoluto -> relativo en auth_pb2_grpc.py
RUN python - <<'PY'
p = "app/grpc/auth_pb2_grpc.py"
s = open(p, "r", encoding="utf-8").read()
s = s.replace("import auth_pb2 as auth__pb2", "from . import auth_pb2 as auth__pb2")
open(p, "w", encoding="utf-8").write(s)
print("Patched:", p)
PY

ENV PORT=8000
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]
