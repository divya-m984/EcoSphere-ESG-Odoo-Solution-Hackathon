import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginLayout    from '@/layouts/LoginLayout';
import MainLayout     from '@/layouts/MainLayout';
import ProtectedLayout from '@/layouts/ProtectedLayout';

import Login          from '@/pages/Login';
import Dashboard      from '@/pages/Dashboard';
import Environmental  from '@/pages/Environmental';
import Social         from '@/pages/Social';
import Governance     from '@/pages/Governance';
import Gamification   from '@/pages/Gamification';
import Challenges     from '@/pages/Challenges';
import ChallengeForm  from '@/pages/ChallengeForm';
import Tasks          from '@/pages/Tasks';
import TaskForm       from '@/pages/TaskForm';
import Badges         from '@/pages/Badges';
import Teams          from '@/pages/Teams';
import Reports        from '@/pages/Reports';
import Administration from '@/pages/Administration';
import Profile        from '@/pages/Profile';
import Settings       from '@/pages/Settings';
import NotFound       from '@/pages/NotFound';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route element={<LoginLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Protected — auth check then shared layout */}
        <Route element={<ProtectedLayout />}>
          <Route element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"      element={<Dashboard />} />
            <Route path="/environmental"  element={<Environmental />} />
            <Route path="/social"         element={<Social />} />
            <Route path="/governance"     element={<Governance />} />
            <Route path="/gamification"   element={<Gamification />} />
            
            {/* Gamification Sub-Routes */}
            <Route path="/gamification/challenges"      element={<Challenges />} />
            <Route path="/gamification/challenges/new"  element={<ChallengeForm />} />
            <Route path="/gamification/challenges/:id"  element={<ChallengeForm />} />
            <Route path="/gamification/tasks"           element={<Tasks />} />
            <Route path="/gamification/tasks/new"       element={<TaskForm />} />
            <Route path="/gamification/tasks/:id"       element={<TaskForm />} />
            <Route path="/gamification/badges"          element={<Badges />} />
            <Route path="/gamification/teams"           element={<Teams />} />

            <Route path="/reports"        element={<Reports />} />
            <Route path="/administration" element={<Administration />} />
            <Route path="/profile"        element={<Profile />} />
            <Route path="/settings"       element={<Settings />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
