from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# SQLiteデータベースファイルのパス
DATABASE_URL = "sqlite:///./database.db"

# SQLAlchemyエンジンを作成
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite用の設定
)

# セッションファクトリーを作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ベースクラスを作成
Base = declarative_base()

# スポットモデル
class Spot(Base):
    __tablename__ = "spots"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    address = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    plan = Column(String(100), nullable=True, index=True)
    image_url = Column(String(500), nullable=True)
    visit_duration = Column(Integer, nullable=True)  # 訪問時間（分）
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# CSVアップロード履歴モデル
class CSVUpload(Base):
    __tablename__ = "csv_uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    spot_count = Column(Integer, nullable=True)
    success = Column(Boolean, default=True)

# データベーステーブルを作成
def create_tables():
    Base.metadata.create_all(bind=engine)

# データベースセッションを取得
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# データベース初期化
def init_db():
    create_tables()
    print("データベースが初期化されました。")
