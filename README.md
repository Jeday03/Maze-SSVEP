# Maze-SSVEP: Guia Rápido de Execução

Este arquivo explica de forma simples e direta como rodar o projeto **com** e **sem** BCI.

---

## Rodar o código **sem** BCI

```bash
node server.js
```

Isso iniciará o jogo usando apenas o teclado/mouse sem qualquer leitura de EEG.

---

## Rodar o código **com** BCI (OpenBCI + BrainFlow)

### 1) Iniciar o stream do EEG

Execute o script do BrainFlow apontando para sua porta COM e canais escolhidos:

```bash
python bci_brainflow.py --board-id 2 --serial-port COM3 --chan-idx "9,10,11,12,13,14,15,16"
```

### 2) Rodar o servidor com suporte a BCI

```bash
node server.js --bci
```

O servidor entrará no modo de interpretação dos comandos vindos do EEG.
