import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react';
import type {
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskPriority,
  Task,
} from '../types/task';
import type { Tag } from '../types/tag';

interface TaskFormProps {
  onSubmit: (payload: CreateTaskPayload | UpdateTaskPayload) => Promise<void>;
  initialData?: Task;
  onCancel?: () => void;
  /** Full Tag objects from the DB — used for the dropdown + colour dots */
  availableTags?: Tag[];
  /** @deprecated pass availableTags instead */
  suggestedTags?: string[];
}

const TaskForm = ({
  onSubmit,
  initialData,
  onCancel,
  availableTags = [],
}: TaskFormProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const loadDraft = () => {
    if (initialData) return null;
    try {
      const saved = localStorage.getItem('tf-draft');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const draft = loadDraft();

  const [title, setTitle] = useState(initialData?.title || draft?.title || '');
  const [description, setDescription] = useState(
    initialData?.description || draft?.description || '',
  );
  const [priority, setPriority] = useState<TaskPriority>(
    initialData?.priority || draft?.priority || 'medium',
  );
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().split('T')[0]
      : draft?.dueDate || '',
  );
  // For new tasks: pre-seed with default tags (only on first mount, not from draft)
  const getInitialTags = (): string[] => {
    if (initialData) return initialData.tags ?? [];
    if (draft?.tags?.length) return draft.tags;
    // Pre-select all default tags
    return availableTags.filter((t) => t.isDefault).map((t) => t.name);
  };
  const [tags, setTags] = useState<string[]>(getInitialTags);
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initialData?.estimatedMinutes ? String(initialData.estimatedMinutes) : draft?.estimatedMinutes || '',
  );

  // Subtasks State
  const [subtasks, setSubtasks] = useState<
    { title: string; isCompleted: boolean }[]
  >(initialData?.subtasks || draft?.subtasks || []);
  const [subtaskInput, setSubtaskInput] = useState('');

  const [isLongTerm, setIsLongTerm] = useState(
    initialData?.isLongTerm ?? draft?.isLongTerm ?? false,
  );
  const [isExpanded, setIsExpanded] = useState(!!initialData || !!draft?.title);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialData) {
      localStorage.setItem('tf-draft', JSON.stringify({
        title, description, priority, dueDate, tags, estimatedMinutes, subtasks, isLongTerm
      }));
    }
  }, [title, description, priority, dueDate, tags, estimatedMinutes, subtasks, isLongTerm, initialData]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleTag = (tagName: string) => {
    if (tags.includes(tagName)) {
      setTags(tags.filter((t) => t !== tagName));
    } else if (tags.length < 5) {
      setTags([...tags, tagName]);
    }
  };

  const removeTag = (tagName: string) => {
    setTags(tags.filter((t) => t !== tagName));
  };



  const addSubtask = () => {
    const stTitle = subtaskInput.trim();
    if (stTitle && subtasks.length < 20) {
      setSubtasks([...subtasks, { title: stTitle, isCompleted: false }]);
      setSubtaskInput('');
    }
  };

  const removeSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubtaskKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubtask();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        tags: tags.length > 0 ? tags : undefined,
        estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : 0,
        subtasks: subtasks.length > 0 ? subtasks : undefined,
        isLongTerm,
        dueDate: dueDate
          ? new Date(dueDate).toISOString()
          : initialData
            ? null
            : undefined,
      });
      if (!initialData) {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        // Reset to default tags again
        setTags(availableTags.filter((t) => t.isDefault).map((t) => t.name));
        setEstimatedMinutes('');
        setSubtasks([]);
        setSubtaskInput('');
        setIsLongTerm(false);
        setIsExpanded(false);
        localStorage.removeItem('tf-draft');
      }
    } catch (err) {
      console.error('Failed to save task:', err);
      setSubmitError('Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormKeyDown = (e: KeyboardEvent<HTMLFormElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <form
      className={`bg-white dark:bg-black border rounded-xl shadow-sm transition-all duration-300 mb-6 ${
        isExpanded ? 'border-blue-400 ring-4 ring-blue-50 dark:ring-blue-900/30' : 'border-slate-200 dark:border-neutral-800'
      } ${initialData ? 'mb-0 shadow-none border-0' : ''}`}
      onSubmit={handleSubmit}
      onKeyDown={handleFormKeyDown}
    >
      <div className='flex items-center gap-3 p-3 sm:p-4'>
        <div className='flex-1 flex items-center gap-3'>
          <svg
            className='text-slate-400 shrink-0'
            width='20'
            height='20'
            viewBox='0 0 20 20'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <circle cx='10' cy='10' r='7' />
            <path d='M10 7v6M7 10h6' strokeLinecap='round' />
          </svg>
          <input
            id='task-title-input'
            type='text'
            className='flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-[15px]'
            placeholder='What needs to be done?'
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => !initialData && setIsExpanded(true)}
          />
        </div>

        {initialData && onCancel && (
          <button
            type='button'
            className='text-slate-500 hover:bg-slate-100 rounded-lg px-3 py-2 text-sm font-semibold transition-colors'
            onClick={onCancel}
          >
            Cancel
          </button>
        )}

        <button
          type='submit'
          className='flex items-center gap-2 bg-blue-600 text-white border-none rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
          disabled={!title.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
          ) : (
            <>
              {initialData ? null : (
                <svg
                  width='16'
                  height='16'
                  viewBox='0 0 16 16'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                >
                  <path d='M8 3v10M3 8h10' strokeLinecap='round' />
                </svg>
              )}
              <span className='hidden sm:inline'>
                {initialData ? 'Save' : 'Add'}
              </span>
            </>
          )}
        </button>
      </div>

      {submitError && (
        <div className='px-3 sm:px-4 pb-3'>
          <div className='p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 flex items-center gap-2'>
            <svg
              width='16'
              height='16'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <circle cx='12' cy='12' r='10'></circle>
              <line x1='12' y1='8' x2='12' y2='12'></line>
              <line x1='12' y1='16' x2='12.01' y2='16'></line>
            </svg>
            {submitError}
          </div>
        </div>
      )}

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out px-3 sm:px-4 ${
          isExpanded
            ? 'max-h-[1000px] opacity-100 pb-4'
            : 'max-h-0 opacity-0 pb-0'
        }`}
      >
        {/* Description */}
        <textarea
          className='w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg p-3 text-slate-800 dark:text-slate-100 text-sm resize-none outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 dark:focus:ring-blue-900/30 mb-4'
          placeholder='Add a description (optional)'
          value={description}
          maxLength={1000}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
          {/* Subtasks */}
          <div className='flex flex-col gap-2'>
            <label className='text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider'>
              Subtasks
            </label>
            <div className='flex flex-col gap-2'>
              {subtasks.map((st, index) => (
                <div
                  key={index}
                  className='flex items-center gap-2 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-1.5'
                >
                  <div className='w-3.5 h-3.5 rounded-sm border-2 border-slate-300 dark:border-neutral-600 shrink-0' />
                  <span className='text-sm text-slate-700 dark:text-slate-300 flex-1 truncate'>
                    {st.title}
                  </span>
                  <button
                    type='button'
                    onClick={() => removeSubtask(index)}
                    className='text-slate-400 hover:text-red-500'
                  >
                    <svg
                      width='14'
                      height='14'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <line x1='18' y1='6' x2='6' y2='18'></line>
                      <line x1='6' y1='6' x2='18' y2='18'></line>
                    </svg>
                  </button>
                </div>
              ))}
              <div className='flex items-center gap-2'>
                <input
                  type='text'
                  className='flex-1 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-sm dark:text-slate-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 dark:focus:ring-blue-900/30'
                  placeholder='Add a subtask (press Enter)...'
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={handleSubtaskKeyDown}
                />
                <button
                  type='button'
                  onClick={addSubtask}
                  className='p-1.5 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-700'
                  disabled={!subtaskInput.trim()}
                >
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <line x1='12' y1='5' x2='12' y2='19'></line>
                    <line x1='5' y1='12' x2='19' y2='12'></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className='flex flex-col gap-4'>
            {/* Tags — multi-select dropdown */}
            <div className='relative z-10' ref={dropdownRef}>
              <label className='block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2'>
                Tags
                {tags.length > 0 && (
                  <span className='ml-2 normal-case font-normal text-slate-400 dark:text-slate-500'>
                    {tags.length}/5
                  </span>
                )}
              </label>

              {/* Selected tag pills + trigger */}
              <div
                role='button'
                tabIndex={0}
                aria-haspopup='listbox'
                aria-expanded={dropdownOpen}
                onClick={() => setDropdownOpen((o) => !o)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDropdownOpen((o) => !o); } }}
                className={`flex flex-wrap gap-1.5 items-center min-h-[38px] bg-slate-50 dark:bg-neutral-900 border rounded-lg p-2 cursor-pointer transition-colors select-none ${
                  dropdownOpen
                    ? 'border-blue-400 ring-2 ring-blue-50 dark:ring-blue-900/30'
                    : 'border-slate-200 dark:border-neutral-700 hover:border-slate-300 dark:hover:border-neutral-600'
                }`}
              >
                {tags.length === 0 && (
                  <span className='text-sm text-slate-400 flex-1'>Select tags…</span>
                )}
                {tags.map((tagName) => {
                  const tagObj = availableTags.find((t) => t.name === tagName);
                  return (
                    <span
                      key={tagName}
                      className='flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border'
                      style={{
                        background: tagObj ? `${tagObj.color}15` : '#eef2ff',
                        borderColor: tagObj ? `${tagObj.color}40` : '#c7d2fe',
                        color: tagObj?.color ?? '#4f46e5',
                      }}
                    >
                      <span
                        className='w-1.5 h-1.5 rounded-full shrink-0'
                        style={{ background: tagObj?.color ?? '#6366f1' }}
                      />
                      {tagName}
                      <button
                        type='button'
                        className='opacity-60 hover:opacity-100 transition-opacity'
                        onClick={(e) => { e.stopPropagation(); removeTag(tagName); }}
                        tabIndex={-1}
                      >
                        <svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3' strokeLinecap='round' strokeLinejoin='round'>
                          <line x1='18' y1='6' x2='6' y2='18' /><line x1='6' y1='6' x2='18' y2='18' />
                        </svg>
                      </button>
                    </span>
                  );
                })}
                <svg
                  className={`ml-auto shrink-0 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'
                >
                  <polyline points='6 9 12 15 18 9' />
                </svg>
              </div>

              {/* Dropdown panel */}
              {dropdownOpen && (
                <div
                  role='listbox'
                  aria-multiselectable='true'
                  className='absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#0a0a0a] border border-slate-200 dark:border-neutral-800 rounded-xl shadow-lg overflow-hidden z-20'
                >
                  {availableTags.length === 0 ? (
                    <div className='px-3 py-3 text-xs text-slate-400 text-center'>
                      No tags yet — create one in{' '}
                      <a href='/tags' className='text-indigo-500 hover:underline'>Tags page</a>
                    </div>
                  ) : (
                    <ul className='py-1 max-h-48 overflow-y-auto'>
                      {availableTags.map((tag) => {
                        const selected = tags.includes(tag.name);
                        const disabled = !selected && tags.length >= 5;
                        return (
                          <li
                            key={tag._id}
                            role='option'
                            aria-selected={selected}
                            onClick={() => !disabled && toggleTag(tag.name)}
                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                              disabled
                                ? 'opacity-40 cursor-not-allowed'
                                : selected
                                  ? 'bg-indigo-50/60 dark:bg-indigo-900/30'
                                  : 'hover:bg-slate-50 dark:hover:bg-neutral-900'
                            }`}
                          >
                            {/* Checkbox */}
                            <span
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                selected ? 'border-transparent' : 'border-slate-300 dark:border-neutral-600'
                              }`}
                              style={selected ? { background: tag.color, borderColor: tag.color } : {}}
                            >
                              {selected && (
                                <svg width='9' height='9' viewBox='0 0 12 12' fill='none' stroke='white' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
                                  <path d='M2 6l3 3 5-5' />
                                </svg>
                              )}
                            </span>
                            {/* Color dot */}
                            <span className='w-2 h-2 rounded-full shrink-0' style={{ background: tag.color }} />
                            {/* Name */}
                            <span className='text-sm text-slate-700 dark:text-slate-300 flex-1'>{tag.name}</span>
                            {/* Default badge */}
                            {tag.isDefault && (
                              <span className='text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-500'>default</span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {tags.length >= 5 && (
                    <div className='px-3 py-1.5 text-xs text-amber-600 bg-amber-50 border-t border-amber-100'>
                      Maximum 5 tags reached
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Estimates & Due Date */}
            <div className='flex flex-row gap-4 items-start'>
              <div className='flex-1'>
                <label className='block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2'>
                  Est. Time (Mins)
                </label>
                <input
                  type='number'
                  min='0'
                  step='5'
                  className='w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-md px-3 py-1.5 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 dark:focus:ring-blue-900/30'
                  placeholder='e.g. 30'
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                />
              </div>

              <div className='flex-1'>
                <label className='block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2'>
                  Due Date
                </label>
                <input
                  type='date'
                  className='w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-md px-3 py-1.5 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 dark:focus:ring-blue-900/30'
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Priority and Long Term */}
            <div className='flex gap-4'>
              <div className='flex-1'>
                <label className='block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2'>
                  Priority
                </label>
                <div className='flex gap-2 w-full'>
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type='button'
                      className={`flex-1 px-3 py-1.5 rounded-md border text-xs font-medium capitalize transition-colors ${
                        priority === p
                          ? p === 'low'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : p === 'medium'
                              ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-slate-400 dark:hover:bg-neutral-800'
                      }`}
                      onClick={() => setPriority(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className='shrink-0'>
                <label className='block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2'>
                  Keep 24h+
                </label>
                <button
                  type='button'
                  onClick={() => setIsLongTerm(!isLongTerm)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                    isLongTerm
                      ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-slate-400 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isLongTerm ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-neutral-600'}`}
                  >
                    {isLongTerm && (
                      <svg
                        width='10'
                        height='10'
                        viewBox='0 0 12 12'
                        fill='none'
                        stroke='white'
                        strokeWidth='3'
                      >
                        <path
                          d='M2 6l3 3 5-5'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    )}
                  </div>
                  Long-Term
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default TaskForm;
