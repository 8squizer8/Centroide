# backend/logic.py

import numpy as np

# Função ANTIGA para a Página 2
def calculate_final_point(points):
    logs = []
    if not points:
        return {'x': 0, 'y': 0}, 0, logs

    lista_x = [p['x'] for p in points]
    lista_y = [p['y'] for p in points]
    lista_w = [p.get('w', 1) for p in points]

    x1 = sum([lista_x[i]*lista_w[i] for i in range(len(lista_x))])/sum(lista_w)
    y1 = sum([lista_y[i]*lista_w[i] for i in range(len(lista_y))])/sum(lista_w)
    logs.append(f"Ponto inicial: ({x1:.4f}, {y1:.4f})")

    x_old, y_old = x1, y1
    epsilon = 1e-6
    iteracao = 0
    max_iter = 100

    while iteracao < max_iter:
        iteracao += 1
        distancias = []
        for i in range(len(lista_x)):
            d = np.sqrt((x_old - lista_x[i])**2 + (y_old - lista_y[i])**2)
            if d < 1e-9: d = 1e-9
            distancias.append(d)

        soma_x = sum([lista_w[i]*lista_x[i]/distancias[i] for i in range(len(lista_x))])
        soma_y = sum([lista_w[i]*lista_y[i]/distancias[i] for i in range(len(lista_x))])
        soma_div = sum([lista_w[i]/distancias[i] for i in range(len(lista_x))])

        x_new = soma_x / soma_div
        y_new = soma_y / soma_div
        logs.append(f"Iter {iteracao}: ({x_new:.4f}, {y_new:.4f})")

        if abs(x_new - x_old) < epsilon and abs(y_new - y_old) < epsilon:
            logs.append(f"\n✅ Convergência atingida em {iteracao} iterações!")
            break

        x_old, y_old = x_new, y_new
    
    c = sum([lista_w[i]*distancias[i] for i in range(len(lista_x))])
    return {'x': round(x_new,4), 'y': round(y_new,4)}, round(c,4), logs

# --- NOVA FUNÇÃO para a Página 3 ---
def calculate_from_geo_as_cartesian(points):
    logs = ["Tratando coordenadas Lat/Lng como um plano X/Y..."]
    if not points:
        # Devolvemos no formato lat/lng que o frontend espera
        return {'lat': 0, 'lng': 0}, 0, logs

    # A única diferença real é como lemos os dados de entrada
    # Tratamos 'lat' como 'x' e 'lng' como 'y'
    lista_x = [p['lat'] for p in points]
    lista_y = [p['lng'] for p in points]
    lista_w = [p.get('w', 1) for p in points]

    # O resto do algoritmo de Weiszfeld é EXATAMENTE o mesmo
    x1 = sum([lista_x[i]*lista_w[i] for i in range(len(lista_x))])/sum(lista_w)
    y1 = sum([lista_y[i]*lista_w[i] for i in range(len(lista_y))])/sum(lista_w)
    logs.append(f"Ponto inicial: (Lat: {x1:.4f}, Lng: {y1:.4f})")

    x_old, y_old = x1, y1
    epsilon = 1e-6
    iteracao = 0
    max_iter = 100

    while iteracao < max_iter:
        iteracao += 1
        distancias = []
        for i in range(len(lista_x)):
            d = np.sqrt((x_old - lista_x[i])**2 + (y_old - lista_y[i])**2)
            if d < 1e-9: d = 1e-9
            distancias.append(d)

        soma_x = sum([lista_w[i]*lista_x[i]/distancias[i] for i in range(len(lista_x))])
        soma_y = sum([lista_w[i]*lista_y[i]/distancias[i] for i in range(len(lista_x))])
        soma_div = sum([lista_w[i]/distancias[i] for i in range(len(lista_x))])

        x_new = soma_x / soma_div
        y_new = soma_y / soma_div
        logs.append(f"Iter {iteracao}: (Lat: {x_new:.4f}, Lng: {y_new:.4f})")

        if abs(x_new - x_old) < epsilon and abs(y_new - y_old) < epsilon:
            logs.append(f"\n✅ Convergência atingida em {iteracao} iterações!")
            break

        x_old, y_old = x_new, y_new
    
    # O custo aqui será em "unidades de graus", o que não tem muito significado,
    # mas o cálculo funciona.
    c = sum([lista_w[i]*distancias[i] for i in range(len(lista_x))])

    # MUITO IMPORTANTE: Devolvemos o resultado com as chaves 'lat' e 'lng'
    # para que o frontend saiba como desenhar o marcador azul.
    final_point = {'lat': round(x_new, 6), 'lng': round(y_new, 6)}
    
    return final_point, round(c, 4), logs