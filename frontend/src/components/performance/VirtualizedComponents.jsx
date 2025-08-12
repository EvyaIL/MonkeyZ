import React, { memo, useMemo } from 'react';
import { FixedSizeList as List, VariableSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

// Memoized row component for better performance
const ProductRow = memo(({ index, style, data }) => {
  const { products, onProductClick, isLoading } = data;
  const product = products[index];

  if (!product) {
    return (
      <div style={style} className="flex items-center justify-center p-4">
        <div className="animate-pulse bg-gray-200 h-20 w-full rounded"></div>
      </div>
    );
  }

  return (
    <div style={style} className="p-2">
      <div 
        className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onProductClick?.(product)}
      >
        <div className="flex items-center space-x-4">
          <img
            src={product.imageUrl || product.image || '/placeholder.png'}
            alt={product.name}
            className="w-16 h-16 object-cover rounded"
            loading="lazy"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {typeof product.name === 'object' ? 
                product.name.en || Object.values(product.name)[0] : 
                product.name}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {typeof product.description === 'object' ? 
                product.description.en || Object.values(product.description)[0] : 
                product.description}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-lg font-bold text-gray-900">
                ₪{product.price}
              </span>
              <span className="text-xs text-gray-500">
                Stock: {product.available_keys || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ProductRow.displayName = 'ProductRow';

// Fixed height virtualized list for consistent row sizes
export const VirtualizedProductList = memo(({ 
  products = [], 
  height = 400,
  itemHeight = 120,
  onProductClick,
  isLoading = false,
  hasMore = false,
  loadMore,
  threshold = 15
}) => {
  const itemData = useMemo(() => ({
    products,
    onProductClick,
    isLoading
  }), [products, onProductClick, isLoading]);

  const itemCount = hasMore ? products.length + 1 : products.length;

  const isItemLoaded = (index) => !!products[index];

  if (hasMore && loadMore) {
    return (
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMore}
        threshold={threshold}
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={ref}
            height={height}
            itemCount={itemCount}
            itemSize={itemHeight}
            itemData={itemData}
            onItemsRendered={onItemsRendered}
            overscanCount={5}
            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
          >
            {ProductRow}
          </List>
        )}
      </InfiniteLoader>
    );
  }

  return (
    <List
      height={height}
      itemCount={products.length}
      itemSize={itemHeight}
      itemData={itemData}
      overscanCount={5}
      className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
    >
      {ProductRow}
    </List>
  );
});

VirtualizedProductList.displayName = 'VirtualizedProductList';

// Table virtualization for admin interfaces
export const VirtualizedTable = memo(({ 
  data = [], 
  columns = [],
  height = 400,
  rowHeight = 60,
  headerHeight = 40,
  onRowClick
}) => {
  const TableHeader = memo(() => (
    <div 
      className="flex bg-gray-50 border-b font-medium text-gray-700"
      style={{ height: headerHeight }}
    >
      {columns.map((column, index) => (
        <div
          key={column.key || index}
          className="flex items-center px-4 border-r"
          style={{ width: column.width || 'auto', flex: column.flex || 1 }}
        >
          {column.title}
        </div>
      ))}
    </div>
  ));

  const TableRow = memo(({ index, style }) => {
    const row = data[index];
    
    return (
      <div 
        style={style}
        className="flex border-b hover:bg-gray-50 cursor-pointer"
        onClick={() => onRowClick?.(row, index)}
      >
        {columns.map((column, colIndex) => (
          <div
            key={column.key || colIndex}
            className="flex items-center px-4 border-r text-sm"
            style={{ width: column.width || 'auto', flex: column.flex || 1 }}
          >
            {column.render ? column.render(row[column.key], row, index) : row[column.key]}
          </div>
        ))}
      </div>
    );
  });

  TableRow.displayName = 'VirtualizedTableRow';

  return (
    <div className="border rounded-lg overflow-hidden">
      <TableHeader />
      <List
        height={height - headerHeight}
        itemCount={data.length}
        itemSize={rowHeight}
        overscanCount={5}
      >
        {TableRow}
      </List>
    </div>
  );
});

VirtualizedTable.displayName = 'VirtualizedTable';

export default VirtualizedProductList;
