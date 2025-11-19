// ==UserScript==
// @name         Amtrak Smart Form Filler
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Semi-automated form filler for Amtrak - fills forms but YOU control submission
// @author       You
// @match        https://www.amtrak.com/*
// @match        https://*.amtrak.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // ============================================
    // Configuration Manager
    // ============================================
    class AmtrakConfig {
        constructor() {
            this.defaults = {
                passenger: {
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    dateOfBirth: ''
                },
                preferences: {
                    seatPreference: 'window',
                    classType: 'coach',
                    loyaltyNumber: ''
                },
                payment: {
                    cardholderName: '',
                    billingZip: '',
                    // NOTE: NEVER store full card number or CVV
                },
                features: {
                    autoFillEnabled: true,
                    showVisualFeedback: true,
                    highlightFilledFields: true,
                    confirmBeforeFill: false
                }
            };
        }

        load() {
            const saved = GM_getValue('amtrak_config', JSON.stringify(this.defaults));
            return JSON.parse(saved);
        }

        save(config) {
            GM_setValue('amtrak_config', JSON.stringify(config));
        }

        reset() {
            this.save(this.defaults);
        }
    }

    // ============================================
    // Form Filler Core
    // ============================================
    class AmtrakFormFiller {
        constructor() {
            this.config = new AmtrakConfig();
            this.settings = this.config.load();
            this.filledFields = [];
            this.observer = null;
        }

        init() {
            console.log('🚂 Amtrak Smart Form Filler initialized');

            // Add settings menu
            GM_registerMenuCommand('⚙️ Configure Auto-Fill', () => this.showSettingsUI());
            GM_registerMenuCommand('🔄 Reset Settings', () => this.resetSettings());
            GM_registerMenuCommand('❌ Disable Auto-Fill', () => this.toggleAutoFill());

            // Add custom CSS
            this.injectStyles();

            // Start monitoring for forms
            if (this.settings.features.autoFillEnabled) {
                this.startMonitoring();
            }

            // Add floating control panel
            this.createControlPanel();
        }

        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .amtrak-autofill-highlight {
                    border: 2px solid #4CAF50 !important;
                    background-color: #E8F5E9 !important;
                    transition: all 0.3s ease;
                }

                .amtrak-autofill-control {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 20px;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    z-index: 999999;
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                    max-width: 300px;
                }

                .amtrak-autofill-control h3 {
                    margin: 0 0 10px 0;
                    font-size: 16px;
                }

                .amtrak-autofill-btn {
                    background: white;
                    color: #667eea;
                    border: none;
                    padding: 8px 15px;
                    margin: 5px 5px 5px 0;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.2s;
                }

                .amtrak-autofill-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }

                .amtrak-autofill-btn.danger {
                    background: #ff4444;
                    color: white;
                }

                .amtrak-autofill-status {
                    margin-top: 10px;
                    padding: 8px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 6px;
                    font-size: 12px;
                }

                .amtrak-settings-modal {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    z-index: 1000000;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                    color: #333;
                }

                .amtrak-settings-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    z-index: 999999;
                }

                .amtrak-settings-input {
                    width: 100%;
                    padding: 10px;
                    margin: 5px 0 15px 0;
                    border: 2px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                }

                .amtrak-settings-label {
                    font-weight: bold;
                    color: #555;
                    display: block;
                    margin-top: 10px;
                }

                .amtrak-warning {
                    background: #fff3cd;
                    border: 2px solid #ffc107;
                    padding: 10px;
                    border-radius: 6px;
                    margin: 10px 0;
                    color: #856404;
                }
            `;
            document.head.appendChild(style);
        }

        createControlPanel() {
            const panel = document.createElement('div');
            panel.className = 'amtrak-autofill-control';
            panel.innerHTML = `
                <h3>🚂 Auto-Fill Assistant</h3>
                <button class="amtrak-autofill-btn" id="amtrak-fill-now">Fill Forms Now</button>
                <button class="amtrak-autofill-btn" id="amtrak-clear-fills">Clear Fields</button>
                <button class="amtrak-autofill-btn" id="amtrak-settings">Settings</button>
                <div class="amtrak-autofill-status">
                    Status: <span id="amtrak-status">Ready</span><br>
                    Fields filled: <span id="amtrak-count">0</span>
                </div>
            `;

            document.body.appendChild(panel);

            // Add event listeners
            document.getElementById('amtrak-fill-now').addEventListener('click', () => this.fillAllForms());
            document.getElementById('amtrak-clear-fills').addEventListener('click', () => this.clearFilledFields());
            document.getElementById('amtrak-settings').addEventListener('click', () => this.showSettingsUI());
        }

        startMonitoring() {
            // Initial fill attempt
            setTimeout(() => this.fillAllForms(), 2000);

            // Monitor for dynamic forms
            this.observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.addedNodes.length > 0) {
                        setTimeout(() => this.fillAllForms(), 500);
                        break;
                    }
                }
            });

            this.observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }

        fillAllForms() {
            if (!this.settings.features.autoFillEnabled) {
                this.updateStatus('Auto-fill disabled');
                return;
            }

            this.updateStatus('Filling forms...');
            this.filledFields = [];

            // Fill passenger information
            this.fillPassengerInfo();

            // Fill search preferences
            this.fillSearchPreferences();

            // Fill payment info (limited for security)
            this.fillPaymentInfo();

            // Update UI
            this.updateStatus('Ready');
            this.updateCount();

            if (this.filledFields.length > 0 && this.settings.features.showVisualFeedback) {
                this.showNotification(`Filled ${this.filledFields.length} fields`, 'success');
            }
        }

        fillField(selector, value, label = '') {
            if (!value) return;

            const fields = document.querySelectorAll(selector);
            fields.forEach(field => {
                if (field && !field.value) {
                    field.value = value;
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));

                    if (this.settings.features.highlightFilledFields) {
                        field.classList.add('amtrak-autofill-highlight');
                    }

                    this.filledFields.push({ field, label, value });
                }
            });
        }

        fillPassengerInfo() {
            const p = this.settings.passenger;

            // First name
            this.fillField('input[name*="first" i][name*="name" i], input[id*="firstName"], input[placeholder*="First Name" i]',
                p.firstName, 'First Name');

            // Last name
            this.fillField('input[name*="last" i][name*="name" i], input[id*="lastName"], input[placeholder*="Last Name" i]',
                p.lastName, 'Last Name');

            // Email
            this.fillField('input[type="email"], input[name*="email" i], input[id*="email"]',
                p.email, 'Email');

            // Phone
            this.fillField('input[type="tel"], input[name*="phone" i], input[id*="phone"]',
                p.phone, 'Phone');

            // Date of birth
            if (p.dateOfBirth) {
                this.fillField('input[type="date"], input[name*="birth" i], input[id*="dob"]',
                    p.dateOfBirth, 'Date of Birth');
            }

            // Loyalty number
            if (this.settings.preferences.loyaltyNumber) {
                this.fillField('input[name*="loyalty" i], input[name*="guest" i][name*="rewards" i], input[id*="loyalty"]',
                    this.settings.preferences.loyaltyNumber, 'Loyalty Number');
            }
        }

        fillSearchPreferences() {
            const prefs = this.settings.preferences;

            // Seat preference
            if (prefs.seatPreference) {
                const seatRadios = document.querySelectorAll(`input[type="radio"][value*="${prefs.seatPreference}" i]`);
                seatRadios.forEach(radio => {
                    if (!radio.checked) {
                        radio.click();
                        this.filledFields.push({ field: radio, label: 'Seat Preference', value: prefs.seatPreference });
                    }
                });
            }

            // Class selection
            if (prefs.classType) {
                const classSelects = document.querySelectorAll('select[name*="class" i], select[id*="class"]');
                classSelects.forEach(select => {
                    const option = Array.from(select.options).find(opt =>
                        opt.value.toLowerCase().includes(prefs.classType.toLowerCase())
                    );
                    if (option) {
                        select.value = option.value;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        this.filledFields.push({ field: select, label: 'Class', value: prefs.classType });
                    }
                });
            }
        }

        fillPaymentInfo() {
            const payment = this.settings.payment;

            // Cardholder name
            this.fillField('input[name*="cardholder" i], input[name*="card" i][name*="name" i], input[id*="cardName"]',
                payment.cardholderName, 'Cardholder Name');

            // Billing ZIP
            this.fillField('input[name*="billing" i][name*="zip" i], input[name*="billing" i][name*="postal" i], input[id*="billingZip"]',
                payment.billingZip, 'Billing ZIP');

            // NOTE: We NEVER fill card number or CVV for security
        }

        clearFilledFields() {
            this.filledFields.forEach(({ field }) => {
                field.value = '';
                field.classList.remove('amtrak-autofill-highlight');
            });
            this.filledFields = [];
            this.updateCount();
            this.showNotification('Cleared all filled fields', 'info');
        }

        showSettingsUI() {
            const overlay = document.createElement('div');
            overlay.className = 'amtrak-settings-overlay';

            const modal = document.createElement('div');
            modal.className = 'amtrak-settings-modal';
            modal.innerHTML = `
                <h2>🚂 Amtrak Auto-Fill Settings</h2>

                <div class="amtrak-warning">
                    ⚠️ <strong>Security Notice:</strong> This data is stored locally in your browser.
                    NEVER store full credit card numbers or CVV codes.
                </div>

                <h3>Passenger Information</h3>
                <label class="amtrak-settings-label">First Name</label>
                <input type="text" class="amtrak-settings-input" id="setting-firstName" value="${this.settings.passenger.firstName}">

                <label class="amtrak-settings-label">Last Name</label>
                <input type="text" class="amtrak-settings-input" id="setting-lastName" value="${this.settings.passenger.lastName}">

                <label class="amtrak-settings-label">Email</label>
                <input type="email" class="amtrak-settings-input" id="setting-email" value="${this.settings.passenger.email}">

                <label class="amtrak-settings-label">Phone</label>
                <input type="tel" class="amtrak-settings-input" id="setting-phone" value="${this.settings.passenger.phone}">

                <label class="amtrak-settings-label">Date of Birth (YYYY-MM-DD)</label>
                <input type="date" class="amtrak-settings-input" id="setting-dob" value="${this.settings.passenger.dateOfBirth}">

                <h3>Preferences</h3>
                <label class="amtrak-settings-label">Seat Preference</label>
                <select class="amtrak-settings-input" id="setting-seatPref">
                    <option value="window" ${this.settings.preferences.seatPreference === 'window' ? 'selected' : ''}>Window</option>
                    <option value="aisle" ${this.settings.preferences.seatPreference === 'aisle' ? 'selected' : ''}>Aisle</option>
                    <option value="none">No Preference</option>
                </select>

                <label class="amtrak-settings-label">Class</label>
                <select class="amtrak-settings-input" id="setting-class">
                    <option value="coach" ${this.settings.preferences.classType === 'coach' ? 'selected' : ''}>Coach</option>
                    <option value="business" ${this.settings.preferences.classType === 'business' ? 'selected' : ''}>Business</option>
                    <option value="first" ${this.settings.preferences.classType === 'first' ? 'selected' : ''}>First Class</option>
                </select>

                <label class="amtrak-settings-label">Loyalty Number (optional)</label>
                <input type="text" class="amtrak-settings-input" id="setting-loyalty" value="${this.settings.preferences.loyaltyNumber}">

                <h3>Payment Info (Limited for Security)</h3>
                <label class="amtrak-settings-label">Cardholder Name</label>
                <input type="text" class="amtrak-settings-input" id="setting-cardName" value="${this.settings.payment.cardholderName}">

                <label class="amtrak-settings-label">Billing ZIP Code</label>
                <input type="text" class="amtrak-settings-input" id="setting-zip" value="${this.settings.payment.billingZip}">

                <div style="margin-top: 20px;">
                    <button class="amtrak-autofill-btn" id="save-settings">💾 Save Settings</button>
                    <button class="amtrak-autofill-btn danger" id="close-settings">Cancel</button>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Event listeners
            document.getElementById('save-settings').addEventListener('click', () => {
                this.saveSettings();
                document.body.removeChild(overlay);
            });

            document.getElementById('close-settings').addEventListener('click', () => {
                document.body.removeChild(overlay);
            });

            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    document.body.removeChild(overlay);
                }
            });
        }

        saveSettings() {
            this.settings.passenger.firstName = document.getElementById('setting-firstName').value;
            this.settings.passenger.lastName = document.getElementById('setting-lastName').value;
            this.settings.passenger.email = document.getElementById('setting-email').value;
            this.settings.passenger.phone = document.getElementById('setting-phone').value;
            this.settings.passenger.dateOfBirth = document.getElementById('setting-dob').value;

            this.settings.preferences.seatPreference = document.getElementById('setting-seatPref').value;
            this.settings.preferences.classType = document.getElementById('setting-class').value;
            this.settings.preferences.loyaltyNumber = document.getElementById('setting-loyalty').value;

            this.settings.payment.cardholderName = document.getElementById('setting-cardName').value;
            this.settings.payment.billingZip = document.getElementById('setting-zip').value;

            this.config.save(this.settings);
            this.showNotification('Settings saved successfully!', 'success');
        }

        resetSettings() {
            if (confirm('Reset all settings to defaults?')) {
                this.config.reset();
                this.settings = this.config.load();
                this.showNotification('Settings reset', 'info');
            }
        }

        toggleAutoFill() {
            this.settings.features.autoFillEnabled = !this.settings.features.autoFillEnabled;
            this.config.save(this.settings);

            if (this.settings.features.autoFillEnabled) {
                this.startMonitoring();
                this.showNotification('Auto-fill enabled', 'success');
            } else {
                if (this.observer) {
                    this.observer.disconnect();
                }
                this.showNotification('Auto-fill disabled', 'info');
            }
        }

        updateStatus(status) {
            const statusEl = document.getElementById('amtrak-status');
            if (statusEl) statusEl.textContent = status;
        }

        updateCount() {
            const countEl = document.getElementById('amtrak-count');
            if (countEl) countEl.textContent = this.filledFields.length;
        }

        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 1000001;
                font-family: Arial, sans-serif;
                animation: slideIn 0.3s ease;
            `;
            notification.textContent = message;

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => document.body.removeChild(notification), 300);
            }, 3000);
        }
    }

    // ============================================
    // Initialize on page load
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const filler = new AmtrakFormFiller();
            filler.init();
        });
    } else {
        const filler = new AmtrakFormFiller();
        filler.init();
    }

})();
