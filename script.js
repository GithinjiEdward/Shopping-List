let currentItems = [];
let shoppingHistory = JSON.parse(localStorage.getItem('shoppingHistory')) || [];
let myChart = null;

window.onload = function() {
    document.getElementById('shoppingDate').value = new Date().toISOString().split('T')[0];
    displayHistory();
};

// Tab Switching Logic
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if(tabId === 'tab-history') displayHistory();
}

function addItem() {
    const name = document.getElementById('itemName').value;
    const price = document.getElementById('itemPrice').value;
    if (name && price) {
        currentItems.push({ name, price: parseFloat(price) });
        updateActiveListUI();
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
    }
}

function updateActiveListUI() {
    const listEl = document.getElementById('activeList');
    listEl.innerHTML = currentItems.map(item => `<li>${item.name} <span>$${item.price.toFixed(2)}</span></li>`).join('');
}

function checkout() {
    if (currentItems.length === 0) return alert("List is empty!");
    const selectedDate = document.getElementById('shoppingDate').value;
    const trip = {
        date: selectedDate,
        items: [...currentItems],
        total: currentItems.reduce((sum, item) => sum + item.price, 0)
    };

    shoppingHistory.push(trip);
    shoppingHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    localStorage.setItem('shoppingHistory', JSON.stringify(shoppingHistory));

    // Logic to show history for the month just added
    const monthYear = selectedDate.substring(0, 7); // Extracts "YYYY-MM"
    document.getElementById('monthFilter').value = monthYear;
    
    currentItems = [];
    updateActiveListUI();
    
    // Switch to History Tab and show the list
    showTab('tab-history'); 
    alert(`Success! View your ${monthYear} summary below.`);
}

function displayHistory() {
    const selectedMonth = document.getElementById('monthFilter').value;
    const historyDiv = document.getElementById('historyDisplay');
    const filtered = shoppingHistory.filter(trip => trip.date.startsWith(selectedMonth));

    updateDashboard(filtered);

    if (filtered.length === 0) {
        historyDiv.innerHTML = "<p>No data for this month.</p>";
        return;
    }

    historyDiv.innerHTML = filtered.map(trip => `
        <div class="history-item">
            <div style="display:flex; justify-content:space-between; font-weight:bold;">
                <span>${trip.date}</span><span>$${trip.total.toFixed(2)}</span>
            </div>
            ${trip.items.map(i => `
                <div class="item-row">
                    <span>${i.name}</span>
                    <button class="copy-btn" onclick="reAdd('${i.name}', ${i.price})">Add Again</button>
                </div>`).join('')}
        </div>
    `).join('');
}

function updateDashboard(filteredTrips) {
    let total = 0, counts = {}, dailyData = {};
    filteredTrips.forEach(trip => {
        total += trip.total;
        dailyData[trip.date] = (dailyData[trip.date] || 0) + trip.total;
        trip.items.forEach(i => counts[i.name] = (counts[i.name] || 0) + 1);
    });

    let topItem = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, "None");
    document.getElementById('totalSpent').innerText = `$${total.toFixed(2)}`;
    document.getElementById('topProduct').innerText = topItem;

    const labels = Object.keys(dailyData).sort();
    renderChart(labels, labels.map(d => dailyData[d]));
}

function renderChart(labels, values) {
    const ctx = document.getElementById('spendingChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Spend', data: values, backgroundColor: '#28a745' }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}

function reAdd(name, price) {
    currentItems.push({ name, price });
    updateActiveListUI();
    showTab('tab-shopping');
}
