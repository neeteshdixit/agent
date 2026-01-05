"""
Speech Recognition Service
Handles voice input, transcription, and audio processing
"""

import speech_recognition as sr
from pydub import AudioSegment
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class SpeechRecognitionService:
    """Service for handling speech recognition and audio processing"""

    def __init__(self):
        """Initialize the speech recognition service"""
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        self.available = self._check_availability()

    def _check_availability(self) -> bool:
        """Check if microphone and speech recognition is available"""
        try:
            with self.microphone as source:
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
            logger.info("Speech recognition service initialized successfully")
            return True
        except Exception as e:
            logger.warning(f"Speech recognition not available: {str(e)}")
            return False

    def is_available(self) -> bool:
        """Check if service is available"""
        return self.available

    def listen_and_transcribe(self, duration: int = 10, timeout: int = 10) -> Optional[str]:
        """
        Listen to microphone and transcribe audio to text
        
        Args:
            duration: How long to listen (in seconds)
            timeout: Timeout for listening (in seconds)
        
        Returns:
            Transcribed text or None if failed
        """
        try:
            logger.info(f"Listening for {duration} seconds...")
            
            with self.microphone as source:
                # Adjust for ambient noise
                self.recognizer.adjust_for_ambient_noise(source, duration=1)
                
                # Listen to audio
                audio = self.recognizer.listen(source, timeout=timeout, phrase_time_limit=duration)
            
            logger.info("Audio captured, transcribing...")
            
            # Transcribe using Google Speech Recognition
            text = self.recognizer.recognize_google(audio)
            logger.info(f"Transcribed: {text}")
            
            return text

        except sr.UnknownValueError:
            logger.warning("Could not understand audio")
            return None
        except sr.RequestError as e:
            logger.error(f"Speech recognition request failed: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error during voice capture: {str(e)}")
            return None

    def transcribe_audio(self, audio_path: str) -> Optional[str]:
        """
        Transcribe audio from a file
        
        Args:
            audio_path: Path to audio file
        
        Returns:
            Transcribed text or None if failed
        """
        try:
            if not os.path.exists(audio_path):
                logger.error(f"Audio file not found: {audio_path}")
                return None

            logger.info(f"Transcribing audio file: {audio_path}")

            # Load audio file
            with sr.AudioFile(audio_path) as source:
                audio = self.recognizer.record(source)

            # Transcribe
            text = self.recognizer.recognize_google(audio)
            logger.info(f"Transcribed: {text}")

            return text

        except sr.UnknownValueError:
            logger.warning("Could not understand audio from file")
            return None
        except sr.RequestError as e:
            logger.error(f"Speech recognition request failed: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Error transcribing audio file: {str(e)}")
            return None

    def process_audio_file(self, audio_path: str, output_format: str = 'wav') -> Optional[str]:
        """
        Process and convert audio file to WAV format
        
        Args:
            audio_path: Path to input audio file
            output_format: Output format (default: wav)
        
        Returns:
            Path to processed audio file or None if failed
        """
        try:
            logger.info(f"Processing audio file: {audio_path}")

            # Load audio
            audio = AudioSegment.from_file(audio_path)

            # Convert to output format
            output_path = audio_path.replace(
                os.path.splitext(audio_path)[1],
                f'.{output_format}'
            )
            audio.export(output_path, format=output_format)

            logger.info(f"Audio processed: {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"Error processing audio file: {str(e)}")
            return None

    def set_energy_threshold(self, threshold: int = 4000):
        """
        Set the energy threshold for voice detection
        
        Args:
            threshold: Energy threshold value
        """
        self.recognizer.energy_threshold = threshold
        logger.info(f"Energy threshold set to: {threshold}")

    def set_dynamic_energy_threshold(self, enabled: bool = True):
        """
        Enable or disable dynamic energy threshold adjustment
        
        Args:
            enabled: Whether to enable dynamic threshold
        """
        self.recognizer.dynamic_energy_threshold = enabled
        logger.info(f"Dynamic energy threshold: {enabled}")
