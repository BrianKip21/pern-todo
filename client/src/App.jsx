
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ListTodo, LoaderCircle } from "lucide-react";

import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
} from "./api/todoService.js";

import TodoForm from "./components/TodoForm.jsx";
import TodoList from "./components/TodoList.jsx";

function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadTodos = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getTodos();

      setTodos(response.data);
    } catch (error) {
      console.error("Failed to load todos:", error);

      setError(
        error.response?.data?.message ??
          "Unable to load tasks. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleAddTodo = async (todoData) => {
    const userId = Number(import.meta.env.VITE_TODO_USER_ID);

    if (!Number.isSafeInteger(userId) || userId < 1) {
      setError("Please configure a valid development user ID.");
      return false;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await createTodo({
        ...todoData,
        user_id: userId,
      });

      await loadTodos();
      return true;
    } catch (error) {
      console.error("Failed to create todo:", error);

      setError(
        error.response?.data?.message ?? "Unable to create the task."
      );

      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTodo = async (todo) => {
    const previousTodos = todos;
    const nextCompleted = !todo.completed;

    // Update the UI immediately for a responsive experience.
    setTodos((currentTodos) =>
      currentTodos.map((item) =>
        item.id === todo.id
          ? { ...item, completed: nextCompleted }
          : item
      )
    );

    setError("");

    try {
      await updateTodo(todo.id, {
        completed: nextCompleted,
      });
    } catch (error) {
      console.error("Failed to update todo:", error);

      setTodos(previousTodos);
      setError(
        error.response?.data?.message ?? "Unable to update the task."
      );
    }
  };

  const handleDeleteTodo = async (id) => {
    const previousTodos = todos;

    setTodos((currentTodos) =>
      currentTodos.filter((todo) => todo.id !== id)
    );

    setError("");

    try {
      await deleteTodo(id);
    } catch (error) {
      console.error("Failed to delete todo:", error);

      setTodos(previousTodos);
      setError(
        error.response?.data?.message ?? "Unable to delete the task."
      );
    }
  };

  const completedCount = todos.filter((todo) => todo.completed).length;
  const activeCount = todos.length - completedCount;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <CheckCircle2 size={25} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              TaskFlow
            </h1>
            <p className="text-sm text-slate-500">
              Make today productive.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="mb-8">
          <p className="text-sm font-medium text-indigo-600">
            YOUR WORKSPACE
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Plan your day.
          </h2>

          <p className="mt-2 max-w-xl text-slate-500">
            Keep track of your priorities and make progress one task at a time.
          </p>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total tasks"
            value={todos.length}
            icon={<ListTodo size={20} />}
          />

          <StatCard
            label="In progress"
            value={activeCount}
            icon={<LoaderCircle size={20} />}
          />

          <StatCard
            label="Completed"
            value={completedCount}
            icon={<CheckCircle2 size={20} />}
          />
        </section>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <TodoForm
            onAddTodo={handleAddTodo}
            isSubmitting={isSubmitting}
          />

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
              <LoaderCircle className="animate-spin" size={22} />
              <span>Loading your tasks...</span>
            </div>
          ) : (
            <TodoList
              todos={todos}
              filter={filter}
              onFilterChange={setFilter}
              onToggle={handleToggleTodo}
              onDelete={handleDeleteTodo}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        {icon}
      </div>

      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default App;
