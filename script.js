let shoppingHistory = JSON.parse(localStorage.getItem('shoppingHistory')) || [];
let myChart = null;

window.onload = function() {
    document.getElementById('shoppingDate').value = new Date().toISOString().split('T')[0];
    initializeTable();
    displayHistory();
};

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if(tabId === 'tab-history') displayHistory();
}

function initializeTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = ''; 
    for (let i = 0; i < 3; i++) { addRow(); }
}

function addRow() {
    const tbody = document.getElementById('tableBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="table-input item-name" placeholder="Item..." oninput="checkLastRow(this)"></td>
        <td><input type="number" class="table-input item-qty" value="1" oninput="calculateRowTotal(this)"></td>
        <td><input type="number" class="table-input item-price" placeholder="0.00" oninput="calculateRowTotal(this)"></td>
        <td class="total-cell">$0.00</td>
    `;
    tbody.appendChild(row);
}

function calculateRowTotal(input) {
    const row = input.closest('tr');
    const qty = row.querySelector('.item-qty').value || 0;
    const price = row.querySelector('.item-price').value || 0;
    const total = (parseFloat(qty) * parseFloat(price)).toFixed(2);
    row.querySelector('.total-cell').innerText = `$${total}`;
}

function checkLastRow(input) {
    const rows = document.querySelectorAll('#tableBody tr');
    if (input.closest('tr') === rows[rows.length - 1] && input.value !== '') {
        addRow();
    }
}

function checkout() {
    const rows = document.querySelectorAll('#tableBody tr');
    let items = [], grandTotal = 0;

    rows.forEach(row => {
        const name = row.querySelector('.item-name').value;
        const qty = parseFloat(row.querySelector('.item-qty').value);
        const price = parseFloat(row.querySelector('.item-price').value);
        if (name && qty && price) {
            items.push({ name, qty, price, total: qty * price });
            grandTotal += qty * price;
        }
    });

    if (items.length === 0) return alert("Please add items!");
    
    shoppingHistory.push({ date: document.getElementById('shoppingDate').value, items, total: grandTotal });
    localStorage.setItem('shoppingHistory', JSON.stringify(shoppingHistory));
    
    initializeTable();
    showTab('tab-history');
}

function reAdd(name, price) {
    showTab('tab-shopping');
    const rows = document.querySelectorAll('#tableBody tr');
    let targetRow = null;

    // Find first empty row
    for (let row of rows) {
        if (!row.querySelector('.item-name').value) {
            targetRow = row;
            break;
        }
    }

    if (targetRow) {
        targetRow.querySelector('.item-name').value = name;
        targetRow.querySelector('.item-price').value = price;
        calculateRowTotal(targetRow.querySelector('.item-price'));
        checkLastRow(targetRow.querySelector('.item-name'));
    }
}

function displayHistory() {
    const filter = document.getElementById('monthFilter').value;
    const filtered = shoppingHistory.filter(t => t.date.startsWith(filter));
    updateDashboard(filtered);
    
    const display = document.getElementById('historyDisplay');
    if (filtered.length === 0) { display.innerHTML = "<p>No data.</p>"; return; }

    display.innerHTML = filtered.map(trip => `
        <div class="history-item">
            <div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom:8px;">
                <span>${trip.date}</span><span>$${trip.total.toFixed(2)}</span>
            </div>
            ${trip.items.map(i => `
                <div style="display:flex; justify-content:space-between; font-size:13px; color:#555; margin-bottom:4px;">
                    <span>${i.name} (x${i.qty})</span>
                    <button class="copy-btn" onclick="reAdd('${i.name}', ${i.price})">Add Again</button>
                </div>`).join('')}
        </div>
    `).join('');
}

function updateDashboard(trips) {
    let total = 0, counts = {}, daily = {};
    trips.forEach(t => {
        total += t.total;
        daily[t.date] = (daily[t.date] || 0) + t.total;
        t.items.forEach(i => counts[i.name] = (counts[i.name] || 0) + 1);
    });
    document.getElementById('totalSpent').innerText = `$${total.toFixed(2)}`;
    const top = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, "None");
    document.getElementById('topProduct').innerText = top;
    
    const ctx = document.getElementById('spendingChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: Object.keys(daily).sort(), datasets: [{ label: 'Spend', data: Object.keys(daily).sort().map(d => daily[d]), backgroundColor: '#28a745' }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}
