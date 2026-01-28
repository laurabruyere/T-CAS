// ===== UI.JS - User Interface Updates =====

// This file contains additional UI helper functions
// Most UI updates are handled in main.js, but this file can be extended
// for more complex UI interactions

// Format numbers for display
function formatNumber(num, decimals = 0) {
    return num.toFixed(decimals);
}

// Format altitude in feet
function formatAltitude(meters) {
    const feet = meters / 0.3048;
    return Math.round(feet);
}

// Format speed in knots
function formatSpeed(metersPerSecond) {
    const knots = metersPerSecond * 1.94384;
    return Math.round(knots);
}

// Format vertical speed in feet per minute
function formatVerticalSpeed(metersPerSecond) {
    const fpm = metersPerSecond * 196.85;
    return Math.round(fpm);
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 255, 65, 0.9);
        color: #0a1929;
        padding: 15px 30px;
        border-radius: 10px;
        font-family: 'Roboto Mono', monospace;
        font-weight: 700;
        z-index: 9999;
        animation: slideDown 0.3s ease;
    `;

    if (type === 'warning') {
        notification.style.background = 'rgba(255, 215, 0, 0.9)';
    } else if (type === 'error') {
        notification.style.background = 'rgba(255, 51, 51, 0.9)';
        notification.style.color = 'white';
    }

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(style);

// Update scenario progress
function updateScenarioProgress(progress) {
    // This can be used to show scenario completion percentage
    console.log('Scenario progress:', progress + '%');
}

// Show success message
function showSuccess(message) {
    showNotification(message, 'info');
}

// Show warning message
function showWarning(message) {
    showNotification(message, 'warning');
}

// Show error message
function showError(message) {
    showNotification(message, 'error');
}

console.log('ui.js loaded');
