
import { Check, Clock3, Trash2 } from "lucide-react";

const priorityStyles = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-rose-100 text-rose-700",
};

function TodoItem({ todo, onToggle, onDelete }) {
  const completed = todo.completed;

  const formattedDate = todo.due_date
    ? new Date(`${String(todo.due_date).slice(0, 10)}T00:00:00`)
        .toLocaleDateString("en-KE", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
    : null;

  return (
    <article className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm">
      <button
        type="button"
        onClick={() => onToggle(todo)}
        aria-label={completed ? "Mark as incomplete" : "Mark as complete"}
        aria-pressed={Boolean(completed)}
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
          completed
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-slate-300 text-transparent hover:border-indigo-500"
        }`}
      >
        <Check size={15} strokeWidth={3} />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`break-words font-medium ${
              completed
                ? "text-slate-400 line-through"
                : "text-slate-900"
            }`}
          >
            {todo.title}
          </h3>

          <span
            className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${
              priorityStyles[todo.priority] ?? priorityStyles.medium
            }`}
          >
            {todo.priority}
          </span>
        </div>

        {todo.description && (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-500">
            {todo.description}
          </p>
        )}

        {formattedDate && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <Clock3 size={14} />
            Due {formattedDate}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete ${todo.title}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center self-start rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
      >
        <Trash2 size={17} />
      </button>
    </article>
  );
}

export default TodoItem;
