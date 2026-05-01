import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { Tag, CreateTagPayload, UpdateTagPayload } from '../types/tag';
import * as tagApi from '../services/tagApi';

interface UseTagsReturn {
  tags: Tag[];
  loading: boolean;
  error: string | null;
  createTag: (payload: CreateTagPayload) => Promise<Tag>;
  updateTag: (id: string, payload: UpdateTagPayload) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  refresh: () => void;
}

export const useTags = (): UseTagsReturn => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Inline async effect — avoids cascading render warning
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await tagApi.getAllTags();
        if (!cancelled) setTags(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch tags');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const createTag = async (payload: CreateTagPayload): Promise<Tag> => {
    try {
      const newTag = await tagApi.createTag(payload);
      setTags((prev) => [...prev, newTag]);
      toast.success(`Tag "${newTag.name}" created`);
      return newTag;
    } catch (err) {
      toast.error('Failed to create tag');
      throw err;
    }
  };

  const updateTag = async (id: string, payload: UpdateTagPayload): Promise<void> => {
    try {
      const updated = await tagApi.updateTag(id, payload);
      setTags((prev) => prev.map((t) => (t._id === id ? updated : t)));
      toast.success('Tag updated');
    } catch (err) {
      toast.error('Failed to update tag');
      throw err;
    }
  };

  const deleteTag = async (id: string): Promise<void> => {
    // Optimistic remove
    const snapshot = tags.find((t) => t._id === id);
    setTags((prev) => prev.filter((t) => t._id !== id));
    try {
      await tagApi.deleteTag(id);
      toast.success(`Tag "${snapshot?.name ?? ''}" deleted`);
    } catch (err) {
      // Restore on failure
      if (snapshot) setTags((prev) => [...prev, snapshot]);
      toast.error('Failed to delete tag');
      throw err;
    }
  };

  return { tags, loading, error, createTag, updateTag, deleteTag, refresh };
};
