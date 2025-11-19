# 🚀 Quick Start Guide

Get up and running in 5 minutes!

## Part 1: Monitoring System (2 minutes)

```bash
# 1. Navigate and setup
cd amtrak-automation
chmod +x setup.sh
./setup.sh

# 2. Edit your config
cp config/config.example.json config/config.json
nano config/config.json

# 3. Add your route(s)
# Example: New York to DC on Dec 15
{
  "routes": [{
    "name": "My Trip",
    "origin": "NYP",
    "destination": "WAS",
    "date": "2025-12-15",
    "max_price": 150,
    "alert_on_availability": true
  }]
}

# 4. Run it!
cd monitor
./run_once.sh  # Test run

# Or for continuous monitoring:
./start_monitor.sh
```

## Part 2: Form Filler (3 minutes)

```
1. Install Tampermonkey extension in your browser
   → Chrome: https://chrome.google.com/webstore/detail/tampermonkey/

2. Open: amtrak-automation/form-filler/amtrak-autofill.user.js

3. Copy all the code

4. Tampermonkey Dashboard → Create new script → Paste → Save

5. Visit amtrak.com

6. Click floating panel → Settings → Enter your info → Save

7. Forms will auto-fill! (You still click submit)
```

## Common Station Codes

| Code | Station |
|------|---------|
| NYP  | New York Penn Station |
| WAS  | Washington DC |
| BOS  | Boston South Station |
| CHI  | Chicago Union Station |
| LAX  | Los Angeles |
| PHL  | Philadelphia |
| BAL  | Baltimore |

[Full list →](https://www.amtrak.com/stations)

## Notification Setup (Optional)

### Desktop Notifications
Already enabled by default! ✅

### Email Alerts
```json
"email": {
  "enabled": true,
  "smtp_server": "smtp.gmail.com",
  "smtp_port": 587,
  "sender_email": "you@gmail.com",
  "sender_password": "your-app-password",  // ← Use App Password!
  "recipient_email": "you@gmail.com"
}
```

Get Gmail App Password: https://myaccount.google.com/apppasswords

### Telegram Alerts
```json
"telegram": {
  "enabled": true,
  "bot_token": "from @BotFather",
  "chat_id": "from @userinfobot"
}
```

## That's It! 🎉

**Monitor will:**
- Check routes every 30 minutes (configurable)
- Alert you on availability or price drops
- Save price history to database
- Take screenshots for debugging

**Form Filler will:**
- Auto-fill passenger info when you visit Amtrak
- Remember your preferences
- Highlight filled fields in green
- Let YOU review and submit manually

---

Need help? Check the full [README.md](README.md)
