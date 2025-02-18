import { EditableInput } from "@/components/custom/EditableInput";
import { SortableList } from "@/components/custom/SortableList";
import { TodoItem } from "@/components/custom/TodoItem";
import { Button } from "@/components/ui/button";
import { useTodos } from "@/hooks/useTodos.tsx";
import type { Todo } from "@/types/types";
import { useState } from "react";

export function InboxPage() {
  const {
    todos,
    isLoading,
    isError,
    toggleTodo,
    updateTodo,
    addTodo,
    deleteTodo,
    reorderTodo,
  } = useTodos();
  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);

  const handleStartEditing = (id: string) => {
    setEditingTodoId(id);
    setIsAddingTodo(false);
  };

  const handleCancelEditing = () => {
    setEditingTodoId(null);
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error...</div>;

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold pl-10">Inbox</h1>
          <Button
            onClick={() => {
              setIsAddingTodo(true);
              setEditingTodoId(null);
            }}
          >
            Add Todo
          </Button>
        </div>

        {isAddingTodo && (
          <EditableInput
            initialValue=""
            initialDescription=""
            onSave={(title, description) => {
              const newTodo: Omit<Todo, "id" | "position"> = {
                title,
                description,
                completed: false,
              };
              addTodo(newTodo);
              setIsAddingTodo(false);
            }}
            onCancel={() => setIsAddingTodo(false)}
            isOpen={true}
          />
        )}

        <SortableList
          items={todos}
          onChange={reorderTodo}
          renderItem={(todo: Todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              isEditing={editingTodoId === todo.id}
              onDelete={deleteTodo}
              onToggle={toggleTodo}
              onUpdate={updateTodo}
              onStartEditing={handleStartEditing}
              onCancelEditing={handleCancelEditing}
            />
          )}
        />
      </div>
    </div>
  );
}
