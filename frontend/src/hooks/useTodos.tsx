import { MUTATIONS, QUERIES } from "@/api/todosApi";

export function useTodos() {
  const { data: todos, isLoading, isError } = QUERIES.useFetchTodos();
  const { mutate: deleteTodo } = MUTATIONS.useDeleteTodo();
  const { mutate: toggleTodo } = MUTATIONS.useToggleTodo();
  const { mutate: addTodo } = MUTATIONS.useAddTodo();
  const { mutate: updateTodo } = MUTATIONS.useUpdateTodo();
  const { mutate: reorderTodo } = MUTATIONS.useReorderTodos();

  return {
    todos,
    isLoading,
    isError,
    toggleTodo,
    updateTodo,
    addTodo,
    deleteTodo,
    reorderTodo,
  };
}
