const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (errorEvent) => {
      console.error("Image loading failed:", errorEvent);
      reject(new Error(`Failed to load image from URL: ${url}`));
    });
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop, overlaySrc) {
  const image = await createImage(imageSrc);
  const overlayImage = overlaySrc ? await createImage(overlaySrc) : null;

  const isPortrait = image.width < image.height;
  const croppedWidth = isPortrait ? 702 : 882.5;
  const croppedHeight = isPortrait ? 882.5 : 702;

  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  croppedCanvas.width = croppedWidth;
  croppedCanvas.height = croppedHeight;

  croppedCtx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height, 
    0,
    0,
    croppedWidth,
    croppedHeight
  );

  const duplicateCanvas = document.createElement("canvas");
  const duplicateCtx = duplicateCanvas.getContext("2d");

  duplicateCanvas.width = 1000;
  duplicateCanvas.height = 1000;

  duplicateCtx.filter = "grayscale(100%)";
  duplicateCtx.drawImage(croppedCanvas, 0, 0, croppedWidth, croppedHeight, 0, 0, 1000, 1000);
  duplicateCtx.filter = "none"; 

  const finalCanvas = document.createElement("canvas");
  const finalCtx = finalCanvas.getContext("2d");

  finalCanvas.width = 1000;
  finalCanvas.height = 1000;

  finalCtx.drawImage(duplicateCanvas, 0, 0, 1000, 1000);
  const offsetX = (1000 - croppedWidth) / 2;
  const offsetY = (1000 - croppedHeight) / 2;

  finalCtx.translate(1000 / 2, 1000 / 2); 
  finalCtx.rotate((-4.87 * Math.PI) / 180); 
  finalCtx.translate(-1000 / 2, -1000 / 2);
  finalCtx.drawImage(croppedCanvas, offsetX, offsetY);

  if (overlayImage) {
    finalCtx.setTransform(1, 0, 0, 1, 0, 0);
    finalCtx.drawImage(overlayImage, 0, 0, 1000, 1000);
  }

  return finalCanvas.toDataURL("image/png");
}

export const cropImage = async (image, croppedAreaPixels, overlaySrc, onError) => {
  try {
    const croppedImage = await getCroppedImg(image, croppedAreaPixels, overlaySrc);
    return croppedImage;
  } catch (err) {
    if (typeof onError === "function") {
      onError(err); 
    } else {
      console.error("Error cropping image:", err);
    }
  }
};