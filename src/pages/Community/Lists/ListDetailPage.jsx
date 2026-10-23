import { ListDetail } from '../../Account/ListDetail/ListDetail';
import { RequireSession } from '../RequireSession/RequireSession';

// /community/lists/:id — ListDetail id'yi useParams'tan okur (wildcard değil,
// sıradan route). "Listelerime dön" Community'deki liste sayfasına gider.
export default function ListDetailPage() {
  return (
    <RequireSession>
      <ListDetail backTo="/community/lists" embedded />
    </RequireSession>
  );
}
