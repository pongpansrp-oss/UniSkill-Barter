import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './index.css';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';
import ExplorePage from './pages/ExplorePage/ExplorePage';
import LoginPage from './pages/LoginPage/LoginPage';
import CreateProfilePage from './pages/CreateProfilePage/CreateProfilePage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import CreditPage from './pages/CreditPage/CreditPage';
import SearchResultsPage from './pages/SearchResultsPage/SearchResultsPage';
import CreateRequestPage from './pages/CreateRequestPage/CreateRequestPage';
import StudentProfileDetailsPage from './pages/StudentProfileDetailsPage/StudentProfileDetailsPage';
import MatchEnginePage from './pages/MatchEnginePage/MatchEnginePage';

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { currentUser, isGuest, isLoading } = useDatabase();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!currentUser && !isGuest) {
    return (
      <Navigate
        to="/"
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    );
  }

  return children;
};

function App() {
  return (
    <DatabaseProvider>
      <div className="app">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/create-profile" element={<CreateProfilePage />} />
          <Route
            path="/explore"
            element={
              <RequireAuth>
                <ExplorePage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/credit"
            element={
              <RequireAuth>
                <CreditPage />
              </RequireAuth>
            }
          />
          <Route
            path="/search"
            element={
              <RequireAuth>
                <SearchResultsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/create-request"
            element={
              <RequireAuth>
                <CreateRequestPage />
              </RequireAuth>
            }
          />
          <Route
            path="/request"
            element={
              <RequireAuth>
                <CreateRequestPage />
              </RequireAuth>
            }
          />
          <Route
            path="/student/:id"
            element={
              <RequireAuth>
                <StudentProfileDetailsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/match"
            element={
              <RequireAuth>
                <MatchEnginePage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth>
                <MatchEnginePage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </DatabaseProvider>
  );
}

export default App;
