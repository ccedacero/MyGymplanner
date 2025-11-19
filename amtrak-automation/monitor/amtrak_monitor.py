#!/usr/bin/env python3
"""
Amtrak Ticket Monitor - Watches for availability and price changes
Alerts you when tickets match your criteria
"""

import json
import sqlite3
import time
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import schedule

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
except ImportError:
    print("Playwright not installed. Run: pip install -r requirements.txt")
    print("Then run: playwright install chromium")
    exit(1)


class AmtrakMonitor:
    def __init__(self, config_path: str = "../config/config.json"):
        self.config_path = Path(config_path)
        self.config = self.load_config()
        self.db_path = Path(__file__).parent / "amtrak_data.db"
        self.setup_logging()
        self.setup_database()

    def load_config(self) -> dict:
        """Load configuration from JSON file"""
        if not self.config_path.exists():
            example_path = self.config_path.parent / "config.example.json"
            raise FileNotFoundError(
                f"Config file not found. Copy {example_path} to {self.config_path} and customize it."
            )

        with open(self.config_path) as f:
            return json.load(f)

    def setup_logging(self):
        """Configure logging"""
        log_file = Path(__file__).parent / "monitor.log"
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    def setup_database(self):
        """Initialize SQLite database for tracking price history"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                route_name TEXT,
                origin TEXT,
                destination TEXT,
                date TEXT,
                check_timestamp DATETIME,
                available BOOLEAN,
                price REAL,
                train_number TEXT,
                departure_time TEXT,
                arrival_time TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alerts_sent (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                route_name TEXT,
                alert_type TEXT,
                timestamp DATETIME,
                details TEXT
            )
        ''')

        conn.commit()
        conn.close()
        self.logger.info("Database initialized")

    def check_route(self, route: dict) -> List[dict]:
        """
        Check Amtrak website for a specific route
        Returns list of available trains with prices
        """
        self.logger.info(f"Checking route: {route['name']} ({route['origin']} -> {route['destination']})")

        # Amtrak booking URL structure
        base_url = "https://www.amtrak.com/tickets/departure.html"

        results = []

        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                context = browser.new_context(
                    user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                )
                page = context.new_page()

                # Navigate to Amtrak
                page.goto("https://www.amtrak.com", timeout=30000)
                time.sleep(2)

                # Fill out search form
                try:
                    # Origin
                    origin_input = page.locator('input[name="origin"], input[placeholder*="From"]').first
                    origin_input.fill(route['origin'])
                    time.sleep(1)

                    # Destination
                    dest_input = page.locator('input[name="destination"], input[placeholder*="To"]').first
                    dest_input.fill(route['destination'])
                    time.sleep(1)

                    # Date
                    date_input = page.locator('input[type="date"], input[name="departDate"]').first
                    date_input.fill(route['date'])
                    time.sleep(1)

                    # Click search
                    search_button = page.locator('button[type="submit"], button:has-text("Find Trains")').first
                    search_button.click()

                    # Wait for results
                    page.wait_for_load_state('networkidle', timeout=30000)
                    time.sleep(3)

                    # Take screenshot for debugging
                    screenshot_path = Path(__file__).parent / f"screenshot_{route['name']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                    page.screenshot(path=screenshot_path)
                    self.logger.info(f"Screenshot saved: {screenshot_path}")

                    # Parse results (selectors may need adjustment based on actual Amtrak site)
                    trains = page.locator('.train-result, .journey-result, [class*="train"]').all()

                    if trains:
                        for train in trains[:5]:  # Get first 5 results
                            try:
                                # Extract train details (adjust selectors as needed)
                                price_elem = train.locator('[class*="price"], .fare-price').first
                                time_elem = train.locator('[class*="time"], .departure-time').first
                                number_elem = train.locator('[class*="train-number"]').first

                                result = {
                                    'available': True,
                                    'price': self.extract_price(price_elem.inner_text() if price_elem else "N/A"),
                                    'departure_time': time_elem.inner_text() if time_elem else "N/A",
                                    'train_number': number_elem.inner_text() if number_elem else "N/A"
                                }
                                results.append(result)
                            except Exception as e:
                                self.logger.warning(f"Error parsing train result: {e}")
                    else:
                        self.logger.info("No trains found - may need to adjust selectors")

                except PlaywrightTimeout:
                    self.logger.error("Timeout waiting for page elements")
                except Exception as e:
                    self.logger.error(f"Error during search: {e}")

                browser.close()

        except Exception as e:
            self.logger.error(f"Error checking route: {e}")

        return results

    def extract_price(self, price_text: str) -> Optional[float]:
        """Extract numeric price from text"""
        import re
        match = re.search(r'\$?(\d+(?:\.\d{2})?)', price_text.replace(',', ''))
        return float(match.group(1)) if match else None

    def save_results(self, route: dict, results: List[dict]):
        """Save check results to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        timestamp = datetime.now().isoformat()

        for result in results:
            cursor.execute('''
                INSERT INTO price_history
                (route_name, origin, destination, date, check_timestamp, available, price, train_number, departure_time, arrival_time)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                route['name'],
                route['origin'],
                route['destination'],
                route['date'],
                timestamp,
                result.get('available', False),
                result.get('price'),
                result.get('train_number', 'N/A'),
                result.get('departure_time', 'N/A'),
                result.get('arrival_time', 'N/A')
            ))

        conn.commit()
        conn.close()

    def check_alert_conditions(self, route: dict, results: List[dict]) -> List[str]:
        """Check if any alert conditions are met"""
        alerts = []

        if not results:
            return alerts

        # Check for availability alerts
        if route.get('alert_on_availability') and results:
            available_trains = [r for r in results if r.get('available')]
            if available_trains:
                alerts.append(f"✓ Trains available for {route['name']}")

        # Check for price drops
        if route.get('alert_on_price_drop'):
            for result in results:
                price = result.get('price')
                if price and price <= route.get('max_price', float('inf')):
                    alerts.append(
                        f"💰 Price alert: ${price} for {route['name']} "
                        f"(train {result.get('train_number')}, departs {result.get('departure_time')})"
                    )

        return alerts

    def send_notifications(self, alerts: List[str]):
        """Send notifications through configured channels"""
        if not alerts:
            return

        message = "\n".join(alerts)
        notifications = self.config['monitoring']['notifications']

        # Desktop notification
        if notifications.get('desktop', {}).get('enabled'):
            self.send_desktop_notification("Amtrak Alert", message)

        # Email notification
        if notifications.get('email', {}).get('enabled'):
            self.send_email_notification(message)

        # Telegram notification
        if notifications.get('telegram', {}).get('enabled'):
            self.send_telegram_notification(message)

        # Webhook notification
        if notifications.get('webhook', {}).get('enabled'):
            self.send_webhook_notification(message)

        # Log alert
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            'INSERT INTO alerts_sent (route_name, alert_type, timestamp, details) VALUES (?, ?, ?, ?)',
            ('multiple', 'combined', datetime.now().isoformat(), message)
        )
        conn.commit()
        conn.close()

    def send_desktop_notification(self, title: str, message: str):
        """Send desktop notification"""
        try:
            from plyer import notification
            notification.notify(
                title=title,
                message=message,
                app_name='Amtrak Monitor',
                timeout=10
            )
            self.logger.info("Desktop notification sent")
        except Exception as e:
            self.logger.error(f"Failed to send desktop notification: {e}")

    def send_email_notification(self, message: str):
        """Send email notification"""
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            email_config = self.config['monitoring']['notifications']['email']

            msg = MIMEMultipart()
            msg['From'] = email_config['sender_email']
            msg['To'] = email_config['recipient_email']
            msg['Subject'] = 'Amtrak Ticket Alert'

            msg.attach(MIMEText(message, 'plain'))

            server = smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port'])
            server.starttls()
            server.login(email_config['sender_email'], email_config['sender_password'])
            server.send_message(msg)
            server.quit()

            self.logger.info("Email notification sent")
        except Exception as e:
            self.logger.error(f"Failed to send email: {e}")

    def send_telegram_notification(self, message: str):
        """Send Telegram notification"""
        try:
            import requests

            telegram_config = self.config['monitoring']['notifications']['telegram']
            url = f"https://api.telegram.org/bot{telegram_config['bot_token']}/sendMessage"

            payload = {
                'chat_id': telegram_config['chat_id'],
                'text': message,
                'parse_mode': 'HTML'
            }

            response = requests.post(url, json=payload)
            response.raise_for_status()

            self.logger.info("Telegram notification sent")
        except Exception as e:
            self.logger.error(f"Failed to send Telegram notification: {e}")

    def send_webhook_notification(self, message: str):
        """Send webhook notification"""
        try:
            import requests

            webhook_config = self.config['monitoring']['notifications']['webhook']
            response = requests.post(
                webhook_config['url'],
                json={'message': message, 'timestamp': datetime.now().isoformat()},
                timeout=10
            )
            response.raise_for_status()

            self.logger.info("Webhook notification sent")
        except Exception as e:
            self.logger.error(f"Failed to send webhook: {e}")

    def run_check(self):
        """Run a single check of all configured routes"""
        self.logger.info("=== Starting monitoring check ===")

        routes = self.config['monitoring']['routes']
        all_alerts = []

        for route in routes:
            try:
                results = self.check_route(route)

                if results:
                    self.save_results(route, results)
                    alerts = self.check_alert_conditions(route, results)
                    all_alerts.extend(alerts)
                else:
                    self.logger.warning(f"No results found for {route['name']}")

                # Be respectful with rate limiting
                time.sleep(5)

            except Exception as e:
                self.logger.error(f"Error checking route {route['name']}: {e}")

        if all_alerts:
            self.send_notifications(all_alerts)

        self.logger.info("=== Monitoring check complete ===\n")

    def start_monitoring(self):
        """Start continuous monitoring with scheduled checks"""
        interval = self.config['monitoring']['check_interval_minutes']

        self.logger.info(f"Starting Amtrak monitor - checking every {interval} minutes")
        self.logger.info(f"Monitoring {len(self.config['monitoring']['routes'])} routes")

        # Run first check immediately
        self.run_check()

        # Schedule subsequent checks
        schedule.every(interval).minutes.do(self.run_check)

        # Keep running
        try:
            while True:
                schedule.run_pending()
                time.sleep(60)
        except KeyboardInterrupt:
            self.logger.info("Monitor stopped by user")


def main():
    """Main entry point"""
    import argparse

    parser = argparse.ArgumentParser(description='Amtrak Ticket Monitor')
    parser.add_argument('--config', default='../config/config.json', help='Path to config file')
    parser.add_argument('--once', action='store_true', help='Run once and exit (no continuous monitoring)')

    args = parser.parse_args()

    monitor = AmtrakMonitor(args.config)

    if args.once:
        monitor.run_check()
    else:
        monitor.start_monitoring()


if __name__ == '__main__':
    main()
