import sys
from pathlib import Path
import uvicorn

# Ensure both project root and backend dir are in sys.path
backend_dir = Path(__file__).resolve().parent
root_dir = backend_dir.parent

for p in (str(root_dir), str(backend_dir)):
    if p not in sys.path:
        sys.path.insert(0, p)

if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
