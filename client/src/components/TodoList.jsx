
import { CheckCircle2, ListTodo } from "lucide-react";
import TodoItem from "./TodoItem.jsx";

function TodoList({
  todos,
  filter,
  onFilterChange,
  onToggle,
  onDelete,
}) {
  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;

    return true;
  });

  const filters = [
    { value: "all", label: "All tasks" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Your tasks
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredTodos.length}{" "}
            {filteredTodos.length === 1 ? "task" : "tasks"}
          </p>
        </div>

        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onFilterChange(item.value)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition sm:text-sm ${
                filter === item.value
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {filteredTodos.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center">
          {filter === "completed" ? (
            <CheckCircle2 className="mb-3 text-emerald-500" size={36} />
          ) : (
            <ListTodo className="mb-3 text-slate-400" size={36} />
          )}

          <h3 className="font-medium text-slate-900">
            {filter === "completed"
              ? "No completed tasks yet"
              : filter === "active"
                ? "You're all caught up!"
                : "No tasks yet"}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {filter === "all"
              ? "Add your first task to get started."
              : "Try another filter or add a new task."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default TodoList;
