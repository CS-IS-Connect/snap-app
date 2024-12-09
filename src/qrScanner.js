import React, { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import jsQR from "jsqr";
import ReactQrScanner from "react-qr-scanner";  // Importing react-qr-scanner
import "./App.css";

export default function QRScannerDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleOpen = () => {
        setIsOpen(true);
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleScan = (data) => {
        if (data && data.text) {
            setResult(data.text);  // Store the scanned data
            localStorage.setItem("ID", data.text);  // Store the data in local storage
            handleClose();
            window.location.reload();
        }
    };

    const handleError = (err) => {
        console.error("QR Code Scan Error:", err);
        setError("Error scanning the QR code: " + err.message);
    };

    const handleImageUpload = (e) => {
        setError(null);
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.width = img.width;
                canvas.height = img.height;
                context.drawImage(img, 0, 0);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

                try {
                    const qrCode = jsQR(imageData.data, canvas.width, canvas.height);
                    if (qrCode) {
                        setResult(qrCode.data);
                        localStorage.setItem("ID", qrCode.data);
                        handleClose();
                        window.location.reload();
                    } else {
                        setError("No QR code found in the image.");
                    }
                } catch (err) {
                    setError("Could not decode QR code from the image.");
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div>
            <p>Upload your QR to confirm your identity.</p>
            <button className="upload-btn btn" onClick={handleOpen}>
                Scan/Upload Your QR<span><i className="fa-solid fa-qrcode"></i></span>
            </button>

            <Dialog open={isOpen} onClose={handleClose}>
                <div className="crop-btns">
                    <DialogTitle className="crop-title">Scan QR Code</DialogTitle>
                    <DialogActions>
                        <button onClick={handleClose} className="close-btn">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </DialogActions>
                </div>
                <DialogContent>
                    <div>
                        {error && (
                            <div style={{ color: "red", marginTop: "10px" }}>
                                <p>{error}</p>
                            </div>
                        )}

                        {/* QR scanning from camera using react-qr-scanner */}
                        <ReactQrScanner
                            delay={300}
                            onError={handleError}
                            onScan={handleScan}
                            style={{ width: "100%" }}
                            facingMode="environment" // Use the rear camera
                        />

                        {result && <p>Scanned ID: {result}</p>}

                        <div style={{ marginTop: "20px" }}>
                            <button className="label">
                                <label htmlFor="file">Upload a QR from Gallery</label>
                            </button>
                            <input
                                id="file"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                hidden
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
