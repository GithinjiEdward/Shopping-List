let shoppingHistory = JSON.parse(localStorage.getItem('shoppingHistory')) || [];
let myChart = null;

window.onload = function() {
    document.getElementById('shoppingDate').value = new Date().toISOString().split('T')[0];
    initializeTable();
    setupMonthFilter();
    displayHistory();
};

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if(tabId === 'tab-history') displayHistory();
}

// --- DRAFTING TABLE (Auto-add rows) ---
function initializeTable() {
    const tbody = document.getElementById('draftTableBody');
    tbody.innerHTML = '';
    for (let i = 0; i < 3; i++) { addDraftRow(); }
}

function addDraftRow() {
    const tbody = document.getElementById('draftTableBody');
    const rowCount = tbody.rows.length + 1;
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="row-num">${rowCount}</td>
        <td><input type="text" class="table-input draft-name" placeholder="Enter item..." oninput="handleRowInput(this)"></td>
    `;
    tbody.appendChild(row);
}

function handleRowInput(input) {
    const rows = document.querySelectorAll('#draftTableBody tr');
    const lastRow = rows[rows.length - 1];
    const secondToLast = rows[rows.length - 2];
    
    // Add row if the last row starts getting filled
    if (input.closest('tr') === lastRow && input.value !== '') {
        addDraftRow();
    }
}

// --- TRANSITION TO STORE ---
function goToStore() {
    const names = Array.from(document.querySelectorAll('.draft-name'))
                       .map(i => i.value.trim())
                       .filter(v => v !== '');

    if (names.length === 0) return alert("Your list is empty!");

    const tbody = document.getElementById('storeTableBody');
    tbody.innerHTML = names.map(name => `
        <tr>
            <td style="font-size:14px;">${name}</td>
            <td><input type="number" class="store-qty" value="1" oninput="calculateLiveTotal()"></td>
            <td><input type="number" class="store-price" placeholder="0.00" oninput="calculateLiveTotal()"></td>
            <td style="text-align:center;"><input type="checkbox" class="store-check" onchange="calculateLiveTotal()"></td>
        </tr>
    `).join('');

    calculateLiveTotal();
    showTab('tab-store');
}

function calculateLiveTotal() {
    let total = 0;
    document.querySelectorAll('#storeTableBody tr').forEach(row => {
        const qty = row.querySelector('.store-qty').value || 0;
        const price = row.querySelector('.store-price').value || 0;
        if (row.querySelector('.store-check').checked) {
            total += (parseFloat(qty) * parseFloat(price));
        }
    });
    document.getElementById('liveTotal').innerText = `$${total.toFixed(2)}`;
}

// --- FINAL SAVE ---
function finalSave() {
    const rows = document.querySelectorAll('#storeTableBody tr');
    const items = [];
    let grandTotal = 0;

    rows.forEach(row => {
        if (row.querySelector('.store-check').checked) {
            const name = row.cells[0].innerText;
            const qty = parseFloat(row.querySelector('.store-qty').value) || 0;
            const price = parseFloat(row.querySelector('.store-price').value) || 0;
            items.push({ name, qty, price, total: qty * price });
            grandTotal += (qty * price);
        }
    });

    if (items.length === 0) return alert("Nothing checked as purchased!");

    shoppingHistory.push({
        date: document.getElementById('shoppingDate').value,
        items: items,
        total: grandTotal
    });

    localStorage.setItem('shoppingHistory', JSON.stringify(shoppingHistory));
    alert("Saved to History!");
    initializeTable();
    showTab('tab-history');
}

// --- ANALYTICS & HISTORY ---
function setupMonthFilter() {
    const filter = document.getElementById('monthFilter');
    const now = new Date();
    let options = "";
    for(let i=0; i<4; i++) {
        let d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        let m = d.toISOString().substring(0, 7);
        options += `<option value="${m}">${m}</option>`;
    }
    filter.innerHTML = options;
}

function displayHistory() {
    const filter = document.getElementById('monthFilter').value;
    const filtered = shoppingHistory.filter(t => t.date.startsWith(filter));
    
    updateDashboard(filtered);
    
    const display = document.getElementById('historyDisplay');
    display.innerHTML = filtered.map(t => `
        <div class="history-item" style="border-bottom:1px solid #eee; padding:10px 0;">
            <div style="display:flex; justify-content:space-between; font-weight:bold;">
                <span>${t.date}</span><span>$${t.total.toFixed(2)}</span>
            </div>
            <p style="font-size:11px; color:#888; margin:5px 0;">${t.items.map(i => i.name).join(', ')}</p>
        </div>
    `).join('') || "<p style='text-align:center; color:#999;'>No history.</p>";
}

function updateDashboard(trips) {
    let total = trips.reduce((s, t) => s + t.total, 0);
    document.getElementById('totalSpent').innerText = `$${total.toFixed(2)}`;
    
    const counts = {};
    const daily = {};
    trips.forEach(t => {
        daily[t.date] = (daily[t.date] || 0) + t.total;
        t.items.forEach(i => counts[i.name] = (counts[i.name] || 0) + 1);
    });
    
    const top = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, "None");
    document.getElementById('topProduct').innerText = top;

    const ctx = document.getElementById('spendingChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: { 
            labels: Object.keys(daily).sort(), 
            datasets: [{ label: 'Daily Spend', data: Object.keys(daily).sort().map(d => daily[d]), backgroundColor: '#28a745' }] 
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}

function clearHistory() {
    if(confirm("Delete all history?")) {
        shoppingHistory = [];
        localStorage.removeItem('shoppingHistory');
        displayHistory();
    }
}
