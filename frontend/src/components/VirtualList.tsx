import { useMemo } from 'react';

interface VirtualListProps {
  items: string[];
  selectedItems: string[];
  onSelect: (item: string, checked: boolean) => void;
  onSelectAll?: () => void;
  onClearAll?: () => void;
  itemHeight?: number;
  maxHeight?: number;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  selectedCount?: number;
  totalCount?: number;
}

export default function VirtualList({
  items,
  selectedItems,
  onSelect,
  onSelectAll,
  onClearAll,
  itemHeight = 35,
  maxHeight = 300,
  showSearch = false,
  searchValue = '',
  onSearchChange,
  selectedCount = 0,
  totalCount = 0,
}: VirtualListProps) {
  if (items.length === 0) {
    return (
      <div className="virtual-list-empty">
        <span>No items found</span>
      </div>
    );
  }

  // For large lists, implement basic windowing with slicing
  const VISIBLE_ITEMS = 10;
  const visibleItems = useMemo(() => {
    return items.slice(0, Math.max(VISIBLE_ITEMS, Math.ceil(maxHeight / itemHeight) + 2));
  }, [items, maxHeight, itemHeight]);

  const hasMore = items.length > visibleItems.length;

  return (
    <div className="virtual-list-container">
      {showSearch && (
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="search-input"
        />
      )}

      <div className="list-controls">
        <button
          className="control-btn"
          onClick={onSelectAll}
          disabled={items.length === 0}
        >
          Select All
        </button>
        <button
          className="control-btn secondary"
          onClick={onClearAll}
          disabled={selectedItems.length === 0}
        >
          Clear
        </button>
      </div>

      <div
        className="virtual-list"
        style={{ maxHeight: `${maxHeight}px`, overflowY: 'auto' }}
      >
        {visibleItems.map((item) => {
          const isSelected = selectedItems.includes(item);
          return (
            <label
              key={item}
              className={`item-checkbox ${isSelected ? 'selected' : ''}`}
              style={{ height: `${itemHeight}px` }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onSelect(item, e.target.checked)}
              />
              <span>{item}</span>
            </label>
          );
        })}
        {hasMore && (
          <div
            style={{
              padding: '8px 10px',
              color: 'var(--text3)',
              fontSize: '11px',
              fontFamily: 'var(--mono)',
              textAlign: 'center',
            }}
          >
            +{items.length - visibleItems.length} more
          </div>
        )}
      </div>

      {totalCount > 0 && (
        <div className="selection-info">
          {selectedCount} of {totalCount} selected
        </div>
      )}
    </div>
  );
}
