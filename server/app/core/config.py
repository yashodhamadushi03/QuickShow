from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from pathlib import Path

class Settings(BaseSettings):
    PROJECT_NAME: str = "QuickShow Cinema Reservation API"
    API_V1_STR: str = "/api"

    SECRET_KEY: str = "quickshow_jwt_secret_key_production_ready_2026_super_secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    MYSQL_SERVER: str = "gateway01.ap-southeast-1.prod.aws.tidbcloud.com"
    MYSQL_PORT: int = 4000
    MYSQL_USER: str = "6xAdRhFkJrPN6Ad.root"
    MYSQL_PASSWORD: str = "FvL1SHud1J7yEI96"
    MYSQL_DB: str = "quickshowDB"

    DATABASE_URL: Optional[str] = "mysql+pymysql://6xAdRhFkJrPN6Ad.root:FvL1SHud1J7yEI96@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/quickshowDB?ssl_verify_cert=true&ssl_verify_identity=true"
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = "yashodhamadushi03@gmail.com"
    SMTP_PASSWORD: str = "xqmgnjpgamwrcpxv"
    EMAILS_FROM: str = "yashodhamadushi03@gmail.com"
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        import urllib.parse
        encoded_pwd = urllib.parse.quote_plus(self.MYSQL_PASSWORD)
        url = f"mysql+pymysql://{self.MYSQL_USER}:{encoded_pwd}@{self.MYSQL_SERVER}:{self.MYSQL_PORT}/{self.MYSQL_DB}"
        if "tidbcloud.com" in self.MYSQL_SERVER:
            url += "?ssl_verify_cert=true&ssl_verify_identity=true"
        return url

settings = Settings()
