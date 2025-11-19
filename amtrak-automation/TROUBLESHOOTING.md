# 🔧 Troubleshooting Guide

Solutions to common issues with the Amtrak automation tools.

## Table of Contents
- [Monitoring System Issues](#monitoring-system-issues)
- [Form Filler Issues](#form-filler-issues)
- [Notification Problems](#notification-problems)
- [Installation Issues](#installation-issues)
- [Performance & Resource Issues](#performance--resource-issues)

---

## Monitoring System Issues

### "No trains found" or Empty Results

**Symptoms:**
- Monitor runs but finds no tickets
- Empty database entries
- Screenshots show unexpected page content

**Solutions:**

1. **Verify Station Codes**
   ```bash
   # Check your config has valid 3-letter codes
   cat config/config.json | grep -E "origin|destination"
   ```
   - Use official Amtrak codes (NYP, WAS, BOS, etc.)
   - [Station code list](https://www.amtrak.com/stations)

2. **Check Date Format**
   - Must be: `YYYY-MM-DD`
   - Example: `2025-12-15`
   - Not: `12/15/2025` or `15-12-2025`

3. **Amtrak Website Changed**
   - Check screenshot in `monitor/` directory
   - Compare to actual amtrak.com
   - Selectors may need updating in code

4. **Test Manually**
   ```bash
   cd monitor
   source venv/bin/activate
   python amtrak_monitor.py --once
   ```
   - Check screenshot output
   - Look at browser console output

### Playwright/Browser Errors

**Symptoms:**
- "Playwright not found"
- "Browser executable not found"
- Timeout errors

**Solutions:**

1. **Reinstall Playwright**
   ```bash
   cd monitor
   source venv/bin/activate
   pip install --force-reinstall playwright
   playwright install chromium
   ```

2. **Check System Dependencies (Linux)**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1

   # Fedora
   sudo dnf install nss atk at-spi2-atk cups-libs libdrm libxkbcommon mesa-libgbm
   ```

3. **Increase Timeout**
   - Edit `amtrak_monitor.py`
   - Change: `timeout=30000` to `timeout=60000`

4. **Try Headed Mode (for debugging)**
   ```python
   # In amtrak_monitor.py, change:
   browser = p.chromium.launch(headless=True)
   # To:
   browser = p.chromium.launch(headless=False)
   ```

### Database Errors

**Symptoms:**
- "Database locked"
- "Cannot write to database"
- Corrupted data

**Solutions:**

1. **Close Other Connections**
   ```bash
   # Kill any running monitors
   pkill -f amtrak_monitor
   ```

2. **Reset Database**
   ```bash
   cd monitor
   mv amtrak_data.db amtrak_data.db.backup
   # Database will be recreated on next run
   ```

3. **Check Permissions**
   ```bash
   ls -la monitor/amtrak_data.db
   # Should be writable by your user
   ```

### Monitor Won't Start

**Symptoms:**
- Script exits immediately
- "Config not found" error
- Import errors

**Solutions:**

1. **Check Virtual Environment**
   ```bash
   cd monitor
   ls -la venv/
   # If missing, run setup.sh again
   ```

2. **Verify Config Exists**
   ```bash
   ls -la config/config.json
   # If missing, copy from config.example.json
   ```

3. **Check Python Version**
   ```bash
   python3 --version
   # Should be 3.8 or higher
   ```

4. **Install Dependencies**
   ```bash
   cd monitor
   source venv/bin/activate
   pip install -r requirements.txt
   ```

---

## Form Filler Issues

### Forms Not Auto-Filling

**Symptoms:**
- Visit Amtrak.com but nothing happens
- Control panel doesn't appear
- Forms remain empty

**Solutions:**

1. **Check Tampermonkey Enabled**
   - Click Tampermonkey icon
   - Ensure script is enabled (toggle should be on)
   - Check script count shows "1" on amtrak.com

2. **Verify Script Installation**
   - Tampermonkey Dashboard
   - Look for "Amtrak Smart Form Filler"
   - Check "Last modified" date
   - Ensure no syntax errors (red X icon)

3. **Check Browser Console**
   - Press F12
   - Click "Console" tab
   - Look for errors (red text)
   - Common issue: localStorage disabled

4. **Clear and Reinstall**
   ```
   1. Tampermonkey Dashboard
   2. Delete "Amtrak Smart Form Filler"
   3. Create new script
   4. Paste code again
   5. Save
   6. Refresh amtrak.com
   ```

5. **Try Manual Fill**
   - Look for floating purple panel (bottom-right)
   - Click "Fill Forms Now"
   - If panel missing, script isn't loading

### Settings Not Saving

**Symptoms:**
- Configure settings
- Refresh page
- Settings are lost

**Solutions:**

1. **Check LocalStorage**
   - F12 → Application tab → Local Storage
   - Look for Tampermonkey entries
   - If blocked, adjust privacy settings

2. **Disable Strict Privacy Mode**
   - Firefox: Turn off "Enhanced Tracking Protection" for amtrak.com
   - Chrome: Settings → Privacy → Allow cookies for amtrak.com
   - Safari: Preferences → Privacy → Disable "Prevent cross-site tracking"

3. **Check Browser Extensions Conflict**
   - Disable privacy/ad-blocking extensions temporarily
   - Test if settings save
   - Re-enable one by one to find culprit

4. **Try Different Browser**
   - Install Tampermonkey in Chrome/Firefox/Edge
   - Install script
   - Test if issue persists

### Control Panel Not Visible

**Symptoms:**
- Script enabled but no purple panel
- Can't access settings

**Solutions:**

1. **Check Z-Index Conflicts**
   - Other page elements may overlap
   - Edit script CSS: Increase `z-index: 999999` to `z-index: 9999999`

2. **Try Different Position**
   ```javascript
   // Edit in script:
   .amtrak-autofill-control {
       bottom: 20px;  // Try: top: 20px
       right: 20px;   // Try: left: 20px
   }
   ```

3. **Check Page Load**
   - Wait 2-3 seconds after page loads
   - Some dynamic sites load slowly

4. **Console Check**
   - F12 → Console
   - Look for "🚂 Amtrak Smart Form Filler initialized"
   - If missing, script didn't load

### Fields Fill With Wrong Data

**Symptoms:**
- Forms fill with incorrect information
- Data doesn't match settings

**Solutions:**

1. **Update Settings**
   - Click Settings in control panel
   - Verify all fields
   - Save explicitly

2. **Clear and Refill**
   - Click "Clear Fields"
   - Update settings
   - Click "Fill Forms Now"

3. **Check Field Mapping**
   - Some forms use different field names
   - May require script updates for new Amtrak layouts

---

## Notification Problems

### Desktop Notifications Not Showing

**Symptoms:**
- Monitor runs but no popup notifications
- Logs show "notification sent" but nothing appears

**Solutions:**

1. **Check System Permissions**
   - **Windows:** Settings → System → Notifications
   - **Mac:** System Preferences → Notifications
   - **Linux:** Settings → Notifications

2. **Install Required Packages (Linux)**
   ```bash
   # Ubuntu/Debian
   sudo apt install libnotify-bin python3-gi gir1.2-notify-0.7

   # Fedora
   sudo dnf install libnotify python3-gobject
   ```

3. **Test Manually**
   ```bash
   # Linux
   notify-send "Test" "Notification test"

   # Check if this works - if not, system issue
   ```

4. **Use Alternative Notification**
   - Enable email or Telegram instead
   - Desktop notifications can be flaky

### Email Notifications Failing

**Symptoms:**
- "Failed to send email" in logs
- Authentication errors
- Connection timeouts

**Solutions:**

1. **Use App-Specific Password**
   - **Gmail:** https://myaccount.google.com/apppasswords
   - **Never** use your regular password
   - 2FA must be enabled first

2. **Check SMTP Settings**
   ```json
   // Gmail
   "smtp_server": "smtp.gmail.com",
   "smtp_port": 587,

   // Outlook
   "smtp_server": "smtp-mail.outlook.com",
   "smtp_port": 587,

   // Yahoo
   "smtp_server": "smtp.mail.yahoo.com",
   "smtp_port": 587,
   ```

3. **Test Email Manually**
   ```python
   # In monitor directory:
   source venv/bin/activate
   python3

   >>> import smtplib
   >>> server = smtplib.SMTP('smtp.gmail.com', 587)
   >>> server.starttls()
   >>> server.login('your@email.com', 'app-password')
   >>> # If no error, credentials are correct
   ```

4. **Check Firewall**
   - Port 587 must be open
   - Some networks block SMTP

### Telegram Notifications Not Working

**Symptoms:**
- No messages received in Telegram
- "Failed to send Telegram notification" error

**Solutions:**

1. **Verify Bot Token**
   - Should look like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
   - Get from [@BotFather](https://t.me/botfather)
   - No spaces or extra characters

2. **Verify Chat ID**
   - Should be a number: `123456789`
   - Get from [@userinfobot](https://t.me/userinfobot)
   - Must start conversation with your bot first

3. **Start Chat With Bot**
   - Search for your bot in Telegram
   - Click "Start"
   - Then test notifications

4. **Test API Manually**
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/sendMessage" \
        -d "chat_id=<YOUR_CHAT_ID>" \
        -d "text=Test message"
   ```

---

## Installation Issues

### Setup Script Fails

**Symptoms:**
- `./setup.sh` errors
- Permission denied
- Python not found

**Solutions:**

1. **Make Executable**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

2. **Check Python**
   ```bash
   python3 --version
   # Must be 3.8+

   # If missing:
   # Ubuntu: sudo apt install python3 python3-pip python3-venv
   # Mac: brew install python3
   # Windows: Download from python.org
   ```

3. **Run Manually**
   ```bash
   cd monitor
   python3 -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   playwright install chromium
   ```

### Playwright Install Fails

**Symptoms:**
- "playwright install chromium" hangs
- Download errors
- Insufficient disk space

**Solutions:**

1. **Check Disk Space**
   ```bash
   df -h
   # Need ~500MB free
   ```

2. **Manual Download**
   ```bash
   source venv/bin/activate
   python -m playwright install chromium --force
   ```

3. **Use Different Browser**
   ```python
   # In script, change:
   browser = p.chromium.launch(headless=True)
   # To:
   browser = p.firefox.launch(headless=True)

   # Then install:
   playwright install firefox
   ```

---

## Performance & Resource Issues

### High CPU Usage

**Symptoms:**
- System slows down
- Fan runs loud
- Process using 100% CPU

**Solutions:**

1. **Increase Check Interval**
   ```json
   "check_interval_minutes": 60  // Instead of 15
   ```

2. **Use Headless Mode**
   - Ensure `headless=True` in script
   - More efficient than headed mode

3. **Reduce Concurrent Routes**
   - Monitor fewer routes at once
   - Run separate instances if needed

### High Memory Usage

**Symptoms:**
- RAM usage grows over time
- System becomes sluggish
- Out of memory errors

**Solutions:**

1. **Restart Monitor Periodically**
   ```cron
   # Restart every 6 hours
   0 */6 * * * systemctl restart amtrak-monitor
   ```

2. **Close Browser After Each Check**
   - Script should already do this
   - Verify `browser.close()` is called

3. **Clear Old Screenshots**
   ```bash
   # Delete screenshots older than 7 days
   find monitor/ -name "*.png" -mtime +7 -delete
   ```

### Database Growing Large

**Symptoms:**
- `amtrak_data.db` is many GB
- Queries slow down
- Disk space issues

**Solutions:**

1. **Archive Old Data**
   ```bash
   cd monitor
   sqlite3 amtrak_data.db

   -- Delete entries older than 30 days
   DELETE FROM price_history WHERE check_timestamp < date('now', '-30 days');
   DELETE FROM alerts_sent WHERE timestamp < date('now', '-30 days');

   -- Compact database
   VACUUM;
   ```

2. **Automatic Cleanup (add to script)**
   ```python
   # Add to amtrak_monitor.py
   def cleanup_old_data(days=30):
       conn = sqlite3.connect(self.db_path)
       cursor = conn.cursor()
       cursor.execute(
           "DELETE FROM price_history WHERE check_timestamp < date('now', ?)",
           (f'-{days} days',)
       )
       conn.commit()
       conn.close()
   ```

---

## Still Having Issues?

### Debug Mode

Enable verbose logging:

```python
# In amtrak_monitor.py, change:
logging.basicConfig(level=logging.INFO, ...)
# To:
logging.basicConfig(level=logging.DEBUG, ...)
```

### Collect Diagnostic Info

```bash
# System info
python3 --version
pip list | grep playwright

# Check logs
cat monitor/monitor.log | tail -50

# Check database
sqlite3 monitor/amtrak_data.db "SELECT COUNT(*) FROM price_history"

# Check config
cat config/config.json
```

### Browser Console (Form Filler)

```
1. Press F12 on amtrak.com
2. Go to Console tab
3. Look for errors
4. Copy any error messages
```

### Common Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Config file not found" | Missing config.json | Copy from config.example.json |
| "Timeout waiting for page" | Slow connection or changed site | Increase timeout value |
| "Database is locked" | Multiple instances running | Kill other processes |
| "SMTP authentication failed" | Wrong email credentials | Use app-specific password |
| "localStorage is not defined" | Browser blocking storage | Adjust privacy settings |

---

**Still stuck?** Double-check the main [README.md](README.md) and [EXAMPLES.md](EXAMPLES.md) for detailed configuration help.
