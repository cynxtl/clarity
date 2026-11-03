import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    slug = Column(String(120), nullable=False, unique=True, index=True)
    description = Column(String(500), nullable=True)
    root_path = Column(String(500), nullable=False)
    is_sample = Column(Integer, default=0) # 1 if seeded demonstration repo
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    files = relationship("DocumentFile", back_populates="workspace", cascade="all, delete-orphan")
    scans = relationship("Scan", back_populates="workspace", cascade="all, delete-orphan")

class DocumentFile(Base):
    __tablename__ = "document_files"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    path = Column(String(500), nullable=False)  # Relative to workspace root, e.g. "guides/auth.md"
    filename = Column(String(255), nullable=False)
    extension = Column(String(30), nullable=False)
    size_bytes = Column(Integer, default=0)
    line_count = Column(Integer, default=0)
    word_count = Column(Integer, default=0)
    last_modified = Column(DateTime, default=utc_now)

    workspace = relationship("Workspace", back_populates="files")

class Scan(Base):
    __tablename__ = "scans"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(30), default="completed")  # "completed", "failed", "running"
    total_score = Column(Float, default=100.0)
    grade = Column(String(5), default="A")  # "A+", "A", "B", "C", "D", "F"
    structure_score = Column(Float, default=100.0)
    links_score = Column(Float, default=100.0)
    style_score = Column(Float, default=100.0)
    error_count = Column(Integer, default=0)
    warning_count = Column(Integer, default=0)
    info_count = Column(Integer, default=0)
    total_files_scanned = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)

    workspace = relationship("Workspace", back_populates="scans")
    issues = relationship("ScanIssue", back_populates="scan", cascade="all, delete-orphan")

class ScanIssue(Base):
    __tablename__ = "scan_issues"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    scan_id = Column(String(36), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, index=True)
    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_id = Column(String(50), nullable=False, index=True)
    rule_name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False, index=True)  # structure, links, assets, style, accessibility
    severity = Column(String(20), nullable=False, index=True)  # error, warning, info
    file_path = Column(String(500), nullable=False)
    line_number = Column(Integer, nullable=True)
    message = Column(Text, nullable=False)
    snippet = Column(Text, nullable=True)
    suggested_fix = Column(Text, nullable=True)

    scan = relationship("Scan", back_populates="issues")
