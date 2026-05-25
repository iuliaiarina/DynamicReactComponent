from pathlib import Path
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator, ConfigDict
from typing import List, Union, Optional


class Settings(BaseSettings):
    DEMO_API_BASE: str = Field("http://localhost:8000", env="DEMO_API_BASE")
    CORS_ALLOWED_ORIGINS: Union[str, List[str]] = Field(["*"], env="CORS_ALLOWED_ORIGINS")

    @field_validator('CORS_ALLOWED_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.strip() == "":
                return ["*"]
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v if isinstance(v, list) else ["*"]

    # Make LLM_MODEL optional to avoid startup validation errors when missing
    LLM_MODEL: Optional[str] = Field(None, env="LLM_MODEL")

    MODEL_TEMPERATURE: float = Field(0.0, env="MODEL_TEMPERATURE")

    # Azure OpenAI
    AZURE_OPENAI_API_KEY: Optional[str] = Field(None, env="AZURE_OPENAI_API_KEY")
    AZURE_OPENAI_ENDPOINT: Optional[str] = Field(None, env="AZURE_OPENAI_ENDPOINT")
    AZURE_OPENAI_MODEL_NAME: Optional[str] = Field(None, env="AZURE_OPENAI_MODEL_NAME")
    OPENAI_API_VERSION: str = Field("2023-05-15", env="OPENAI_API_VERSION")
    AZURE_EMBEDDING_DEPLOYMENT: Optional[str] = Field(None, env="AZURE_EMBEDDING_DEPLOYMENT")

    # Documents
    DOC_PATH: Optional[str] = Field(None, env="DOC_PATH")

    # Database
    DB_HOST: Optional[str] = Field(None, env="DB_HOST")
    DB_PORT: int = Field(5432, env="DB_PORT")
    DB_NAME: Optional[str] = Field(None, env="DB_NAME")
    DB_USER: Optional[str] = Field(None, env="DB_USER")
    DB_PASSWORD: Optional[str] = Field(None, env="DB_PASSWORD")
    COLLECTION_NAME: Optional[str] = Field(None, env="COLLECTION_NAME")

    # Tavily API for internet search
    TAVILY_API_KEY: Optional[str] = Field(None, env="TAVILY_API_KEY")

    # MCP Servers
    GMAIL_MCP_SERVER_PATH: Optional[str] = Field(None, env="GMAIL_MCP_SERVER_PATH")
    CALENDAR_MCP_SERVER_PATH: Optional[str] = Field(None, env="CALENDAR_MCP_SERVER_PATH")
    @property
    def CONNECTION_STRING(self) -> Optional[str]:
        if all([self.DB_HOST, self.DB_NAME, self.DB_USER, self.DB_PASSWORD]):
            return f"postgresql+psycopg2://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        return None

    LOG_LEVEL: str = Field("DEBUG", env="LOG_LEVEL")

    model_config = ConfigDict(
        extra="ignore",
        env_file=Path(__file__).resolve().parent.parent.parent / ".env",
        env_file_encoding="utf-8",
    )


settings = Settings()