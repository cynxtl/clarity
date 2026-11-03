import os
import zipfile
from pathlib import Path
from typing import List, Tuple
from backend.app.config import settings

ALLOWED_EXTENSIONS = {
    # Markdown & Docs
    ".md", ".markdown", ".mdx", ".txt",
    # Images & Assets
    ".png", ".jpg", ".jpeg", ".svg", ".gif", ".webp",
    # Structured Configs
    ".json", ".yaml", ".yml",
}

BLOCKED_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".sh", ".bin", ".dll", ".so", ".dylib",
    ".pyc", ".pyd", ".vbs", ".ps1", ".jar", ".class", ".msi",
}

class ZipSafetyError(Exception):
    pass

class SafeZipExtractor:
    @classmethod
    def validate_and_extract(cls, zip_path: Path, target_dir: Path) -> List[Tuple[str, int]]:
        """
        Safely inspects and extracts zip archives.
        Returns a list of extracted relative file paths and sizes.
        Raises ZipSafetyError on any violation.
        """
        target_dir = target_dir.resolve()
        target_dir.mkdir(parents=True, exist_ok=True)

        if not zipfile.is_zipfile(zip_path):
            raise ZipSafetyError("Uploaded file is not a valid ZIP archive.")

        total_extracted_size = 0
        extracted_files: List[Tuple[str, int]] = []

        with zipfile.ZipFile(zip_path, 'r') as archive:
            infolist = archive.infolist()

            if len(infolist) > settings.MAX_FILE_COUNT:
                raise ZipSafetyError(
                    f"ZIP archive contains {len(infolist)} files, exceeding limit of {settings.MAX_FILE_COUNT} files."
                )

            # Pre-flight check before extracting anything
            for info in infolist:
                # Disallow symlinks
                if info.is_dir():
                    continue

                # 1. Path traversal verification
                filename = info.filename
                if ".." in filename or filename.startswith("/") or filename.startswith("\\") or ":" in filename:
                    raise ZipSafetyError(f"Security violation: Illegal relative path traversal attempt '{filename}'.")

                # 2. File size verification
                if info.file_size > settings.MAX_SINGLE_FILE_BYTES:
                    raise ZipSafetyError(
                        f"File '{filename}' exceeds maximum single file limit of {settings.MAX_SINGLE_FILE_BYTES // (1024*1024)}MB."
                    )

                total_extracted_size += info.file_size
                if total_extracted_size > settings.MAX_EXTRACTED_SIZE_BYTES:
                    raise ZipSafetyError(
                        f"Total uncompressed content exceeds safety limit of {settings.MAX_EXTRACTED_SIZE_BYTES // (1024*1024)}MB."
                    )

                # 3. Extension verification
                ext = Path(filename).suffix.lower()
                if ext in BLOCKED_EXTENSIONS:
                    raise ZipSafetyError(f"Security violation: Executable or prohibited file type '{ext}' found in archive.")

                # If it's a file, verify it's an allowed doc/asset extension or skip hidden files
                base_name = Path(filename).name
                if base_name.startswith(".") and not base_name.startswith(".markdown"):
                    continue

            # Now perform safe extraction
            for info in infolist:
                if info.is_dir():
                    continue

                ext = Path(info.filename).suffix.lower()
                if ext not in ALLOWED_EXTENSIONS:
                    # Ignore non-doc/asset files safely
                    continue

                # Compute destination path and verify it stays inside target_dir
                dest_path = (target_dir / info.filename).resolve()
                if not str(dest_path).startswith(str(target_dir)):
                    raise ZipSafetyError(f"Path traversal detected: {info.filename}")

                dest_path.parent.mkdir(parents=True, exist_ok=True)

                with archive.open(info) as src, open(dest_path, "wb") as dst:
                    # Stream chunks
                    while chunk := src.read(65536):
                        dst.write(chunk)

                # Store relative path (normalized to forward slashes)
                rel_path = dest_path.relative_to(target_dir).as_posix()
                extracted_files.append((rel_path, dest_path.stat().st_size))

        return extracted_files
