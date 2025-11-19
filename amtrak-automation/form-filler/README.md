# 🎨 Amtrak Smart Form Filler

Browser userscript that auto-fills Amtrak booking forms with your saved preferences.

## ✨ Features

- ✅ **Auto-fills forms** as you browse Amtrak.com
- ✅ **Visual feedback** - Highlights filled fields in green
- ✅ **You control submission** - Reviews before you click submit
- ✅ **Secure** - Stores data locally, never shares externally
- ✅ **Easy configuration** - In-browser settings UI
- ✅ **Smart** - Only fills empty fields
- ✅ **Safe** - NEVER stores card numbers or CVV

## 🚀 Installation

### Step 1: Install Tampermonkey

Choose your browser:
- **Chrome:** [Install here](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox:** [Install here](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
- **Edge:** [Install here](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)
- **Safari:** [Install here](https://www.tampermonkey.net/?browser=safari)

### Step 2: Install the Script

1. Open `amtrak-autofill.user.js` in a text editor
2. Select all (Ctrl+A) and copy (Ctrl+C)
3. Click the Tampermonkey extension icon
4. Click "Dashboard"
5. Click the "+" tab (Create a new script)
6. Delete the template, paste your copied code
7. Click "File" → "Save" (or Ctrl+S)

### Step 3: Configure Your Settings

1. Visit [amtrak.com](https://www.amtrak.com)
2. You'll see a floating purple panel in the bottom-right
3. Click "Settings"
4. Fill in your information:
   - **Passenger Info:** Name, email, phone, date of birth
   - **Preferences:** Seat (window/aisle), class (coach/business/first)
   - **Payment Info:** Cardholder name, billing ZIP
5. Click "Save Settings"

## 🎮 Usage

### Automatic Mode (Default)

Once configured, the form filler works automatically:

1. Browse to Amtrak.com
2. Navigate to booking or passenger info pages
3. Forms auto-fill with your saved data
4. Filled fields turn green
5. Review the information
6. Click submit when ready

### Manual Mode

Use the floating control panel:

- **Fill Forms Now** - Manually trigger form filling
- **Clear Fields** - Remove all auto-filled data
- **Settings** - Update your saved information

### Tampermonkey Menu Commands

Right-click the Tampermonkey icon → Amtrak Smart Form Filler:

- ⚙️ **Configure Auto-Fill** - Open settings UI
- 🔄 **Reset Settings** - Clear all saved data
- ❌ **Disable Auto-Fill** - Turn off automatic filling

## 🎯 What Gets Auto-Filled

### ✅ Passenger Information
- First name
- Last name
- Email address
- Phone number
- Date of birth
- Loyalty/rewards number

### ✅ Preferences
- Seat preference (window/aisle)
- Class selection (coach/business/first)

### ✅ Limited Payment Info
- Cardholder name
- Billing ZIP code

### ❌ NEVER Auto-Filled (Security)
- Credit card numbers
- CVV codes
- Expiration dates (you should verify these)

## 🔒 Security & Privacy

### Where Is Data Stored?

**Locally in your browser only** via Tampermonkey's storage (essentially localStorage).

- ✅ Never sent to external servers
- ✅ Not accessible to other websites
- ✅ Stays on your device
- ✅ Cleared when you reset settings

### What About Sensitive Data?

**Best Practices:**
- ✅ Store: Name, email, phone, preferences
- ⚠️ Optional: Billing ZIP, cardholder name
- ❌ NEVER store: Card numbers, CVV, SSN, passwords

The script is designed to **never** accept or store full payment card details.

### Shared Computers

If using a shared computer:
1. Use "Reset Settings" when done
2. Or disable auto-fill after each use
3. Consider using browser's private/incognito mode

## 🎨 Visual Indicators

| Color | Meaning |
|-------|---------|
| 🟢 Green border & light green background | Field was auto-filled |
| 🟣 Purple floating panel | Control panel (bottom-right) |
| 🟡 Yellow notification | Info messages |
| 🟢 Green notification | Success messages |
| 🔴 Red notification | Error messages |

## 🛠️ Troubleshooting

### Forms Not Auto-Filling

**Possible causes:**

1. **Script not enabled**
   - Check Tampermonkey icon shows active script count
   - Click icon → Ensure "Amtrak Smart Form Filler" is enabled

2. **Page structure changed**
   - Amtrak may have updated their website
   - Try clicking "Fill Forms Now" manually
   - Check browser console (F12) for errors

3. **Settings not configured**
   - Open Settings and ensure fields aren't blank
   - Save settings explicitly

4. **Browser privacy settings**
   - Some strict privacy modes block localStorage
   - Try allowing Tampermonkey exceptions

### Settings Not Saving

1. Check browser allows localStorage for Tampermonkey
2. Disable strict privacy extensions temporarily
3. Try a different browser
4. Clear browser cache and reinstall script

### Forms Fill Incorrectly

1. Open Settings and verify your saved data
2. Click "Clear Fields" then "Fill Forms Now" to retry
3. Manually override any incorrect fields
4. The script only fills **empty** fields, so you can manually fill first

### Control Panel Not Appearing

1. Refresh the page (F5)
2. Check you're on amtrak.com or *.amtrak.com
3. Verify script is enabled in Tampermonkey
4. Try disabling other extensions that might conflict

## ⚙️ Customization

### Disable Automatic Filling

If you prefer manual control:

1. Tampermonkey menu → "Disable Auto-Fill"
2. Or edit the script: Set `autoFillEnabled: false`

Forms will only fill when you click "Fill Forms Now"

### Change Highlight Color

Edit the script's CSS section:

```javascript
.amtrak-autofill-highlight {
    border: 2px solid #4CAF50 !important;  // ← Change color here
    background-color: #E8F5E9 !important;  // ← And here
}
```

### Adjust Control Panel Position

Edit the script:

```javascript
.amtrak-autofill-control {
    position: fixed;
    bottom: 20px;   // ← Adjust position
    right: 20px;    // ← Adjust position
}
```

## 📱 Mobile Support

Tampermonkey is available for mobile browsers:

- **Firefox Mobile:** Supports Tampermonkey add-on
- **Kiwi Browser (Android):** Supports Chrome extensions
- **iOS Safari:** Limited userscript support

*Note: Mobile support may be limited due to browser restrictions*

## 🔄 Updates

To update the script:

1. Get the new version of `amtrak-autofill.user.js`
2. Open Tampermonkey Dashboard
3. Click on "Amtrak Smart Form Filler"
4. Replace code with new version
5. Save (Ctrl+S)

Or simply delete and reinstall following installation steps.

## ⚖️ Legal & Terms of Service

**Important:**
- This tool is for **personal convenience only**
- It does NOT automatically submit forms (you control that)
- Review Amtrak's ToS regarding automated tools
- The authors assume no liability for misuse
- You are responsible for data accuracy
- Use responsibly and ethically

## 🆘 Support

### Common Questions

**Q: Will this automatically buy tickets?**
A: NO. It only fills forms. You must review and click submit.

**Q: Is my credit card information safe?**
A: This script NEVER stores or handles full card numbers or CVV codes.

**Q: Can I use this on other sites?**
A: This script only works on amtrak.com domains.

**Q: Is this against Amtrak's ToS?**
A: Consult Amtrak's ToS. This is form auto-fill (like browser password managers), not automated purchasing.

### Getting Help

1. Check browser console (F12) for error messages
2. Review the main [README.md](../README.md)
3. Verify Tampermonkey is up to date
4. Try reinstalling the script

---

**Happy travels! 🚂**

*Remember: Always review auto-filled information before submission.*
