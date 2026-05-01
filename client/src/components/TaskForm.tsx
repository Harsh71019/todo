import { useState, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import type {
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskPriority,
  Task,
} from '../types/task';

interface TaskFormProps {
  onSubmit: (payload: CreateTaskPayload | UpdateTaskPayload) => Promise<void>;
  initialData?: Task;
  onCancel?: () => void;
  suggestedTags?: string[];
}

const TaskForm = ({
  onSubmit,
  initialData,
  onCancel,
  suggestedTags,
}: TaskFormProps) => {
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
  const [tags, setTags] = useState<string[]>(initialData?.tags || draft?.tags || []);
  const [tagInput, setTagInput] = useState('');
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
        setTags([]);
        setTagInput('');
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
      className={`bg-white border rounded-xl shadow-sm transition-all duration-300 mb-6 ${
        isExpanded ? 'border-blue-400 ring-4 ring-blue-50' : 'border-slate-200'
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
            className='flex-1 bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 text-[15px]'
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
          className='w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 text-sm resize-none outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 mb-4'
          placeholder='Add a description (optional)'
          value={description}
          maxLength={1000}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
          {/* Subtasks */}
          <div className='flex flex-col gap-2'>
            <label className='text-xs font-semibold text-slate-500 uppercase tracking-wider'>
              Subtasks
            </label>
            <div className='flex flex-col gap-2'>
              {subtasks.map((st, index) => (
                <div
                  key={index}
                  className='flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5'
                >
                  <div className='w-3.5 h-3.5 rounded-sm border-2 border-slate-300 shrink-0' />
                  <span className='text-sm text-slate-700 flex-1 truncate'>
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
                  className='flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50'
                  placeholder='Add a subtask (press Enter)...'
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={handleSubtaskKeyDown}
                />
                <button
                  type='button'
                  onClick={addSubtask}
                  className='p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200'
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
            {/* Tags */}
            <div className='relative z-10'>
              <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2'>
                Tags
              </label>
              <div className='flex flex-wrap gap-1.5 items-center bg-slate-50 border border-slate-200 rounded-lg p-2 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-50 transition-colors'>
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className='flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium border border-indigo-100'
                  >
                    {tag}
                    <button
                      type='button'
                      className='text-indigo-400 hover:text-indigo-700 transition-colors'
                      onClick={() => removeTag(tag)}
                    >
                      <svg
                        width='12'
                        height='12'
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
                  </span>
                ))}
                <input
                  type='text'
                  className='flex-1 min-w-[100px] bg-transparent border-none outline-none text-slate-800 text-sm placeholder-slate-400'
                  placeholder={
                    tags.length >= 5 ? 'Max 5 tags' : 'Add tags (Enter)...'
                  }
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  disabled={tags.length >= 5}
                />
              </div>

              {/* Autocomplete Dropdown */}
              {tagInput &&
                suggestedTags &&
                suggestedTags.filter(
                  (t) =>
                    t.toLowerCase().includes(tagInput.toLowerCase()) &&
                    !tags.includes(t),
                ).length > 0 && (
                  <div className='absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-40 overflow-y-auto'>
                    {suggestedTags
                      .filter(
                        (t) =>
                          t.toLowerCase().includes(tagInput.toLowerCase()) &&
                          !tags.includes(t),
                      )
                      .map((tag) => (
                        <button
                          key={tag}
                          type='button'
                          className='w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors'
                          onClick={() => {
                            if (tags.length < 5) {
                              setTags([...tags, tag]);
                              setTagInput('');
                            }
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                  </div>
                )}
            </div>

            {/* Estimates & Due Date */}
            <div className='flex flex-row gap-4 items-start'>
              <div className='flex-1'>
                <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2'>
                  Est. Time (Mins)
                </label>
                <input
                  type='number'
                  min='0'
                  step='5'
                  className='w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-800 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50'
                  placeholder='e.g. 30'
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                />
              </div>

              <div className='flex-1'>
                <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2'>
                  Due Date
                </label>
                <input
                  type='date'
                  className='w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-800 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50'
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Priority and Long Term */}
            <div className='flex gap-4'>
              <div className='flex-1'>
                <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2'>
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
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : p === 'medium'
                              ? 'bg-amber-50 border-amber-500 text-amber-700'
                              : 'bg-red-50 border-red-500 text-red-700'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      onClick={() => setPriority(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className='shrink-0'>
                <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2'>
                  Keep 24h+
                </label>
                <button
                  type='button'
                  onClick={() => setIsLongTerm(!isLongTerm)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                    isLongTerm
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isLongTerm ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}
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
