import csv
from collections import deque
import math

def load_maze(filename): #Carega o labirinto em um dicionario
    maze = {}
    with open(filename, mode='r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            x = int(row['x'])
            y = int(row['y'])
            maze[(x, y)] = {
                'wall_top': row['wall_top'] == 'True',
                'wall_right': row['wall_right'] == 'True',
                'wall_bottom': row['wall_bottom'] == 'True',
                'wall_left': row['wall_left'] == 'True'
            }
    return maze

def find_end_cell(maze): #Encontra a celula com o objetivo
    max_x = max(coord[0] for coord in maze.keys())
    max_y = max(coord[1] for coord in maze.keys())
    return (max_x, max_y)

def find_path(maze, start, end): #Encontra o caminho-resposta
    queue = deque([start])
    came_from = {start: None}
    while queue:
        current = queue.popleft()
        if current == end:
            break
        x, y = current
        directions = [(0, -1, 'wall_top'), (1, 0, 'wall_right'), (0, 1, 'wall_bottom'), (-1, 0, 'wall_left')]
        for dx, dy, wall in directions:
            neighbor = (x + dx, y + dy)
            if not maze[current][wall] and neighbor in maze and neighbor not in came_from:
                queue.append(neighbor)
                came_from[neighbor] = current
    path = []
    step = end
    while step:
        path.append(step)
        step = came_from[step]
    path.reverse()
    return path

def load_player_data(filename): #Dicionario com as informações
    player_data = []
    npca_contact_columns = []

    with open(filename, mode='r') as file:
        reader = csv.DictReader(file)
        headers = reader.fieldnames

        # Identificar colunas de contato npca
        for header in headers:
            if header.startswith('npca_') and header.endswith('_contato'):
                npca_contact_columns.append(header)

        for row in reader:
            player_info = {
                'minutes': int(row['minutes']),
                'seconds': int(row['seconds']),
                'player_x': float(row['player_x']),
                'player_y': float(row['player_y']),
                'npca_contacts': [row[col] == 'True' for col in npca_contact_columns]
            }
            player_data.append(player_info)

    return player_data, npca_contact_columns

def round_position(x, y):# Função para arredondar a posição do jogador
    return (round(x), round(y))

def analyze_player_data(player_data, path): # Função para verificar as variáveis solicitadas
    # 1. Tempo final em segundos
    final_minutes = player_data[-1]['minutes']
    final_seconds = player_data[-1]['seconds']
    total_time_seconds = final_minutes * 60 + final_seconds

    # 2. Verificar se a posição final arredondada corresponde à última posição do labirinto
    final_player_pos = round_position(player_data[-1]['player_x'], player_data[-1]['player_y'])
    is_at_end = 1 if final_player_pos == path[-1] else 0

    # 3. Contar quantos npca tiveram contato igual a True na última linha
    last_row = player_data[-1]
    npca_contact_count = sum(last_row['npca_contacts'])

    # 4. Verificar quantas células o player esteve que não estão no caminho resposta
    non_path_cells = 0
    path_set = set(path)
    
    for data in player_data:
        player_pos = round_position(data['player_x'], data['player_y'])
        if player_pos not in path_set:
            non_path_cells += 1

    return [total_time_seconds, is_at_end, npca_contact_count, non_path_cells]

def score(pontos):
    return pontos[0] + pontos[1]*100 - (pontos[2] * 10 + pontos[3]*5)

def gerar_pontuação(filename_maze, filename_player):
    maze = load_maze(filename_maze)
    start = (0, 0)
    end = find_end_cell(maze)
    path = find_path(maze, start, end)
    player_data, npca_contact_columns = load_player_data(filename_player)
    pontos = analyze_player_data(player_data, path)
    return score(pontos)

# Carregar o labirinto
# filename_maze = '_maze_grid_1.csv'
# filename_player = '_maze_info_1.csv'
# print(gerar_pontuação(filename_maze, filename_player))


# Imprimir os resultados
# print("Tempo final em segundos:", pontos[0])
# print("Posição final corresponde ao final do labirinto:", pontos[1])
# print(f"Número de npca com contato True na última linha ({len(npca_contact_columns)} npca):", pontos[2])
# print("Número de células fora do caminho resposta:", pontos[3])
# print("Resultado final:", score(pontos))
