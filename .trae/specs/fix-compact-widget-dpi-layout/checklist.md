# Checklist

- [x] 精简模式 `setSize` 使用 `LogicalSize`，不再有 PhysicalSize 窗口尺寸调用残留在切换逻辑中
- [x] 全功能展开尺寸按显示器逻辑尺寸（物理 ÷ scaleFactor）钳制，并用 `LogicalSize` 设置
- [x] 窗口位置持久化/恢复仍为物理单位（onMoved ↔ PhysicalPosition），未被误改
- [x] 学习内容抽屉有最大高度（max-h）且内容超高时内部滚动（overflow-y-auto）
- [x] 抽屉遮罩点击、关闭按钮、Esc 收起行为不受影响
- [x] `npm run build:deploy` 通过，无 TypeScript 类型错误
- [x] 代码走查：`LogicalSize`/`PhysicalSize`/`PhysicalPosition`/`LogicalPosition` 使用与注释一致，无单位混用残留