import os

import psycopg
from flask import Flask, jsonify

app = Flask(__name__)

# Se configuran con variables de entorno: aquí no hay que cambiar nada.
DATABASE_URL = os.environ["DATABASE_URL"]              # postgresql://usuario:clave@host:5432/base
ORIGEN_PERMITIDO = os.getenv("ORIGEN_PERMITIDO", "")   # URL del frontend, p. ej. https://g07.dominio.com


def consultar(sql):
    with psycopg.connect(DATABASE_URL, connect_timeout=5) as conexion:
        return conexion.execute(sql).fetchall()


@app.after_request
def permitir_frontend(respuesta):
    if ORIGEN_PERMITIDO:
        respuesta.headers["Access-Control-Allow-Origin"] = ORIGEN_PERMITIDO
    return respuesta


@app.get("/api/salud")
def salud():
    consultar("SELECT 1")
    return jsonify(estado="ok")


@app.get("/api/sistemas")
def sistemas():
    filas = consultar("SELECT nombre, anio, tipo FROM sistemas_operativos ORDER BY anio")
    return jsonify([{"nombre": n, "anio": a, "tipo": t} for n, a, t in filas])
