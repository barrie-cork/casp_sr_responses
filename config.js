/**
 * Configuration for CASP SR Response Viewer
 * Update the API_URL with your Google Apps Script Web App URL
 */

const CONFIG = {
    // Google Apps Script Web App URL - UPDATE THIS!
    API_URL: 'https://script.google.com/macros/s/AKfycbxQyAI89eyOkoxdvFlUU3OgvysWkBQxFqrrT7SV9U6czT6eYPn_TA0sOAwdPGsBdEtSlQ/exec',

    // Number of questions in SR form (10 questions, not 13 like RCT)
    TOTAL_QUESTIONS: 10,

    // Auto-refresh settings
    REFRESH_INTERVAL: 30000, // 30 seconds in milliseconds
    AUTO_REFRESH: true,

    // Display settings
    MAX_EXPLANATION_LENGTH: 2000, // Maximum characters to display
    ENABLE_VOTING: true,
    ENABLE_STATISTICS: true,

    // LocalStorage keys for vote tracking
    STORAGE_PREFIX: 'casp_sr_vote_',

    // Chart colors
    CHART_COLORS: {
        yes: '#34a853',
        no: '#ea4335',
        cantTell: '#fbbc04'
    }
};

// Validation to ensure configuration is set
if (CONFIG.API_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
    console.warn('⚠️ Please update CONFIG.API_URL in config.js with your Google Apps Script Web App URL');
    // Show warning in UI
    window.addEventListener('DOMContentLoaded', () => {
        const errorDiv = document.getElementById('error');
        const errorMessage = document.getElementById('errorMessage');
        if (errorDiv && errorMessage) {
            errorMessage.textContent = 'Configuration Error: Please update the API_URL in config.js with your Google Apps Script Web App URL. See DEPLOYMENT.md for instructions.';
            errorDiv.style.display = 'block';
            document.getElementById('loading').style.display = 'none';
        }
    });
}