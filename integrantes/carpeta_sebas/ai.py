# ============================================
# MARIO BROS 2D / MEDIEVAL LEGEND - SERVIDOR IA
# ============================================
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import random
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Habilita conexiones desde el navegador

MEMORY_FILE = "game_data.json"
USERS_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Usuarios")

# Crear carpeta de usuarios si no existe
if not os.path.exists(USERS_FOLDER):
    os.makedirs(USERS_FOLDER)
    print(f"✓ Carpeta Usuarios creada en: {USERS_FOLDER}")

# ===== GESTIÓN DE MEMORIA =====
def cargar_memoria():
    if not os.path.exists(MEMORY_FILE):
        return crear_memoria_inicial()
    try:
        with open(MEMORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return crear_memoria_inicial()

def crear_memoria_inicial():
    return {
        "nivel_dificultad": 1.0,      # Multiplicador general
        "agresividad_enemigos": 1.0,  # Frecuencia de ataque
        "velocidad_enemigos": 1.0,    # Velocidad de movimiento
        "tasa_saltos_jugador": 0.0,   # Qué tanto salta el jugador
        "tasa_ataque_jugador": 0.0,   # Qué tan agresivo es el jugador
        "total_partidas": 0,
        "ultima_actualizacion": datetime.now().isoformat()
    }

def guardar_memoria(data):
    data["ultima_actualizacion"] = datetime.now().isoformat()
    with open(MEMORY_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

# ===== ENDPOINTS =====

@app.route("/save_user", methods=["POST"])
def save_user():
    """Guarda un nuevo usuario"""
    try:
        datos = request.json
        username = datos.get("username", "Unknown").replace(" ", "_").replace("/", "_")
        
        # Crear archivo JSON con los datos del usuario
        user_file = os.path.join(USERS_FOLDER, f"{username}.json")
        
        user_data = {
            "username": username,
            "startTime": datos.get("startTime", datetime.now().isoformat()),
            "score": datos.get("score", 0),
            "round": datos.get("round", 1),
            "lastUpdate": datetime.now().isoformat()
        }
        
        # Escribir el archivo
        with open(user_file, "w", encoding="utf-8") as f:
            json.dump(user_data, f, indent=4, ensure_ascii=False)
        
        print(f"✓ Usuario guardado exitosamente: {username}")
        print(f"  Archivo: {user_file}")
        
        return jsonify({"status": "success", "username": username, "message": "Usuario creado"}), 200
        
    except Exception as e:
        print(f"✗ Error al guardar usuario: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/save_ai_data", methods=["POST"])
def save_ai_data():
    """Recibe telemetría del jugador y ajusta la IA"""
    try:
        datos = request.json
        memoria = cargar_memoria()
        
        # 1. Analizar estilo del jugador
        saltos = datos.get("saltos", 0)
        ataques = datos.get("ataques", 0)
        tiempo_vivo = datos.get("tiempo_vivo", 1)
        
        # Calcular tasas por segundo (aprox)
        tasa_saltos = saltos / max(1, tiempo_vivo)
        tasa_ataques = ataques / max(1, tiempo_vivo)
        
        # 2. Ajustar IA dinámicamente
        # Si el jugador es muy agresivo, los enemigos se vuelven más resistentes/rápidos
        if tasa_ataques > 0.5:
            memoria["agresividad_enemigos"] = min(3.0, memoria["agresividad_enemigos"] + 0.1)
            memoria["velocidad_enemigos"] = min(2.5, memoria["velocidad_enemigos"] + 0.05)
            
        # Si el jugador salta mucho (evasivo), aumentar velocidad de proyectiles/vuelo
        if tasa_saltos > 0.5:
            memoria["velocidad_enemigos"] = min(2.5, memoria["velocidad_enemigos"] + 0.1)

        # Si el jugador ganó, subir dificultad general
        if datos.get("victoria", False):
            memoria["nivel_dificultad"] += 0.2
        else:
            # Si perdió rápido, bajar un poco la dificultad (balanceo)
            if tiempo_vivo < 30:
                memoria["nivel_dificultad"] = max(1.0, memoria["nivel_dificultad"] - 0.1)

        memoria["total_partidas"] += 1
        memoria["tasa_saltos_jugador"] = tasa_saltos
        memoria["tasa_ataque_jugador"] = tasa_ataques
        
        guardar_memoria(memoria)
        
        print(f"🧠 IA Actualizada: Dificultad {memoria['nivel_dificultad']:.2f} | Agresividad {memoria['agresividad_enemigos']:.2f}")
        
        return jsonify({"status": "success", "new_difficulty": memoria}), 200
        
    except Exception as e:
        print("Error:", e)
        return jsonify({"status": "error", "message": str(e)}), 400

@app.route("/get_ai_params", methods=["GET"])
def get_ai_params():
    """El juego consulta esto al iniciar para configurar los enemigos"""
    return jsonify(cargar_memoria()), 200

if __name__ == "__main__":
    print("=" * 50)
    print("🤖 SERVIDOR DE IA EN EJECUCIÓN")
    print("=" * 50)
    print(f"Carpeta de usuarios: {USERS_FOLDER}")
    print(f"Puerto: 5000")
    print(f"URL: http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000)