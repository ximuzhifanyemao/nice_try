# Checklist

- [x] `applyMode(true)` 用 `currentMonitor().position + size` 计算显示器中心并显式 `setPosition(PhysicalPosition)`，窗口完整居中不伸出桌面
- [x] 钳制尺寸（窄屏/小工作区）下展开同样居中；取显示器失败时回退 `center()`/默认 1600×1000
- [x] 精简模式分支、`sanitizePosition`、`switchingRef`、`PhysicalPosition` 恢复逻辑未被改动
- [x] `HomeLayoutContext` 扩展 `wide`，默认值与旧消费方（Home.tsx）兼容
- [x] 指定 13 个页面根容器按 `wide` 放宽到 `max-w-[1280px]`，无遗漏
- [x] 网页/移动端（wide=false）页面宽度与现状一致，无回归
- [x] `npm run build:deploy` 通过，无 TypeScript 类型错误
- [x] 代码走查：居中公式物理单位一致；各页面条件类正确