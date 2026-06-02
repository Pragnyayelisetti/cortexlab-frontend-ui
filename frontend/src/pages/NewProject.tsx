import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as annotationApi from '../api/annotation';
import type { BladeImageData } from '../types';
import { AnnotationType } from '../types';
import VirtualList from '../components/VirtualList';

const BUCKETS = ['images', 'tray', 'ocr'];
const VIEWS = [
  'concave_side',
  'convex_side',
  'peripheral',
  'root',
  'leading_edge',
  'trailing_edge',
];
const IMAGE_BASE_URL = 'http://localhost:9002/compressed';
const TRAY_IMAGE_BASE_URL = 'http://localhost:9002/tray';
const ITEMS_PER_PAGE = 50;

const getImageBaseUrl = (bucket: string): string => {
  return bucket === 'tray' ? TRAY_IMAGE_BASE_URL : IMAGE_BASE_URL;
};

interface SelectedImages {
  [bladeId: string]: Set<string>;
}

export default function NewProject() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [projectName, setProjectName] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('images');
  const [annotationType, setAnnotationType] = useState<AnnotationType>(AnnotationType.POLYGON_SEGMENTATION);
  const [labels, setLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState('');

  // Part numbers
  const [partNumbers, setPartNumbers] = useState<string[]>([]);
  const [selectedPartNumbers, setSelectedPartNumbers] = useState<string[]>([]);
  const [partNumberSearch, setPartNumberSearch] = useState('');

  // Blade IDs
  const [bladeIds, setBladeIds] = useState<string[]>([]);
  const [selectedBladeIds, setSelectedBladeIds] = useState<string[]>([]);
  const [bladeIdSearch, setBladeIdSearch] = useState('');

  // Blade images
  const [bladeImagesData, setBladeImagesData] = useState<BladeImageData[]>([]);

  // Tray images
  const [trayImages, setTrayImages] = useState<string[]>([]);

  const [selectedImages, setSelectedImages] = useState<SelectedImages>({});
  const [visibleViews, setVisibleViews] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtered lists with search
  const filteredPartNumbers = useMemo(() => {
    return partNumbers.filter((pn) =>
      pn.toLowerCase().includes(partNumberSearch.toLowerCase())
    );
  }, [partNumbers, partNumberSearch]);

  const filteredBladeIds = useMemo(() => {
    return bladeIds.filter((bid) =>
      bid.toLowerCase().includes(bladeIdSearch.toLowerCase())
    );
  }, [bladeIds, bladeIdSearch]);

  useEffect(() => {
    if (selectedBucket === 'images' || selectedBucket === 'tray') {
      loadPartNumbers();
    }
  }, [selectedBucket]);

  const loadPartNumbers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await annotationApi.listPartNumbers();
      setPartNumbers(res.part_numbers || []);
      setSelectedPartNumbers([]);
      setPartNumberSearch('');
      setSelectedBladeIds([]);
      setBladeIds([]);
      setBladeImagesData([]);
      setTrayImages([]);
      setSelectedImages({});
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPartNumber = useCallback(
    (partNumber: string, checked: boolean) => {
      let newParts: string[] = [];
      if (checked) {
        newParts = [partNumber];
      }
      setSelectedPartNumbers(newParts);
      setSelectedBladeIds([]);
      setBladeImagesData([]);
      setSelectedImages({});

      if (newParts.length > 0) {
        loadBladeIds(partNumber);
      } else {
        setBladeIds([]);
      }
    },
    []
  );

  const selectAllPartNumbers = useCallback(() => {
    setSelectedPartNumbers(filteredPartNumbers);
  }, [filteredPartNumbers]);

  const clearAllPartNumbers = useCallback(() => {
    setSelectedPartNumbers([]);
  }, []);

  const loadBladeIds = async (partNumber: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await annotationApi.listBladeIds(partNumber);
      setBladeIds(res.blade_ids || []);
      setSelectedBladeIds([]);
      setBladeIdSearch('');
      setBladeImagesData([]);
      setSelectedImages({});
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBladeId = useCallback(
    (bladeId: string, checked: boolean) => {
      setSelectedBladeIds((prev) => {
        let newBladeIds = [...prev];
        if (checked) {
          if (!newBladeIds.includes(bladeId)) newBladeIds.push(bladeId);
        } else {
          newBladeIds = newBladeIds.filter((id) => id !== bladeId);
        }
        return newBladeIds;
      });
      setBladeImagesData([]);
      setSelectedImages({});
    },
    []
  );

  const selectAllBladeIds = useCallback(() => {
    setSelectedBladeIds(filteredBladeIds);
  }, [filteredBladeIds]);

  const clearAllBladeIds = useCallback(() => {
    setSelectedBladeIds([]);
  }, []);

  const handleLoadBladeImages = async () => {
    if (selectedPartNumbers.length === 0 || selectedBladeIds.length === 0) return;

    setLoading(true);
    setError('');
    try {
      const res = await annotationApi.getBladeImages({
        part_number: selectedPartNumbers[0],
        blade_ids: selectedBladeIds,
      });

      setBladeImagesData(res.image_paths || []);
      const newSelected: SelectedImages = {};
      (res.image_paths || []).forEach((data) => {
        newSelected[data.blade_id] = new Set();
      });
      setSelectedImages(newSelected);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTrayImages = async (partNumber: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await annotationApi.getTrayImages({
        bucket: 'tray',
        part_number: partNumber,
      });

      setTrayImages(res.tray_image_paths || []);
      const newSelected: SelectedImages = {
        tray: new Set(),
      };
      setSelectedImages(newSelected);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const toggleImage = useCallback(
    (bladeId: string, imagePath: string) => {
      setSelectedImages((prev) => {
        const newSel = { ...prev };
        if (!newSel[bladeId]) newSel[bladeId] = new Set();
        const set = new Set(newSel[bladeId]);
        if (set.has(imagePath)) {
          set.delete(imagePath);
        } else {
          set.add(imagePath);
        }
        newSel[bladeId] = set;
        return newSel;
      });
    },
    []
  );

  const toggleViewAll = useCallback(
    (bladeId: string, view: string) => {
      const bladeData = bladeImagesData.find((b) => b.blade_id === bladeId);
      if (!bladeData) return;

      const viewImages = bladeData.image_paths.filter((p) => p.includes(`/${view}/`));
      setSelectedImages((prev) => {
        const newSel = { ...prev };
        if (!newSel[bladeId]) newSel[bladeId] = new Set();
        const set = new Set(newSel[bladeId]);

        const allSelected = viewImages.length > 0 && viewImages.every((p) => set.has(p));

        if (allSelected) {
          viewImages.forEach((p) => set.delete(p));
        } else {
          viewImages.forEach((p) => set.add(p));
        }
        newSel[bladeId] = set;
        return newSel;
      });
    },
    [bladeImagesData]
  );

  const selectAllImages = useCallback(() => {
    setSelectedImages((prev) => {
      const newSel = { ...prev };
      if (selectedBucket === 'tray') {
        const set = new Set<string>();
        trayImages.forEach((path) => set.add(path));
        newSel['tray'] = set;
      } else {
        bladeImagesData.forEach((data) => {
          const set = new Set<string>();
          data.image_paths.forEach((path) => set.add(path));
          newSel[data.blade_id] = set;
        });
      }
      return newSel;
    });
  }, [bladeImagesData, trayImages, selectedBucket]);

  const clearAllImages = useCallback(() => {
    setSelectedImages((prev) => {
      const newSel = { ...prev };
      if (selectedBucket === 'tray') {
        newSel['tray'] = new Set();
      } else {
        bladeImagesData.forEach((data) => {
          newSel[data.blade_id] = new Set();
        });
      }
      return newSel;
    });
  }, [bladeImagesData, selectedBucket]);

  const getSelectedImageUrls = (): string[] => {
    const urls: string[] = [];
    const baseUrl = getImageBaseUrl(selectedBucket);
    if (selectedBucket === 'tray') {
      selectedImages['tray']?.forEach((path) => {
        urls.push(`${baseUrl}/${path}`);
      });
    } else {
      Object.keys(selectedImages).forEach((bladeId) => {
        selectedImages[bladeId].forEach((path) => {
          urls.push(`${baseUrl}/${path}`);
        });
      });
    }
    return urls;
  };

  const getTotalImageCount = (): number => {
    return Object.values(selectedImages).reduce((sum, set) => sum + set.size, 0);
  };

  const toggleView = useCallback((view: string) => {
    setVisibleViews((prev) => {
      const newViews = new Set(prev);
      if (newViews.has(view)) {
        newViews.delete(view);
      } else {
        newViews.add(view);
      }
      return newViews;
    });
  }, []);

  const selectAllViews = useCallback(() => {
    setVisibleViews(new Set(VIEWS));
  }, []);

  const clearAllViews = useCallback(() => {
    setVisibleViews(new Set());
  }, []);

  const canStart = (): boolean => {
    const hasName = projectName.trim().length > 0;
    const hasImages = getTotalImageCount() > 0;
    const hasLabels = labels.length > 0;
    if (projectId) return hasImages;
    return hasName && hasImages && hasLabels;
  };

  const addLabel = useCallback(() => {
    const trimmed = labelInput.trim();
    if (trimmed && !labels.includes(trimmed)) {
      setLabels((prev) => [...prev, trimmed]);
      setLabelInput('');
    }
  }, [labelInput, labels]);

  const removeLabel = useCallback((label: string) => {
    setLabels((prev) => prev.filter((l) => l !== label));
  }, []);

  const handleStartProject = async () => {
    setLoading(true);
    setError('');
    try {
      const selectedUrls = getSelectedImageUrls();
      const prefixToUse = selectedBucket === 'tray' ? selectedPartNumbers : selectedBladeIds;
      if (projectId) {
        await annotationApi.addImages(parseInt(projectId), selectedUrls);
        navigate(`/projects/${projectId}/annotate`);
      } else {
        const res = await annotationApi.createProject({
          project_name: projectName,
          bucket: selectedBucket,
          prefix: prefixToUse,
          selected_images: selectedUrls,
          config: {
            annotation_type: annotationType,
            labels,
          },
        });
        navigate(`/projects/${res.project_id}/annotate`);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const showBladeImages = bladeImagesData.length > 0;
  const showTrayImages = trayImages.length > 0;

  return (
    <div className="new-project-page">
      <div className="project-sidebar">
        <div className="sidebar-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ←
          </button>
          <div>
            <span className="sidebar-title">
              {projectId ? 'Add Images' : 'New Project'}
            </span>

            <div className="page-header-subtitle">
              Create and configure your annotation workflow
            </div>
          </div>
        </div>
        <div className="project-progress">
          <div className={`progress-item ${projectName ? 'done' : 'active'}`}>
            {projectName ? '✓' : '1'} Project Setup
          </div>

          <div className={`progress-item ${selectedPartNumbers.length > 0 ? 'done' : ''}`}>
            {selectedPartNumbers.length > 0 ? '✓' : '2'} Dataset Selection
          </div>

          <div className={`progress-item ${getTotalImageCount() > 0 ? 'done' : ''}`}>
            {getTotalImageCount() > 0 ? '✓' : '3'} Images Selection
          </div>
        </div>
        <div className="sidebar-body">
          {!projectId && (
            <div className="field">
              <label className="field-label">
                Project Name
                  <span style={{ color: '#888', fontSize: '12px', marginLeft: '6px' }}>
                    (Required)
                  </span>
              </label>
              <input
                type="text"
                placeholder="e.g. blade-defects-v1"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label className="field-label">Data Source</label>
            <div className="bucket-selector">
              {BUCKETS.map((bucket) => (
                <button
                  key={bucket}
                  className={`bucket-btn ${selectedBucket === bucket ? 'active' : ''}`}
                  onClick={() => setSelectedBucket(bucket)}
                >
                  {bucket=== 'images'
                    ? '🖼 Images'
                    : bucket === 'tray'
                    ? '📦 Tray'
                    : '📄 OCR'}
                </button>
              ))}
            </div>
          </div>

          {!projectId && (
            <>
              <div className="field">
                <label className="field-label">
                  Annotation Type
                </label>

                <div className="annotation-type-selector">
                  <button
                    className={`type-btn ${annotationType === AnnotationType.BBOX ? 'active' : ''}`}
                    onClick={() => setAnnotationType(AnnotationType.BBOX)}
                  >
                    Bounding Box
                  </button>
                  <button
                    className={`type-btn ${annotationType === AnnotationType.POLYGON_SEGMENTATION ? 'active' : ''}`}
                    onClick={() => setAnnotationType(AnnotationType.POLYGON_SEGMENTATION)}
                  >
                    Polygon
                  </button>
                </div>
              </div>

              <div className="field">
                <label className="field-label">Labels</label>
                <div className="label-input-group">
                  <input
                    type="text"
                    placeholder="Enter label name"
                    value={labelInput}
                    onChange={(e) => setLabelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addLabel();
                      }
                    }}
                  />
                  <button className="add-label-btn" onClick={addLabel}>
                    Add
                  </button>
                </div>
                <div className="labels-list">
                  {labels.length === 0 ? (
                    <span className="empty-labels">Add at least one label (e.g. Crack, Dent, Scratch)</span>
                  ) : (
                    labels.map((label) => (
                      <div key={label} className="label-tag">
                        <span>{label}</span>
                        <button
                          className="remove-label-btn"
                          onClick={() => removeLabel(label)}
                          title="Remove label"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {error && <div className="msg error">
            Unable to connect to the server.
            Please try again later.
          </div>}

          {selectedBucket === 'images' && (
            <>
              {partNumbers.length > 0 && (
                <div className="selection-section">
                  <div className="step-header">
                    <span className="step-pill">
                      {selectedPartNumbers.length > 0 ? '✓' : '1'}
                    </span>
                    <span className="section-label">Part Numbers</span>
                  </div>

                  <VirtualList
                    items={filteredPartNumbers}
                    selectedItems={selectedPartNumbers}
                    onSelect={handleSelectPartNumber}
                    onSelectAll={selectAllPartNumbers}
                    onClearAll={clearAllPartNumbers}
                    itemHeight={35}
                    maxHeight={250}
                    showSearch={partNumbers.length > ITEMS_PER_PAGE}
                    searchValue={partNumberSearch}
                    onSearchChange={setPartNumberSearch}
                    selectedCount={selectedPartNumbers.length}
                    totalCount={filteredPartNumbers.length}
                  />
                </div>
              )}

              {bladeIds.length > 0 && (
                <div className="selection-section">
                  <div className="step-header">
                    <span className="step-pill">
                      {selectedBladeIds.length > 0 ? '✓' : '2'}
                    </span>
                    <span className="section-label">Blade IDs</span>
                  </div>

                  <VirtualList
                    items={filteredBladeIds}
                    selectedItems={selectedBladeIds}
                    onSelect={handleSelectBladeId}
                    onSelectAll={selectAllBladeIds}
                    onClearAll={clearAllBladeIds}
                    itemHeight={35}
                    maxHeight={250}
                    showSearch={bladeIds.length > ITEMS_PER_PAGE}
                    searchValue={bladeIdSearch}
                    onSearchChange={setBladeIdSearch}
                    selectedCount={selectedBladeIds.length}
                    totalCount={filteredBladeIds.length}
                  />
                </div>
              )}

              {selectedBladeIds.length > 0 && (
                <div className="selection-section">
                  <div className="step-header">
                    <span className="step-pill">{getTotalImageCount() > 0 ? '✓' : '3'}</span>
                    <span className="section-label">Select Images</span>
                  </div>
                  <button
                    className="load-btn"
                    onClick={handleLoadBladeImages}
                    disabled={loading}
                  >
                    {loading && <span className="spinner"></span>}
                    Load Blade Images
                  </button>
                </div>
              )}
            </>
          )}

          {selectedBucket === 'tray' && (
            <>
              {partNumbers.length > 0 && (
                <div className="selection-section">
                  <div className="step-header">
                    <span className="step-pill">
                      {selectedPartNumbers.length > 0 ? '✓' : '1'}
                    </span>
                    <span className="section-label">Part Numbers</span>
                  </div>

                  <VirtualList
                    items={filteredPartNumbers}
                    selectedItems={selectedPartNumbers}
                    onSelect={(partNumber, checked) => {
                      setSelectedPartNumbers(checked ? [partNumber] : []);
                      setTrayImages([]);
                      if (checked) {
                        handleLoadTrayImages(partNumber);
                      }
                    }}
                    onSelectAll={selectAllPartNumbers}
                    onClearAll={clearAllPartNumbers}
                    itemHeight={35}
                    maxHeight={250}
                    showSearch={partNumbers.length > ITEMS_PER_PAGE}
                    searchValue={partNumberSearch}
                    onSearchChange={setPartNumberSearch}
                    selectedCount={selectedPartNumbers.length}
                    totalCount={filteredPartNumbers.length}
                  />
                </div>
              )}
            </>
          )}

          {selectedBucket === 'ocr' && (
            <div className="placeholder-section">
              <span>OCR bucket workflow coming soon</span>
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          {error && <div className="msg error" style={{ marginBottom: '6px' }}>Unable to load data from the server.
            Please check your connection and try again.</div>}
          <button
            className="start-btn"
            disabled={!canStart() || loading}
            onClick={handleStartProject}
          >
            {loading && <span className="spinner"></span>}
            {projectId ? 'Add Images' : 'Start annotation job'}
          </button>
        </div>
      </div>

      <div className="project-main">
        {showBladeImages || showTrayImages ? (
          <div className="image-picker-container">
            <div className="picker-topbar">
              <span className="picker-title">Select images to annotate</span>
              <span className="picker-count">{getTotalImageCount()} selected</span>
              <button className="picker-btn" onClick={selectAllImages}>
                Select All
              </button>
              <button className="picker-btn secondary" onClick={clearAllImages}>
                Clear
              </button>
            </div>

            {selectedBucket === 'images' && (
              <div className="view-filter-bar">
                <span className="filter-label">Show sides:</span>
                <div className="view-filter-buttons">
                  {VIEWS.map((view) => (
                    <button
                      key={view}
                      className={`view-filter-btn ${visibleViews.has(view) ? 'active' : ''}`}
                      onClick={() => toggleView(view)}
                      title={`Toggle ${view}`}
                    >
                      {view.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
                <button className="filter-btn-small" onClick={selectAllViews} title="Show all sides">
                  All
                </button>
                <button className="filter-btn-small" onClick={clearAllViews} title="Hide all sides">
                  None
                </button>
              </div>
            )}

            <div className="picker-content">
              {showBladeImages && (
                <>
                  {bladeImagesData.map((bladeData) => (
                    <div key={bladeData.blade_id} className="blade-section">
                      <div className="blade-header">
                        <span className="blade-title">
                          Blade ID: {bladeData.blade_id}
                        </span>
                        <span className="blade-data-id">{bladeData.blade_data_id}</span>
                      </div>

                      <div className="views-container">
                        {VIEWS.map((view) => {
                          if (!visibleViews.has(view)) return null;

                          const viewImages = bladeData.image_paths.filter((p) =>
                            p.includes(`/${view}/`)
                          );

                          if (viewImages.length === 0) return null;

                          const selectedSet = selectedImages[bladeData.blade_id] || new Set();
                          const allSelected =
                            viewImages.length > 0 &&
                            viewImages.every((p) => selectedSet.has(p));
                          const partialSelected =
                            viewImages.some((p) => selectedSet.has(p)) && !allSelected;

                          return (
                            <div key={view} className="view-group">
                              <div className="view-header">
                                <div
                                  className={`view-toggle ${
                                    allSelected ? 'all-selected' : partialSelected ? 'partial' : ''
                                  }`}
                                  onClick={() => toggleViewAll(bladeData.blade_id, view)}
                                >
                                  <div className="checkbox-mark">
                                    {allSelected ? '✓' : partialSelected ? '–' : ''}
                                  </div>
                                  <span className="view-name">{view}</span>
                                </div>
                                <span className="view-count">{viewImages.length}</span>
                              </div>

                              <div className="image-gallery">
                                {viewImages.map((imagePath) => {
                                  const fileName = imagePath.split('/').pop() || imagePath;
                                  const isSelected =
                                    selectedImages[bladeData.blade_id]?.has(imagePath) || false;

                                  return (
                                    <div
                                      key={imagePath}
                                      className={`image-tile ${isSelected ? 'selected' : ''}`}
                                      onClick={() => toggleImage(bladeData.blade_id, imagePath)}
                                    >
                                      <div className="image-placeholder"></div>
                                      <img
                                        src={`${getImageBaseUrl(selectedBucket)}/${imagePath}`}
                                        alt={fileName}
                                        className="image-preview loading"
                                        loading="lazy"
                                        onLoad={(e) => {
                                          (e.target as HTMLImageElement).classList.remove('loading');
                                          (e.target as HTMLImageElement).classList.add('loaded');
                                        }}
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                      <div className="image-label">{fileName}</div>
                                      {isSelected && <div className="selection-check">✓</div>}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {showTrayImages && (
                <div className="tray-section">
                  <div className="tray-header">
                    <span className="tray-title">Tray Images</span>
                    <span className="tray-count">{trayImages.length} images</span>
                  </div>

                  <div className="image-gallery">
                    {trayImages.map((imagePath) => {
                      const fileName = imagePath.split('/').pop() || imagePath;
                      const isSelected = selectedImages['tray']?.has(imagePath) || false;

                      return (
                        <div
                          key={imagePath}
                          className={`image-tile ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleImage('tray', imagePath)}
                        >
                          <div className="image-placeholder"></div>
                          <img
                            src={`${getImageBaseUrl(selectedBucket)}/${imagePath}`}
                            alt={fileName}
                            className="image-preview loading"
                            loading="lazy"
                            onLoad={(e) => {
                              (e.target as HTMLImageElement).classList.remove('loading');
                              (e.target as HTMLImageElement).classList.add('loaded');
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div className="image-label">{fileName}</div>
                          {isSelected && <div className="selection-check">✓</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
        ) : (
          <>
            <div className="stats-grid">

              <div className="stat-card">
                <h2 style={{ color: '#2563eb' }}>
                  {selectedPartNumbers.length}
                </h2>
                <p>📁 Selected Parts</p>
              </div>

              <div className="stat-card">
                <h2 style={{ color: '#16a34a' }}>
                  {getTotalImageCount()}
                </h2>
                <p>🖼 Selected Images</p>
              </div>

              <div className="stat-card">
                <h2 style={{ color: '#9333ea' }}>
                  {labels.length}
                </h2>
                <p>🏷 Labels Added</p>
              </div>
            </div>
          
          <div className="empty-state">
            <div className="empty-icon">📁</div>

            <h3>Dataset Setup</h3>

            <p>
              {selectedBucket === 'images'
              ? selectedPartNumbers.length === 0
              ? 'Select a Part Number to begin'
              : selectedBladeIds.length === 0
              ? 'Select one or more Blade IDs'
              : 'Click "Load Blade Images" to browse available images'
              : selectedBucket === 'tray'
              ? selectedPartNumbers.length === 0
              ? 'Select a Part Number to load tray images'
              : 'Loading tray images...'
              : 'OCR workflow is coming soon'}
            </p>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
