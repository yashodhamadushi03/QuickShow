import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from app.core.config import settings

logger = logging.getLogger("quickshow.notifications")
logging.basicConfig(level=logging.INFO)


class NotificationService:
    @staticmethod
    def send_email_ticket(
        user_email: str,
        user_name: str,
        movie_title: str,
        theater_name: str,
        hall_name: str,
        showtime_str: str,
        seat_labels: List[str],
        total_amount: float,
        transaction_ref: str
    ):
        """
        Sends an HTML confirmation email with ticket details and unique entrance passcode.
        Uses SMTP settings from app config. Logs graceful fallback if SMTP is unavailable.
        """
        seats_display = ", ".join(seat_labels) if seat_labels else "N/A"
        
        subject = f"🎟️ QuickShow Ticket Pass: {movie_title} [{transaction_ref}]"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }}
                .ticket-card {{ max-width: 600px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
                .header {{ background: linear-gradient(135deg, #e11d48, #be123c); padding: 24px; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 28px; color: #ffffff; text-transform: uppercase; letter-spacing: 2px; }}
                .header p {{ margin: 5px 0 0 0; color: #fecdd3; font-size: 14px; }}
                .content {{ padding: 30px; }}
                .movie-title {{ font-size: 24px; font-weight: bold; color: #f43f5e; margin-bottom: 20px; border-bottom: 2px solid #334155; padding-bottom: 10px; }}
                .info-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; }}
                .info-item {{ background: #0f172a; padding: 12px 16px; border-radius: 8px; border-left: 3px solid #e11d48; }}
                .label {{ font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 600; letter-spacing: 0.5px; }}
                .value {{ font-size: 15px; color: #f8fafc; font-weight: 600; margin-top: 4px; }}
                .pass-code {{ background: #0284c7; color: #ffffff; padding: 16px; text-align: center; border-radius: 10px; font-size: 20px; font-weight: bold; letter-spacing: 4px; margin: 20px 0; font-family: monospace; }}
                .footer {{ text-align: center; padding: 20px; background: #0f172a; color: #64748b; font-size: 12px; border-top: 1px solid #334155; }}
            </style>
        </head>
        <body>
            <div class="ticket-card">
                <div class="header">
                    <h1>QuickShow Ticket Pass</h1>
                    <p>Show this digital ticket at the cinema entrance</p>
                </div>
                <div class="content">
                    <p>Hello <strong>{user_name}</strong>,</p>
                    <p>Your ticket booking is confirmed! Here are your ticket details:</p>
                    
                    <div class="movie-title">🎬 {movie_title}</div>
                    
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="label">Cinema / Hall</div>
                            <div class="value">{theater_name} ({hall_name})</div>
                        </div>
                        <div class="info-item">
                            <div class="label">Date & Time</div>
                            <div class="value">{showtime_str}</div>
                        </div>
                        <div class="info-item">
                            <div class="label">Seats</div>
                            <div class="value">{seats_display}</div>
                        </div>
                        <div class="info-item">
                            <div class="label">Total Paid</div>
                            <div class="value">LKR {total_amount:,.2f}</div>
                        </div>
                    </div>

                    <div class="label" style="text-align: center;">Entry Pass Code / Reference</div>
                    <div class="pass-code">{transaction_ref}</div>
                </div>
                <div class="footer">
                    Thank you for choosing QuickShow! Enjoy your movie experience.
                </div>
            </div>
        </body>
        </html>
        """

        # SMTP Configuration (Check env)
        smtp_host = getattr(settings, "SMTP_HOST", None)
        smtp_port = getattr(settings, "SMTP_PORT", 587)
        smtp_user = getattr(settings, "SMTP_USER", None)
        smtp_password = getattr(settings, "SMTP_PASSWORD", None)
        emails_from = getattr(settings, "EMAILS_FROM", "tickets@quickshow.com")

        if smtp_host and smtp_user and smtp_password:
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = emails_from
                msg["To"] = user_email
                msg.attach(MIMEText(html_content, "html"))

                with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_password)
                    server.sendmail(emails_from, user_email, msg.as_string())
                
                logger.info(f"HTML Ticket Email dispatched successfully to {user_email}")
                return True
            except Exception as err:
                logger.error(f"Failed to send email via SMTP: {str(err)}")
        
        # Fallback console log output for development/preview
        logger.info(
            f"\n[EMAIL NOTIFICATION DISPATCH SIMULATION]\n"
            f"To: {user_email}\n"
            f"Subject: {subject}\n"
            f"Movie: {movie_title} | Theater: {theater_name} | Seats: {seats_display}\n"
            f"Ref: {transaction_ref} | Amount: LKR {total_amount:,.2f}\n"
        )
        return False

    @staticmethod
    def send_sms_ticket(
        phone_number: Optional[str],
        movie_title: str,
        showtime_str: str,
        seat_labels: List[str],
        transaction_ref: str
    ):
        """
        Sends a concise SMS text message with ticket pass code to registered phone.
        Integrates with Twilio API gateway if credentials are available.
        """
        if not phone_number:
            logger.info("SMS notification skipped: User phone number not provided.")
            return False

        seats_display = ", ".join(seat_labels) if seat_labels else "N/A"
        message_body = (
            f"🎟️ QuickShow Ticket Confirmed!\n"
            f"Movie: {movie_title}\n"
            f"Time: {showtime_str}\n"
            f"Seats: {seats_display}\n"
            f"Pass Code: {transaction_ref}\n"
            f"Show this pass code at entrance."
        )

        account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", None)
        auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", None)
        from_phone = getattr(settings, "TWILIO_PHONE_NUMBER", None)

        if account_sid and auth_token and from_phone:
            try:
                from twilio.rest import Client
                client = Client(account_sid, auth_token)
                message = client.messages.create(
                    body=message_body,
                    from_=from_phone,
                    to=phone_number
                )
                logger.info(f"SMS Ticket dispatched successfully to {phone_number} (SID: {message.sid})")
                return True
            except Exception as err:
                logger.error(f"Failed to send SMS via Twilio: {str(err)}")

        # Fallback console log output for development/preview
        logger.info(
            f"\n[SMS NOTIFICATION DISPATCH SIMULATION]\n"
            f"To: {phone_number}\n"
            f"Message: {message_body}\n"
        )
        return False
