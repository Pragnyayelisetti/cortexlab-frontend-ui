import { ANNOTATION_API } from '../env';
import type {
  ListFoldersResponse,
  ListDataIdsResponse,
  ListImagesResponse,
  CreateProjectRequest,
  CreateProjectResponse,
  SaveAnnotationRequest,
  SaveAnnotationResponse,
  AddImagesResponse,
  ListPartNumbersResponse,
  ListBladeIdsResponse,
  GetBladeImagesResponse,
  BladeImageRequest,
  TrayImageRequest,
  GetTrayImagesResponse,
} from '../types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }
  return data;
}

export async function listFolders(bucket: string): Promise<ListFoldersResponse> {
  return fetchJson(`${ANNOTATION_API}/annotate/list_folders?bucket=${encodeURIComponent(bucket)}`);
}

export async function listDataIds(
  bucket: string,
  prefix: string
): Promise<ListDataIdsResponse> {
  return fetchJson(
    `${ANNOTATION_API}/annotate/list_data_ids?bucket=${encodeURIComponent(bucket)}&prefix=${encodeURIComponent(prefix)}`
  );
}

export async function listImages(
  bucket: string,
  prefix: string
): Promise<ListImagesResponse> {
  return fetchJson(
    `${ANNOTATION_API}/annotate/list_images?bucket=${encodeURIComponent(bucket)}&prefix=${encodeURIComponent(prefix)}`
  );
}

export async function createProject(
  request: CreateProjectRequest
): Promise<CreateProjectResponse> {
  return fetchJson(`${ANNOTATION_API}/annotate/annotate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}

export async function saveAnnotation(
  request: SaveAnnotationRequest
): Promise<SaveAnnotationResponse> {
  return fetchJson(`${ANNOTATION_API}/annotate/save_annotation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}

export async function addImages(
  projectId: number,
  imageUrls: string[]
): Promise<AddImagesResponse> {
  return fetchJson(`${ANNOTATION_API}/annotate/add_images/${projectId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(imageUrls),
  });
}

export async function exportYaml(jobId: string): Promise<{ status: string }> {
  return fetchJson(`${ANNOTATION_API}/annotate/jobs/${jobId}/export_yaml`);
}

export async function listPartNumbers(): Promise<ListPartNumbersResponse> {
  return fetchJson(`${ANNOTATION_API}/annotate/list_part_numbers`);
}

export async function listBladeIds(partNumber: string): Promise<ListBladeIdsResponse> {
  return fetchJson(
    `${ANNOTATION_API}/annotate/list_blade_ids?part_number=${encodeURIComponent(partNumber)}`
  );
}

export async function getBladeImages(request: BladeImageRequest): Promise<GetBladeImagesResponse> {
  return fetchJson(`${ANNOTATION_API}/annotate/get_blade_images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}

export async function getTrayImages(request: TrayImageRequest): Promise<GetTrayImagesResponse> {
  return fetchJson(`${ANNOTATION_API}/annotate/get_tray_images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
}
