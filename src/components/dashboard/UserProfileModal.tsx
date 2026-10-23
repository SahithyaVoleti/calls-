import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { User, Image as ImageIcon } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, currentUser, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(
    userProfile?.displayName || currentUser?.displayName || ''
  );
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || currentUser?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await updateProfile({
        displayName: displayName.trim(),
        photoURL: photoURL.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      description="Customize how your authorized partner sees you."
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Preview Avatar */}
        <div className="flex flex-col items-center justify-center my-3">
          <Avatar
            src={photoURL || undefined}
            name={displayName || 'User'}
            size="xl"
            className="ring-4 ring-violet-500/20 shadow-xl"
          />
          <span className="text-xs text-slate-400 mt-2">Avatar Preview</span>
        </div>

        {/* Display Name Input */}
        <Input
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Alex"
          leftIcon={<User className="w-4 h-4" />}
          required
        />

        {/* Photo URL Input */}
        <Input
          label="Profile Picture URL (Optional)"
          value={photoURL}
          onChange={(e) => setPhotoURL(e.target.value)}
          placeholder="https://..."
          leftIcon={<ImageIcon className="w-4 h-4" />}
        />

        {/* Avatar Preset Chips */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Or Pick a Preset Avatar
          </label>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            {PRESET_AVATARS.map((url, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setPhotoURL(url)}
                className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all shrink-0 ${
                  photoURL === url ? 'border-violet-500 ring-2 ring-violet-500/30 scale-105' : 'border-slate-700 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}
        {success && <p className="text-xs text-emerald-400 font-medium">Profile updated successfully!</p>}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
