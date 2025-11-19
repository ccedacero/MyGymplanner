# 📖 Configuration Examples

Real-world examples for different use cases.

## Example 1: Weekend Commuter

**Scenario:** Regular weekend trips between New York and Boston

```json
{
  "monitoring": {
    "routes": [
      {
        "name": "Friday Evening to Boston",
        "origin": "NYP",
        "destination": "BOS",
        "date": "2025-12-13",
        "preferred_times": ["afternoon", "evening"],
        "max_price": 120,
        "alert_on_availability": true,
        "alert_on_price_drop": true
      },
      {
        "name": "Sunday Return to NYC",
        "origin": "BOS",
        "destination": "NYP",
        "date": "2025-12-15",
        "preferred_times": ["afternoon"],
        "max_price": 120,
        "alert_on_availability": true,
        "alert_on_price_drop": true
      }
    ],
    "check_interval_minutes": 30,
    "notifications": {
      "desktop": { "enabled": true },
      "email": {
        "enabled": true,
        "smtp_server": "smtp.gmail.com",
        "smtp_port": 587,
        "sender_email": "myemail@gmail.com",
        "sender_password": "app-password-here",
        "recipient_email": "myemail@gmail.com"
      }
    }
  }
}
```

## Example 2: Price Watcher

**Scenario:** Flexible traveler watching for best deals

```json
{
  "monitoring": {
    "routes": [
      {
        "name": "Flexible LA to Seattle",
        "origin": "LAX",
        "destination": "SEA",
        "date": "2025-12-20",
        "max_price": 200,
        "alert_on_availability": false,
        "alert_on_price_drop": true
      }
    ],
    "check_interval_minutes": 60,
    "notifications": {
      "telegram": {
        "enabled": true,
        "bot_token": "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11",
        "chat_id": "123456789"
      }
    }
  }
}
```

## Example 3: Business Traveler

**Scenario:** Need specific train times for meetings

```json
{
  "monitoring": {
    "routes": [
      {
        "name": "Morning Acela to DC",
        "origin": "NYP",
        "destination": "WAS",
        "date": "2025-12-10",
        "preferred_times": ["morning"],
        "max_price": 250,
        "alert_on_availability": true,
        "alert_on_price_drop": false
      }
    ],
    "check_interval_minutes": 15,
    "notifications": {
      "desktop": { "enabled": true },
      "email": { "enabled": true, /* ... */ },
      "webhook": {
        "enabled": true,
        "url": "https://hooks.slack.com/services/YOUR/WEBHOOK"
      }
    }
  }
}
```

## Example 4: Multiple Routes Monitor

**Scenario:** Planning a multi-city tour

```json
{
  "monitoring": {
    "routes": [
      {
        "name": "Leg 1: NYC to Philadelphia",
        "origin": "NYP",
        "destination": "PHL",
        "date": "2025-12-15",
        "max_price": 60,
        "alert_on_availability": true
      },
      {
        "name": "Leg 2: Philadelphia to Baltimore",
        "origin": "PHL",
        "destination": "BAL",
        "date": "2025-12-17",
        "max_price": 40,
        "alert_on_availability": true
      },
      {
        "name": "Leg 3: Baltimore to Washington DC",
        "origin": "BAL",
        "destination": "WAS",
        "date": "2025-12-19",
        "max_price": 30,
        "alert_on_availability": true
      },
      {
        "name": "Return: DC to NYC",
        "origin": "WAS",
        "destination": "NYP",
        "date": "2025-12-22",
        "max_price": 100,
        "alert_on_availability": true
      }
    ],
    "check_interval_minutes": 45,
    "notifications": {
      "desktop": { "enabled": true },
      "telegram": { "enabled": true, /* ... */ }
    }
  }
}
```

## Example 5: Minimal Setup (Desktop Only)

**Scenario:** Simple monitoring with desktop notifications

```json
{
  "monitoring": {
    "routes": [
      {
        "name": "Simple Trip",
        "origin": "CHI",
        "destination": "MKE",
        "date": "2025-12-25",
        "max_price": 100,
        "alert_on_availability": true,
        "alert_on_price_drop": true
      }
    ],
    "check_interval_minutes": 30,
    "notifications": {
      "desktop": { "enabled": true },
      "email": { "enabled": false },
      "telegram": { "enabled": false },
      "webhook": { "enabled": false }
    }
  },
  "form_filler": {
    "passenger_info": {
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane.smith@email.com",
      "phone": "555-987-6543"
    }
  }
}
```

## Station Code Reference

### Northeast Corridor
- **NYP** - New York Penn Station
- **BOS** - Boston South Station
- **PHL** - Philadelphia 30th Street
- **WAS** - Washington DC Union Station
- **BAL** - Baltimore Penn Station
- **NWK** - Newark Penn Station

### Midwest
- **CHI** - Chicago Union Station
- **MKE** - Milwaukee
- **DET** - Detroit
- **STL** - St. Louis

### West Coast
- **LAX** - Los Angeles
- **SEA** - Seattle
- **PDX** - Portland
- **SAC** - Sacramento
- **SAN** - San Diego

### South
- **MIA** - Miami
- **ORL** - Orlando
- **ATL** - Atlanta
- **NOL** - New Orleans

[Complete list of all stations →](https://www.amtrak.com/stations)

## Notification Examples

### Gmail Setup

```json
"email": {
  "enabled": true,
  "smtp_server": "smtp.gmail.com",
  "smtp_port": 587,
  "sender_email": "your.name@gmail.com",
  "sender_password": "app-password-from-google",
  "recipient_email": "your.name@gmail.com"
}
```

**Get App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and your device
3. Copy the 16-character password
4. Use in config (no spaces)

### Outlook/Office 365 Setup

```json
"email": {
  "enabled": true,
  "smtp_server": "smtp-mail.outlook.com",
  "smtp_port": 587,
  "sender_email": "your.name@outlook.com",
  "sender_password": "your-password",
  "recipient_email": "your.name@outlook.com"
}
```

### Telegram Bot Setup

1. **Create Bot:**
   - Message [@BotFather](https://t.me/botfather)
   - Send `/newbot`
   - Follow prompts
   - Copy the token

2. **Get Chat ID:**
   - Message [@userinfobot](https://t.me/userinfobot)
   - Send any message
   - Copy your ID

3. **Configure:**
```json
"telegram": {
  "enabled": true,
  "bot_token": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
  "chat_id": "987654321"
}
```

### Slack Webhook

1. Go to https://api.slack.com/messaging/webhooks
2. Create incoming webhook
3. Copy webhook URL
4. Configure:

```json
"webhook": {
  "enabled": true,
  "url": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX"
}
```

### Discord Webhook

1. Server Settings → Integrations → Webhooks
2. Create New Webhook
3. Copy Webhook URL
4. Configure:

```json
"webhook": {
  "enabled": true,
  "url": "https://discord.com/api/webhooks/123456789/abcdefghijklmnop"
}
```

## Form Filler Configuration

### Basic Setup

Via Tampermonkey menu or in-browser settings:

```
First Name: John
Last Name: Doe
Email: john.doe@email.com
Phone: 555-123-4567
Date of Birth: 1990-01-15

Seat Preference: Window
Class: Coach
Loyalty Number: 123456789

Cardholder Name: John Doe
Billing ZIP: 12345
```

### Business Traveler Setup

```
First Name: Jane
Last Name: Smith
Email: jane.smith@company.com
Phone: 555-987-6543
Date of Birth: 1985-06-20

Seat Preference: Aisle
Class: Business
Loyalty Number: 987654321

Cardholder Name: Jane Smith
Billing ZIP: 90210
```

## Scheduling Examples

### Run Every Hour (Cron)

```cron
0 * * * * cd /home/user/amtrak-automation/monitor && ./run_once.sh
```

### Run Every 30 Minutes (Cron)

```cron
*/30 * * * * cd /home/user/amtrak-automation/monitor && ./run_once.sh
```

### Run Only During Business Hours (Cron)

```cron
0 9-17 * * 1-5 cd /home/user/amtrak-automation/monitor && ./run_once.sh
```

### Systemd Service (Linux)

Create `/etc/systemd/system/amtrak-monitor.service`:

```ini
[Unit]
Description=Amtrak Ticket Monitor
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/home/youruser/amtrak-automation/monitor
ExecStart=/home/youruser/amtrak-automation/monitor/start_monitor.sh
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable amtrak-monitor
sudo systemctl start amtrak-monitor
```

---

**Need more examples?** Check the main [README.md](README.md) or customize these templates for your needs!
