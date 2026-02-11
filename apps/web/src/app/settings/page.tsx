'use client';

import { ProtectedRoute } from '@/shared/components/layout/ProtectedRoute';
import { DashboardLayout } from '@/shared/components/layout/DashboardLayout';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { uploadImage, generateUniqueFilename, deleteImage, isBlobUrl } from '@/lib/firebase/storage';

export default function SettingsPage() {
  const { user } = useAuth();
  const { profile, myProjects, isLoading: profileLoading, updateProfile } = useUsers();


  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    website: '',
    socials: {
      twitter: '',
      instagram: '',
      linkedin: '',
      imdb: '',
    },
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        website: profile.website || '',
        socials: {
          twitter: profile.socials?.twitter || '',
          instagram: profile.socials?.instagram || '',
          linkedin: profile.socials?.linkedin || '',
          imdb: profile.socials?.imdb || '',
        },
      });
      setPhotoPreview(profile.photoURL || null);
    }
  }, [profile]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingPhoto(true);

    try {
      let photoURL: string | null = null;
      const oldPhotoURL = profile?.photoURL;

      // Upload new photo if selected
      if (photoFile) {
        const filename = generateUniqueFilename(photoFile.name);
        const storagePath = `users/${user?.id}/${filename}`;
        photoURL = await uploadImage(photoFile, storagePath);

        // Delete old photo if it exists and is a Firebase Storage URL (not Google profile image)
        if (oldPhotoURL && !isBlobUrl(oldPhotoURL) && oldPhotoURL.includes('firebasestorage')) {
          try {
            await deleteImage(oldPhotoURL);
          } catch (error) {
            // Silently fail if it's not a valid Firebase Storage URL (e.g., Google profile image)
            console.log('Could not delete old image (may not be Firebase Storage URL)');
          }
        }
      } else {
        photoURL = profile?.photoURL || null;
      }

      await updateProfile.mutateAsync({
        displayName: formData.displayName,
        photoURL: photoURL || null,
        bio: formData.bio || null,
        website: formData.website || null,
        socials: {
          twitter: formData.socials.twitter || null,
          instagram: formData.socials.instagram || null,
          linkedin: formData.socials.linkedin || null,
          imdb: formData.socials.imdb || null,
        },
      });
      
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-purple-500 to-pink-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-purple-500',
      'from-cyan-500 to-blue-500',
      'from-amber-500 to-orange-500',
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  if (profileLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-text-primary">Settings</h1>
            <p className="text-text-secondary">Manage your profile and preferences</p>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-xl text-success">
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Photo */}
                <div className="card card-elevated p-6 rounded-2xl">
                  <h2 className="text-xl font-bold mb-4 text-text-primary">Profile Photo</h2>
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      {photoPreview ? (
                        <div className="relative w-24 h-24 rounded-full overflow-hidden">
                          <Image
                            src={photoPreview}
                            alt={formData.displayName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getAvatarColor(formData.displayName || 'User')} flex items-center justify-center text-white text-2xl font-bold`}>
                          {getInitials(formData.displayName || 'User')}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-accent-primary file:text-white hover:file:bg-accent-hover file:cursor-pointer"
                      />
                      <p className="text-xs text-text-tertiary mt-2">JPG, PNG or GIF. Max size 5MB.</p>
                    </div>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="card card-elevated p-6 rounded-2xl">
                  <h2 className="text-xl font-bold mb-4 text-text-primary">Basic Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="input-field bg-background-tertiary cursor-not-allowed opacity-80"
                      />
                      <p className="text-xs text-text-tertiary mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Bio
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={4}
                        className="input-field resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="input-field"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="card card-elevated p-6 rounded-2xl">
                  <h2 className="text-xl font-bold mb-4 text-text-primary">Social Links</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Twitter / X
                      </label>
                      <input
                        type="text"
                        value={formData.socials.twitter}
                        onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, twitter: e.target.value } })}
                        className="input-field"
                        placeholder="@username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Instagram
                      </label>
                      <input
                        type="text"
                        value={formData.socials.instagram}
                        onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, instagram: e.target.value } })}
                        className="input-field"
                        placeholder="@username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        LinkedIn
                      </label>
                      <input
                        type="text"
                        value={formData.socials.linkedin}
                        onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, linkedin: e.target.value } })}
                        className="input-field"
                        placeholder="linkedin.com/in/username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        IMDb
                      </label>
                      <input
                        type="text"
                        value={formData.socials.imdb}
                        onChange={(e) => setFormData({ ...formData, socials: { ...formData.socials, imdb: e.target.value } })}
                        className="input-field"
                        placeholder="imdb.com/name/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={uploadingPhoto}
                    className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: 'rgb(var(--button-text-on-accent))' }}
                  >
                    {uploadingPhoto ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

                {/* Projects Sidebar */}
            <div className="lg:col-span-1">
              <div className="card card-elevated p-6 rounded-2xl sticky top-8">
                <h2 className="text-xl font-bold mb-4 text-text-primary">My Projects</h2>
                {profileLoading ? ( // Using profileLoading as general loading state for now
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-primary"></div>
                  </div>
                ) : myProjects.length === 0 ? (
                  <p className="text-text-secondary text-sm">No projects yet</p>
                ) : (
                  <div className="space-y-3">
                    {myProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block p-3 rounded-lg border border-border-default hover:bg-background-tertiary transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {project.coverImageUrl ? (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={project.coverImageUrl}
                                alt={project.title}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center text-xl flex-shrink-0">
                              📝
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-text-primary truncate">{project.title}</h3>
                            <p className="text-xs text-text-secondary capitalize">{project.status}</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

