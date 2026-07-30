import apiClient from "./client";

export interface Dataset {
  id: number;
  name: string;
  column_names: string[];
  created_at: string;
}

export interface DatasetList {
  items: Dataset[];
  total: number;
  page: number;
  limit: number;
}

export interface DatasetPreview {
  columns: string[];
  rows: Record<string, unknown>[];
  total_rows: number;
}

export interface ComputeResult {
  column: string;
  operation: string;
  result: number;
}

export interface PlotData {
  col1: string;
  col2: string;
  data: { col1: unknown; col2: unknown }[];
}

export async function uploadDataset(name: string, file: File): Promise<Dataset> {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("file", file);
  const res = await apiClient.post<Dataset>("/dataset", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function listDatasets(page: number, limit: number): Promise<DatasetList> {
  const res = await apiClient.get<DatasetList>("/dataset", { params: { page, limit } });
  return res.data;
}

export async function previewDataset(id: number): Promise<DatasetPreview> {
  const res = await apiClient.get<DatasetPreview>(`/dataset/${id}/preview`);
  return res.data;
}

export async function deleteDataset(id: number): Promise<void> {
  await apiClient.delete(`/dataset/${id}`);
}

export async function computeStat(
  id: number,
  column: string,
  operation: "min" | "max" | "sum"
): Promise<ComputeResult> {
  const res = await apiClient.post<ComputeResult>(`/dataset/${id}/compute`, { column, operation });
  return res.data;
}

export async function getPlotData(id: number, col1: string, col2: string): Promise<PlotData> {
  const res = await apiClient.get<PlotData>(`/dataset/${id}/plot`, { params: { col1, col2 } });
  return res.data;
}