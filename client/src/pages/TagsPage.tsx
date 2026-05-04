import { useState } from 'react';
import { useTags } from '../hooks/useTags';
import type { Tag, CreateTagPayload, UpdateTagPayload } from '../types/tag';

// ─── Preset colour swatches ────────────────────────────────────────────────
const PRESET_COLORS = [
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#8b5cf6', // violet
];

// ─── Helpers ───────────────────────────────────────────────────────────────
const isValidHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

// ─── Create Tag Modal ──────────────────────────────────────────────────────
interface CreateTagModalProps {
  existingNames: string[];
  onClose: () => void;
  onCreate: (payload: CreateTagPayload) => Promise<Tag>;
}

const CreateTagModal = ({
  existingNames,
  onClose,
  onCreate,
}: CreateTagModalProps) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [customColor, setCustomColor] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState('');

  const activeColor =
    customColor && isValidHex(customColor) ? customColor : color;

  const handleNameChange = (v: string) => {
    setName(v);
    const trimmed = v.trim().toLowerCase();
    if (trimmed && existingNames.includes(trimmed)) {
      setNameError('A tag with this name already exists');
    } else if (trimmed && !/^[a-z0-9\-_]+$/i.test(trimmed)) {
      setNameError('Only letters, numbers, hyphens, and underscores');
    } else {
      setNameError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nameError || !name.trim()) return;
    setSubmitting(true);
    try {
      await onCreate({
        name: name.trim().toLowerCase(),
        color: activeColor,
        isDefault,
        description: description.trim() || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className='fixed inset-0 bg-slate-800/20 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'
      onClick={onClose}
    >
      <div
        className='bg-white dark:bg-[#0a0a0a] dark:border dark:border-neutral-800 rounded-2xl shadow-2xl shadow-slate-200 dark:shadow-none w-full max-w-md'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800'>
          <h2 className='font-bold text-slate-800 dark:text-slate-100 text-lg'>
            New Tag
          </h2>
          <button
            onClick={onClose}
            className='p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors'
          >
            <svg
              width='18'
              height='18'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <line x1='18' y1='6' x2='6' y2='18' />
              <line x1='6' y1='6' x2='18' y2='18' />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-6 flex flex-col gap-5'>
          {/* Name */}
          <div>
            <label className='block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5'>
              Tag name *
            </label>
            <div className='flex items-center gap-2'>
              <span
                className='w-3 h-3 rounded-full shrink-0 ring-1 ring-slate-200 dark:ring-neutral-700 transition-colors'
                style={{ background: activeColor }}
              />
              <input
                id='new-tag-name'
                type='text'
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                maxLength={30}
                placeholder='e.g. work, urgent, personal'
                className='flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 dark:bg-black text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 dark:focus:ring-blue-900/30 transition-colors'
                autoFocus
              />
            </div>
            {nameError && (
              <p className='mt-1 text-xs text-red-600'>{nameError}</p>
            )}
          </div>

          {/* Color */}
          <div>
            <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2'>
              Colour
            </label>
            <div className='flex items-center gap-2 flex-wrap'>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type='button'
                  onClick={() => {
                    setColor(c);
                    setCustomColor('');
                  }}
                  className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ring-offset-2 ${color === c && !customColor ? 'ring-2 ring-slate-400 scale-110' : ''}`}
                  style={{ background: c }}
                  title={c}
                />
              ))}
              <input
                type='text'
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                placeholder='#3b82f6'
                maxLength={7}
                className={`w-24 px-2 py-1 text-xs rounded-lg border outline-none transition-colors ${
                  customColor && !isValidHex(customColor)
                    ? 'border-red-300 focus:ring-red-100'
                    : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50'
                }`}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className='block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5'>
              Description{' '}
              <span className='font-normal normal-case'>(optional)</span>
            </label>
            <input
              type='text'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
              placeholder='Short description…'
              className='w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 dark:bg-black text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 dark:focus:ring-blue-900/30 transition-colors'
            />
          </div>

          {/* Default toggle */}
          <label className='flex items-center gap-3 cursor-pointer select-none'>
            <button
              type='button'
              role='switch'
              aria-checked={isDefault}
              onClick={() => setIsDefault(!isDefault)}
              className={`relative w-10 h-6 rounded-full transition-colors ${isDefault ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-neutral-800'}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white dark:bg-neutral-300 rounded-full shadow transition-transform ${isDefault ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </button>
            <span className='text-sm font-medium text-slate-700 dark:text-slate-300'>
              Set as default
            </span>
            <span className='text-xs text-slate-400 dark:text-slate-500'>
              — auto-applied to new tasks
            </span>
          </label>

          {/* Actions */}
          <div className='flex gap-3 pt-1'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={
                !name.trim() ||
                !!nameError ||
                submitting ||
                (!!customColor && !isValidHex(customColor))
              }
              className='flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors'
            >
              {submitting ? 'Creating…' : 'Create Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Inline Edit Row ────────────────────────────────────────────────────────
interface TagRowProps {
  tag: Tag;
  onUpdate: (id: string, payload: UpdateTagPayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TagRow = ({ tag, onUpdate, onDelete }: TagRowProps) => {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);
  const [customColor, setCustomColor] = useState('');
  const [description, setDescription] = useState(tag.description ?? '');
  const [isDefault, setIsDefault] = useState(tag.isDefault);

  const activeColor =
    customColor && isValidHex(customColor) ? customColor : color;

  const resetEdit = () => {
    setName(tag.name);
    setColor(tag.color);
    setCustomColor('');
    setDescription(tag.description ?? '');
    setIsDefault(tag.isDefault);
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(tag._id, {
        name: name.trim().toLowerCase(),
        color: activeColor,
        description: description.trim() || undefined,
        isDefault,
      });
      setEditing(false);
      setCustomColor('');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await onDelete(tag._id);
  };

  return (
    <div className='bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden transition-shadow hover:shadow-sm'>
      {/* Main row */}
      <div className='flex items-center gap-4 px-4 py-3.5'>
        {/* Color dot */}
        <span
          className='w-3 h-3 rounded-full shrink-0 ring-1 ring-slate-200 dark:ring-neutral-700'
          style={{ background: tag.color }}
        />

        {/* Name + description */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <span className='font-semibold text-slate-800 dark:text-slate-100 text-sm'>
              {tag.name}
            </span>
            {tag.isDefault && (
              <span className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold'>
                <svg
                  width='9'
                  height='9'
                  viewBox='0 0 12 12'
                  fill='currentColor'
                >
                  <path d='M6 1l1.545 3.13L11 4.635l-2.5 2.435.59 3.44L6 8.93l-3.09 1.58.59-3.44L1 4.635l3.455-.505z' />
                </svg>
                default
              </span>
            )}
          </div>
          {tag.description && (
            <p className='text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate'>
              {tag.description}
            </p>
          )}
        </div>

        {/* Task count badge */}
        <div className='text-right shrink-0'>
          <span className='text-xs font-medium text-slate-500 dark:text-slate-400'>
            {tag.taskCount ?? 0}
          </span>
          <span className='text-xs text-slate-400 dark:text-slate-500'>
            {' '}
            tasks
          </span>
        </div>

        {/* Actions */}
        <div className='flex items-center gap-1 shrink-0'>
          <button
            onClick={() => {
              setEditing(!editing);
              setConfirming(false);
            }}
            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${editing ? 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-neutral-800 dark:hover:text-slate-300'}`}
            title='Edit'
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
              <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
              <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
            </svg>
          </button>
          <button
            onClick={() => {
              setConfirming(true);
              setEditing(false);
            }}
            className='p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors'
            title='Delete'
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
              <polyline points='3 6 5 6 21 6' />
              <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
            </svg>
          </button>
        </div>
      </div>

      {/* Delete confirmation panel */}
      {confirming && (
        <div className='px-4 py-3 bg-red-50 dark:bg-red-900/10 border-t border-red-100 dark:border-red-900/20 flex items-center gap-3'>
          <svg
            width='15'
            height='15'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            className='text-red-500 shrink-0'
          >
            <circle cx='12' cy='12' r='10' />
            <line x1='12' y1='8' x2='12' y2='12' />
            <line x1='12' y1='16' x2='12.01' y2='16' />
          </svg>
          <p className='text-xs text-red-700 dark:text-red-400 flex-1'>
            This will remove <strong>"{tag.name}"</strong> from all{' '}
            {tag.taskCount ?? 0} task(s). Are you sure?
          </p>
          <button
            onClick={() => setConfirming(false)}
            className='text-xs px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className='text-xs px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors'
          >
            Confirm Delete
          </button>
        </div>
      )}

      {/* Inline edit panel */}
      {editing && (
        <div className='px-4 pt-1 pb-4 border-t border-slate-100 dark:border-neutral-800 flex flex-col gap-4 bg-slate-50/50 dark:bg-neutral-900/50'>
          {/* Name */}
          <div className='flex items-center gap-2 mt-3'>
            <span
              className='w-3 h-3 rounded-full shrink-0 ring-1 ring-slate-200 dark:ring-neutral-700'
              style={{ background: activeColor }}
            />
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              className='flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 dark:focus:ring-blue-900/30 transition-colors bg-white dark:bg-black'
            />
          </div>

          {/* Color swatches */}
          <div className='flex items-center gap-2 flex-wrap'>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type='button'
                onClick={() => {
                  setColor(c);
                  setCustomColor('');
                }}
                className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ring-offset-1 ${color === c && !customColor ? 'ring-2 ring-slate-400 scale-110' : ''}`}
                style={{ background: c }}
              />
            ))}
            <input
              type='text'
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder='#hex'
              maxLength={7}
              className='w-20 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-black outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 dark:focus:ring-blue-900/30'
            />
          </div>

          {/* Description */}
          <input
            type='text'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={100}
            placeholder='Description (optional)'
            className='px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 dark:focus:ring-blue-900/30 bg-white dark:bg-black transition-colors'
          />

          {/* Default toggle */}
          <label className='flex items-center gap-2.5 cursor-pointer select-none'>
            <button
              type='button'
              role='switch'
              aria-checked={isDefault}
              onClick={() => setIsDefault(!isDefault)}
              className={`relative w-9 h-5 rounded-full transition-colors ${isDefault ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-neutral-700'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white dark:bg-neutral-300 rounded-full shadow transition-transform ${isDefault ? 'translate-x-4' : ''}`}
              />
            </button>
            <span className='text-xs text-slate-600 dark:text-slate-400 font-medium'>
              Default tag
            </span>
          </label>

          {/* Save / Cancel */}
          <div className='flex gap-2'>
            <button
              onClick={resetEdit}
              className='flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                saving ||
                !name.trim() ||
                (!!customColor && !isValidHex(customColor))
              }
              className='flex-1 px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors'
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tags Page ──────────────────────────────────────────────────────────────
const TagsPage = () => {
  const { tags, loading, error, createTag, updateTag, deleteTag } = useTags();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = tags.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const existingNames = tags.map((t) => t.name);

  return (
    <div className='animate-in fade-in slide-in-from-bottom-4 duration-500'>
      {/* Page header */}
      <header className='mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4'>
        <div>
          <h2 className='text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight'>
            Tags
          </h2>
          <p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>
            <span className='font-medium text-slate-700 dark:text-slate-300'>
              {tags.length}
            </span>{' '}
            {tags.length === 1 ? 'tag' : 'tags'} ·{' '}
            <span className='font-medium text-slate-700 dark:text-slate-300'>
              {tags.filter((t) => t.isDefault).length}
            </span>{' '}
            default
          </p>
        </div>
        <button
          id='new-tag-btn'
          onClick={() => setShowModal(true)}
          className='inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-sm shadow-indigo-200 transition-all'
        >
          <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <line x1='12' y1='5' x2='12' y2='19' />
            <line x1='5' y1='12' x2='19' y2='12' />
          </svg>
          New Tag
        </button>
      </header>

      {/* Error */}
      {error && (
        <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700'>
          <svg
            className='shrink-0 mt-0.5'
            width='18'
            height='18'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <circle cx='12' cy='12' r='10' />
            <line x1='12' y1='8' x2='12' y2='12' />
            <line x1='12' y1='16' x2='12.01' y2='16' />
          </svg>
          <div>
            <p className='font-bold text-sm'>Failed to load tags</p>
            <p className='text-sm opacity-90 mt-0.5'>{error}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className='flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-black border border-slate-200 dark:border-neutral-800 rounded-xl mb-5 shadow-sm focus-within:border-indigo-300 dark:focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-50 dark:focus-within:ring-indigo-900/30 transition-all'>
        <svg
          className='text-slate-400 shrink-0'
          width='16'
          height='16'
          viewBox='0 0 16 16'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
        >
          <circle cx='7' cy='7' r='5' />
          <path d='M11 11l3 3' strokeLinecap='round' />
        </svg>
        <input
          id='tags-search'
          type='text'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder='Search tags…'
          className='flex-1 bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500'
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className='text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 transition-colors'
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
              <line x1='18' y1='6' x2='6' y2='18' />
              <line x1='6' y1='6' x2='18' y2='18' />
            </svg>
          </button>
        )}
      </div>

      {/* Tags list */}
      {loading ? (
        <div className='flex flex-col gap-3'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='h-16 bg-slate-100 dark:bg-neutral-800 rounded-xl animate-pulse'
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className='text-center py-20'>
          <div className='inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-400 dark:text-indigo-500 mb-4'>
            <svg
              width='28'
              height='28'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              <path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' />
              <line x1='7' y1='7' x2='7.01' y2='7' />
            </svg>
          </div>
          <h3 className='font-semibold text-slate-700 dark:text-slate-300 mb-1'>
            {search ? 'No tags match your search' : 'No tags yet'}
          </h3>
          <p className='text-sm text-slate-400 dark:text-slate-500'>
            {search
              ? 'Try a different search term'
              : 'Create your first tag to start organising your tasks.'}
          </p>
          {!search && (
            <button
              onClick={() => setShowModal(true)}
              className='mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors'
            >
              Create first tag
            </button>
          )}
        </div>
      ) : (
        <div className='flex flex-col gap-3'>
          {filtered.map((tag: Tag) => (
            <TagRow
              key={tag._id}
              tag={tag}
              onUpdate={updateTag}
              onDelete={deleteTag}
            />
          ))}
        </div>
      )}

      {/* Create Tag Modal */}
      {showModal && (
        <CreateTagModal
          existingNames={existingNames}
          onClose={() => setShowModal(false)}
          onCreate={createTag}
        />
      )}
    </div>
  );
};

export default TagsPage;
