// api/todosApi.tsx
import { queryClient } from "@/context/query-provider";
import { Todo } from "@/types/types";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";

const API_URL = "http://localhost:8080/todos";

const CreateTodoSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  completed: z.boolean().default(false),
});

const UpdateTodoSchema = z.object({
  id: z.string(),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  completed: z.boolean(),
  position: z.number().optional(),
});

const ReorderTodoSchema = z.object({
  id: z.string(),
  position: z.number().int().nonnegative(),
});

type CreateTodoInput = z.infer<typeof CreateTodoSchema>;
type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;
type ReorderTodoInput = z.infer<typeof ReorderTodoSchema>;


const fetchTodos = async (): Promise<Todo[]> => {
  const response = await fetch(API_URL);
  const res = await response.json();
  if (!response.ok) throw new Error("Failed to fetch todos");
  console.log("fetchTodos - Fetched Data:", res.data);
  return res.data;
};

const deleteTodo = async (id: string) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete todo");
  const res = await response.json();
  return res.data;
};

const toggleTodo = async (todo: Todo) => {
  const response = await fetch(`${API_URL}/${todo.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(todo),
  });
  if (!response.ok) throw new Error("Failed to toggle todo");
  const res = await response.json();
  return res.data;
};

const addTodo = async (todo: CreateTodoInput) => {
  const validatedTodo = CreateTodoSchema.parse(todo);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validatedTodo),
  });
  if (!response.ok) throw new Error("Failed to add todo");
  const responseData = await response.json();
  return responseData.data;
};

const updateTodo = async (todo: UpdateTodoInput) => {
  const validatedTodo = UpdateTodoSchema.parse(todo);

  const response = await fetch(`${API_URL}/${validatedTodo.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validatedTodo),
  });
  if (!response.ok) throw new Error("Failed to update todo");
  return (await response.json()).data;
};

const reorderTodos = async (todo: ReorderTodoInput) => {
  const validatedTodo = ReorderTodoSchema.parse(todo);

  const response = await fetch(`${API_URL}/reorder/${validatedTodo.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validatedTodo),
  });
  if (!response.ok) throw new Error("Failed to reorder todos");
  const responseData = await response.json();
  return responseData.data;
};

const invalidateTodosCache = () => {
  queryClient.invalidateQueries({ queryKey: ["todos"] });
};

export const QUERIES = {
  useFetchTodos: () =>
    useSuspenseQuery({
      queryKey: ["todos"],
      queryFn: fetchTodos,
      staleTime: 3000,
    }),
};

export const MUTATIONS = {
  useDeleteTodo: () => useMutation({
    mutationFn: deleteTodo, onMutate: async (id) => {
      const todos = queryClient.getQueryData<Todo[]>(["todos"]) ?? [];
      const updatedTodos = todos.filter((t) => t.id !== id);
      queryClient.setQueryData<Todo[]>(["todos"], updatedTodos);
      return { previousTodos: todos };
    },
    onSettled: () => invalidateTodosCache,
  }),
  useToggleTodo: () => useMutation({
    mutationFn: toggleTodo,
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] })
      const todos = queryClient.getQueryData<Todo[]>(["todos"]) ?? [];
      const updatedTodos = todos.map((t) => (t.id === id ? { ...t, completed } : t));
      queryClient.setQueryData<Todo[]>(["todos"], updatedTodos);
      return { previousTodos: todos };
    },
    onSettled: () => invalidateTodosCache,
  }),
  useAddTodo: () => useMutation({
    mutationFn: addTodo,
    onMutate: async (todo) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] })
      const todos = queryClient.getQueryData<Todo[]>(["todos"]) ?? [];
      const updatedTodos = [...todos, { ...todo, id: Date.now().toString(), position: todos.length + 1 }];
      queryClient.setQueryData<Todo[]>(["todos"], updatedTodos);
      return { previousTodos: todos };
    },
    onSettled: () => invalidateTodosCache(),
  }),
  useUpdateTodo: () => useMutation({
    mutationFn: updateTodo, onMutate: async (todo) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] })
      const todos = queryClient.getQueryData<Todo[]>(["todos"]) ?? [];
      const updatedTodos = todos.map((t) => (t.id === todo.id ? { ...todo } : t));
      queryClient.setQueryData<Todo[]>(["todos"], updatedTodos as Todo[]);
      return { previousTodos: todos };
    },
    onSettled: () => invalidateTodosCache,
  }),
  useReorderTodos: () => useMutation({
    mutationFn: reorderTodos, onMutate: async ({ id, position }) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const todos = queryClient.getQueryData<Todo[]>(["todos"]) ?? [];
      const filteredTodos = todos.filter(todo => todo.id !== id);
      const updatedTodos = [
        ...filteredTodos.slice(0, position),
        todos.find(todo => todo.id === id)!,
        ...filteredTodos.slice(position),
      ];
      queryClient.setQueryData<Todo[]>(["todos"], updatedTodos);
      return { previousTodos: todos };
    },
    onSettled: () => invalidateTodosCache,
  }),
}