#!/bin/bash

# 修复 macOS 图标显示过大的问题
# 通过添加 15% 的内边距来符合 macOS 图标规范

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📱 开始修复 macOS 图标..."

# 创建临时目录
TEMP_DIR="$(mktemp -d)"
ICONSET_DIR="$TEMP_DIR/icon.iconset"
mkdir -p "$ICONSET_DIR"
mkdir -p build

# 原始图标路径
ORIGINAL_ICON="resources/icon.png"

# 创建带边距的图标（缩小到 85%，周围留出 15% 的边距）
echo "1️⃣ 添加 15% 内边距..."
TEMP_ICON="$TEMP_DIR/icon_with_padding.png"

# 使用 Python 创建带边距的图标
python3 - "$ORIGINAL_ICON" "$TEMP_ICON" <<'PYTHON_SCRIPT'
import sys
from PIL import Image

# 读取原始图标
img = Image.open(sys.argv[1])

# 创建一个新的透明背景图像
new_size = img.size[0]
scale_factor = 0.85  # 缩小到 85%
inner_size = int(new_size * scale_factor)

# 调整原始图像大小
img_resized = img.resize((inner_size, inner_size), Image.Resampling.LANCZOS)

# 创建新的透明背景
new_img = Image.new('RGBA', (new_size, new_size), (0, 0, 0, 0))

# 计算居中位置
offset = (new_size - inner_size) // 2

# 将缩小后的图标粘贴到中心
new_img.paste(img_resized, (offset, offset), img_resized if img_resized.mode == 'RGBA' else None)

# 保存
new_img.save(sys.argv[2])
print(f"✓ 已创建带边距的图标: {sys.argv[2]}")
PYTHON_SCRIPT

# 生成各种尺寸的图标
echo "2️⃣ 生成多种尺寸的图标..."
sips -z 16 16     "$TEMP_ICON" --out "$ICONSET_DIR/icon_16x16.png" > /dev/null
sips -z 32 32     "$TEMP_ICON" --out "$ICONSET_DIR/icon_16x16@2x.png" > /dev/null
sips -z 32 32     "$TEMP_ICON" --out "$ICONSET_DIR/icon_32x32.png" > /dev/null
sips -z 64 64     "$TEMP_ICON" --out "$ICONSET_DIR/icon_32x32@2x.png" > /dev/null
sips -z 128 128   "$TEMP_ICON" --out "$ICONSET_DIR/icon_128x128.png" > /dev/null
sips -z 256 256   "$TEMP_ICON" --out "$ICONSET_DIR/icon_128x128@2x.png" > /dev/null
sips -z 256 256   "$TEMP_ICON" --out "$ICONSET_DIR/icon_256x256.png" > /dev/null
sips -z 512 512   "$TEMP_ICON" --out "$ICONSET_DIR/icon_256x256@2x.png" > /dev/null
sips -z 512 512   "$TEMP_ICON" --out "$ICONSET_DIR/icon_512x512.png" > /dev/null
sips -z 1024 1024 "$TEMP_ICON" --out "$ICONSET_DIR/icon_512x512@2x.png" > /dev/null

# 生成 .icns 文件
echo "3️⃣ 生成 .icns 文件..."
iconutil -c icns "$ICONSET_DIR" -o build/icon.icns

# 也更新 resources 中的图标（可选）
echo "4️⃣ 更新原始图标文件..."
cp "$TEMP_ICON" resources/icon.png

# 清理临时文件
rm -rf "$TEMP_DIR"

echo ""
echo "✅ 图标修复完成！"
echo ""
echo "已生成文件："
echo "  - build/icon.icns (macOS 图标文件)"
echo "  - resources/icon.png (更新后的 PNG 图标，带 15% 边距)"
echo ""
echo "请运行以下命令重新构建应用："
echo "  npm run build:mac"
