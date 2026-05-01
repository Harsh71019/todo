import axios from 'axios';
import type { Tag, CreateTagPayload, UpdateTagPayload } from '../types/tag';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

interface TagApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
}

export const getAllTags = async (): Promise<Tag[]> => {
  const { data } = await api.get<TagApiResponse<Tag[]>>('/tags');
  return data.data;
};

export const createTag = async (payload: CreateTagPayload): Promise<Tag> => {
  const { data } = await api.post<TagApiResponse<Tag>>('/tags', payload);
  return data.data;
};

export const updateTag = async (id: string, payload: UpdateTagPayload): Promise<Tag> => {
  const { data } = await api.patch<TagApiResponse<Tag>>(`/tags/${id}`, payload);
  return data.data;
};

export const deleteTag = async (id: string): Promise<void> => {
  await api.delete(`/tags/${id}`);
};
