let shoppingHistory = JSON.parse(localStorage.getItem('shoppingHistory')) || [];
let draftItems = JSON.parse(localStorage.getItem('draftItems')) || [];
let myChart = null;

window.onload = function() {
    document.getElementById('shoppingDate').value = new Date().toISOString().split('T')[0];
    setupMonthFilter();
    renderDraftList();
    displayHistory();
};

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if(tabId === 'tab-history') displayHistory();
}

// --- DRAFT LIST ---
function addQuickItem() {
    const input = document.getElementById('quickItemName');
    if (input.value.trim() === "") return;
    draftItems.push(input.value.trim());
    localStorage.setItem('draftItems', JSON.stringify(draftItems));
    input.value = "";
    renderDraftList();
}

function renderDraftList() {
    const ul = document.getElementById('draftList');
    ul.innerHTML = draftItems.map((item, index) => `
        <li>${item} <button class="delete-btn" onclick="removeDraft(${index})">&times;</button></li>
    `).join('');
}

function removeDraft(index) {
    draftItems.splice(index, 1);
    localStorage.setItem('draftItems', JSON.stringify(draftItems));
    renderDraftList();
}

function clearDraft() {
    if(confirm("Clear your entire list?")) {
        draftItems = [];
        localStorage.removeItem('draftItems');
        renderDraftList();
    }
}

// --- IN-STORE TABLE ---
function goToStoreTable() {
    if (draftItems.length === 0) return alert("Your list is empty!");
    const tbody = document.getElementById('storeTableBody');
    tbody.innerHTML = draftItems.map((item, index) => `
        <tr>
            <td style="font-size:14px; overflow:hidden;">${item}</td>
            <td><input type="number" class="store-qty" value="1" oninput="updateLiveTotal()"></td>
            <td><input type="number" class="store-price" placeholder="0.00" oninput="updateLiveTotal()"></td>
            <td style="text-align:center;"><input type="checkbox" class="store-check" onchange="updateLiveTotal()"></td>
        </tr>
    `).join('');
    updateLiveTotal();
    showTab('tab-store');
}

function updateLiveTotal() {
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

// --- DATA SAVING ---
function finalSave() {
    const rows = document.querySelectorAll('#storeTableBody tr');
    const finalItems = [];
    let grandTotal = 0;

    rows.forEach((row, index) => {
        if (row.querySelector('.store-check').checked) {
            const qty = parseFloat(row.querySelector('.store-qty').value) || 0;
            const price = parseFloat(row.querySelector('.store-price').value) || 0;
            finalItems.push({ name: draftItems[index], qty, price, total: qty * price });
            grandTotal += qty * price;
        }
    });

    if (finalItems.length === 0) return alert("No items checked!");

    shoppingHistory.push({ date: document.getElementById('shoppingDate').value, items: finalItems, total: grandTotal });
    localStorage.setItem('shoppingHistory', JSON.stringify(shoppingHistory));
    
    // Auto-clear list after saving
    draftItems = [];
    localStorage.removeItem('draftItems');
    renderDraftList();
    showTab('tab-history');
}

// --- ANALYTICS ---
function setupMonthFilter() {
    const filter = document.getElementById('monthFilter');
    const months = ["2026-01", "2025-12", "2025-11", "2025-10"];
    filter.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
}

function displayHistory() {
    const filter = document.getElementById('monthFilter').value;
    const filtered = shoppingHistory.filter(t => t.date.startsWith(filter));
    updateDashboard(filtered);
    const display = document.getElementById('historyDisplay');
    display.innerHTML = filtered.map(t => `
        <div class="history-item">
            <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:14px;">
                <span>${t.date}</span><span>$${t.total.toFixed(2)}</span>
            </div>
            <p style="font-size:11px; color:#777; margin:5px 0 0 0;">${t.items.map(i => i.name).join(', ')}</p>
        </div>
    `).join('') || "<p style='text-align:center; padding:20px; color:#999;'>No history found.</p>";
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

    if (myChart) myChart.destroy();
    const ctx = document.getElementById('spendingChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: Object.keys(daily).sort(), datasets: [{ label: 'Spend', data: Object.keys(daily).sort().map(d => daily[d]), backgroundColor: '#28a745' }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}

function clearHistory() {
    if(confirm("This will permanently delete ALL shopping history. Continue?")) {
        shoppingHistory = [];
        localStorage.removeItem('shoppingHistory');
        displayHistory();
    }
}
