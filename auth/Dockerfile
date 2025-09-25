FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PYTHONPATH=/app

WORKDIR /app

# 1) Dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2) Código
COPY app ./app
# asegurar el paquete para los stubs
RUN mkdir -p app/grpc && [ -f app/grpc/__init__.py ] || printf "" > app/grpc/__init__.py

# 3) Protos y generación de stubs
COPY protos ./protos
RUN python -m grpc_tools.protoc \
      -I./protos \
      --python_out=./app/grpc \
      --grpc_python_out=./app/grpc \
      ./protos/auth.proto

# 4) Parchear import absoluto del stub para que use el paquete app.grpc
RUN python - <<'PY'
path = "app/grpc/auth_pb2_grpc.py"
with open(path, "r", encoding="utf-8") as f:
    s = f.read()
s = s.replace("import auth_pb2 as auth__pb2", "from app.grpc import auth_pb2 as auth__pb2")
with open(path, "w", encoding="utf-8") as f:
    f.write(s)
PY

EXPOSE 8001 50051

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
