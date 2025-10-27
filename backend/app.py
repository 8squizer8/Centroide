# backend/app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import logic

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return "Flask backend running!"

# Rota ANTIGA para a Página 2 (Simulador Oxy)
@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json
    points = data.get('points', [])
    
    print("\n📦 [Page 2] Pontos recebidos (formato x,y):")
    print(points)

    final_point, cost, logs = logic.calculate_final_point(points)

    return jsonify({
        'final_point': final_point,
        'cost': cost,
        'logs': logs
    })

# --- NOVA ROTA para a Página 3 (Mapa) ---
@app.route('/calculate-geo', methods=['POST'])
def calculate_geo():
    data = request.json
    points = data.get('points', []) # Vai receber {'lat': ..., 'lng': ..., 'w': ...}

    # O teu teste para verificar se os dados chegam corretamente
    print("\n📦 [Page 3] Pontos recebidos do mapa (formato lat,lng):")
    print(points)

    # Vamos chamar uma NOVA função em logic.py para este cálculo
    final_point, cost, logs = logic.calculate_from_geo_as_cartesian(points)

    # A resposta para o frontend precisa de ter as chaves 'lat' e 'lng'
    return jsonify({
        'final_point': final_point,
        'cost': cost,
        'logs': logs
    })


if __name__ == '__main__':
    # O debug=True faz com que o servidor reinicie automaticamente quando guardas alterações
    app.run(debug=True, port=5000)