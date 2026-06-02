import { useEffect, useRef } from 'react';
import { LS_BASE } from '../env';
import type { Task } from '../types';

declare global {
  function LabelStudio(
    containerId: string,
    config: {
      config: string;
      interfaces: string[];
      user: { pk: number; firstName: string };
      task: {
        id: number;
        data: { image: string };
        annotations: unknown[];
        predictions: unknown[];
      };
      onLabelStudioLoad?: (instance: LabelStudioInstance) => void;
    }
  ): LabelStudioInstance;
}

interface LabelStudioInstance {
  destroy: () => void;
  store: {
    annotationStore: {
      addAnnotation: (opts: { userGenerate: boolean }) => { id: string };
      selectAnnotation: (id: string) => void;
      selected?: AnnotationObject;
      selectedAnnotation?: AnnotationObject;
    };
  };
}

interface AnnotationObject {
  serializeAnnotation: () => unknown;
}

export function useLabelStudio(
  containerId: string,
  task: Task,
  labelConfig?: string,
  _onSubmit?: () => void
): void {
  const instanceRef = useRef<LabelStudioInstance | null>(null);

  useEffect(() => {
    console.log('useLabelStudio hook called for task:', task.id);

    let imageUrl = task.data.image;
    if (imageUrl.startsWith('/tasks/')) {
      imageUrl = LS_BASE + imageUrl;
    }

    if (instanceRef.current) {
      try {
        instanceRef.current.destroy();
      } catch (e) {
        console.error('Error destroying LS instance:', e);
      }
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.warn('Container not found:', containerId, '- retrying...');
      const timeout = setTimeout(() => {
        const retryContainer = document.getElementById(containerId);
        if (retryContainer) {
          retryContainer.innerHTML = '';
          initializeLabelStudio(imageUrl, labelConfig, task);
        }
      }, 100);
      return () => clearTimeout(timeout);
    }

    container.innerHTML = '';
    initializeLabelStudio(imageUrl, labelConfig, task);
  }, [task.id, task.data.image, containerId, task.annotations, labelConfig]);

  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        try {
          instanceRef.current.destroy();
        } catch (e) {
          console.error('Error destroying LS instance on cleanup:', e);
        }
        instanceRef.current = null;
      }
    };
  }, []);

  const initializeLabelStudio = (
    imageUrl: string,
    config: string | undefined,
    currentTask: Task
  ) => {
    const LS = (window as any).LabelStudio;
    console.log('LabelStudio SDK available:', !!LS);

    if (typeof LS === 'undefined' || LS === null) {
      console.error('LabelStudio SDK not loaded. Window.LabelStudio:', (window as any).LabelStudio);
      return;
    }

    console.log('Creating LabelStudio instance...');
    try {
      instanceRef.current = new LS(containerId, {
        config: config,
        interfaces: ['panel', 'side-column', 'annotations:menu', 'controls'],
        user: { pk: 1, firstName: 'Annotator' },
        task: {
          id: currentTask.id,
          data: { image: imageUrl },
          annotations: currentTask.annotations && currentTask.annotations.length ? currentTask.annotations : [],
          predictions: [],
        },
        onLabelStudioLoad: (lsApp: any) => {
          console.log('onLabelStudioLoad called, lsApp:', lsApp);
          try {
            (window as any)._labelStudioApp = lsApp;
            console.log('Stored _labelStudioApp globally');

            if (!currentTask.annotations || !currentTask.annotations.length) {
              const annotationStore = lsApp.store?.annotationStore || lsApp.annotationStore;
              if (annotationStore) {
                const c = annotationStore.addAnnotation({ userGenerate: true });
                annotationStore.selectAnnotation(c.id);
              }
            }
            window.dispatchEvent(new Event('resize'));
          } catch (e) {
            console.error('Error in onLabelStudioLoad:', e);
          }
        },
      });

      console.log('LabelStudio instance created:', instanceRef.current);
      (window as any)._labelStudioApp = instanceRef.current;
    } catch (e) {
      console.error('Error creating LabelStudio instance:', e);
    }
  };
}

export function getLabelStudioInstance(): LabelStudioInstance | null {
  const container = document.getElementById('ls-container');
  if (!container) return null;

  const inst = (window as unknown as { _lsInstance?: LabelStudioInstance })._lsInstance;
  return inst || null;
}

export function setLabelStudioInstance(inst: LabelStudioInstance): void {
  (window as unknown as { _lsInstance?: LabelStudioInstance })._lsInstance = inst;
}
