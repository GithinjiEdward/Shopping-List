let shoppingHistory = JSON.parse(localStorage.getItem('shoppingHistory')) || [];
let myChart = null;

// Initialize when page loads
window.onload = function() {
    document.getElementById('shoppingDate').value = new Date().toISOString().split('T')[0];
    initializeTable(); // Ensures the input table is built
    setupMonthFilter();
    displayHistory();
};

// --- NAVIGATION LOGIC ---
function showTab(tabId) {
    // Hide all tabs
    const tabs = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }
    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    
    if(tabId === 'tab-history') displayHistory();
}

// --- DRAFTING TABLE LOGIC ---
function initializeTable() {
    const tbody = document.getElementById('draftTableBody');
    tbody.innerHTML = '';
    // Start with 3 blank rows
    for (let i = 0; i < 3; i++) {
        addDraftRow();
    }
}

function addDraftRow() {
    const tbody = document.getElementById('draftTableBody');
    const rowCount = tbody.rows.length + 1;
    const row = document.createElement('tr');
    row.innerHTML = `
        <td style="color:#ccc; font-weight:bold;">${rowCount}</td>
        <td><input type="text" class="table-input draft-name" placeholder="Type item here..." oninput="handleRowInput(this)"></td>
    `;
    tbody.appendChild(row);
}

function handleRowInput(input) {
    const rows = document.querySelectorAll('#draftTableBody tr');
    const lastRow = rows[rows.length - 1];
    // If user types in the last row, add a new one automatically
    if (input.closest('tr') === lastRow && input.value !== '') {
        addDraftRow();
    }
}

// --- TRANSITION TO STORE (PHASE 2) ---
function goToStore() {
    const inputs = document.querySelectorAll('.draft-name');
    const names = [];
    inputs.forEach(input => {
        if (input.value.trim() !== "") names.push(input.value.trim());
    });

    if (names.length === 0) {
        alert("Please enter at least one item in the list.");
        return;
    }

    const storeBody = document.getElementById('storeTableBody');
    storeBody.innerHTML = ''; // Clear previous

    names.forEach(name => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="font-weight:600;">${name}</td>
            <td><input type="number" class="store-qty" value="1" min="1" oninput="calculateLiveTotal()"></td>
            <td><input type="number" class="store-price" placeholder="0.00" step="0.01" oninput="calculateLiveTotal()"></td>
            <td style="text-align:center;"><input type="checkbox" class="store-check" onchange="calculateLiveTotal()"></td>
        `;
        storeBody.appendChild(row);
    });

    calculateLiveTotal();
    showTab('tab-store'); // Switch page
}

function calculateLiveTotal() {
    let total = 0;
    const rows = document.querySelectorAll('#storeTableBody tr');
    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.store-qty').value) || 0;
        const price = parseFloat(row.querySelector('.store-price').value) || 0;
        const isChecked = row.querySelector('.store-check').checked;
        if (isChecked) {
            total += (qty * price);
        }
    });
    document.getElementById('liveTotal').innerText = `$${total.toFixed(2)}`;
}

// --- FINAL SAVE ---
function finalSave() {
    const rows = document.querySelectorAll('#storeTableBody tr');
    const purchasedItems = [];
    let grandTotal = 0;

    rows.forEach(row => {
        const isChecked = row.querySelector('.store-check').checked;
        if (isChecked) {
            const name = row.cells[0].innerText;
            const qty = parseFloat(row.querySelector('.store-qty').value) || 0;
            const price = parseFloat(row.querySelector('.store-price').value) || 0;
            purchasedItems.push({ name, qty, price, total: qty * price });
            grandTotal += (qty * price);
        }
    });

    if (purchasedItems.length === 0) {
        alert("Please check at least one item that you bought.");
        return;
    }

    const tripData = {
        date: document.getElementById('shoppingDate').value,
        items: purchasedItems,
        total: grandTotal
    };

    shoppingHistory.push(tripData);
    localStorage.setItem('shoppingHistory', JSON.stringify(shoppingHistory));
    
    alert("Shopping Trip Saved!");
    initializeTable(); // Reset first page
    showTab('tab-history'); // Go to analytics
}

// --- ANALYTICS LOGIC ---
function setupMonthFilter() {
    const filter = document.getElementById('monthFilter');
    const months = ["2026-01", "2025-12", "2025-11", "2025-10"];
    filter.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
}

function displayHistory() {
    const filterValue = document.getElementById('monthFilter').value;
    const filtered = shoppingHistory.filter(item => item.date.startsWith(filterValue));
    
    updateDashboard(filtered);
    
    const container = document.getElementById('historyDisplay');
    if (filtered.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#999;'>No history for this month.</p>";
        return;
    }

    container.innerHTML = filtered.map(trip => `
        <div style="background:#fff; border:1px solid #eee; padding:15px; border-radius:10px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; font-weight:bold;">
                <span>${trip.date}</span><span>$${trip.total.toFixed(2)}</span>
            </div>
            <p style="font-size:11px; color:#777; margin:5px 0 0 0;">${trip.items.map(i => i.name).join(', ')}</p>
        </div>
    `).join('');
}

function updateDashboard(trips) {
    let total = trips.reduce((sum, t) => sum + t.total, 0);
    document.getElementById('totalSpent').innerText = `$${total.toFixed(2)}`;
    
    const dailyData = {};
    trips.forEach(t => dailyData[t.date] = (dailyData[t.date] || 0) + t.total);
    
    const ctx = document.getElementById('spendingChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(dailyData).sort(),
            datasets: [{ label: 'Spend', data: Object.keys(dailyData).sort().map(d => dailyData[d]), backgroundColor: '#28a745' }]
        }
    });
}

function clearHistory() {
    if(confirm("Delete all history?")) {
        shoppingHistory = [];
        localStorage.removeItem('shoppingHistory');
        displayHistory();
    }
}
