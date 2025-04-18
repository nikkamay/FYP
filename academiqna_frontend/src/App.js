import '@fortawesome/fontawesome-free/css/all.min.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Login from './features/Login/login'; 
import Home from './features/Home/home'; // Import Homepage
import DiscBoard from './features/DiscussionBoard/discboard';
import DiscBoardInfo from './features/DiscussionBoard/DiscBoardInfo';
import JoinedBoards from './features/JoinedBoard/JoinedBoards';
import AuthRoute from './features/AuthRoute';
import SummaryPage from './features/Summary/summarypage';
import ModerationPage from './features/Moderation/moderationpage';







// Setting up routing 
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Login page route */}
        <Route path="/login" element={<Login />} />

        
        {/* Home page route */}
        <Route path="/home" element={<AuthRoute><Home/></AuthRoute>} />
        <Route path="/discussion-boards" element={<AuthRoute><DiscBoard /></AuthRoute>} />
        <Route path="/discussion-board-info/:boardId" element={<AuthRoute><DiscBoardInfo /></AuthRoute>} />
        <Route path="/joined-boards" element={<AuthRoute><JoinedBoards /></AuthRoute>} />
        <Route path="/summary" element={<AuthRoute><SummaryPage /></AuthRoute>} />
        <Route path="/moderation/:boardId" element={<AuthRoute><ModerationPage /></AuthRoute>} />
        
      </Routes>
    </Router>
  );
}
export default App; // Ensure proper default export
