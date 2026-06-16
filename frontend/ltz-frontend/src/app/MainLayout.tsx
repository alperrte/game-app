import { Outlet } from "react-router-dom";

export function MainLayout() {
  return (
    <div className="min-h-screen bg-ltz-bg text-white">
      <Outlet />
    </div>
  );
}
