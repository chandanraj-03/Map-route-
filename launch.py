import subprocess
import sys
import os
import time

def main():
    print("Starting AI Route Optimization Platform...")
    
    # Path setup
    base_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(base_dir, "frontend")
    
    # Start Backend
    print("Starting FastAPI Backend...")
    # Using virtual environment python if it exists, otherwise default python
    venv_python = os.path.join(base_dir, ".venv", "Scripts", "python.exe") if os.name == 'nt' else os.path.join(base_dir, ".venv", "bin", "python")
    
    if os.path.exists(venv_python):
        python_exec = venv_python
    else:
        python_exec = sys.executable

    backend_cmd = [python_exec, "-m", "uvicorn", "main:app", "--reload", "--port", "8000"]
    backend_dir = os.path.join(base_dir, "backend")
    
    backend_process = subprocess.Popen(
        backend_cmd,
        cwd=backend_dir
    )
    
    # Start Frontend
    print("Starting React Frontend...")
    npm_cmd = "npm.cmd" if os.name == 'nt' else "npm"
    frontend_cmd = [npm_cmd, "run", "dev"]
    
    frontend_process = subprocess.Popen(
        frontend_cmd,
        cwd=frontend_dir
    )
    
    try:
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down services...")
        backend_process.terminate()
        frontend_process.terminate()
        backend_process.wait()
        frontend_process.wait()
        print("Shutdown complete.")

if __name__ == "__main__":
    main()
