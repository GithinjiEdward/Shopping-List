let currentItems = [];
let shoppingHistory = JSON.parse(localStorage.getItem('shoppingHistory')) || [];
let myChart = null;

// Initialize app
window.onload = function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('shoppingDate').value = today;
    displayHistory();
};

function addItem() {
    const name = document.getElementById('itemName').value;
    const price = document.getElementById('itemPrice').value;

    if (name && price) {
        currentItems.push({ name, price: parseFloat(price) });
        updateActiveListUI();
        document.getElementById('itemName').value = '';
        document.getElementById('itemPrice').value = '';
    } else {
        alert("Please enter both name and price.");
    }
}

function updateActiveListUI() {
    const listEl = document.getElementById('activeList');
    listEl.innerHTML = currentItems.map((item, index) => `
        <li>
            ${item.name} <span>$${item.price.toFixed(2)}</span>
        </li>
    `).join('');
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
    
    currentItems = [];
    updateActiveListUI();
    displayHistory();
    alert("Trip Saved!");
}

function displayHistory() {
    const selectedMonth = document.getElementById('monthFilter').value;
    const historyDiv = document.getElementById('historyDisplay');
    const filtered = shoppingHistory.filter(trip => trip.date.startsWith(selectedMonth));

    updateDashboard(filtered);

    if (filtered.length === 0) {
        historyDiv.innerHTML = "<p style='text-align:center;'>No history for this month.</p>";
        return;
    }

    historyDiv.innerHTML = filtered.map(trip => `
        <div class="history-item">
            <div class="history-header">
                <span>${new Date(trip.date).toLocaleDateString(undefined, {weekday:'short', day:'numeric', month:'short'})}</span>
                <span>$${trip.total.toFixed(2)}</span>
            </div>
            ${trip.items.map(item => `
                <div style="display:flex; justify-content:space-between; font-size:0.9em; margin-bottom:5px;">
                    <span>${item.name} ($${item.price.toFixed(2)})</span>
                    <button class="copy-btn" onclick="reAdd('${item.name}', ${item.price})">Add Again</button>
                </div>
            `).join('')}
        </div>
    `).join('');
}

function updateDashboard(filteredTrips) {
    let total = 0;
    let counts = {};
    let dailyData = {};

    filteredTrips.forEach(trip => {
        total += trip.total;
        dailyData[trip.date] = (dailyData[trip.date] || 0) + trip.total;
        trip.items.forEach(item => {
            counts[item.name] = (counts[item.name] || 0) + 1;
        });
    });

    // Top Product logic
    let topItem = "None";
    let max = 0;
    for (const [name, count] of Object.entries(counts)) {
        if (count > max) { max = count; topItem = name; }
    }

    document.getElementById('totalSpent').innerText = `$${total.toFixed(2)}`;
    document.getElementById('topProduct').innerText = topItem;

    // Chart logic
    const labels = Object.keys(dailyData).sort();
    const values = labels.map(d => dailyData[d]);
    renderChart(labels, values);
}

function renderChart(labels, values) {
    const ctx = document.getElementById('spendingChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ label: 'Daily Spend', data: values, backgroundColor: '#28a745' }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}

function reAdd(name, price) {
    currentItems.push({ name, price: parseFloat(price) });
    updateActiveListUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
