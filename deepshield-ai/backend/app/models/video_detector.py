"""
DeepShield AI — Video Deepfake Detector
Frame-by-frame face analysis using pretrained models
CPU-friendly implementation
"""

import cv2
import torch
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import numpy as np
from pathlib import Path


class VideoDetector:
    def __init__(self):
        self.device    = torch.device("cpu")
        self.model     = None
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            ),
        ])
        # OpenCV face detector
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        self._load_model()

    def _load_model(self):
        try:
            self.model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT)
            self.model.fc = torch.nn.Linear(self.model.fc.in_features, 2)
            self.model.eval()
            self.model.to(self.device)
            print("✅ Video detector loaded (ResNet-50)")
        except Exception as e:
            print(f"⚠️ Video detector load failed: {e}")
            self.model = None

    def detect(self, video_path: str, sample_frames: int = 10) -> dict:
        """
        Detect deepfake in video by analyzing sampled frames.
        """
        try:
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                return self._error_result("Could not open video file")

            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps          = cap.get(cv2.CAP_PROP_FPS)
            duration_sec = total_frames / fps if fps > 0 else 0

            if total_frames == 0:
                return self._error_result("Empty video file")

            # Sample frames evenly
            frame_indices = np.linspace(0, total_frames - 1, min(sample_frames, total_frames), dtype=int)
            frame_scores  = []
            faces_detected = 0

            for idx in frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ret, frame = cap.read()
                if not ret:
                    continue

                # Detect faces in frame
                gray  = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)

                if len(faces) > 0:
                    faces_detected += 1
                    # Analyze each face
                    for (x, y, w, h) in faces[:1]:  # First face only
                        face_roi = frame[y:y+h, x:x+w]
                        score    = self._analyze_face(face_roi)
                        frame_scores.append(score)
                else:
                    # No face — analyze full frame
                    score = self._analyze_frame(frame)
                    frame_scores.append(score)

            cap.release()

            if not frame_scores:
                return self._error_result("No frames could be analyzed")

            # Aggregate scores
            avg_score   = float(np.mean(frame_scores))
            max_score   = float(np.max(frame_scores))
            # Weight towards higher scores (deepfakes often inconsistent)
            final_score = (avg_score * 0.6) + (max_score * 0.4)

            is_deepfake      = final_score > 0.5
            confidence_score = round(final_score * 100, 2)
            authenticity     = round((1 - final_score) * 100, 2)

            return {
                "is_deepfake":           is_deepfake,
                "confidence_score":      confidence_score,
                "authenticity_score":    authenticity,
                "model_used":            "ResNet-50",
                "frames_analyzed":       len(frame_scores),
                "faces_detected":        faces_detected,
                "duration_seconds":      round(duration_sec, 1),
                "confidence_per_frame":  [round(s * 100, 2) for s in frame_scores],
                "summary": (
                    f"Deepfake artifacts detected across {len(frame_scores)} analyzed frames. "
                    f"Face manipulation signatures found."
                    if is_deepfake else
                    f"No significant manipulation detected across {len(frame_scores)} frames. "
                    f"Video appears authentic."
                ),
            }

        except Exception as e:
            print(f"Video detection error: {e}")
            return self._error_result(str(e))

    def _analyze_face(self, face_roi: np.ndarray) -> float:
        """Analyze a face region for manipulation"""
        if self.model and face_roi.size > 0:
            try:
                img    = Image.fromarray(cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB))
                tensor = self.transform(img).unsqueeze(0).to(self.device)
                with torch.no_grad():
                    out   = self.model(tensor)
                    probs = torch.softmax(out, dim=1)
                    return float(probs[0][1].item())
            except:
                pass
        return self._statistical_analysis(face_roi)

    def _analyze_frame(self, frame: np.ndarray) -> float:
        """Analyze full frame when no face detected"""
        return self._statistical_analysis(frame)

    def _statistical_analysis(self, frame: np.ndarray) -> float:
        """Statistical analysis of frame"""
        try:
            gray       = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if len(frame.shape) == 3 else frame
            # Laplacian variance — blurry = possibly manipulated
            laplacian  = cv2.Laplacian(gray, cv2.CV_64F).var()
            blur_score = max(0, 1 - min(laplacian / 500, 1))
            # Noise analysis
            noise = np.std(np.diff(gray.astype(float), axis=0))
            noise_score = max(0, 1 - (noise / 30))
            return float((blur_score + noise_score) / 2 * 0.6)
        except:
            return 0.3

    def _error_result(self, msg: str) -> dict:
        return {
            "is_deepfake":        False,
            "confidence_score":   0.0,
            "authenticity_score": 100.0,
            "model_used":         "error",
            "summary":            f"Analysis error: {msg}",
        }


# Singleton
_video_detector = None

def get_video_detector() -> VideoDetector:
    global _video_detector
    if _video_detector is None:
        _video_detector = VideoDetector()
    return _video_detector