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
    const rowCount = tbody.rows.length + 1;
    const row = document.createElement('tr');
    row.innerHTML = `<td>${rowCount}</td><td><input type="text" class="table-input draft-name" placeholder="Item name..." oninput="handleRowInput(this)"></td>`;
    tbody.appendChild(row);
}

function handleRowInput(input) {
    const rows = document.querySelectorAll('#draftTableBody tr');
    if (input.closest('tr') === rows[rows.length - 1] && input.value !== '') addDraftRow();
}

// --- STORE ---
function goToStore() {
    const names = Array.from(document.querySelectorAll('.draft-name')).map(i => i.value.trim()).filter(v => v !== '');
    if (names.length === 0) return alert("Your list is empty!");
    const storeBody = document.getElementById('storeTableBody');
    storeBody.innerHTML = names.map(name => `
        <tr>
            <td>${name}</td>
            <td><input type="number" class="store-qty" value="1" min="1" oninput="calculateLiveTotal()"></td>
            <td><input type="number" class="store-price" placeholder="0.00" step="0.01" oninput="calculateLiveTotal()"></td>
            <td style="text-align:center;"><input type="checkbox" class="store-check" onchange="calculateLiveTotal()"></td>
        </tr>`).join('');
    calculateLiveTotal();
    showTab('tab-store');
}

function calculateLiveTotal() {
    let total = 0;
    document.querySelectorAll('#storeTableBody tr').forEach(row => {
        if (row.querySelector('.store-check').checked) {
            const qty = parseFloat(row.querySelector('.store-qty').value) || 0;
            const price = parseFloat(row.querySelector('.store-price').value) || 0;
            total += (qty * price);
        }
    });
    document.getElementById('liveTotal').innerText = `$${total.toFixed(2)}`;
}

// --- SAVE ---
function finalSave() {
    const rows = document.querySelectorAll('#storeTableBody tr');
    const bought = [];
    const missed = [];
    let total = 0;

    rows.forEach(row => {
        const name = row.cells[0].innerText;
        if (row.querySelector('.store-check').checked) {
            const qty = parseFloat(row.querySelector('.store-qty').value) || 0;
            const price = parseFloat(row.querySelector('.store-price').value) || 0;
            bought.push({ name, qty, price, total: qty * price });
            total += (qty * price);
        } else {
            missed.push(name);
        }
    });

    if (bought.length > 0) {
        shoppingHistory.push({ date: document.getElementById('shoppingDate').value, items: bought, total: total });
        localStorage.setItem('shoppingHistory', JSON.stringify(shoppingHistory));
    }
    if (missed.length > 0) {
        pendingItems = [...new Set([...pendingItems, ...missed])];
        localStorage.setItem('pendingItems', JSON.stringify(pendingItems));
    }

    document.getElementById('storeTableBody').innerHTML = '';
    initializeTable();
    alert("Saved successfully!");
    showTab('tab-pending');
}

// --- PENDING LOGIC ---
function renderPendingList() {
    const container = document.getElementById('pendingList');
    if (pendingItems.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#999; margin-top:20px;'>No pending items.</p>";
        return;
    }
    container.innerHTML = pendingItems.map((item, index) => `
        <li>
            <span>${item}</span>
            <button class="delete-item" onclick="removePending(${index})">&times;</button>
        </li>`).join('');
}

function removePending(index) {
    pendingItems.splice(index, 1);
    localStorage.setItem('pendingItems', JSON.stringify(pendingItems));
    renderPendingList();
}

function clearAllPending() {
    if (pendingItems.length === 0) return;
    if (confirm("Permanently remove all items from this list?")) {
        pendingItems = [];
        localStorage.removeItem('pendingItems');
        renderPendingList();
    }
}

function movePendingToList() {
    if (pendingItems.length === 0) return alert("Nothing to move!");
    showTab('tab-shopping');
    initializeTable();
    const inputs = document.querySelectorAll('.draft-name');
    pendingItems.forEach((item, index) => {
        if (index < inputs.length) {
            inputs[index].value = item;
            if (index === inputs.length - 1) addDraftRow();
        }
    });
    pendingItems = [];
    localStorage.removeItem('pendingItems');
}

// --- HISTORY ---
function displayHistory() {
    const filter = document.getElementById('monthFilter').value;
    const filtered = shoppingHistory.filter(t => t.date.startsWith(filter));
    updateDashboard(filtered);
    const container = document.getElementById('historyTableContainer');
    if (!filtered.length) return container.innerHTML = "<p style='text-align:center; padding:20px;'>No logs found.</p>";

    container.innerHTML = filtered.reverse().map(trip => `
        <div class="log-date-header">${trip.date} - Total: $${trip.total.toFixed(2)}</div>
        <table class="log-table">
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>${trip.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>$${i.price.toFixed(2)}</td><td>$${i.total.toFixed(2)}</td></tr>`).join('')}</tbody>
        </table>`).join('');
}

function updateDashboard(trips) {
    let total = trips.reduce((s, t) => s + t.total, 0);
    document.getElementById('totalSpent').innerText = `$${total.toFixed(2)}`;
    const daily = {};
    const counts = {};
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
        data: { labels: Object.keys(daily).sort(), datasets: [{ label: 'Daily Spend', data: Object.keys(daily).sort().map(d => daily[d]), backgroundColor: '#28a745' }] }
    });
}

function setupMonthFilter() {
    const filter = document.getElementById('monthFilter');
    const months = ["2026-01", "2025-12", "2025-11", "2025-10"];
    filter.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
}

function clearHistory() { if(confirm("Clear history?")) { shoppingHistory = []; localStorage.removeItem('shoppingHistory'); displayHistory(); } }
