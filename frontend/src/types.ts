export interface Folder {
  name: string;
}

export interface ListFoldersResponse {
  folders: Folder[];
}

export interface ListDataIdsResponse {
  views: string[];
}

export interface ListImagesResponse {
  views: string[];
}

export interface ListPartNumbersResponse {
  part_numbers: string[];
}

export interface ListBladeIdsResponse {
  blade_ids: string[];
}

export interface BladeImageData {
  blade_id: string;
  blade_data_id: string;
  image_paths: string[];
}

export interface GetBladeImagesResponse {
  image_paths: BladeImageData[];
}

export interface BladeImageRequest {
  blade_ids: string[];
  part_number: string;
}

export interface TrayImageRequest {
  bucket: string;
  part_number: string;
}

export interface GetTrayImagesResponse {
  tray_image_paths: string[];
}

export enum AnnotationType {
  BBOX = "bounding_box",
  POLYGON_SEGMENTATION = "polygon_segmentation"
}

export interface AnnotationConfig {
  annotation_type: AnnotationType;
  labels: string[];
}

export interface Task {
  id: number;
  data: {
    image: string;
  };
  annotations?: Annotation[];
}

export interface Annotation {
  id?: string;
  [key: string]: unknown;
}

export interface CreateProjectRequest {
  project_name: string;
  bucket: string;
  prefix: string[];
  selected_images: string[];
  config: AnnotationConfig;
}

export interface CreateProjectResponse {
  job_id: string;
  project_id: number;
  task_count: number;
  tasks: Task[];
}

export interface SaveAnnotationRequest {
  project_name: string;
  task_id: number;
  project_id: number;
  result: unknown;
  labels: string[];
}

export interface SaveAnnotationResponse {
  status: string;
  annotation_path?: string;
  num_annotations?: number;
}

export interface Job {
  id: string;
  name: string;
  ls_project_id: number;
  image_paths?: string[];
  annotation_path?: string[];
  created_at: string;
}

export interface GetJobResponse {
  job_id: string;
  name: string;
  project_id: number;
  tasks: Task[];
}

export interface TrainingConfig {
  epochs?: number;
  imgsz?: number;
  save?: boolean;
  save_period?: number;
  plots?: boolean;
  batch?: number;
  project_name: string;
  val_ratio?: number;
  version?: 'n' | 's' | 'm' | 'l' | 'x';
}

export interface AddImagesRequest extends Array<string> {}

export interface AddImagesResponse {
  message: string;
  count: number;
  task_ids?: number[];
}

export interface TrainingJob {
  id: string;
  name: string;
  version: number;
  status: string;
  mAP50: number | null;
  mAP50_95: number | null;
  precision: number | null;
  recall: number | null;
  created_at: string;
}

export const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:     { bg: '#2a2a2a', color: '#858585', label: 'Pending' },
  in_progress: { bg: '#2a2010', color: '#d4a017', label: 'Preparing' },
  training:    { bg: '#101a2a', color: '#569cd6', label: 'Training' },
  completed:   { bg: '#0d2010', color: '#4ec9b0', label: 'Completed' },
};

export interface ArtifactItem {
  name: string;
  media_type: string;
}

export interface TrainingMetricsResponse {
  training_jobs: TrainingJob[];
}

export interface ArtifactsResponse {
  artifacts: ArtifactItem[];
}
