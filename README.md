# Personal Shopping Tracker & Analytics App

A mobile-responsive web application designed to help users manage current shopping lists while tracking historical spending habits through data visualization.

## 📱 Features

- **Dual-Tab Interface**: Separate views for active shopping and historical data analysis.
- **Smart History**: Filter shopping records by month and year to track past expenses.
- **Data Visualization**: Interactive bar charts (via Chart.js) showing daily spending trends.
- **Insights Dashboard**: Automatically identifies your most frequently purchased product and total monthly expenditure.
- **Quick-Add**: One-tap "Add Again" feature to clone items from previous months into your current list.
- **Persistence**: Uses Browser LocalStorage to keep your data saved locally on your device.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Mobile-first design)
- **Logic**: Vanilla JavaScript (ES6+)
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **Deployment**: GitHub Pages

## 📂 Project Structure

- `index.html`: The core structure and tab navigation.
- `style.css`: Custom styling for a native app-like experience.
- `script.js`: Handles data processing, chart rendering, and local storage management.

## 🚀 How to Use

1. **Shopping**: Enter items and prices on the 'Shop' tab. Select the date of purchase.
2. **Save**: Click 'Finish & Save Trip'. The app will automatically move you to the History tab.
3. **Analyze**: Use the dropdown on the History tab to view specific months. Check the dashboard for your spending total and top item.
4. **Repeat**: Use the "Add Again" button in history to quickly populate your next shopping trip.

## 🔧 Installation / Local Setup

To run this project locally:
1. Clone this repository:
   ```bash
   git clone [https://github.com/YOUR_USERNAME/shopping-tracker.git](https://github.com/YOUR_USERNAME/shopping-tracker.git)
