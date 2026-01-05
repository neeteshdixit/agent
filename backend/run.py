#!/usr/bin/env python3
"""
Startup script for Agent Backend
Handles initialization and startup of the Flask application
"""

import os
import sys
import logging
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from app import app, logger

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


def check_dependencies():
    """Check if all required dependencies are installed"""
    try:
        import flask
        import flask_cors
        import speech_recognition
        import pydub
        logger.info("✓ All dependencies are installed")
        return True
    except ImportError as e:
        logger.error(f"✗ Missing dependency: {str(e)}")
        logger.error("Run: pip install -r requirements.txt")
        return False


def check_microphone():
    """Check if microphone is available"""
    try:
        import speech_recognition as sr
        mic = sr.Microphone()
        logger.info("✓ Microphone detected and available")
        return True
    except Exception as e:
        logger.warning(f"✗ Microphone not available: {str(e)}")
        logger.warning("Voice recognition features may not work")
        return False


def create_data_directories():
    """Create necessary data directories"""
    try:
        directories = ['logs', 'data', 'temp']
        for dir_name in directories:
            dir_path = Path(dir_name)
            if not dir_path.exists():
                dir_path.mkdir(parents=True, exist_ok=True)
                logger.info(f"✓ Created directory: {dir_name}")
    except Exception as e:
        logger.warning(f"Could not create directories: {str(e)}")


def startup():
    """Perform startup checks and start the application"""
    logger.info("=" * 60)
    logger.info("Starting Agent Backend")
    logger.info("=" * 60)

    # Check dependencies
    if not check_dependencies():
        logger.error("Cannot start: Missing dependencies")
        sys.exit(1)

    # Check microphone
    check_microphone()

    # Create directories
    create_data_directories()

    # Get configuration
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True').lower() == 'true'
    host = os.getenv('HOST', '0.0.0.0')

    logger.info("=" * 60)
    logger.info(f"Server Configuration:")
    logger.info(f"  Host: {host}")
    logger.info(f"  Port: {port}")
    logger.info(f"  Debug: {debug}")
    logger.info(f"  Environment: {os.getenv('FLASK_ENV', 'development')}")
    logger.info("=" * 60)

    logger.info("\nAPI Documentation:")
    logger.info("  http://localhost:{}/api/health - Health check")
    logger.info("  http://localhost:{}/api/status - System status")
    logger.info("=" * 60)

    # Start Flask app
    try:
        logger.info(f"\nStarting server on http://{host}:{port}")
        app.run(host=host, port=port, debug=debug)
    except KeyboardInterrupt:
        logger.info("\nShutting down gracefully...")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Error starting server: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    startup()
