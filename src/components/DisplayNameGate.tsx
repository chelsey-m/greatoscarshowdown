import { useAuth } from '@/contexts/AuthContext';
import DisplayNameModal from '@/components/DisplayNameModal';

const DisplayNameGate = () => {
  const { user, needsDisplayName, setDisplayName } = useAuth();

  if (!user || !needsDisplayName) return null;

  return (
    <DisplayNameModal
      open={true}
      userId={user.id}
      onComplete={(name) => setDisplayName(name)}
    />
  );
};

export default DisplayNameGate;
