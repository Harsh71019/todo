import { useState, type FormEvent, type KeyboardEvent } from 'react';
import type { CreateTaskPayload, TaskPriority } from '../types/task';

interface TaskFormProps {
  onSubmit: (payload: CreateTaskPayload) => Promise<void>;
}

const TaskForm = ({ onSubmit }: TaskFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        tags: tags.length > 0 ? tags : undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      });
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      setTags([]);
      setTagInput('');
      setIsExpanded(false);
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="task-form-main">
        <div className="task-form-input-wrapper">
          <svg className="task-form-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="10" cy="10" r="7" />
            <path d="M10 7v6M7 10h6" strokeLinecap="round" />
          </svg>
          <input
            id="task-title-input"
            type="text"
            className="task-form-input"
            placeholder="Add a new task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setIsExpanded(true)}
          />
        </div>
        <button
          type="submit"
          className="task-form-submit"
          disabled={!title.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <span className="spinner-small" />
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v10M3 8h10" strokeLinecap="round" />
              </svg>
              Add
            </>
          )}
        </button>
      </div>

      <div className={`task-form-extras ${isExpanded ? 'expanded' : ''}`}>
        <textarea
          className="task-form-description"
          placeholder="Add a description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        {/* Tags Input */}
        <div className="tags-input-wrapper">
          <div className="tags-input-container">
            {tags.map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
                <button type="button" className="tag-remove" onClick={() => removeTag(tag)}>×</button>
              </span>
            ))}
            <input
              type="text"
              className="tag-input"
              placeholder={tags.length >= 5 ? 'Max 5 tags' : 'Add tags (press Enter)...'}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={addTag}
              disabled={tags.length >= 5}
            />
          </div>
        </div>

        <div className="task-form-row">
          <div className="task-form-field">
            <label className="task-form-label">Priority</label>
            <div className="priority-selector">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`priority-option ${p} ${priority === p ? 'selected' : ''}`}
                  onClick={() => setPriority(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="task-form-field">
            <label className="task-form-label">Due Date</label>
            <input
              type="date"
              className="task-form-date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
      </div>
    </form>
  );
};

export default TaskForm;
