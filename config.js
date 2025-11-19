/**
 * Configuration for CASP SR Response Viewer
 * Update the API_URL with your Google Apps Script Web App URL
 */

const CONFIG = {
    // Google Apps Script Web App URL - Updated 2025-11-19 (SR Form - Final)
    API_URL: 'https://script.google.com/macros/s/AKfycbz5j5wZItErZ30nfmBBusf2SjtphIOL1xoLB2puY6Awbvu8WG02f7Ktvnr-SDcb8A_Sig/exec',

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