/**
 * 标签芯片组件
 * 用于显示标签列表
 */
import type { Tag } from '@shared/types';
import { X } from '../../utils/icons';

interface TagChipsProps {
  tags: Tag[];
  onRemove?: (tagId: string) => void;
  editable?: boolean;
}

export function TagChips({ tags, onRemove, editable = false }: TagChipsProps) {
  if (tags.length === 0) {
    return (
      <span className="text-sm text-gray-400 dark:text-gray-500">暂无标签</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium"
          style={{
            backgroundColor: tag.color + '20',
            color: tag.color,
          }}
        >
          {tag.name}
          {editable && onRemove && (
            <button
              onClick={() => onRemove(tag.id)}
              className="ml-1 rounded-full p-0.5 hover:bg-black/10 transition-colors"
              title="移除标签"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}

export default TagChips;
