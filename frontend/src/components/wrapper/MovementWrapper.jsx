import React, { useState, useRef, useMemo } from "react";

const MovementWrapper = ({ children, item,setItem, boundaries }) => {
  const [dragging, setDragging] = useState(false);
  const [initialMousePosition, setInitialMousePosition] = useState({ x: 0, y: 0 });

  const minX = boundaries?.xMin ?? 0;
  const maxX = boundaries?.xMax ?? window.innerWidth;
  const minY = boundaries?.yMin ?? 0;
  const maxY = boundaries?.yMax ?? window.innerHeight;

  const handleDragStart = (e) => {
    e.stopPropagation();
    setDragging(true);
    setInitialMousePosition({ x: e.clientX, y: e.clientY });
  };

  const handleDrag = (e) => {
    if (!dragging) return;
    e.preventDefault();
    e.stopPropagation();

    const { clientX, clientY } = e;
    const deltaX = clientX - initialMousePosition.x ;
    const deltaY = clientY - initialMousePosition.y;

    let newX = item.x + deltaX;
    let newY = item.y + deltaY;

    // Apply bounds
    newX = Math.max(minX, Math.min(newX, maxX));
    newY = Math.max(minY, Math.min(newY, maxY));

    item.x = newX;
    item.y = newY;
    setItem(item)

    setInitialMousePosition({ x: clientX, y: clientY });
  };

  const handleDragEnd = (e) => {
    if (!dragging) return;
    e.stopPropagation();
    setDragging(false);
  };

  // Memoized style computation
  const style = useMemo(
    () => ({
      position: "absolute",
      left: item.x,
      top: item.y,
      transformOrigin: "0 0",
      opacity: dragging ? 0.5 : 1,
      zIndex: dragging ? 10 : 5,
      cursor: dragging ? "grabbing" : "grab",
    }),
    [item.x, item.y,  dragging]
  );

  return (
    <div
      onMouseDown={handleDragStart}
      onMouseUp={handleDragEnd}
      onMouseMove={handleDrag}
      onMouseLeave={handleDragEnd}
      style={style}
    >
      {children}
    </div>
  );
};

const DraggableItem = React.memo(MovementWrapper);
export default DraggableItem;