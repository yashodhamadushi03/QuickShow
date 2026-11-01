import logging
import smtplib
import io
import base64
import qrcode
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from typing import List, Optional
from app.core.config import settings

logger = logging.getLogger("quickshow.notifications")
logging.basicConfig(level=logging.INFO)


def generate_qr_code(data: str) -> tuple[bytes, str]:
    """Generates PNG bytes and data URI for high-contrast QR code."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#0f172a", back_color="#ffffff")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png_bytes = buf.getvalue()
    b64_str = base64.b64encode(png_bytes).decode("utf-8")
    data_uri = f"data:image/png;base64,{b64_str}"
    return png_bytes, data_uri


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
        transaction_ref: str,
        verification_code: Optional[str] = None
    ):
        """
        Sends an HTML confirmation email with ticket details, unique entrance passcode,
        and an embedded high-resolution verification QR code for turnstile entrance scanning.
        """
        if not user_email or not str(user_email).strip():
            logger.warning("Email dispatch skipped: user_email is empty.")
            return False

        if isinstance(seat_labels, str):
            seat_labels = [seat_labels]
        elif not seat_labels:
            seat_labels = []

        user_name = user_name or "Valued Customer"
        movie_title = movie_title or "Cinema Movie"
        theater_name = theater_name or "QuickShow Cinema"
        hall_name = hall_name or "Standard Hall"
        showtime_str = showtime_str or "Scheduled Showtime"
        transaction_ref = transaction_ref or "QS-TICKET"
        verification_code = verification_code or f"VERIFY-{transaction_ref}"

        seats_display = ", ".join(seat_labels) if seat_labels else "Confirmed Seats"
        
        # Generate QR code containing entrance verification data
        qr_payload = (
            f"QUICKSHOW:{transaction_ref}|MOVIE:{movie_title}|"
            f"THEATER:{theater_name}|HALL:{hall_name}|"
            f"TIME:{showtime_str}|SEATS:{seats_display}|"
            f"CODE:{verification_code}"
        )
        try:
            qr_bytes, qr_data_uri = generate_qr_code(qr_payload)
        except Exception as qr_err:
            logger.warning(f"Could not generate QR code: {qr_err}")
            qr_bytes, qr_data_uri = b"", ""

        subject = f"🎟️ QuickShow Ticket Pass: {movie_title} [{transaction_ref}]"

        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #020617; color: #f8fafc; margin: 0; padding: 20px; }}
        .ticket-card {{ max-width: 580px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }}
        .header {{ background: linear-gradient(135deg, #e11d48, #be123c); padding: 28px 24px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 26px; color: #ffffff; text-transform: uppercase; letter-spacing: 2px; font-weight: 900; }}
        .header p {{ margin: 6px 0 0 0; color: #ffe4e6; font-size: 13px; font-weight: 500; }}
        .content {{ padding: 28px 24px; }}
        .movie-title {{ font-size: 22px; font-weight: 800; color: #ffffff; margin-bottom: 20px; border-bottom: 1px solid #1e293b; padding-bottom: 14px; letter-spacing: -0.5px; }}
        .info-grid {{ width: 100%; border-collapse: separate; border-spacing: 0 10px; margin-bottom: 20px; }}
        .info-row {{ background: #1e293b; border-radius: 10px; }}
        .info-cell {{ padding: 12px 16px; }}
        .label {{ font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px; }}
        .value {{ font-size: 15px; color: #f8fafc; font-weight: 700; }}
        .value-highlight {{ font-size: 16px; color: #f43f5e; font-weight: 800; }}
        .qr-section {{ text-align: center; margin: 24px 0 16px 0; background: #020617; padding: 22px; border-radius: 16px; border: 1px dashed #334155; }}
        .qr-label {{ font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 1px; margin-bottom: 14px; }}
        .qr-image {{ display: block; margin: 0 auto; border-radius: 10px; border: 5px solid #ffffff; background: #ffffff; }}
        .qr-hint {{ margin: 12px 0 0 0; color: #38bdf8; font-size: 13px; font-weight: 600; }}
        .pass-code-container {{ text-align: center; margin-top: 14px; }}
        .pass-code {{ display: inline-block; background: #0284c7; color: #ffffff; padding: 10px 20px; border-radius: 8px; font-size: 18px; font-weight: 800; letter-spacing: 3px; font-family: monospace; }}
        .footer {{ text-align: center; padding: 20px; background: #020617; color: #64748b; font-size: 12px; border-top: 1px solid #1e293b; }}
    </style>
</head>
<body>
    <div class="ticket-card">
        <div class="header">
            <h1>QuickShow Ticket Pass</h1>
            <p>Official Digital Entrance Pass • Scan at Cinema Gate</p>
        </div>
        <div class="content">
            <p style="margin-top:0; color: #cbd5e1; font-size: 14px;">Hello <strong>{user_name}</strong>,</p>
            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">Your cinema reservation is confirmed. Present this digital ticket or show the QR code at the hall entrance.</p>
            
            <div class="movie-title">🎬 {movie_title}</div>
            
            <table class="info-grid">
                <tr class="info-row">
                    <td class="info-cell" style="width: 50%;">
                        <div class="label">Cinema & Hall</div>
                        <div class="value">{theater_name}</div>
                        <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">{hall_name}</div>
                    </td>
                    <td class="info-cell" style="width: 50%;">
                        <div class="label">Movie Showtime</div>
                        <div class="value-highlight">{showtime_str}</div>
                    </td>
                </tr>
                <tr class="info-row">
                    <td class="info-cell">
                        <div class="label">Reserved Seats</div>
                        <div class="value" style="color: #38bdf8;">{seats_display}</div>
                    </td>
                    <td class="info-cell">
                        <div class="label">Total Paid</div>
                        <div class="value">LKR {float(total_amount):,.2f}</div>
                    </td>
                </tr>
            </table>

            <!-- Entrance Verification QR Code Section -->
            <div class="qr-section">
                <div class="qr-label">Entrance Verification QR Pass</div>
                <img src="cid:ticket_qrcode" class="qr-image" width="160" height="160" alt="Ticket Verification QR Code" />
                <p class="qr-hint">Scan at cinema turnstile or entrance usher</p>
                <div class="pass-code-container">
                    <div class="pass-code">{transaction_ref}</div>
                </div>
            </div>
        </div>
        <div class="footer">
            Thank you for choosing QuickShow Sri Lanka! Enjoy your blockbuster movie experience.
        </div>
    </div>
</body>
</html>"""

        smtp_host = getattr(settings, "SMTP_HOST", "smtp.gmail.com") or "smtp.gmail.com"
        smtp_port = getattr(settings, "SMTP_PORT", 587) or 587
        smtp_user = getattr(settings, "SMTP_USER", "yashodhamadushi03@gmail.com") or "yashodhamadushi03@gmail.com"
        smtp_password = getattr(settings, "SMTP_PASSWORD", "xqmgnjpgamwrcpxv") or "xqmgnjpgamwrcpxv"
        emails_from = getattr(settings, "EMAILS_FROM", None) or smtp_user or "yashodhamadushi03@gmail.com"

        # Construct multipart email with inline CID QR image attachment
        msg = MIMEMultipart("related")
        msg["Subject"] = subject
        msg["From"] = f"QuickShow LK <{emails_from}>"
        msg["To"] = user_email

        msg_alt = MIMEMultipart("alternative")
        msg.attach(msg_alt)
        msg_alt.attach(MIMEText(html_content, "html"))

        if qr_bytes:
            try:
                qr_img = MIMEImage(qr_bytes, name="ticket_qrcode.png")
                qr_img.add_header("Content-ID", "<ticket_qrcode>")
                qr_img.add_header("Content-Disposition", "inline", filename="ticket_qrcode.png")
                msg.attach(qr_img)
            except Exception as att_err:
                logger.warning(f"Failed to attach QR code MIMEImage: {att_err}")

        try:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(emails_from, user_email, msg.as_string())
            logger.info(f"HTML Ticket Email with QR Pass dispatched successfully to {user_email} via TLS ({smtp_port})")
            return True
        except Exception as tls_err:
            logger.warning(f"Port {smtp_port} TLS dispatch warning: {tls_err}. Retrying via Port 465 SSL...")
            try:
                with smtplib.SMTP_SSL(smtp_host, 465, timeout=10) as server_ssl:
                    server_ssl.login(smtp_user, smtp_password)
                    server_ssl.sendmail(emails_from, user_email, msg.as_string())
                logger.info(f"HTML Ticket Email with QR Pass dispatched successfully to {user_email} via SSL (465)")
                return True
            except Exception as ssl_err:
                logger.error(f"Failed to send email via SMTP (TLS & SSL): {ssl_err}")

        logger.info(
            f"\n[EMAIL NOTIFICATION DISPATCH SIMULATION]\n"
            f"To: {user_email}\n"
            f"Subject: {subject}\n"
            f"Movie: {movie_title} | Theater: {theater_name} | Seats: {seats_display}\n"
            f"Showtime: {showtime_str}\n"
            f"QR Payload: {qr_payload}\n"
            f"Ref: {transaction_ref} | Amount: LKR {float(total_amount):,.2f}\n"
        )
        return False

    @staticmethod
    def send_sms_ticket(
        phone_number: Optional[str],
        movie_title: str,
        showtime_str: str,
        seat_labels: List[str],
        transaction_ref: str,
        verification_code: Optional[str] = None
    ):
        """
        Sends a concise SMS text message with ticket pass code to registered phone.
        Integrates with Twilio API gateway if credentials are available.
        """
        if not phone_number or not str(phone_number).strip():
            logger.info("SMS notification skipped: User phone number not provided.")
            return False

        if isinstance(seat_labels, str):
            seat_labels = [seat_labels]
        elif not seat_labels:
            seat_labels = []

        movie_title = movie_title or "Cinema Movie"
        showtime_str = showtime_str or "Scheduled Showtime"
        transaction_ref = transaction_ref or "QS-TICKET"
        seats_str = ", ".join(seat_labels) if seat_labels else "Confirmed Seats"

        sms_body = (
            f"🎟️ QuickShow Ticket Confirmed!\n"
            f"Movie: {movie_title}\n"
            f"Time: {showtime_str}\n"
            f"Seats: {seats_str}\n"
            f"Pass Code: {transaction_ref}\n"
            f"Show this pass code at entrance."
        )

        twilio_sid = getattr(settings, "TWILIO_ACCOUNT_SID", None)
        twilio_token = getattr(settings, "TWILIO_AUTH_TOKEN", None)
        twilio_from = getattr(settings, "TWILIO_PHONE_NUMBER", None)

        if twilio_sid and twilio_token and twilio_from:
            try:
                from twilio.rest import Client
                client = Client(twilio_sid, twilio_token)
                message = client.messages.create(
                    body=sms_body,
                    from_=twilio_from,
                    to=phone_number
                )
                logger.info(f"SMS dispatched to {phone_number} (SID: {message.sid})")
                return True
            except Exception as e:
                logger.error(f"Failed to send SMS via Twilio: {e}")

        logger.info(
            f"\n[SMS NOTIFICATION DISPATCH SIMULATION]\n"
            f"To: {phone_number}\n"
            f"Message: {sms_body}\n"
        )
        return False
