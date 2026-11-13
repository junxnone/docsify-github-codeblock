# docsify-github-codeblock demo

每个 GitHub permalink 后面都有一个 `▸ 代码` 按钮，点击展开代码，再点收起。

## 行内链接

OpenCV 里自适应阈值的实现见 [thresh.cpp](https://github.com/opencv/opencv/blob/157b0e7760117a60de457a4ae874b0709edc4e53/modules/imgproc/src/thresh.cpp#L1695-L1697)，后面还有文字。

## 列表、表格、引用

- Python：[prompt_ensemble.py](https://github.com/zqhang/AnomalyCLIP/blob/e0741d81c3dd4bec4c3fdf124b4091cda021e087/prompt_ensemble.py#L57-L79)
- CMake 单行：[CMakeLists.txt](https://github.com/google/googletest/blob/5fce13091d223069436ad7a5aad53f026b0f2041/googletest/CMakeLists.txt#L66)
- 带列号的范围：[thresh.cpp](https://github.com/opencv/opencv/blob/157b0e7760117a60de457a4ae874b0709edc4e53/modules/imgproc/src/thresh.cpp#L1698C51-L1705)

> 引用里：[amp_examples.rst](https://github.com/pytorch/pytorch/blob/d927aee312fa95b7803cb976fee9525923ca9ad6/docs/source/notes/amp_examples.rst)

| 说明 | 链接 |
| --- | --- |
| 表格单元格 | [internal_utils.cmake](https://github.com/google/googletest/blob/e9fb5c7bacc4a25b030569c92ff9f6925288f1c3/googletest/cmake/internal_utils.cmake#L38) |

## 不会加按钮的链接

- 分支链接（行号会漂移）：[thresh.cpp](https://github.com/opencv/opencv/blob/master/modules/imgproc/src/thresh.cpp#L10)
- 不适合展示的文件：[notebook](https://github.com/openvinotoolkit/openvino_notebooks/blob/173645d14740b0ceba9d9785552823bf8330ce67/notebooks/301-tensorflow-training-openvino/301-tensorflow-training-openvino-pot.ipynb)
- 标题里的链接：见下

## 标题里的 [permalink](https://github.com/opencv/opencv/blob/157b0e7760117a60de457a4ae874b0709edc4e53/modules/imgproc/src/thresh.cpp#L1695-L1697)

## 加载失败

文件不存在时展开会显示错误信息和原链接：[missing](https://github.com/opencv/opencv/blob/157b0e7760117a60de457a4ae874b0709edc4e53/no/such/file.cpp#L1-L3)

行号超出文件范围时会提示文件总行数：[CMakeLists.txt L9000](https://github.com/google/googletest/blob/5fce13091d223069436ad7a5aad53f026b0f2041/googletest/CMakeLists.txt#L9000-L9010)

## 其他语言

- TypeScript：[docsify globals.ts](https://github.com/docsifyjs/docsify/blob/9ad3c422153f16455d5eaae2b1a8cdf9959a9a5b/src/core/globals.ts)
- Go：[hello.go](https://github.com/golang/example/blob/7f05d217867b2af52b0a28c6d1c91df97e1b5b39/hello/hello.go#L15-L40)
