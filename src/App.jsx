import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ProductionDetail from './pages/ProductionDetail';
import Placeholder from './pages/Placeholder';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/title/:slug" element={<ProductionDetail />} />
        <Route path="/series" element={<Placeholder title="Series" />} />
        <Route path="/movies" element={<Placeholder title="Movies" />} />
        <Route path="/community" element={<Placeholder title="Community" />} />
        <Route path="/community/theories" element={<Placeholder title="Theories" />} />
        <Route path="/community/discussion" element={<Placeholder title="Discussion" />} />
        <Route path="/community/reactions" element={<Placeholder title="Episode Reactions" />} />
        <Route path="/blog" element={<Placeholder title="Blog / News" />} />
        <Route path="/coming-soon" element={<Placeholder title="Coming Soon" />} />
        <Route path="/shop" element={<Placeholder title="Shop" />} />
        <Route path="/account" element={<Placeholder title="Account" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
