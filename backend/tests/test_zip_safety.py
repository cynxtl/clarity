import io
import zipfile
import pytest
from pathlib import Path
from backend.app.core.zip_safety import SafeZipExtractor, ZipSafetyError

def create_in_memory_zip(file_dict: dict) -> Path:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for fname, data in file_dict.items():
            zf.writestr(fname, data)
    buf.seek(0)
    return buf

def test_zip_safe_extraction(tmp_path):
    target = tmp_path / "extracted"
    zip_buf = create_in_memory_zip({
        "README.md": "# Readme Content",
        "docs/guide.md": "# Guide Content"
    })
    
    zip_path = tmp_path / "test.zip"
    zip_path.write_bytes(zip_buf.getvalue())

    extracted = SafeZipExtractor.validate_and_extract(zip_path, target)
    assert len(extracted) == 2
    assert (target / "README.md").exists()
    assert (target / "docs/guide.md").exists()

def test_zip_path_traversal_blocked(tmp_path):
    target = tmp_path / "extracted"
    zip_buf = create_in_memory_zip({
        "../evil.md": "malicious"
    })
    zip_path = tmp_path / "evil.zip"
    zip_path.write_bytes(zip_buf.getvalue())

    with pytest.raises(ZipSafetyError) as exc_info:
        SafeZipExtractor.validate_and_extract(zip_path, target)
    assert "traversal" in str(exc_info.value).lower()

def test_zip_prohibited_executable_blocked(tmp_path):
    target = tmp_path / "extracted"
    zip_buf = create_in_memory_zip({
        "script.sh": "#!/bin/bash\necho evil"
    })
    zip_path = tmp_path / "blocked.zip"
    zip_path.write_bytes(zip_buf.getvalue())

    with pytest.raises(ZipSafetyError) as exc_info:
        SafeZipExtractor.validate_and_extract(zip_path, target)
    assert "prohibited" in str(exc_info.value).lower()
