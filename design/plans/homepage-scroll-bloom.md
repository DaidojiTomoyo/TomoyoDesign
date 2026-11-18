# 首页 Scroll Bloom：历史索引

本文件保留已被替换的方案与审查出处。当前实现、最新用户反馈和验收统一见 [homepage-sakura-background.md](homepage-sakura-background.md)。历史 `ship` 只对应当时的范围，不代表用户后续反馈已经解决。

## 方案演进

- **独立蓝银雕塑：** 用户明确纠正为贯穿整个首页的樱花动画。历史证据：`.impeccable/review/scroll-bloom-2026-11-17/`。
- **右侧三花枝：** 固定场景从右下向上生长，正文为花枝让出空间。该版重建过花瓣、花苞和材质，检查及 10 项测试通过，完整审查结果见 `.impeccable/review/sakura-global-2026-11-17/finish-review-rebuild.md`，运行边界见同目录 `verification.md`。用户随后拒绝右侧构图及压缩正文，要求左上向下、绑定页面并恢复居中布局。
- **首版页面背景：** 12 簇、36 花位，采用页面坐标和整簇避让。`.impeccable/review/sakura-background-2026-11-17/finish-verdict-2.md` 将自然枝形、文字整合与完整花簇两项修正判为 `resolved`，结论为仅覆盖这两项的 `ship`。用户随后指出枝条仍生硬、花簇稀疏，要求进一步丰富；这一结果不批准当前自然分枝细化。
- **当前自然分枝细化：** 用户原话、实现与新证据集中在 `.impeccable/review/sakura-natural-2026-11-17/`。其中 `finish-verdict-1.md` 将自然下部分枝、实现事实与验收历史记录两项修正判为 `resolved`，给出仅覆盖这两项的 `ship`；当前计划记录最终实现及验证边界。

## 保留的约束与资源

四项组件演示、页面内容及顺序、原生可逆滚动、英语和桌面布局持续保留。最小文档宽度 1200px，不新增独立段落、额外滚动距离、花枝专用栏、手机布局或鼠标跟随镜头。装饰层不获取焦点或拦截点击，减少动效与渲染失败有静态回退。`DESIGN.md` 与共享 tokens 不随局部场景细化改变。

花瓣、叶片、树皮三张 AI 生成材质继续复用，来源及运行素材见 [design/README.md](../README.md)。旧 `sakura-branch-v2.png`（919 × 1359）已移出 `public/`，保存在 `.impeccable/review/sakura-background-2026-11-17/retired/`；更早的枝条和雕塑封面只保留于忽略的历史证据中。

实现入口仍为 `apps/web/components/effects/scroll-bloom.tsx`、`scroll-bloom.module.css`、`shaders/scroll-bloom.ts` 和 `shaders/scroll-bloom-geometry.ts`。入口复用不表示旧构图仍有效。旧版减少动效曾通过模拟媒体条件验证，后台停绘未以真实隐藏状态测量，历史 CPU 或绘制次数均不能当作 GPU 帧率。

## 技术依据

- [GSAP ScrollTrigger：滚动进度、scrub 与尺寸刷新](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [GSAP React：useGSAP 与作用域清理](https://gsap.com/resources/React/)
- [GSAP matchMedia：减少动态效果与条件清理](<https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/>)
