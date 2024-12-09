import React, { useEffect, useState } from "react";
import ImageUploading from "react-images-uploading";
import Cropper from "react-easy-crop";
import { Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import axios from "axios";
import "./App.css";
import heic2any from "heic2any";
import { cropImage } from "./cropUtils";
import QRScannerDialog from "./qrScanner";

const CLOUD_NAME = process.env.REACT_APP_CLOUD_NAME;
const UPLOAD_PRESET = "csis-connect";
const COLLECTION_TAG = "csis-connect";

const convertHEIC = async (file) => {
  if (file.type === "image/heic" || file.type === "image/heif") {
    return await heic2any({ blob: file });
  }
  return file;
};

const ImageCropper = ({ open, image, onComplete, containerStyle, orientation, onClose }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <div className="crop-btns">
        <DialogTitle className="crop-title">Crop Image</DialogTitle>
        <DialogActions>
          <button onClick={onClose} className="close-btn">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </DialogActions>
      </div>
      <DialogContent>
        <div style={containerStyle}>
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={orientation === "portrait" ? 707.5 / 882.5 : 882.5 / 707.5}
            onCropChange={setCrop}
            onCropComplete={(_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
            onZoomChange={setZoom}
          />
        </div>
      </DialogContent>
      <DialogActions>
        <button
          className="finish-btn"
          onClick={() => onComplete(image, croppedAreaPixels, orientation)}
        >
          See The Magic!
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default function App() {
  const [image, setImage] = useState([]);
  const [croppedImage, setCroppedImage] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [orientation, setOrientation] = useState("portrait");
  const [qrscanned, setQrScanned] = useState(false);
  const [userID, setUserID] = useState(null);


  const handleCropComplete = async (imageSrc, croppedAreaPixels, orientation) => {
    if (!croppedAreaPixels) {
      console.error("Invalid cropped area");
      return;
    }

    const overlaySrc = orientation === "portrait"
      ? "./images/overlay-portrait.png"
      : "./images/overlay-landscape.png";

    try {
      const finalImage = await cropImage(imageSrc, croppedAreaPixels, overlaySrc, orientation, console.error);
      setCroppedImage(finalImage);
      uploadImageToCloudinary(finalImage);
      setDialogOpen(false);
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleImageChange = async (newImages) => {
    if (!newImages || newImages.length === 0) return;

    const convertedImage = await convertHEIC(newImages[0].file);
    const img = new Image();
    img.src = URL.createObjectURL(convertedImage);

    img.onload = () => {
      const isPortrait = img.width < img.height ? "portrait" : "landscape";
      setOrientation(isPortrait);
      setImage([{ dataURL: img.src, file: convertedImage }]);
      setDialogOpen(true);
    };
  };

  const generateRandomId = () => {
    return Math.floor(1000 + Math.random() * 9000); 
  };
  
  const uploadImageToCloudinary = async (croppedImage) => {
    try {
      const response = await fetch(croppedImage);
      const blob = await response.blob();

      const randomId = generateRandomId();
      const fileName = `${userID}-${randomId}.png`;
      const formData = new FormData();
      formData.append("file", blob, fileName);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("cloud_name", CLOUD_NAME);
      formData.append("tags", COLLECTION_TAG);
  
      const uploadResponse = await axios.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, formData);
      
      const uploadedImageUrl = uploadResponse.data.secure_url;
      console.log(uploadedImageUrl);
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
    }
  };
  

  useEffect(() => {
    const storedID = localStorage.getItem("ID");
    if (storedID) {
      setUserID(storedID);
      setQrScanned(true);
    }
  }, []);

  return (
    <div className="App">
      <div className="content">
        <div>
          <img className="logo" src="./images/LOGO.png" alt="Logo" />
          <hr></hr>
          <h1 className="title">
            Live The Moment.<br />
            <span>Capture The Memory!</span>
          </h1>
          {croppedImage ? (
            <div
              className="pic-container"
              style={{
                backgroundImage: `url(${croppedImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
            </div>
          ) : (
            <div
              className="pic-container"
              style={{
                backgroundImage: 'url(./images/sample.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
            </div>
          )}
        </div>
        <div className="buttons">
          {croppedImage && (
            <a href={croppedImage} download="CS-IS_Connect_2.0.png"><button className="btn">Download <span><i className="fa-solid fa-download"></i></span></button></a>
          )}
          {!qrscanned ? (
            <QRScannerDialog />
          ) : (
            <ImageUploading
              value={image}
              onChange={handleImageChange}
              acceptType={["jpg", "jpeg", "png", "heic", "heif"]}
            >
              {({ onImageUpload }) => (
                <div>
                  <p>Authenticated ID: {userID}</p>
                  <button className="upload-btn btn" onClick={onImageUpload}>
                    Upload Your Picture<span><i className="fa-solid fa-arrow-up-from-bracket"></i></span>
                  </button>
                </div>
              )}
            </ImageUploading>
          )}
        </div>
        <ImageCropper
          open={dialogOpen}
          onClose={handleCloseDialog}
          image={image[0]?.dataURL || ''}
          onComplete={handleCropComplete}
          containerStyle={{
            position: "relative",
            width: "100%",
            height: 300,
            background: "#333",
          }}
          orientation={orientation}
        />

        <a href="https://collection.cloudinary.com/drj8voqyf/40ba60c5c848306a44f0eeb73312c3e2" rel="noreferrer" target="_blank"><div className="description">
          <div className="des-title">
            <h1>CS-IS Connect 2.0 Album <span><i className="fa-solid fa-arrow-right"></i></span></h1>
          </div>
          <div className="des-pic">
            <img src={'./images/cloudinary.png'} alt="clodinary-logo"></img>
          </div>
        </div>
        </a>
      </div>

      <div className="footer">Made with ❤️ by <a href="https://linktr.ee/yasirulaki">Yasiru Lakintha</a></div>
    </div>
  );
}
