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

// --- DRAFTING LOGIC ---
function initializeTable() {
    const tbody = document.getElementById('draftTableBody');
    tbody.innerHTML = '';
    for (let i = 0; i < 3; i++) addDraftRow();
}

function addDraftRow() {
    const tbody = document.getElementById('draftTableBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td style="color:#ccc; font-weight:bold;">${tbody.rows.length + 1}</td>
        <td><input type="text" class="table-input draft-name" placeholder="Item name..." oninput="handleRowInput(this)"></td>
    `;
    tbody.appendChild(row);
}

function handleRowInput(input) {
    const rows = document.querySelectorAll('#draftTableBody tr');
    if (input.closest('tr') === rows[rows.length - 1] && input.value !== '') addDraftRow();
}

// --- STORE TRANSITION ---
function goToStore() {
    const names = Array.from(document.querySelectorAll('.draft-name'))
                       .map(i => i.value.trim()).filter(v => v !== '');
    if (names.length === 0) return alert("Please add items to your list first.");

    const storeBody = document.getElementById('storeTableBody');
    storeBody.innerHTML = names.map(name => `
        <tr>
            <td style="font-weight:600;">${name}</td>
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
        if (row.querySelector('.store-check').checked) {
            const qty = parseFloat(row.querySelector('.store-qty').value) || 0;
            const price = parseFloat(row.querySelector('.store-price').value) || 0;
            total += (qty * price);
        }
    });
    document.getElementById('liveTotal').innerText = `$${total.toFixed(2)}`;
}

// --- SPLIT SAVE LOGIC ---
function finalSave() {
    const rows = document.querySelectorAll('#storeTableBody tr');
    const boughtItems = [];
    const missedItems = [];
    let grandTotal = 0;

    rows.forEach(row => {
        const name = row.cells[0].innerText;
        const isChecked = row.querySelector('.store-check').checked;
        if (isChecked) {
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

    alert("Purchase Saved! Checked items moved to History. Unchecked moved to Pending.");
    initializeTable();
    showTab('tab-pending');
}

// --- PENDING LOGIC ---
function renderPendingList() {
    const container = document.getElementById('pendingList');
    if (pendingItems.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#999;'>All items found! List is clear.</p>";
        return;
    }
    container.innerHTML = pendingItems.map((item, index) => `
        <li><span>${item}</span><button class="clear-link" onclick="removePending(${index})">Delete</button></li>
    `).join('');
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
    pendingItems.forEach((item, index) => {
        if (index < inputs.length) {
            inputs[index].value = item;
            if (index === inputs.length - 1) addDraftRow();
        }
    });
    pendingItems = [];
    localStorage.removeItem('pendingItems');
}

// --- ANALYTICS ---
function setupMonthFilter() {
    const filter = document.getElementById('monthFilter');
    const months = ["2026-01", "2025-12", "2025-11", "2025-10"];
    filter.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
}

function displayHistory() {
    const filterValue = document.getElementById('monthFilter').value;
    const filtered = shoppingHistory.filter(t => t.date.startsWith(filterValue));
    updateDashboard(filtered);
    const container = document.getElementById('historyDisplay');
    container.innerHTML = filtered.map(t => `
        <div style="border:1px solid #eee; padding:12px; border-radius:10px; margin-top:10px;">
            <div style="display:flex; justify-content:space-between; font-weight:bold;"><span>${t.date}</span><span>$${t.total.toFixed(2)}</span></div>
            <p style="font-size:11px; color:#777; margin:5px 0 0 0;">${t.items.map(i => i.name).join(', ')}</p>
        </div>`).join('') || "<p style='text-align:center; color:#999;'>No history.</p>";
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
        data: { labels: Object.keys(daily).sort(), datasets: [{ label: 'Spend', data: Object.keys(daily).sort().map(d => daily[d]), backgroundColor: '#28a745' }] }
    });
}

function clearHistory() { if(confirm("Clear all history?")) { shoppingHistory = []; localStorage.removeItem('shoppingHistory'); displayHistory(); } }
