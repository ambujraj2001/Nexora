import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../pages/dashboard/Sidebar';

const DashboardLayout = () => {
  // Collapse by default if screen width is less than 1024px (standard desktop break)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
      {/* Sidebar - Mounted once for all dashboard sub-routes */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((p) => !p)} />

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        <Outlet context={{ sidebarCollapsed, setSidebarCollapsed }} />
      </main>
    </div>
  );
};

export default DashboardLayout;
