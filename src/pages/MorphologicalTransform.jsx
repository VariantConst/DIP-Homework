import React, { useState, useEffect } from "react";
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
  const [activeTransformation, setActiveTransformation] = useState("erosion");

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

  const applyMorphologicalTransformation = (type) => {
    const isBasic = type === "erosion" || type === "dilation";
    const element =
      structuringElements[
        isBasic ? type : type === "opening" ? "erosion" : "dilation"
      ];

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = selectedImage;
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
    };
  };

  const openModal = (image) => {
    setSelectedImage(image);
    setIsOpen(true);

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

      const element = structuringElements["erosion"];
      const resultData = morphologicalTransform(
        data,
        img.width,
        img.height,
        element,
        "erosion"
      );

      const transformedImageData = new ImageData(
        new Uint8ClampedArray(resultData),
        img.width,
        img.height
      );
      ctx.putImageData(transformedImageData, 0, 0);
      setTransformedImage(canvas.toDataURL());
    };
  };

  const closeModal = () => {
    setIsOpen(false);
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
      </div>

      {isOpen && (
        <Dialog
          open={isOpen}
          onClose={closeModal}
          className="fixed inset-0 bg-gray-100 bg-opacity-90 backdrop-blur-sm flex items-center justify-center p-4 text-xl"
        >
          <Dialog.Panel className="bg-white p-6 lg:p-10 rounded-2xl shadow-2xl max-w-6xl mx-auto w-full space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <p className="text-gray-500 mb-3">原图</p>
                <img
                  src={selectedImage}
                  className="w-full object-cover select-none rounded-lg shadow aspect-square"
                />
              </div>
              <div>
                <p className="text-gray-500 mb-3">变换图像</p>
                <img
                  src={transformedImage}
                  className="w-full object-cover select-none rounded-lg shadow aspect-square"
                />
              </div>
            </div>
            <div>
              <p className="text-gray-500 mb-3">操作</p>
              <div className="grid grid-cols-4 justify-center space-x-8">
                {[
                  { en: "erosion", cn: "腐蚀" },
                  { en: "dilation", cn: "膨胀" },
                  { en: "opening", cn: "开运算" },
                  { en: "closing", cn: "闭运算" },
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
          </Dialog.Panel>
        </Dialog>
      )}
    </div>
  );
}

export default MorphologicalTransformations;
