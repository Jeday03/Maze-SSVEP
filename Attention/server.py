import asyncio
import websockets
import csv
import json
import pandas as pd
import os
from ranking import gerar_pontuação

usuario = ''


async def server(websocket, path):
    async for message in websocket:
        try:
            mensagem = json.loads(message)
            #print(f"Received game event from client: {mensagem}")
            tipo_mensagem = verificar_tipo_mensagem(mensagem)
            print(tipo_mensagem)
            if tipo_mensagem == 'EVENTO DE JOGO':
                nivel = mensagem.pop()
                grade = mensagem.pop()
                maze_filename = salvar_grade(grade, nivel)
                player_filename = salvar_info(mensagem, nivel)
                score = gerar_pontuação(maze_filename, player_filename)
                print("Score:", score)
                await websocket.send(json.dumps(score))
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON: {e}")

def verificar_tipo_mensagem(mensagem):
    try:
        if 'ranking' in mensagem:
            gerar_ranking()
            return "Ranking"
        if 'ID' in mensagem:
            global usuario 
            usuario = mensagem['ID']
            return 'ID'
        elif 'input' in mensagem and 'output' in mensagem:
            write_training_to_csv(mensagem)
            return 'TREINAMENTO'
        # Verifica se a mensagem contém outros campos, indicando um evento de jogo
        elif len(mensagem) > 0:
            return 'EVENTO DE JOGO'
        else:
            return 'TIPO DESCONHECIDO'
    except Exception as e:
        print(f"Erro ao verificar o tipo de mensagem: {e}")
        print(mensagem)
        return 'ERRO'

def gerar_ranking(): #Apenas quando o jogo terminar
    global usuario
    diretorio = "Attention/infos"
    folder_path = os.path.join("Attention", "infos")
    ranking_file = os.path.join(diretorio, "ranking.csv")

    if not os.path.exists(ranking_file):
        # Criar o arquivo de ranking se ele não existir
        with open(ranking_file, "w", newline="") as file:
            writer = csv.writer(file)
            writer.writerow(["user_id", "score_final"])  # Escrever o cabeçalho
    
    arquivos = os.listdir(diretorio)
    arquivos = [arquivo for arquivo in arquivos if arquivo != "ranking.csv"]

    pontuacao = 0
    id = max([int(arquivo.split("_")[-1].split(".")[0]) for arquivo in arquivos])
    ultima_fase = max([int(arquivo.split("_")[-2]) for arquivo in arquivos])
    user_id = f"{usuario}_{id}"

    print(f"{usuario}_{ultima_fase}_{id}_{pontuacao}")

    for i in range(1, ultima_fase+1):
        maze_filename = os.path.join(folder_path, f"{usuario}_maze_grid_{i}_{id}.csv")
        player_filename = os.path.join(folder_path, f"{usuario}_maze_info_{i}_{id}.csv")
        pontuacao += gerar_pontuação(maze_filename, player_filename)
    
    with open(ranking_file, "a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow([user_id, pontuacao])   
    return

def salvar_info(events, nivel):
    df = pd.DataFrame(columns=['minutes', 'seconds', 'player_x', 'player_y'])
    npca_n = max(len(event['npcaInfo']) for event in events) 
    npcp_n = max(len(event['npcpInfo']) for event in events)
    for i in range(npca_n):
        df[f'npca_{i+1}_x'] = [event['npcaInfo'][i]['x'] for event in events]
        df[f'npca_{i+1}_y'] = [event['npcaInfo'][i]['y'] for event in events]
        df[f'npca_{i+1}_contato'] = [event['npcaInfo'][i]['contato'] for event in events]
    for i in range(npcp_n):
        df[f'npcp_{i+1}_x'] = [event['npcpInfo'][i]['x'] for event in events]
        df[f'npcp_{i+1}_y'] = [event['npcpInfo'][i]['y'] for event in events]

    df['minutes'] = [event['time']['minutes'] for event in events]
    df['seconds'] = [event['time']['seconds'] for event in events]
    df['player_x'] = [event['playerPosition']['x'] for event in events]
    df['player_y'] = [event['playerPosition']['y'] for event in events]
    info_filename = nome_csv(usuario, nivel, 'maze_info')
    df.to_csv(info_filename)
    return info_filename

def salvar_grade(grade, nivel):
    df = pd.DataFrame(columns=['x', 'y', 'visited', 'wall_top', 'wall_right', 'wall_bottom', 'wall_left'])
    for row in grade:
        for col in row:
            new_df = pd.DataFrame([{
                'x': col['x'],
                'y': col['y'],
                'visited': bool(col['visited']),
                'wall_top': bool(col['walls'][0]),
                'wall_right': bool(col['walls'][1]),
                'wall_bottom': bool(col['walls'][2]),
                'wall_left': bool(col['walls'][3])
            }])
            df = pd.concat([df, new_df], ignore_index=True).astype({'x': 'int64', 'y': 'int64', 'visited': 'bool',
                                                          'wall_top': 'bool', 'wall_right': 'bool',
                                                          'wall_bottom': 'bool', 'wall_left': 'bool'})
    maze_filename = nome_csv(usuario, nivel, 'maze_grid')
    df.to_csv(maze_filename)
    return maze_filename

def write_training_to_csv(data): #Treinamento, com os valores de {'output': [], 'input': []}
    df = pd.DataFrame(data)
    df = df.transpose()
    df.to_csv(nome_csv(usuario, 'training'), header=False)

def nome_csv(usuario, nivel, tipo):
    folder_path = os.path.join("Attention", "infos")
    if not os.path.exists(folder_path):
        os.makedirs(folder_path)
    numero = 1
    while True:
        nome_arquivo = f"{usuario}_{tipo}_{nivel}_{numero}.csv"
        if not os.path.exists(os.path.join(folder_path, nome_arquivo)):
            return os.path.join(folder_path, nome_arquivo)
        numero += 1

start_server = websockets.serve(server, "localhost", 8766)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
