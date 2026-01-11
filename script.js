let shoppingHistory = JSON.parse(localStorage.getItem('shoppingHistory')) || [];
let pendingItems = JSON.parse(localStorage.getItem('pendingItems')) || [];
let myChart = null;

window.onload = function() {
    document.getElementById('shoppingDate').value = new Date().toISOString().split('T')[0];
    initializeTable();
    setupMonthFilter();
    displayHistory();
};

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if(tabId === 'tab-history') displayHistory();
    if(tabId === 'tab-pending') renderPendingList();
}

function showHistorySub(type) {
    document.getElementById('sub-history-graph').style.display = type === 'graph' ? 'block' : 'none';
    document.getElementById('sub-history-logs').style.display = type === 'logs' ? 'block' : 'none';
    document.getElementById('btn-graph').classList.toggle('active', type === 'graph');
    document.getElementById('btn-logs').classList.toggle('active', type === 'logs');
}

// --- DRAFTING ---
function initializeTable() {
    const tbody = document.getElementById('draftTableBody');
    tbody.innerHTML = '';
    for (let i = 0; i < 3; i++) addDraftRow();
}

function addDraftRow() {
    const tbody = document.getElementById('draftTableBody');
    const row = document.createElement('tr');
    row.innerHTML = `<td>${tbody.rows.length + 1}</td><td><input type="text" class="table-input draft-name" oninput="handleRowInput(this)"></td>`;
    tbody.appendChild(row);
}

function handleRowInput(input) {
    const rows = document.querySelectorAll('#draftTableBody tr');
    if (input.closest('tr') === rows[rows.length - 1] && input.value !== '') addDraftRow();
}

// --- STORE ---
function goToStore() {
    const names = Array.from(document.querySelectorAll('.draft-name')).map(i => i.value.trim()).filter(v => v !== '');
    if (names.length === 0) return alert("List is empty!");
    const storeBody = document.getElementById('storeTableBody');
    storeBody.innerHTML = names.map(name => `
        <tr>
            <td>${name}</td>
            <td><input type="number" class="store-qty" value="1" oninput="calculateLiveTotal()"></td>
            <td><input type="number" class="store-price" placeholder="0.00" oninput="calculateLiveTotal()"></td>
            <td><input type="checkbox" class="store-check" onchange="calculateLiveTotal()"></td>
        </tr>`).join('');
    showTab('tab-store');
}

function calculateLiveTotal() {
    let total = 0;
    document.querySelectorAll('#storeTableBody tr').forEach(row => {
        if (row.querySelector('.store-check').checked) {
            total += (parseFloat(row.querySelector('.store-qty').value) || 0) * (parseFloat(row.querySelector('.store-price').value) || 0);
        }
    });
    document.getElementById('liveTotal').innerText = `$${total.toFixed(2)}`;
}

// --- SAVE LOGIC ---
function finalSave() {
    const rows = document.querySelectorAll('#storeTableBody tr');
    const boughtItems = [];
    const missedItems = [];
    let grandTotal = 0;

    rows.forEach(row => {
        const name = row.cells[0].innerText;
        if (row.querySelector('.store-check').checked) {
            const qty = parseFloat(row.querySelector('.store-qty').value) || 0;
            const price = parseFloat(row.querySelector('.store-price').value) || 0;
            boughtItems.push({ name, qty, price, total: qty * price });
            grandTotal += (qty * price);
        } else {
            missedItems.push(name);
        }
    });

    if (boughtItems.length > 0) {
        shoppingHistory.push({ date: document.getElementById('shoppingDate').value, items: boughtItems, total: grandTotal });
        localStorage.setItem('shoppingHistory', JSON.stringify(shoppingHistory));
    }

    if (missedItems.length > 0) {
        pendingItems = [...new Set([...pendingItems, ...missedItems])];
        localStorage.setItem('pendingItems', JSON.stringify(pendingItems));
    }

    // Auto-clear Store tab and Draft list
    document.getElementById('storeTableBody').innerHTML = '';
    initializeTable();
    alert("Saved! Check Pending tab for items you didn't buy.");
    showTab('tab-pending');
}

// --- PENDING & HISTORY ---
function renderPendingList() {
    const container = document.getElementById('pendingList');
    container.innerHTML = pendingItems.length ? pendingItems.map((item, index) => `
        <li><span>${item}</span><button class="clear-link" onclick="removePending(${index})">Remove</button></li>`).join('') 
        : "<p style='text-align:center; color:#999;'>List clear!</p>";
}

function removePending(index) {
    pendingItems.splice(index, 1);
    localStorage.setItem('pendingItems', JSON.stringify(pendingItems));
    renderPendingList();
}

function movePendingToList() {
    showTab('tab-shopping');
    initializeTable();
    const inputs = document.querySelectorAll('.draft-name');
    pendingItems.forEach((item, index) => { if (index < inputs.length) { inputs[index].value = item; if (index === inputs.length - 1) addDraftRow(); } });
    pendingItems = [];
    localStorage.removeItem('pendingItems');
}

function displayHistory() {
    const filter = document.getElementById('monthFilter').value;
    const filtered = shoppingHistory.filter(t => t.date.startsWith(filter));
    updateDashboard(filtered);
    
    const container = document.getElementById('historyTableContainer');
    if (!filtered.length) return container.innerHTML = "<p style='text-align:center;'>No logs.</p>";

    container.innerHTML = filtered.reverse().map(trip => `
        <div class="log-date-header">${trip.date} (Total: $${trip.total.toFixed(2)})</div>
        <table class="log-table">
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Sum</th></tr></thead>
            <tbody>${trip.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>$${i.price.toFixed(2)}</td><td>$${i.total.toFixed(2)}</td></tr>`).join('')}</tbody>
        </table>`).join('');
}

function updateDashboard(trips) {
    let total = trips.reduce((s, t) => s + t.total, 0);
    document.getElementById('totalSpent').innerText = `$${total.toFixed(2)}`;
    const daily = {};
    trips.forEach(t => daily[t.date] = (daily[t.date] || 0) + t.total);
    
    const ctx = document.getElementById('spendingChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: Object.keys(daily).sort(), datasets: [{ label: 'Spend', data: Object.keys(daily).sort().map(d => daily[d]), backgroundColor: '#28a745' }] }
    });
}

function setupMonthFilter() {
    const filter = document.getElementById('monthFilter');
    const months = ["2026-01", "2025-12", "2025-11", "2025-10"];
    filter.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
}

function clearHistory() { if(confirm("Clear history?")) { shoppingHistory = []; localStorage.removeItem('shoppingHistory'); displayHistory(); } }
