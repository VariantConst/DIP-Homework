import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-10">
        数字图像处理课程作业展示
      </h1>
      <h3 className="text-xl font-bold text-gray-800 mb-10">
        夏一飞&nbsp;&nbsp;&nbsp;&nbsp;2024.05
      </h3>
      <div className="w-full max-w-2xl">
        <Link
          to="/sharpening"
          className="block p-6 mb-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 ease-in-out"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            锐化滤波器作业
          </h2>
          <p className="text-gray-700">
            参考 “空间域图像增强”课的内容, 用拉普拉斯变换对图像进行增强。
          </p>
        </Link>
        <Link
          to="/morphological"
          className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 ease-in-out"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            形态学变换作业
          </h2>
          <p className="text-gray-700">
            参考 “形态学图像处理”,
            对输入图像进行开、闭、腐蚀、膨胀这四种形态学变换,
            并显示每种变换后的结果图像。
          </p>
        </Link>
      </div>
    </div>
  );
}

export default Home;
