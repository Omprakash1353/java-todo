import { EditableInput } from "@/components/custom/EditableInput";
import { Hint } from "@/components/custom/Hint";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type Todo } from "@/types/types";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckCircle, Circle, GripVertical, Pen, Trash } from "lucide-react";

interface TodoItemProps {
  todo: Todo;
  isEditing: boolean;
  onToggle: (todo: Todo) => void;
  onUpdate: (todo: Todo) => void;
  onDelete: (id: string) => void;
  onStartEditing: (id: string) => void;
  onCancelEditing: () => void;
}

export function TodoItem({
  todo,
  isEditing,
  onToggle,
  onUpdate,
  onDelete,
  onStartEditing,
  onCancelEditing,
}: TodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: todo.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
  };

  if (isEditing) {
    return (
      <div ref={setNodeRef} style={style}>
        <EditableInput
          initialValue={todo.title}
          initialDescription={todo.description || ""}
          isOpen={true}
          onSave={(title, description) => {
            onUpdate({ ...todo, title, description });
            onCancelEditing();
          }}
          onCancel={onCancelEditing}
        />
      </div>
    );
  }

  const handleDelete = () => {
    onDelete(todo.id);
  };

  const handleToggle = () => {
    onToggle({ ...todo, completed: !todo.completed });
  };

  return (
    <li ref={setNodeRef} style={style} className="list-none">
      <div className="bg-background rounded-lg shadow-sm">
        <div
          className={cn(
            "group flex w-full items-start gap-3 py-4 px-4 bg-card transition-colors min-h-[92px]",
            todo.completed && "opacity-60",
            isDragging && "shadow-lg bg-background"
          )}
        >
          <div
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggle}
              className="flex h-5 w-5 items-center justify-center rounded-full border"
            >
              {todo.completed ? (
                <CheckCircle className={cn("h-4 w-4")} />
              ) : (
                <Circle className={cn("h-4 w-4")} />
              )}
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <span
              className={cn(
                "text-sm font-medium",
                todo.completed && "line-through"
              )}
            >
              {todo.title}
            </span>
            {todo.description && (
              <span className="text-xs text-muted-foreground">
                {todo.description}
              </span>
            )}
          </div>

          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Hint label="Edit">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-accent rounded-full"
                onClick={() => onStartEditing(todo.id)}
              >
                <Pen className="h-4 w-4" />
              </Button>
            </Hint>
            <Hint label="Delete">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-accent rounded-full"
                onClick={handleDelete}
              >
                <Trash className="h-4 w-4 text-red-600" />
              </Button>
            </Hint>
          </div>
        </div>
      </div>
    </li>
  );
}
