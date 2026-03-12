import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DisplayNameModal from '@/components/DisplayNameModal';

const DisplayNameGate = () => {
  const { user, needsDisplayName, setDisplayName } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Only show if authenticated, needs a name, and hasn't dismissed
  if (!user || !needsDisplayName || dismissed) return null;

  return (
    <DisplayNameModal
      open={true}
      userId={user.id}
      onComplete={(name) => setDisplayName(name)}
      onClose={() => setDismissed(true)}
    />
  );
};

export default DisplayNameGate;
