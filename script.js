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
    for (let i = 0; i < 4; i++) addDraftRow();
}

function addDraftRow() {
    const tbody = document.getElementById('draftTableBody');
    const row = document.createElement('tr');
    row.innerHTML = `<td>${tbody.rows.length + 1}</td><td><input type="text" class="table-input draft-name" placeholder="Item..." oninput="handleRowInput(this)"></td>`;
    tbody.appendChild(row);
}

function handleRowInput(input) {
    const rows = document.querySelectorAll('#draftTableBody tr');
    if (input.closest('tr') === rows[rows.length - 1] && input.value !== '') addDraftRow();
}

// --- STORE ---
function goToStore() {
    const names = Array.from(document.querySelectorAll('.draft-name')).map(i => i.value.trim()).filter(v => v !== '');
    if (names.length === 0) return alert("Please list some items first.");
    const storeBody = document.getElementById('storeTableBody');
    storeBody.innerHTML = names.map(name => `
        <tr>
            <td>${name}</td>
            <td><input type="number" class="store-qty" value="1" min="1" style="width:40px"></td>
            <td><input type="number" class="store-price" placeholder="0.00" step="0.01" oninput="calculateLiveTotal()" style="width:60px"></td>
            <td style="text-align:center;"><input type="checkbox" class="store-check" onchange="calculateLiveTotal()"></td>
        </tr>`).join('');
    calculateLiveTotal();
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

// --- FINAL SAVE (History + Pending) ---
function finalSave() {
    const rows = document.querySelectorAll('#storeTableBody tr');
    const bought = [];
    const missed = [];
    let spent = 0;
    const budget = parseFloat(document.getElementById('budgetInput').value) || 0;

    rows.forEach(row => {
        const name = row.cells[0].innerText;
        if (row.querySelector('.store-check').checked) {
            const qty = parseFloat(row.querySelector('.store-qty').value) || 0;
            const price = parseFloat(row.querySelector('.store-price').value) || 0;
            bought.push({ name, qty, price, total: qty * price });
            spent += (qty * price);
        } else {
            missed.push(name);
        }
    });

    // Save to history
    shoppingHistory.push({
        date: document.getElementById('shoppingDate').value,
        items: bought,
        totalSpent: spent,
        budget: budget
    });
    localStorage.setItem('shoppingHistory', JSON.stringify(shoppingHistory));

    // Handle skipped items
    if (missed.length > 0) {
        pendingItems = [...new Set([...pendingItems, ...missed])];
        localStorage.setItem('pendingItems', JSON.stringify(pendingItems));
    }

    // Reset UI
    document.getElementById('budgetInput').value = '';
    document.getElementById('storeTableBody').innerHTML = '';
    initializeTable();
    alert("Purchase Saved!");
    showTab('tab-pending');
}

// --- PENDING LIST ---
function renderPendingList() {
    const container = document.getElementById('pendingList');
    if (!pendingItems.length) return container.innerHTML = "<p style='text-align:center; color:#999;'>No pending items.</p>";
    container.innerHTML = pendingItems.map((item, index) => `
        <li><span>${item}</span><button class="remove-all-btn" onclick="removeOnePending(${index})">X</button></li>`).join('');
}

function removeOnePending(index) {
    pendingItems.splice(index, 1);
    localStorage.setItem('pendingItems', JSON.stringify(pendingItems));
    renderPendingList();
}

function clearAllPending() {
    if (confirm("Remove all items from Pending?")) {
        pendingItems = [];
        localStorage.removeItem('pendingItems');
        renderPendingList();
    }
}

function movePendingToList() {
    if (!pendingItems.length) return;
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

// --- HISTORY DASHBOARD ---
function displayHistory() {
    const filter = document.getElementById('monthFilter').value;
    const filtered = shoppingHistory.filter(t => t.date.startsWith(filter));
    
    let totalSpent = filtered.reduce((s, t) => s + (t.totalSpent || 0), 0);
    let totalBudget = filtered.reduce((s, t) => s + (t.budget || 0), 0);
    let diff = totalBudget - totalSpent;

    document.getElementById('totalSpent').innerText = `$${totalSpent.toFixed(2)}`;
    document.getElementById('totalBudget').innerText = `$${totalBudget.toFixed(2)}`;
    
    const diffEl = document.getElementById('budgetDiff');
    if (diff < 0) {
        diffEl.innerText = `($${Math.abs(diff).toFixed(2)})`;
        diffEl.className = "diff-over";
    } else {
        diffEl.innerText = `$${diff.toFixed(2)} ✓`;
        diffEl.className = "diff-under";
    }

    updateChart(filtered);

    // Purchase Logs Table
    const container = document.getElementById('historyTableContainer');
    if (!filtered.length) return container.innerHTML = "<p style='text-align:center; padding:20px;'>No history.</p>";
    container.innerHTML = filtered.reverse().map(trip => `
        <div class="log-date-header">${trip.date} | Budget: $${(trip.budget || 0).toFixed(2)}</div>
        <table class="log-table">
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
            <tbody>${trip.items.map(i => `<tr><td>${i.name}</td><td>${i.qty}</td><td>$${i.price.toFixed(2)}</td><td>$${i.total.toFixed(2)}</td></tr>`).join('')}</tbody>
        </table>`).join('');
}

function updateChart(trips) {
    const ctx = document.getElementById('spendingChart').getContext('2d');
    const daily = {};
    trips.forEach(t => daily[t.date] = (daily[t.date] || 0) + (t.totalSpent || 0));
    
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(daily).sort(),
            datasets: [{ label: 'Spent per Day', data: Object.keys(daily).sort().map(d => daily[d]), backgroundColor: '#28a745' }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}

function setupMonthFilter() {
    const filter = document.getElementById('monthFilter');
    const months = ["2026-01", "2025-12", "2025-11", "2025-10"];
    filter.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
}

function clearHistory() { if(confirm("Delete all purchase history?")) { shoppingHistory = []; localStorage.removeItem('shoppingHistory'); displayHistory(); } }
