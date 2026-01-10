let shoppingHistory = JSON.parse(localStorage.getItem('shoppingHistory')) || [];
let myChart = null;
let preparedItems = [];

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

// --- DRAFTING TABLE LOGIC ---
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
    row.querySelector('.total-cell').innerText = `$${(qty * price).toFixed(2)}`;
}

function checkLastRow(input) {
    const rows = document.querySelectorAll('#tableBody tr');
    if (input.closest('tr') === rows[rows.length - 1] && input.value !== '') addRow();
}

// --- CHECKLIST TRANSITION ---
function goToChecklist() {
    preparedItems = [];
    const rows = document.querySelectorAll('#tableBody tr');
    
    rows.forEach(row => {
        const name = row.querySelector('.item-name').value;
        const qty = parseFloat(row.querySelector('.item-qty').value);
        const price = parseFloat(row.querySelector('.item-price').value);
        if (name && qty && price) {
            preparedItems.push({ name, qty, price, total: qty * price });
        }
    });

    if (preparedItems.length === 0) return alert("Please add items to your list first!");

    const checklistBody = document.getElementById('checklistBody');
    checklistBody.innerHTML = preparedItems.map((item, index) => `
        <tr>
            <td id="name-${index}">${item.name} (x${item.qty})</td>
            <td>$${item.total.toFixed(2)}</td>
            <td style="text-align:center;">
                <input type="checkbox" onchange="toggleStrike(${index}, this)">
            </td>
        </tr>
    `).join('');

    showTab('tab-checklist');
}

function toggleStrike(index, checkbox) {
    const nameCell = document.getElementById(`name-${index}`);
    checkbox.checked ? nameCell.classList.add('strikethrough') : nameCell.classList.remove('strikethrough');
}

// --- FINAL DATA SAVE ---
function finalSave() {
    const checkboxes = document.querySelectorAll('#checklistBody input[type="checkbox"]');
    const finalPurchasedItems = preparedItems.filter((item, index) => checkboxes[index].checked);

    if (finalPurchasedItems.length === 0) {
        if (!confirm("No items checked. Save empty trip?")) return;
    }

    const total = finalPurchasedItems.reduce((sum, item) => sum + item.total, 0);
    const date = document.getElementById('shoppingDate').value;

    shoppingHistory.push({ date, items: finalPurchasedItems, total });
    localStorage.setItem('shoppingHistory', JSON.stringify(shoppingHistory));

    alert("Purchase saved! Check your history.");
    initializeTable();
    showTab('tab-history');
}

// --- HISTORY & ANALYTICS ---
function displayHistory() {
    const filter = document.getElementById('monthFilter').value;
    const filtered = shoppingHistory.filter(t => t.date.startsWith(filter));
    updateDashboard(filtered);
    
    const display = document.getElementById('historyDisplay');
    display.innerHTML = filtered.length ? filtered.map(trip => `
        <div class="history-item">
            <div style="display:flex; justify-content:space-between; font-weight:bold; border-bottom:1px solid #eee; padding-bottom:5px;">
                <span>${trip.date}</span><span>$${trip.total.toFixed(2)}</span>
            </div>
            ${trip.items.map(i => `
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-top:8px;">
                    <span>${i.name} (x${i.qty})</span>
                    <button class="copy-btn" style="font-size:10px; background:#eef; border:none; border-radius:4px; padding:2px 6px;" onclick="reAdd('${i.name}', ${i.price})">Add Again</button>
                </div>`).join('')}
        </div>`).join('') : "<p style='text-align:center; margin-top:20px;'>No history found.</p>";
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
        data: { 
            labels: Object.keys(daily).sort(), 
            datasets: [{ label: 'Daily Spend', data: Object.keys(daily).sort().map(d => daily[d]), backgroundColor: '#28a745' }] 
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}
/*jhjj*/
function reAdd(name, price) {
    showTab('tab-shopping');
    const rows = document.querySelectorAll('#tableBody tr');
    let targetRow = Array.from(rows).find(r => !r.querySelector('.item-name').value);
    if (targetRow) {
        targetRow.querySelector('.item-name').value = name;
        targetRow.querySelector('.item-price').value = price;
        calculateRowTotal(targetRow.querySelector('.item-price'));
        checkLastRow(targetRow.querySelector('.item-name'));
    }
}
