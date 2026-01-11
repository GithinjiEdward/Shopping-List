let shoppingHistory = JSON.parse(localStorage.getItem('shoppingHistory')) || [];
let pendingItems = JSON.parse(localStorage.getItem('pendingItems')) || [];
let myChart = null;

window.onload = function() {
    document.getElementById('shoppingDate').value = new Date().toISOString().split('T')[0];
    initializeTable();
    setupMonthFilter();
    renderPendingList();
};

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if(tabId === 'tab-history') displayHistory();
    if(tabId === 'tab-pending') renderPendingList();
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
    row.innerHTML = `
        <td class="row-num">${tbody.rows.length + 1}</td>
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
    if (names.length === 0) return alert("List is empty!");

    const storeBody = document.getElementById('storeTableBody');
    storeBody.innerHTML = names.map(name => `
        <tr>
            <td>${name}</td>
            <td><input type="number" class="store-qty" value="1" oninput="calculateLiveTotal()"></td>
            <td><input type="number" class="store-price" placeholder="0.00" oninput="calculateLiveTotal()"></td>
            <td style="text-align:center;"><input type="checkbox" class="store-check" onchange="calculateLiveTotal()"></td>
        </tr>
    `).join('');
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

// --- THE SPLIT SAVE LOGIC ---
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

    // Save Bought to History
    if (boughtItems.length > 0) {
        shoppingHistory.push({
            date: document.getElementById('shoppingDate').value,
            items: boughtItems,
            total: grandTotal
        });
        localStorage.setItem('shoppingHistory', JSON.stringify(shoppingHistory));
    }

    // Save Missed to Pending
    if (missedItems.length > 0) {
        pendingItems = [...new Set([...pendingItems, ...missedItems])]; // Prevent duplicates
        localStorage.setItem('pendingItems', JSON.stringify(pendingItems));
    }

    alert(`Saved! ${boughtItems.length} items bought, ${missedItems.length} items moved to Pending.`);
    initializeTable();
    showTab('tab-pending');
}

// --- PENDING LIST LOGIC ---
function renderPendingList() {
    const container = document.getElementById('pendingList');
    if (pendingItems.length === 0) {
        container.innerHTML = "<p style='text-align:center; color:#999; margin-top:20px;'>No pending items! Well done.</p>";
        return;
    }
    container.innerHTML = pendingItems.map((item, index) => `
        <li>
            <span>${item}</span>
            <button class="clear-link" onclick="removePending(${index})">Remove</button>
        </li>
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
    const rows = document.querySelectorAll('.draft-name');
    pendingItems.forEach((item, index) => {
        if (index < rows.length) {
            rows[index].value = item;
            if (index === rows.length - 1) addDraftRow();
        }
    });
    // Clear pending after moving
    pendingItems = [];
    localStorage.removeItem('pendingItems');
}

// (Keep previous Analytics/Month Filter functions here)
