const PAGE_ANIMATIONS = {
  none: { name: "无动画", description: "无过渡效果" },
  fade: { name: "淡入淡出", description: "页面渐变过渡" },
  slide: { name: "滑动", description: "页面滑动切换" },
  scale: { name: "缩放", description: "页面缩放过渡" }
};
const PRESET_THEMES = {
  light: {
    id: "light",
    name: "浅色",
    background: "#ffffff",
    color: "#000000",
    linkColor: "#0000ff"
  },
  dark: {
    id: "dark",
    name: "深色",
    background: "#1a1a1a",
    color: "#e0e0e0",
    linkColor: "#64b5f6"
  },
  sepia: {
    id: "sepia",
    name: "护眼",
    background: "#f4ecd8",
    color: "#5c4b37",
    linkColor: "#8b4513"
  }
};
export {
  PRESET_THEMES as P,
  PAGE_ANIMATIONS as a
};
