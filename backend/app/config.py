from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "EcoTwin Simulation API"
    cors_origins: str = "http://localhost:8080"

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()