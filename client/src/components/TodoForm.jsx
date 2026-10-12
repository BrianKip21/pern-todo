
import { useState } from "react";
import { Plus } from "lucide-react";

const initialForm = {
  title: "",
  description: "",
  priority: "medium",
  due_date: "",
};

function TodoForm({ onAddTodo, isSubmitting }) {
  const [formData, setFormData] = useState(initialForm);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title.trim()) return;

    const success = await onAddTodo({
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      due_date: formData.due_date || null,
    });

    if (success) {
      setFormData(initialForm);
    }
  };

  const inputClasses =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Create a task
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          What would you like to accomplish?
        </p>
      </div>

      <div>
        <label
          htmlFor="title"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Task title
        </label>

        <input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g. Complete my project"
          maxLength={255}
          required
          className={inputClasses}
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Description <span className="text-slate-400">(optional)</span>
        </label>

        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Add some details..."
          maxLength={10000}
          rows={3}
          className={inputClasses}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="priority"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Priority
          </label>

          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className={inputClasses}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="due_date"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Due date
          </label>

          <input
            id="due_date"
            name="due_date"
            type="date"
            value={formData.due_date}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Plus size={18} />
        {isSubmitting ? "Adding task..." : "Add task"}
      </button>
    </form>
  );
}

export default TodoForm;
