#!/bin/bash
# Agent Control Center — Quick Start
# Starts both backend (port 8006) and frontend (port 5173)

set -e

echo "=== Agent Control Center ==="

# Backend
echo "[1/2] Starting backend..."
cd backend
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
fi
PYTHONPATH=src .venv/bin/uvicorn controlcenter.main:app --reload --port 8006 &
BACKEND_PID=$!
cd ..

# Frontend
echo "[2/2] Starting frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "Backend:  http://localhost:8006"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
