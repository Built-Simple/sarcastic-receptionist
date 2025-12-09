(function() {
    'use strict';

    // Widget configuration
    const WIDGET_ID = 'sarcastic-receptionist-widget';
    const API_BASE = window.SARCASTIC_RECEPTIONIST_URL || '';
    
    // Widget styles
    const styles = `
        #${WIDGET_ID} {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .sr-widget-button {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f06292, #ba68c8);
            border: none;
            color: white;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(240, 98, 146, 0.4);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .sr-widget-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 30px rgba(240, 98, 146, 0.6);
        }

        .sr-widget-button svg {
            width: 30px;
            height: 30px;
        }

        .sr-widget-pulse {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: rgba(240, 98, 146, 0.4);
            animation: sr-pulse 2s infinite;
        }

        @keyframes sr-pulse {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
        }

        .sr-widget-modal {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 350px;
            max-width: calc(100vw - 40px);
            background: #1a1a2e;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            opacity: 0;
            transform: translateY(20px) scale(0.9);
            transition: all 0.3s ease;
            pointer-events: none;
            color: #eee;
            overflow: hidden;
        }

        .sr-widget-modal.sr-show {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: all;
        }

        .sr-widget-header {
            padding: 20px;
            background: linear-gradient(135deg, #f06292, #ba68c8);
            color: white;
            position: relative;
        }

        .sr-widget-close {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            opacity: 0.8;
            transition: opacity 0.2s;
        }

        .sr-widget-close:hover {
            opacity: 1;
        }

        .sr-widget-title {
            font-size: 20px;
            font-weight: bold;
            margin: 0;
        }

        .sr-widget-subtitle {
            font-size: 14px;
            opacity: 0.9;
            margin-top: 5px;
        }

        .sr-widget-body {
            padding: 20px;
            background: #16213e;
        }

        .sr-widget-input {
            width: 100%;
            padding: 12px 16px;
            font-size: 16px;
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            color: #fff;
            margin-bottom: 15px;
            transition: all 0.3s ease;
        }

        .sr-widget-input:focus {
            outline: none;
            border-color: #f06292;
            background: rgba(255, 255, 255, 0.15);
        }

        .sr-widget-call-btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #f06292, #ba68c8);
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .sr-widget-call-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(240, 98, 146, 0.4);
        }

        .sr-widget-call-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .sr-widget-status {
            text-align: center;
            margin-top: 15px;
            font-size: 14px;
            min-height: 20px;
        }

        .sr-widget-status.sr-connecting { color: #ffd700; }
        .sr-widget-status.sr-connected { color: #4caf50; }
        .sr-widget-status.sr-error { color: #f44336; }

        .sr-widget-warning {
            background: rgba(255, 152, 0, 0.1);
            border: 1px solid rgba(255, 152, 0, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin-top: 15px;
            font-size: 12px;
            color: #ffb74d;
            text-align: center;
        }

        @media (max-width: 400px) {
            .sr-widget-modal {
                bottom: 70px;
                right: 10px;
                left: 10px;
                width: auto;
            }
        }
    `;

    // Inject styles
    function injectStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    // Create widget HTML
    function createWidget() {
        const container = document.getElementById(WIDGET_ID);
        if (!container) {
            console.error('Sarcastic Receptionist: Container element not found');
            return;
        }

        container.innerHTML = `
            <button class="sr-widget-button" id="sr-toggle-btn">
                <div class="sr-widget-pulse"></div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
            </button>

            <div class="sr-widget-modal" id="sr-modal">
                <div class="sr-widget-header">
                    <button class="sr-widget-close" id="sr-close-btn">&times;</button>
                    <h3 class="sr-widget-title">Sarcastic Receptionist</h3>
                    <p class="sr-widget-subtitle">World's Most Passive-Aggressive AI</p>
                </div>
                <div class="sr-widget-body">
                    <input 
                        type="tel" 
                        id="sr-phone-input" 
                        class="sr-widget-input" 
                        placeholder="Enter your phone number"
                    />
                    <button id="sr-call-btn" class="sr-widget-call-btn">
                        Call Receptionist
                    </button>
                    <div id="sr-status" class="sr-widget-status"></div>
                    <div class="sr-widget-warning">
                        ⚠️ Warning: May mention Yale degree repeatedly
                    </div>
                </div>
            </div>
        `;

        // Initialize event listeners
        initializeWidget();
    }

    // Initialize widget functionality
    function initializeWidget() {
        const toggleBtn = document.getElementById('sr-toggle-btn');
        const modal = document.getElementById('sr-modal');
        const closeBtn = document.getElementById('sr-close-btn');
        const phoneInput = document.getElementById('sr-phone-input');
        const callBtn = document.getElementById('sr-call-btn');
        const statusDiv = document.getElementById('sr-status');

        let isOpen = false;
        let callSid = null;
        let statusPollInterval = null;

        // Toggle modal
        toggleBtn.addEventListener('click', () => {
            isOpen = !isOpen;
            if (isOpen) {
                modal.classList.add('sr-show');
                phoneInput.focus();
            } else {
                modal.classList.remove('sr-show');
            }
        });

        // Close modal
        closeBtn.addEventListener('click', () => {
            isOpen = false;
            modal.classList.remove('sr-show');
        });

        // Format phone number
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.length <= 3) {
                    value = value;
                } else if (value.length <= 6) {
                    value = value.slice(0, 3) + '-' + value.slice(3);
                } else if (value.length <= 10) {
                    value = value.slice(0, 3) + '-' + value.slice(3, 6) + '-' + value.slice(6);
                } else {
                    value = '+' + value.slice(0, 1) + '-' + value.slice(1, 4) + '-' + value.slice(4, 7) + '-' + value.slice(7, 11);
                }
            }
            e.target.value = value;
        });

        // Make call
        callBtn.addEventListener('click', async () => {
            const phoneNumber = phoneInput.value.trim();
            
            if (!phoneNumber) {
                showStatus('Please enter your phone number', 'sr-error');
                return;
            }

            if (phoneNumber.replace(/\D/g, '').length < 10) {
                showStatus('Please enter a valid phone number', 'sr-error');
                return;
            }

            callBtn.disabled = true;
            callBtn.textContent = 'Connecting...';
            showStatus('Connecting to receptionist...', 'sr-connecting');

            try {
                const formattedNumber = formatPhoneNumber(phoneNumber);
                
                const response = await fetch(`${API_BASE}/web-call`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ phoneNumber: formattedNumber })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    callSid = data.callSid;
                    showStatus('Calling your phone now!', 'sr-connected');
                    callBtn.textContent = 'Call in progress...';
                    
                    // Start polling for status
                    pollCallStatus();
                } else {
                    showStatus(data.error || 'Failed to connect', 'sr-error');
                    resetCallButton();
                }
            } catch (error) {
                console.error('Widget call error:', error);
                showStatus('Connection failed', 'sr-error');
                resetCallButton();
            }
        });

        // Helper functions
        function formatPhoneNumber(number) {
            const cleaned = number.replace(/\D/g, '');
            if (cleaned.length === 10) {
                return '+1' + cleaned;
            } else if (cleaned.length === 11 && cleaned[0] === '1') {
                return '+' + cleaned;
            }
            return number;
        }

        function showStatus(message, className = '') {
            statusDiv.textContent = message;
            statusDiv.className = 'sr-widget-status ' + className;
        }

        function resetCallButton() {
            callBtn.disabled = false;
            callBtn.textContent = 'Call Receptionist';
        }

        async function pollCallStatus() {
            if (!callSid) return;

            try {
                const response = await fetch(`${API_BASE}/call-status/${callSid}`);
                const data = await response.json();

                if (data.status === 'completed' || data.status === 'failed' || 
                    data.status === 'busy' || data.status === 'no-answer') {
                    showStatus('Call ended', '');
                    resetCallButton();
                    clearInterval(statusPollInterval);
                    callSid = null;
                } else if (data.status === 'in-progress') {
                    showStatus('Connected! Pick up your phone', 'sr-connected');
                }
            } catch (error) {
                console.error('Status poll error:', error);
            }
        }

        // Poll every 2 seconds when call is active
        callBtn.addEventListener('click', () => {
            if (callSid && !statusPollInterval) {
                statusPollInterval = setInterval(pollCallStatus, 2000);
            }
        });

        // Enter key support
        phoneInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !callBtn.disabled) {
                callBtn.click();
            }
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectStyles();
            createWidget();
        });
    } else {
        injectStyles();
        createWidget();
    }
})();