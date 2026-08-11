import { Navigate } from 'react-router-dom';
import { getStoredAuth } from '../../shared/api/authStorage';

// v1: sadece "token var mı" kontrolü — rol bazlı kısıtlama (EDITOR/
// MODERATOR/ADMIN) backend'in JWT'ye rol claim'i eklemesi beklenene kadar
// ertelendi (bkz. docs/plans/2026-08-09-blog-editor-drag-drop-design.md
// "Açık noktalar").
export function RequireAuth({ children }) {
  const auth = getStoredAuth();
  if (!auth?.token) return <Navigate to="/admin/login" replace />;
  return children;
}
