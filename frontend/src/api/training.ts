import { TRAINING_API } from '../env';
import type { TrainingConfig, TrainingMetricsResponse, ArtifactsResponse } from '../types';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }
  return data;
}

export async function startTraining(config: TrainingConfig): Promise<{ status: string; task_id?: string }> {
  return fetchJson(`${TRAINING_API}/train/start_training`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
}

export async function getMetrics(): Promise<TrainingMetricsResponse> {
  return fetchJson(`${TRAINING_API}/metrics/retrieve_metrics`);
}

export async function getArtifacts(projectName: string, version: number): Promise<ArtifactsResponse> {
  return fetchJson(`${TRAINING_API}/metrics/retrieve_artifacts/${projectName}/${version}`);
}

export async function deleteTrainingJob(projectName: string, version: number): Promise<void> {
  return fetchJson(`${TRAINING_API}/jobs/delete_project/${projectName}/${version}`, {
    method: 'DELETE',
  });
}
