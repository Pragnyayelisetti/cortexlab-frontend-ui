import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import NewProject from './pages/NewProject';
import Projects from './pages/Projects';
import Annotate from './pages/Annotate';
import Train from './pages/Train';
import TrainingLogs from './pages/TrainingLogs';
import TrainingMetrics from './pages/TrainingMetrics';
import Layout from './layouts/Layout';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/new" element={<NewProject />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId/annotate" element={<Annotate />} />
          <Route path="/train" element={<Train />} />
          <Route path="/train/logs/:projectName" element={<TrainingLogs />} />
          <Route path="/train/metrics" element={<TrainingMetrics />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
