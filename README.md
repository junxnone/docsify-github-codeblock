# docsify-github-codeblock

一个 [docsify](https://docsify.js.org/) 插件：页面里出现的每个 **GitHub permalink**，后面自动加一个 `▸ 代码` 按钮。点击按钮，从 GitHub 取回对应的代码，显示在链接下方（带语法高亮和复制按钮）；再点 `▾ 收起` 折叠。默认折叠，点击时才请求。

文章里**不需要任何特殊写法**，照常写链接就行：

```markdown
[ADAPTIVE_THRESH_MEAN_C Impl](https://github.com/opencv/opencv/blob/157b0e7760117a60de457a4ae874b0709edc4e53/modules/imgproc/src/thresh.cpp#L1695-L1697)
```

## 特性

- 零配置，一个 JS 文件，样式自带（自动注入，不需要另外引入 CSS）
- 支持行范围：`#L10`、`#L10-L20`、`#L10C5-L20C3`（列号忽略）；不带行号显示整个文件
- 默认折叠、懒加载：点击按钮才请求；同一个文件只请求一次
- 复用 docsify 内置的 Prism 做高亮；页面里没有对应语言组件时，自动按需从 CDN 加载（可关闭）
- 加载失败（404、网络不通）时在代码块位置显示错误和原链接，不影响页面其他内容；收起后再展开会重新请求
- 行号超出文件范围时给出提示（并显示文件总行数），不会显示空白块
- 标题、代码块里的链接，以及分支链接、图片/压缩包/`.ipynb` 等不适合展示的文件不加按钮

## 安装

在 `docsify` 之后引入脚本即可：

```html
<script>
  window.$docsify = {
    // 可选配置，见下文
  };
</script>
<script src="//cdn.jsdelivr.net/npm/docsify@4"></script>
<script src="path/to/docsify-github-codeblock.js"></script>
```

仓库发布到 GitHub 后也可以通过 jsDelivr 引用，例如：
`https://cdn.jsdelivr.net/gh/junxnone/docsify-github-codeblock@v0.1.0/src/docsify-github-codeblock.js`（建议固定到版本标签；用 `@main` 会跟随最新提交，但 jsDelivr 对分支有缓存）。

## 识别规则

链接要满足：`https://github.com/<owner>/<repo>/blob/<40 位 commit SHA>/<路径>`。

| 链接 | 是否加按钮 | 说明 |
| --- | --- | --- |
| `.../blob/<SHA>/a.py` | ✅ | 显示整个文件 |
| `.../blob/<SHA>/a.py#L10` | ✅ | 显示第 10 行 |
| `.../blob/<SHA>/a.py#L10-L20` | ✅ | 显示第 10 到 20 行 |
| `.../blob/<SHA>/a.py#L10C5-L20C3` | ✅ | 带列号，列号忽略，按行取 |
| `.../blob/<SHA>/README.md#some-section` | ✅ | 不是 `#L` 形式，显示整个文件 |
| `.../blob/main/a.py#L10` | ❌ | 分支链接，内容会变、行号会漂移 |
| 图片、压缩包、模型文件、`.ipynb` | ❌ | 不适合当文本展示（见 `skipExt`） |
| 标题（`#`~`######`）里的链接 | ❌ | 否则按钮会出现在 docsify 的侧边栏/TOC 里 |
| 代码块、行内代码里的文字 | ❌ | 本来就不是链接 |

提示：在 GitHub 打开文件，按键盘 `y` 即可把地址栏换成带 commit SHA 的 permalink；点行号（按住 Shift 点另一行可选范围）会自动带上 `#L10-L20`。

## 配置

全部可选，写在 `window.$docsify.githubCodeblock` 里：

```js
window.$docsify = {
  githubCodeblock: {
    labelCollapsed: '▸ code',
    labelExpanded: '▾ hide',
    maxHeight: 360
  }
};
```

| 选项 | 默认值 | 说明 |
| --- | --- | --- |
| `labelCollapsed` | `'▸ 代码'` | 折叠时的按钮文字 |
| `labelExpanded` | `'▾ 收起'` | 展开时的按钮文字 |
| `titleCollapsed` / `titleExpanded` | `'展开代码'` / `'收起代码'` | 按钮的悬停提示 |
| `copyText` / `copiedText` / `copyFailedText` | `'复制'` / `'已复制'` / `'复制失败'` | 复制按钮的文字 |
| `errorText` | `'无法加载代码'` | 加载失败的提示前缀 |
| `retryText` | `'收起后再展开即可重试'` | 加载失败时附带的重试提示 |
| `rangeErrorText` | `'行范围超出文件'` | 行号超出文件时的提示前缀 |
| `maxHeight` | `480` | 代码块最大高度（px），超出后块内滚动；`0` 表示不限制 |
| `rawBase` | `'https://raw.githubusercontent.com'` | 取文件用的地址，可换成镜像或自己的代理 |
| `prismCdn` | `'https://cdn.jsdelivr.net/npm/prismjs@1/components/'` | 页面缺少某语言的 Prism 组件时，从这里按需加载；设为 `''` 则不加载（该语言显示为纯文本） |
| `languages` | `{}` | 扩展名到 Prism 语言的补充或覆盖，如 `{ 'proto': 'protobuf' }` |
| `skipExt` | 见源码 | 不加按钮的文件，按路径匹配：正则，或字符串（按不区分大小写的正则处理）；格式不对时退回默认值 |

## 语法高亮

- 内置的扩展名映射：`py`、`c/h`、`cpp/cc/hpp/cu`、`sh/bash`、`js/ts`、`json`、`yaml/yml`、`cmake`（含 `CMakeLists.txt`）、`md`、`html/xml`、`css`、`java`、`go`、`rs`（rust），`ts` 用 typescript；其他类型显示为纯文本。
- docsify 自带的 Prism 只包含 markup、css、clike、javascript。其他语言（如 python、cpp、bash）默认由插件在第一次用到时从 `prismCdn` 加载，也可以自己在页面里提前引入对应的 `prism-*.min.js`。

## 限制

- 只支持**公开仓库**的文件（请求不带登录信息，私有仓库会返回 404）。
- 只认带 commit SHA 的永久链接，分支链接不处理。
- 点击时才请求，第一次展开会有一次网络等待。
- 代码通过 `fetch` 请求，目标地址需要允许跨域（`raw.githubusercontent.com` 允许）。
- 复制按钮在 HTTPS 页面用 Clipboard API；在 `http://` 或本地文件页面退回到 `document.execCommand('copy')`。

## 演示和开发

`demo/` 目录里有一个最小的 docsify 站点，覆盖行内链接、列表、表格、引用、整文件、不存在的文件，以及不会加按钮的几类链接。用任意静态服务器在项目根目录启动后打开 `demo/` 即可，例如：

```bash
npx serve .      # 然后访问 http://localhost:3000/demo/
```

没有构建步骤：`src/docsify-github-codeblock.js` 就是发布的文件。

## License

MIT
