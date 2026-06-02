import { ANNOTATION_API } from '../env';
import type { Job, GetJobResponse } from '../types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }
  return data;
}

export async function listJobs(): Promise<{ jobs: Job[] }> {
  return fetchJson(`${ANNOTATION_API}/jobs/jobs`);
}

export async function getJob(jobId: string): Promise<GetJobResponse> {
  return fetchJson(`${ANNOTATION_API}/jobs/get_job/${encodeURIComponent(jobId)}`);
}

export async function deleteProject(projectName: string): Promise<void> {
  const res = await fetch(
    `${ANNOTATION_API}/jobs/delete_project?project_name=${encodeURIComponent(projectName)}`,
    { method: 'DELETE' }
  );
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || JSON.stringify(data));
  }
}
