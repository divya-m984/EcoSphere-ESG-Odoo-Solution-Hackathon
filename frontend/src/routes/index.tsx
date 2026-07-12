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
