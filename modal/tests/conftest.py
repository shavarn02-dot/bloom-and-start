"""Pytest configuration for the Modal engine tests."""

from pathlib import Path
import sys


MODAL_DIR = Path(__file__).resolve().parents[1]
if str(MODAL_DIR) not in sys.path:
    sys.path.insert(0, str(MODAL_DIR))
