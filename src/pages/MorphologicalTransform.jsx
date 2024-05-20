import React, { useState, useEffect, useRef } from "react";
import { Dialog } from "@headlessui/react";
import { Link } from "react-router-dom";

function MorphologicalTransformations() {
  const imageFiles = ["word_bw.bmp"];
  for (let i = 62; i <= 122; i++) {
    imageFiles.push(`${i}.jpg`);
  }

  const [images, setImages] = useState(
    imageFiles.map((name) => `/sharpen/${name}`)
  );
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [transformedImage, setTransformedImage] = useState("");
  const [originalLaplaceImage, setOriginalLaplaceImage] = useState("");
  const [transformedLaplaceImage, setTransformedLaplaceImage] = useState("");
  const [dividerPosition, setDividerPosition] = useState(50);
  const [activeTransformation, setActiveTransformation] = useState("erosion");
  const imageContainerRef = useRef(null);
  const laplaceContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const laplaceKernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];

  const structuringElements = {
    erosion: [0, 1, 0, 1, 1, 1, 0, 1, 0],
    dilation: [1, 1, 1, 1, 1, 1, 1, 1, 1],
  };

  const morphologicalTransform = (data, width, height, element, type) => {
    const output = new Uint8ClampedArray(data.length);
    const kSize = Math.sqrt(element.length);
    const kHalf = Math.floor(kSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        let values = { min: [255, 255, 255], max: [0, 0, 0] };

        for (let ky = -kHalf; ky <= kHalf; ky++) {
          for (let kx = -kHalf; kx <= kHalf; kx++) {
            if (element[(ky + kHalf) * kSize + (kx + kHalf)] === 1) {
              const nx = x + kx;
              const ny = y + ky;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = (ny * width + nx) * 4;
                for (let c = 0; c < 3; c++) {
                  values.min[c] = Math.min(values.min[c], data[nIdx + c]);
                  values.max[c] = Math.max(values.max[c], data[nIdx + c]);
                }
              }
            }
          }
        }
        for (let c = 0; c < 3; c++) {
          output[idx + c] = type === "erosion" ? values.min[c] : values.max[c];
        }
        output[idx + 3] = data[idx + 3];
      }
    }
    return output;
  };

  const applyMorphologicalTransformation = (type, image = selectedImage) => {
    const isBasic = type === "erosion" || type === "dilation";
    const element =
      structuringElements[
        isBasic ? type : type === "opening" ? "erosion" : "dilation"
      ];

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = image;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;

      let resultData = morphologicalTransform(
        data,
        img.width,
        img.height,
        element,
        type
      );

      if (!isBasic) {
        const secondType = type === "opening" ? "dilation" : "erosion";
        const secondElement = structuringElements[secondType];
        resultData = morphologicalTransform(
          new Uint8ClampedArray(resultData),
          img.width,
          img.height,
          secondElement,
          secondType
        );
      }

      const transformedImageData = new ImageData(
        new Uint8ClampedArray(resultData),
        img.width,
        img.height
      );
      ctx.putImageData(transformedImageData, 0, 0);
      setTransformedImage(canvas.toDataURL());
      applyLaplaceFilter(image, true);
      applyLaplaceFilter(canvas.toDataURL(), false);
    };
  };

  const applyLaplaceFilter = (image, isOriginal) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = image;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, img.width, img.height);
      const data = imageData.data;

      const laplaceData = applyKernel(
        data,
        img.width,
        img.height,
        laplaceKernel
      );

      const laplaceImageData = new ImageData(
        new Uint8ClampedArray(laplaceData),
        img.width,
        img.height
      );

      ctx.putImageData(laplaceImageData, 0, 0);
      const laplaceUrl = canvas.toDataURL();
      if (isOriginal) {
        setOriginalLaplaceImage(laplaceUrl);
      } else {
        setTransformedLaplaceImage(laplaceUrl);
      }
    };
  };

  const applyKernel = (data, width, height, kernel) => {
    const output = new Float32Array(data.length);
    const kSize = Math.sqrt(kernel.length);
    const kHalf = Math.floor(kSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sumR = 0,
          sumG = 0,
          sumB = 0;
        for (let ky = -kHalf; ky <= kHalf; ky++) {
          for (let kx = -kHalf; kx <= kHalf; kx++) {
            const px = x + kx;
            const py = y + ky;
            if (px >= 0 && px < width && py >= 0 && py < height) {
              const offset = (py * width + px) * 4;
              const weight = kernel[(ky + kHalf) * kSize + (kx + kHalf)];
              sumR += data[offset] * weight;
              sumG += data[offset + 1] * weight;
              sumB += data[offset + 2] * weight;
            }
          }
        }
        const idx = (y * width + x) * 4;
        output[idx] = sumR;
        output[idx + 1] = sumG;
        output[idx + 2] = sumB;
        output[idx + 3] = data[idx + 3];
      }
    }
    return output;
  };

  const openModal = (image) => {
    setSelectedImage(image);
    setIsOpen(true);
    setActiveTransformation("erosion");
    applyMorphologicalTransformation("erosion", image);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleMouseMove = (e) => {
    if (imageContainerRef.current && laplaceContainerRef.current) {
      const containerWidth = imageContainerRef.current.offsetWidth;
      const mouseX =
        e.clientX - imageContainerRef.current.getBoundingClientRect().left;
      const newPosition =
        Math.max(0, Math.min(mouseX / containerWidth, 1)) * 100;
      setDividerPosition(newPosition);
    }
  };

  useEffect(() => {
    if (selectedImage) {
      applyLaplaceFilter(selectedImage, true);
    }
  }, [selectedImage]);

  useEffect(() => {
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    const handleMouseDown = (e) => {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newImageUrl = e.target.result;
        const newImagesArray = [...images, newImageUrl];
        setImages(newImagesArray);
        openModal(newImageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-6 mt-20">形态学变换作业</h1>
      <div className="fixed top-4 left-4">
        <Link
          to="/"
          className="inline-flex items-center justify-center p-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-300 transition duration-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          返回
        </Link>
      </div>

      <div className="grid grid-cols-5 gap-6 p-8">
        {images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`预览图 ${index + 1}`}
            className="cursor-pointer transform hover:scale-110 transition duration-300 object-cover w-48 h-48 select-none shadow-lg hover:shadow-2xl rounded-lg border border-gray-200 hover:border-blue-500"
            onClick={() => openModal(image)}
          />
        ))}
        <div className="flex items-center justify-center w-48 h-48 bg-gray-200 rounded-lg shadow-lg cursor-pointer hover:bg-gray-300">
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageUpload}
            ref={fileInputRef}
          />
          <svg
            onClick={() => fileInputRef.current.click()}
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0l-4 4m4-4v12"
            />
          </svg>
        </div>
      </div>

      {isOpen && (
        <Dialog
          open={isOpen}
          onClose={closeModal}
          className="fixed inset-0 bg-gray-100 bg-opacity-90 backdrop-blur-sm flex items-center justify-center p-4 text-xl"
        >
          <Dialog.Panel className="bg-white p-6 lg:p-10 rounded-2xl shadow-2xl max-w-6xl mx-auto w-full space-y-6">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-800">
                  图像对比
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-gray-600 mb-2">原图 vs 变换图像</p>
                  <div
                    ref={imageContainerRef}
                    className="group relative aspect-square"
                  >
                    <img
                      src={selectedImage}
                      className="absolute top-0 left-0 w-full h-full object-cover select-none transition duration-500 group-hover:clip-path-none"
                      style={{
                        clipPath: `inset(0 ${100 - dividerPosition}% 0 0)`,
                      }}
                    />
                    <img
                      src={transformedImage}
                      className="absolute top-0 left-0 w-full h-full object-cover select-none transition duration-500 group-hover:clip-path-none"
                      style={{ clipPath: `inset(0 0 0 ${dividerPosition}%)` }}
                    />
                    <div
                      className="divider absolute top-0 left-0 w-0.5 h-full bg-gray-400 hover:bg-gray-500 cursor-col-resize transition"
                      style={{ left: `${dividerPosition}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    拖动分割线来对比原图和变换图像。
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 mb-2">
                    原图拉普拉斯边缘 vs 当前图像拉普拉斯边缘
                  </p>
                  <div
                    ref={laplaceContainerRef}
                    className="group relative aspect-square"
                  >
                    <img
                      src={originalLaplaceImage}
                      className="absolute top-0 left-0 w-full h-full object-cover select-none transition duration-500 group-hover:clip-path-none"
                      style={{
                        clipPath: `inset(0 ${100 - dividerPosition}% 0 0)`,
                      }}
                    />
                    <img
                      src={transformedLaplaceImage}
                      className="absolute top-0 left-0 w-full h-full object-cover select-none transition duration-500 group-hover:clip-path-none"
                      style={{ clipPath: `inset(0 0 0 ${dividerPosition}%)` }}
                    />
                    <div
                      className="divider absolute top-0 left-0 w-0.5 h-full bg-gray-400 hover:bg-gray-500 cursor-col-resize transition"
                      style={{ left: `${dividerPosition}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    拖动分割线来对比原图和当前图像的拉普拉斯边缘。
                  </p>
                </div>
              </div>

              <div>
                <p className="text-gray-600 mb-3">操作</p>
                <div className="grid grid-cols-4 justify-center space-x-8">
                  {[
                    { en: "erosion", cn: "腐蚀" },
                    { en: "dilation", cn: "膨胀" },
                    { en: "opening", cn: "开操作" },
                    { en: "closing", cn: "闭操作" },
                  ].map(({ en, cn }) => (
                    <button
                      key={en}
                      className={`px-6 py-2 rounded-xl font-medium tracking-wide shadow-md transition-colors duration-200 ease-in-out
                    ${
                      activeTransformation === en
                        ? "bg-blue-500 hover:bg-blue-600 text-white"
                        : "bg-gray-300 hover:bg-gray-400 text-gray-800"
                    }`}
                      onClick={() => {
                        setActiveTransformation(en);
                        applyMorphologicalTransformation(en);
                      }}
                    >
                      {cn}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Dialog.Panel>
        </Dialog>
      )}
    </div>
  );
}

export default MorphologicalTransformations;
