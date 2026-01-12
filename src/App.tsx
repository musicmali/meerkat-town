import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import MintAgent from './pages/MintAgent';
import MyAgents from './pages/MyAgents';
import './index.css';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/chat/:agentId" element={<Chat />} />
                <Route path="/mint-agent" element={<MintAgent />} />
                <Route path="/my-agents" element={<MyAgents />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

