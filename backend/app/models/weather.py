from sqlalchemy import Column, Integer, Float, Text, DateTime, Index
from backend.app.database.session import Base, utc_now


class WeatherCache(Base):
    __tablename__ = "weather_cache"

    id = Column(Integer, primary_key=True, index=True)
    latitude_bin = Column(Float, nullable=False)
    longitude_bin = Column(Float, nullable=False)
    forecast_json = Column(Text, nullable=False)
    fetched_at = Column(DateTime, default=utc_now, nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)

    __table_args__ = (
        Index("idx_weather_lat_lon_bin", "latitude_bin", "longitude_bin"),
    )
