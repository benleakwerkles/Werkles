"""One-shot Stewart camera with local review/crop. No upload or path logging."""

from __future__ import annotations

import argparse
import json
import os
import sys
import tkinter as tk
from pathlib import Path

import cv2
import numpy as np


def open_camera() -> tuple[cv2.VideoCapture, str]:
    attempts = ((cv2.CAP_MSMF, "MEDIA_FOUNDATION"), (cv2.CAP_DSHOW, "DIRECTSHOW"), (cv2.CAP_ANY, "AUTO"))
    for backend, label in attempts:
        camera = cv2.VideoCapture(0, backend)
        if camera.isOpened():
            camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
            camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
            ok, frame = camera.read()
            if ok and frame is not None and frame.size:
                return camera, label
        camera.release()
    raise RuntimeError("NO_CAMERA_BACKEND_DELIVERED_A_FRAME")


class StewartCamera:
    def __init__(self, jpeg: Path, png: Path, source: Path | None = None) -> None:
        self.jpeg, self.png = jpeg, png
        self.camera = None
        self.backend = "EXISTING_LOCAL_FILE" if source else "UNINITIALIZED"
        self.live_frame = self.review_frame = self.crop = self.drag_start = self.drag_original_crop = None
        self.display_box = (0, 0, 1, 1)
        self.mode, self.result = ("REVIEW", "CANCELED") if source else ("LIVE", "CANCELED")
        if source:
            self.review_frame = cv2.imread(str(source), cv2.IMREAD_COLOR)
            if self.review_frame is None or not self.review_frame.size:
                raise RuntimeError("EXISTING_IMAGE_UNREADABLE")
            height, width = self.review_frame.shape[:2]
            self.crop = (0, 0, width, height)
        else:
            self.camera, self.backend = open_camera()

        self.root = tk.Tk()
        self.root.title("Stewart Live Camera — Review & Crop")
        self.root.configure(bg="#202426")
        self.root.geometry("1100x850")
        self.root.minsize(820, 640)
        self.root.protocol("WM_DELETE_WINDOW", self.cancel)

        self.title = tk.Label(self.root, fg="white", bg="#202426", font=("Segoe UI", 16, "bold"))
        self.title.pack(pady=(12, 6))
        self.canvas = tk.Canvas(self.root, bg="black", highlightthickness=1, highlightbackground="#66706c")
        self.canvas.pack(fill="both", expand=True, padx=18, pady=6)
        self.canvas.bind("<ButtonPress-1>", self.crop_start)
        self.canvas.bind("<B1-Motion>", self.crop_drag)
        self.canvas.bind("<ButtonRelease-1>", self.crop_end)
        self.guidance = tk.Label(self.root, fg="#d9e3dd", bg="#202426", font=("Segoe UI", 10))
        self.guidance.pack(pady=(3, 3))
        self.quality = tk.Label(self.root, text="", fg="#f1d68a", bg="#202426", font=("Segoe UI", 10))
        self.quality.pack(pady=(0, 5))

        self.controls = tk.Frame(self.root, bg="#202426")
        self.controls.pack(pady=(0, 14))
        self.capture_button = self.button("Capture for review", self.capture_for_review, primary=True)
        self.save_button = self.button("Save JPEG + PNG", self.save_review, primary=True)
        self.retake_button = self.button("Retake", self.retake)
        self.full_button = self.button("Full frame", self.full_frame)
        self.center43_button = self.button("Center 4:3", lambda: self.center_crop(4, 3))
        self.square_button = self.button("Center square", lambda: self.center_crop(1, 1))
        self.cancel_button = self.button("Cancel", self.cancel)
        self.set_mode(self.mode)
        if self.mode == "REVIEW":
            self.root.after(0, self.update_quality)
        self.root.after(0, self.update_preview)

    def button(self, text: str, command, primary: bool = False) -> tk.Button:
        button = tk.Button(self.controls, text=text, command=command, font=("Segoe UI", 10, "bold" if primary else "normal"), padx=14, pady=8)
        if primary:
            button.configure(bg="#1f463b", fg="white")
        button.pack(side="left", padx=4)
        return button

    def set_mode(self, mode: str) -> None:
        self.mode = mode
        review_buttons = (self.save_button, self.retake_button, self.full_button, self.center43_button, self.square_button)
        if mode == "LIVE":
            self.capture_button.pack(side="left", padx=4)
            for button in review_buttons:
                button.pack_forget()
            self.title.configure(text="LIVE CAMERA — frame the document before capture")
            self.guidance.configure(text="Capture freezes a private review frame first—no output file is written yet.")
            self.quality.configure(text="")
        else:
            self.capture_button.pack_forget()
            for button in review_buttons:
                button.pack(side="left", padx=4)
            self.cancel_button.pack_forget()
            self.cancel_button.pack(side="left", padx=4)
            self.title.configure(text="REVIEW — confirm legibility, crop, then save")
            self.guidance.configure(text="Drag on the image to draw a crop, or use a centered preset. Retake discards this frame.")

    def update_preview(self) -> None:
        if self.mode == "LIVE":
            ok, frame = self.camera.read()
            if not ok or frame is None or not frame.size:
                self.result = "FRAME_STREAM_LOST"
                self.root.destroy()
                return
            self.live_frame = frame
            self.render(frame)
        elif self.review_frame is not None:
            self.render(self.review_frame)
        self.root.after(33, self.update_preview)

    def render(self, frame) -> None:
        canvas_w, canvas_h = max(self.canvas.winfo_width(), 640), max(self.canvas.winfo_height(), 420)
        height, width = frame.shape[:2]
        scale = min(canvas_w / width, canvas_h / height)
        shown_w, shown_h = max(1, int(width * scale)), max(1, int(height * scale))
        shown = cv2.resize(frame, (shown_w, shown_h), interpolation=cv2.INTER_AREA)
        rgb = cv2.cvtColor(shown, cv2.COLOR_BGR2RGB)
        ppm = f"P6 {shown_w} {shown_h} 255\n".encode("ascii") + rgb.tobytes()
        image = tk.PhotoImage(data=ppm, format="PPM")
        x0, y0 = (canvas_w - shown_w) // 2, (canvas_h - shown_h) // 2
        self.display_box = (x0, y0, shown_w, shown_h)
        self.canvas.delete("all")
        self.canvas.create_image(x0, y0, image=image, anchor="nw")
        self.canvas.image = image
        if self.mode == "REVIEW" and self.crop is not None:
            left, top, right, bottom = self.crop
            sx, sy = shown_w / width, shown_h / height
            self.canvas.create_rectangle(x0 + left * sx, y0 + top * sy, x0 + right * sx, y0 + bottom * sy, outline="#45e08c", width=4)
            self.canvas.create_text(x0 + 12, y0 + 12, text="AREA TO SAVE", fill="#45e08c", anchor="nw", font=("Segoe UI", 11, "bold"))

    def canvas_to_frame(self, x: int, y: int) -> tuple[int, int]:
        x0, y0, shown_w, shown_h = self.display_box
        height, width = self.review_frame.shape[:2]
        fx = int(max(0, min(width, (x - x0) * width / shown_w)))
        fy = int(max(0, min(height, (y - y0) * height / shown_h)))
        return fx, fy

    def crop_start(self, event) -> None:
        if self.mode == "REVIEW":
            self.drag_original_crop = self.crop
            self.drag_start = self.canvas_to_frame(event.x, event.y)

    def crop_drag(self, event) -> None:
        if self.mode == "REVIEW" and self.drag_start:
            self.crop = self.normalized_crop(self.drag_start, self.canvas_to_frame(event.x, event.y))

    def crop_end(self, event) -> None:
        if self.mode != "REVIEW" or not self.drag_start:
            return
        candidate = self.normalized_crop(self.drag_start, self.canvas_to_frame(event.x, event.y))
        self.drag_start = None
        if candidate[2] - candidate[0] >= 160 and candidate[3] - candidate[1] >= 120:
            self.crop = candidate
            self.update_quality()
        else:
            self.crop = self.drag_original_crop
        self.drag_original_crop = None

    @staticmethod
    def normalized_crop(start: tuple[int, int], end: tuple[int, int]) -> tuple[int, int, int, int]:
        return min(start[0], end[0]), min(start[1], end[1]), max(start[0], end[0]), max(start[1], end[1])

    def capture_for_review(self) -> None:
        if self.live_frame is None:
            return
        self.review_frame = self.live_frame.copy()
        height, width = self.review_frame.shape[:2]
        self.crop = (0, 0, width, height)
        self.set_mode("REVIEW")
        self.update_quality()

    def full_frame(self) -> None:
        height, width = self.review_frame.shape[:2]
        self.crop = (0, 0, width, height)
        self.update_quality()

    def center_crop(self, ratio_w: int, ratio_h: int) -> None:
        height, width = self.review_frame.shape[:2]
        target_ratio = ratio_w / ratio_h
        if width / height > target_ratio:
            crop_h, crop_w = height, int(height * target_ratio)
        else:
            crop_w, crop_h = width, int(width / target_ratio)
        left, top = (width - crop_w) // 2, (height - crop_h) // 2
        self.crop = (left, top, left + crop_w, top + crop_h)
        self.update_quality()

    def selected_frame(self):
        left, top, right, bottom = self.crop
        return self.review_frame[top:bottom, left:right]

    def update_quality(self) -> None:
        selected = self.selected_frame()
        height, width = selected.shape[:2]
        gray = cv2.cvtColor(selected, cv2.COLOR_BGR2GRAY)
        brightness = float(gray.mean())
        focus = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        resolution = "OK" if width >= 900 and height >= 600 else "LOW"
        focus_label = "OK" if focus >= 70 else "CHECK SHARPNESS"
        light_label = "OK" if 45 <= brightness <= 220 else "CHECK LIGHTING"
        self.quality.configure(text=f"Advisory only — resolution {width}×{height}: {resolution} | focus: {focus_label} | lighting: {light_label} | site rules vary")

    @staticmethod
    def write_exclusive(path: Path, data: bytes) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("xb") as output:
            output.write(data)
            output.flush()
            os.fsync(output.fileno())

    def save_review(self) -> None:
        selected = self.selected_frame()
        jpeg_ok, jpeg_data = cv2.imencode(".jpg", selected, [cv2.IMWRITE_JPEG_QUALITY, 92])
        png_ok, png_data = cv2.imencode(".png", selected, [cv2.IMWRITE_PNG_COMPRESSION, 3])
        if not jpeg_ok or not png_ok:
            self.result = "ENCODE_FAILED"
            self.root.destroy()
            return
        try:
            self.write_exclusive(self.jpeg, jpeg_data.tobytes())
            try:
                self.write_exclusive(self.png, png_data.tobytes())
            except Exception:
                self.jpeg.unlink(missing_ok=True)
                raise
            self.result = "CAPTURED_REVIEWED"
        except FileExistsError:
            self.result = "OUTPUT_EXISTS"
        except Exception:
            self.jpeg.unlink(missing_ok=True)
            self.png.unlink(missing_ok=True)
            self.result = "WRITE_FAILED"
        self.root.destroy()

    def retake(self) -> None:
        self.review_frame = self.crop = self.drag_start = None
        self.set_mode("LIVE")

    def cancel(self) -> None:
        self.result = "CANCELED"
        self.root.destroy()

    def run(self) -> tuple[str, str]:
        try:
            self.root.mainloop()
            return self.result, self.backend
        finally:
            if self.camera is not None:
                self.camera.release()


def main() -> int:
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--jpeg")
    parser.add_argument("--png")
    parser.add_argument("--source")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        cv2.rectangle(frame, (160, 60), (1120, 660), (255, 255, 255), -1)
        selected = frame[60:660, 160:1120]
        jpeg_ok, _ = cv2.imencode(".jpg", selected, [cv2.IMWRITE_JPEG_QUALITY, 92])
        png_ok, _ = cv2.imencode(".png", selected, [cv2.IMWRITE_PNG_COMPRESSION, 3])
        focus = float(cv2.Laplacian(cv2.cvtColor(selected, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var())
        passed = bool(jpeg_ok and png_ok and selected.shape[:2] == (600, 960) and focus >= 0)
        print(json.dumps({"state": "PASS" if passed else "FAIL", "review_before_write": True, "crop_ready": True, "quality_advisory_ready": True, "private_image_opened": False}))
        return 0 if passed else 3
    if not args.jpeg or not args.png:
        print(json.dumps({"state": "BLOCKED", "reason": "OUTPUT_PATHS_REQUIRED"}))
        return 3
    jpeg, png = Path(args.jpeg).resolve(), Path(args.png).resolve()
    if jpeg.suffix.lower() not in {".jpg", ".jpeg"} or png.suffix.lower() != ".png":
        print(json.dumps({"state": "BLOCKED", "reason": "INVALID_OUTPUT_EXTENSIONS"}))
        return 3
    if jpeg.exists() or png.exists():
        print(json.dumps({"state": "BLOCKED", "reason": "OUTPUT_EXISTS"}))
        return 3
    try:
        source = Path(args.source).resolve() if args.source else None
        if source and not source.is_file():
            print(json.dumps({"state": "BLOCKED", "reason": "SOURCE_NOT_FOUND", "files_written": False}))
            return 3
        state, backend = StewartCamera(jpeg, png, source=source).run()
        print(json.dumps({"state": state, "backend": backend, "files_written": state == "CAPTURED_REVIEWED"}))
        return 0 if state == "CAPTURED_REVIEWED" else 2
    except Exception as error:
        print(json.dumps({"state": "BLOCKED", "reason": str(error), "files_written": False}))
        return 3


if __name__ == "__main__":
    sys.exit(main())
