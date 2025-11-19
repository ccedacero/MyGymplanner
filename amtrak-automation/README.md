# 🚂 Amtrak Ticket Automation Suite

A comprehensive two-part system for Amtrak ticket management:

1. **Monitoring System** - Watches for ticket availability and price changes
2. **Form Filler** - Semi-automated form completion (you control final submission)

## ⚠️ Important Legal & Ethical Notice

**READ THIS CAREFULLY:**

- This tool is for **personal use only** - NEVER for ticket resale
- Automated purchasing may violate Amtrak's Terms of Service (account suspension risk)
- The **BOTS Act (2016)** makes it illegal to use bots for ticket resale
- Use **respectful rate limiting** to avoid overloading Amtrak's servers
- You are responsible for compliance with all applicable laws and ToS

**Recommended approach:** Use the monitoring system to get alerts, then manually purchase tickets.

## 🎯 Features

### Part 1: Monitoring System
- ✅ Monitors multiple routes simultaneously
- ✅ Tracks price history in SQLite database
- ✅ Multiple notification channels (email, desktop, Telegram, webhook)
- ✅ Configurable check intervals
- ✅ Smart alerts for availability and price drops
- ✅ Automatic screenshots for debugging
- ✅ Respectful rate limiting

### Part 2: Form Filler
- ✅ Auto-fills passenger information
- ✅ Remembers your preferences (seat, class, etc.)
- ✅ Visual feedback on filled fields
- ✅ **YOU control final submission** (ToS-safer)
- ✅ Secure local storage (never stores CVV)
- ✅ Easy settings management
- ✅ Works across browsers (via Tampermonkey)

## 📋 Requirements

### Monitoring System
- Python 3.8+
- pip (Python package manager)
- 500MB disk space (for Playwright browser)

### Form Filler
- Modern web browser (Chrome, Firefox, Edge, etc.)
- Tampermonkey extension

## 🚀 Quick Start

### Part 1: Set Up Monitoring System

```bash
# Navigate to the amtrak-automation directory
cd amtrak-automation

# Run setup script
chmod +x setup.sh
./setup.sh

# Edit your configuration
nano config/config.json

# Test with a single check
cd monitor
chmod +x run_once.sh
./run_once.sh

# Start continuous monitoring
chmod +x start_monitor.sh
./start_monitor.sh
```

### Part 2: Set Up Form Filler

1. **Install Tampermonkey:**
   - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/)

2. **Install the script:**
   - Open `form-filler/amtrak-autofill.user.js` in a text editor
   - Copy all contents
   - Click Tampermonkey icon → Dashboard → "+" (Create new script)
   - Paste the code and save (Ctrl+S)

3. **Configure your settings:**
   - Visit amtrak.com
   - Click the Tampermonkey icon
   - Select "Amtrak Smart Form Filler" → Configure Auto-Fill
   - Enter your information
   - Save settings

## ⚙️ Configuration

### Monitoring System Configuration

Edit `config/config.json`:

```json
{
  "monitoring": {
    "routes": [
      {
        "name": "Weekend Trip",
        "origin": "NYP",           // New York Penn Station
        "destination": "WAS",       // Washington DC
        "date": "2025-12-15",
        "max_price": 150,
        "alert_on_availability": true,
        "alert_on_price_drop": true
      }
    ],
    "check_interval_minutes": 30,
    "notifications": {
      "desktop": { "enabled": true },
      "email": { "enabled": false, /* ... */ },
      "telegram": { "enabled": false, /* ... */ }
    }
  }
}
```

**Station Codes:**
- NYP: New York Penn Station
- WAS: Washington DC Union Station
- BOS: Boston South Station
- CHI: Chicago Union Station
- LAX: Los Angeles Union Station
- [Full list](https://www.amtrak.com/stations)

### Email Notifications Setup

For Gmail:
1. Enable 2-factor authentication
2. Create an [App Password](https://myaccount.google.com/apppasswords)
3. Use app password in config (NOT your regular password)

```json
"email": {
  "enabled": true,
  "smtp_server": "smtp.gmail.com",
  "smtp_port": 587,
  "sender_email": "your-email@gmail.com",
  "sender_password": "your-app-password",
  "recipient_email": "your-email@gmail.com"
}
```

### Telegram Notifications Setup

1. Create a bot with [@BotFather](https://t.me/botfather)
2. Get your Chat ID from [@userinfobot](https://t.me/userinfobot)
3. Add to config:

```json
"telegram": {
  "enabled": true,
  "bot_token": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
  "chat_id": "123456789"
}
```

## 📊 Usage Examples

### Monitor a Single Route
```bash
cd monitor
source venv/bin/activate
python amtrak_monitor.py --once
```

### Continuous Monitoring
```bash
cd monitor
./start_monitor.sh
```

### Run in Background (Linux/Mac)
```bash
cd monitor
nohup ./start_monitor.sh > monitor.log 2>&1 &
```

### Check Monitor Logs
```bash
cd monitor
tail -f monitor.log
```

### View Price History
```bash
cd monitor
sqlite3 amtrak_data.db "SELECT * FROM price_history ORDER BY check_timestamp DESC LIMIT 10"
```

## 🎨 Form Filler Usage

Once installed, the form filler works automatically:

1. **Visit Amtrak.com** - The assistant loads automatically
2. **Fill forms** - Click "Fill Forms Now" or wait for auto-fill
3. **Review** - Check all filled information
4. **Submit manually** - YOU click the final submit button

**Controls:**
- Floating panel in bottom-right corner
- Click "Settings" to update your information
- Click "Clear Fields" to remove auto-filled data
- Tampermonkey menu has additional options

## 🔒 Security & Privacy

### What's Stored Locally
- Passenger name, email, phone
- Seat/class preferences
- Billing ZIP code
- Cardholder name (for auto-fill)

### What's NEVER Stored
- Full credit card numbers
- CVV codes
- Passwords
- Social Security Numbers

### Data Storage Locations
- **Monitoring system:** `monitor/amtrak_data.db` (SQLite)
- **Form filler:** Browser's localStorage (Tampermonkey managed)

### Best Practices
1. Use a dedicated email for travel notifications
2. Never share your config files (they contain credentials)
3. Regularly review auto-filled forms before submission
4. Use app passwords for email (not main password)
5. Keep the software updated

## 🛠️ Troubleshooting

### Monitoring System Issues

**"No trains found"**
- Check station codes are correct
- Amtrak may have changed their HTML structure
- Check screenshot in `monitor/` directory
- Run with `--once` flag to test

**Desktop notifications not working (Linux)**
- Install: `sudo apt install libnotify-bin`
- Or use email/Telegram instead

**Playwright errors**
- Run: `playwright install chromium`
- Or reinstall: `pip install --force-reinstall playwright`

### Form Filler Issues

**Forms not auto-filling**
- Open browser console (F12) and check for errors
- Amtrak may have changed their form structure
- Try clicking "Fill Forms Now" manually
- Check Tampermonkey is enabled for amtrak.com

**Settings not saving**
- Check browser allows localStorage
- Try disabling privacy extensions temporarily
- Clear browser cache and reload

## 📈 Advanced Usage

### Custom Notification Webhooks

Send to Slack, Discord, or custom endpoints:

```json
"webhook": {
  "enabled": true,
  "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
}
```

### Multiple Routes

Monitor different trips:

```json
"routes": [
  {
    "name": "Work Commute",
    "origin": "NYP",
    "destination": "WAS",
    "date": "2025-12-01",
    "max_price": 100
  },
  {
    "name": "Weekend Getaway",
    "origin": "BOS",
    "destination": "NYP",
    "date": "2025-12-15",
    "max_price": 80
  }
]
```

### Schedule with Cron

Add to crontab (`crontab -e`):

```cron
# Check every 30 minutes
*/30 * * * * cd /path/to/amtrak-automation/monitor && ./run_once.sh
```

## 🤝 Contributing

Found a bug or want to improve the code?

1. Test your changes thoroughly
2. Ensure you're not violating Amtrak's ToS
3. Document any new features
4. Keep security and privacy in mind

## ⚖️ Legal Disclaimer

This software is provided for **educational and personal convenience purposes only**.

- You are responsible for complying with Amtrak's Terms of Service
- Automated ticket purchasing may violate ToS
- Using this for commercial purposes or ticket resale is illegal
- The authors assume no liability for misuse
- Use at your own risk

## 📚 Additional Resources

- [Amtrak Station Codes](https://www.amtrak.com/stations)
- [Playwright Documentation](https://playwright.dev/python/)
- [Tampermonkey Documentation](https://www.tampermonkey.net/documentation.php)
- [BOTS Act Information](https://www.ftc.gov/enforcement/rules/rulemaking-regulatory-reform-proceedings/bots)

## 📝 License

MIT License - Use responsibly and ethically.

---

**Made with ❤️ for legitimate travelers who value their time**

*Remember: The best use is monitoring for alerts, then manually purchasing tickets.*
