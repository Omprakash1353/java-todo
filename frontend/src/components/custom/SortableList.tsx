// SortableList.tsx
import type { UniqueIdentifier } from "@dnd-kit/core";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import type { ReactNode } from "react";
import React, { useEffect, useMemo, useState } from "react";

import { Todo } from "@/types/types";
import { SortableOverlay } from "./SortableOverlay";

export interface DraggableItem {
  id: UniqueIdentifier;
}

interface Props {
  items: Todo[];
  onChange: (updatedTodo: Todo) => void;
  renderItem: (item: Todo) => ReactNode;
}

export function SortableList({
  items: initialItems,
  onChange,
  renderItem,
}: Props) {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId),
    [activeId, items]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const activeIndex = items.findIndex((item) => item.id === active.id);
    const overIndex = items.findIndex((item) => item.id === over.id);

    if (activeIndex !== -1 && overIndex !== -1) {
      const newIndex = overIndex;
      const reorderedItems = arrayMove(items, activeIndex, newIndex);
      setItems(reorderedItems);

      const todo = reorderedItems.find((item) => item.id === active.id) as Todo;
      if (todo) {
        const newPosition = newIndex;
        const updatedTodo = { ...todo, position: newPosition };
        onChange(updatedTodo);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={items.map((item) => item.id)}>
        <ul className="flex flex-col gap-2" role="application">
          {items.map((item) => (
            <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
          ))}
        </ul>
      </SortableContext>
      <SortableOverlay>
        {activeItem ? renderItem(activeItem) : null}
      </SortableOverlay>
    </DndContext>
  );
}
