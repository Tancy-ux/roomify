import React, {useEffect, useRef, useState} from 'react'
import {useLocation, useNavigate, useOutletContext, useParams} from "react-router";
import {generate3DView} from "../../lib/ai.action";
import {Box, Download, RefreshCcw, Share2, X} from "lucide-react";
import Button from "../../components/ui/Button";
import {createProject, getProjectById} from "../../lib/puter.action";
import {ReactCompareSlider, ReactCompareSliderImage} from "react-compare-slider";

const VisualiserId = () => {
  const {id} = useParams();
  const navigate = useNavigate();
  const {userId} = useOutletContext<AuthContext>();

  const hasInitialGenerated = useRef(false);

  const [project, setProject] = useState<DesignItem | null>(null);
  const [isProjectLoading, setIsProjectLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);

  const handleBack = () => navigate('/')

  const handleExport = () => {
    if (!currentImage) return;

    const link = document.createElement("a");
    link.href = currentImage;
    link.download = `roomify-render-${id || 'export'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const runGeneration = async (item: DesignItem) => {
    if (!id || !item.sourceImage) return;
    try {
      setIsProcessing(true);
      const result = await generate3DView({sourceImage: item.sourceImage});
      if (result.renderedImage) {
        setCurrentImage(result.renderedImage);
        const updatedItem = {
          ...item,
          renderedImage: result.renderedImage,
          renderedPath: result.renderedPath,
          timestamp: Date.now(),
          ownerId: item.ownerId ?? userId ?? null,
          isPublic: item.isPublic ?? false,
        };
        const saved = await createProject({item: updatedItem, visibility: "private"});
        if (!saved) {
          alert("Failed to save project");
          return false;
        }
        setProject(saved);
        setCurrentImage(saved.renderedImage || result.renderedImage);
        return true;
      }
    } catch (e) {
      console.error(`Failed to run generation: ${e}`);
    } finally {
      setIsProcessing(false);
    }
  }
  useEffect(() => {
    let isMounted = true;

    const loadProject = async () => {
      if (!id) {
        setIsProjectLoading(false);
        return;
      }

      setIsProjectLoading(true);

      const fetchedProject = await getProjectById({id});

      if (!isMounted) return;

      if (!fetchedProject) {
        setLoadError("Project not found or failed to load.");
        setIsProjectLoading(false);
        return;
      }

      setProject(fetchedProject);
      setCurrentImage(fetchedProject?.renderedImage || null);
      setIsProjectLoading(false);
      hasInitialGenerated.current = false;
    };

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (
      isProjectLoading ||
      hasInitialGenerated.current ||
      !project?.sourceImage
    )
      return;

    if (project.renderedImage) {
      setCurrentImage(project.renderedImage);
      hasInitialGenerated.current = true;
      return;
    }

    hasInitialGenerated.current = true;
    void runGeneration(project);
  }, [project, isProjectLoading]);


  if (loadError) {
    return (
      <div className="visualizer flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-xl font-semibold mb-4">{loadError}</h2>
        <Button onClick={handleBack}>
          Back
        </Button>
      </div>
    );
  }

  // @ts-ignore
  return (
    <div className="visualizer">
      <nav className="topbar">
        <div className="brand">
          <Box className="logo"/>
          <span className="name">Roomify</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleBack} className="exit">
          <X className="icon"/> Exit Editor
        </Button>
      </nav>

      <section className="content">
        <div className="panel">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Project</p>
              <h2>{project?.name || `Residence ${id}`}</h2>
              <p className="note">Created by You</p>
            </div>
            <div className="panel-actions">
              <Button size="sm" className="export" disabled={!currentImage} onClick={handleExport}>
                <Download className="size-4 mr-2"/> Export
              </Button>
              <Button size="sm" className="share" onClick={() => {
              }}>
                <Share2 className="size-4 mr-2"/> Share
              </Button>
            </div>
          </div>
          <div className={`render-area ${isProcessing ? 'is-processing' : ''}`}>
            {currentImage ? (
              <img src={currentImage} alt="AI render" className="render-img"/>
            ) : (
              <div className="render-placeholder">
                {project?.sourceImage && (
                  <img src={project?.sourceImage} alt="original" className="render-fallback"/>
                )}
                {isProcessing && (
                  <div className="render-overlay">
                    <div className="rendering-card">
                      <RefreshCcw className="spinner"/>
                      <span className="title">Rendering...</span>
                      <span className="subtitle">Generating your 3D visualisation</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="panel compare">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Comparisons</p>
              <h3>Before and After</h3>
            </div>
            <div className="hint">Drag to compare</div>
          </div>
          <div className="compare-stage">
            {project?.sourceImage && currentImage ? (
              <ReactCompareSlider defaultValue={50} style={{width: '100%', height: 'auto'}} itemOne={
                <ReactCompareSliderImage src={project?.sourceImage} alt="before" className="compare-img"/>
              } itemTwo={
                <ReactCompareSliderImage src={currentImage || project?.renderedImage} alt="after"
                                         className="compare-img"/>
              }/>
            ) : (
              <div className="compare-fallback">
                {project?.sourceImage && (
                  <img src={project.sourceImage} alt="before" className="compare-img"/>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
export default VisualiserId
