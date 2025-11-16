console.log("ranking");
console.log("chegou");
fetch('infos/ranking.csv')
    .then(response => response.text())
    .then(data => {
        const table = document.getElementById('ranking-table').getElementsByTagName('tbody')[0];
        table.innerHTML = ''; // Limpar a tabela antes de preencher
        const rows = data.trim().split('\n').slice(1); // Ignora o cabeçalho

        rows.forEach(row => {
            const cols = row.split(',');
            const newRow = table.insertRow();

            cols.forEach(col => {
                const newCell = newRow.insertCell();
                const newText = document.createTextNode(col);
                newCell.appendChild(newText);
            });
        });
    })
    .catch(error => console.error('Error fetching the CSV file:', error));

async function calcularScores() {
    console.log("atualizar");
    fetch('infos/ranking.csv')
        .then(response => response.text())
        .then(data => {
            const table = document.getElementById('ranking-table').getElementsByTagName('tbody')[0];
            table.innerHTML = ''; // Limpar a tabela antes de preencher
            const rows = data.trim().split('\n').slice(1); // Ignora o cabeçalho

            rows.forEach(row => {
                const cols = row.split(',');
                const newRow = table.insertRow();

                cols.forEach(col => {
                    const newCell = newRow.insertCell();
                    const newText = document.createTextNode(col);
                    newCell.appendChild(newText);
                });
            });
        })
        .catch(error => console.error('Error fetching the CSV file:', error));
}


document.getElementById('calcularScoresButton').addEventListener('click', calcularScores);