import React, { useState, useRef, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { Link } from "react-router-dom";

function SharpeningFilter() {
  const imageFiles = [];

  for (let i = 0; i <= 61; i++) {
    imageFiles.push(`${i}.jpg`);
  }

  const [images, setImages] = useState(
    imageFiles.map((name) => `/sharpen/${name}`)
  );

  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [filteredImage, setFilteredImage] = useState("");
  const [enhancedImage, setEnhancedImage] = useState("");
  const [dividerPosition, setDividerPosition] = useState(50);
  const [activeKernel, setActiveKernel] = useState("1");
  const imageContainerRef = useRef(null);

  const laplaceKernels = {
    1: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
    2: [1, 1, 1, 1, -8, 1, 1, 1, 1],
    3: [0, -1, 0, -1, 4, -1, 0, -1, 0],
    4: [0, 1, 0, 1, -4, 1, 0, 1, 0],
  };

  const openModal = (image) => {
    setSelectedImage(image);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const applyLaplaceFilter = (kernelType) => {
    const kernel = laplaceKernels[kernelType];
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = selectedImage;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const originalImageData = ctx.getImageData(0, 0, img.width, img.height);
      const originalData = originalImageData.data;

      const filteredData = applyKernel(
        originalData.slice(),
        img.width,
        img.height,
        kernel
      );
      const filteredImageData = new ImageData(
        new Uint8ClampedArray(filteredData),
        img.width,
        img.height
      );

      ctx.putImageData(filteredImageData, 0, 0);
      setFilteredImage(canvas.toDataURL());

      for (let i = 0; i < originalData.length; i += 4) {
        originalData[i] += filteredData[i] * 0.5;
        originalData[i + 1] += filteredData[i + 1] * 0.5;
        originalData[i + 2] += filteredData[i + 2] * 0.5;
      }

      ctx.putImageData(originalImageData, 0, 0);
      setEnhancedImage(canvas.toDataURL());
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

  const formatKernelMatrix = (kernel) => {
    const size = Math.sqrt(kernel.length);
    const rows = [];
    for (let i = 0; i < size; i++) {
      rows.push(kernel.slice(i * size, (i + 1) * size).join(" "));
    }
    return rows;
  };

  const handleMouseMove = (e) => {
    if (imageContainerRef.current) {
      const containerWidth = imageContainerRef.current.offsetWidth;
      const mouseX =
        e.clientX - imageContainerRef.current.getBoundingClientRect().left;
      const newPosition =
        Math.max(0, Math.min(mouseX / containerWidth, 1)) * 100;
      setDividerPosition(newPosition);
    }
  };

  useEffect(() => {
    applyLaplaceFilter(activeKernel);
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

  const fileInputRef = useRef(null);

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
      <h1 className="text-4xl font-bold mb-6 mt-20">锐化滤波器作业</h1>
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
          className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-md flex items-center justify-center p-4"
        >
          <Dialog.Panel className="bg-white p-8 rounded-xl shadow-xl max-w-5xl mx-auto w-full">
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
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-gray-600 mb-2">原图 vs 增强图</p>
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
                      src={enhancedImage}
                      className="absolute top-0 left-0 w-full h-full object-cover select-none transition duration-500 group-hover:clip-path-none"
                      style={{ clipPath: `inset(0 0 0 ${dividerPosition}%)` }}
                    />
                    <div
                      className="divider absolute top-0 left-0 w-0.5 h-full bg-gray-400 hover:bg-gray-500 cursor-col-resize transition"
                      style={{ left: `${dividerPosition}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    拖动分割线来对比原图和增强图。
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 mb-2">拉普拉斯边缘</p>
                  <img
                    src={filteredImage}
                    className="w-full object-cover select-none rounded aspect-square"
                  />
                </div>
              </div>

              <div>
                <p className="text-gray-600 mt-6 mb-2">拉普拉斯核</p>
                <div className="grid grid-cols-4 gap-4">
                  {Object.keys(laplaceKernels).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveKernel(key);
                        applyLaplaceFilter(key);
                      }}
                      className={`group relative p-2 rounded transition text-sm font-mono ${
                        activeKernel === key
                          ? "bg-blue-100 text-blue-800 shadow-md scale-105"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <div className="flex flex-col justify-center">
                        {formatKernelMatrix(laplaceKernels[key]).map(
                          (row, rowIndex) => (
                            <div
                              key={rowIndex}
                              className="flex justify-between"
                            >
                              {row.split(" ").map((num, numIndex) => (
                                <div
                                  key={numIndex}
                                  className="w-6 h-6 flex items-center justify-center"
                                >
                                  {num}
                                </div>
                              ))}
                            </div>
                          )
                        )}
                      </div>
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

export default SharpeningFilter;
