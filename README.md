本项目使用Javascript语言实现，通过React和Vite实现了用户交互界面，所有图像都在运行时进行处理，使得用户可以自由的切换，并探索不同的图像处理操作所带来的影响。

预先要求：

- yarn v1.22.21，可参考 [yarn的安装说明](https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable)。
  运行方式：

- 在命令行进入项目主目录，执行

  - yarn install

  - yarn dev

然后在浏览器打开`http://localhost:5173/`即可进入项目展示系统。

如果您不便于安装基于Web的环境，可以直接访问`dip.variantconst.com`，我已经将项目展示网页部署到该网站上。核心算法部分位于`src/pages/MorphologicalTransform.jsx`以及`src/pages/SharpeningFilter.jsx`，也可直接查看。
