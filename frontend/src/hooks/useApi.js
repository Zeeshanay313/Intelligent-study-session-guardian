import { useQuery, useMutation, useQueryClient } from 'react-query';
import { userAPI, deviceAPI, handleApiError } from '../services/api';
import toast from 'react-hot-toast';

// Custom hook for API calls with React Query
export const useApi = () => {
  const queryClient = useQueryClient();

  // User profile queries
  const useUserProfile = () => {
    return useQuery(
      'userProfile',
      userAPI.getProfile,
      {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        onError: (error) => {
          console.error('Profile fetch error:', error);
        }
      }
    );
  };

  // Update profile mutation
  const useUpdateProfile = () => {
    return useMutation(
      userAPI.updateProfile,
      {
        onSuccess: (data) => {
          queryClient.setQueryData('userProfile', data.data);
          toast.success('Profile updated successfully');
        },
        onError: (error) => {
          toast.error(handleApiError(error));
        }
      }
    );
  };

  // Update privacy mutation
  const useUpdatePrivacy = () => {
    return useMutation(
      userAPI.updatePrivacy,
      {
        onSuccess: (data) => {
          queryClient.setQueryData('userProfile', (oldData) => ({
            ...oldData,
            data: {
              ...oldData.data,
              user: {
                ...oldData.data.user,
                privacy: data.data.privacy
              }
            }
          }));
          toast.success('Privacy settings updated');
        },
        onError: (error) => {
          toast.error(handleApiError(error));
        }
      }
    );
  };

  // Avatar upload mutation
  const useUploadAvatar = () => {
    return useMutation(
      userAPI.uploadAvatar,
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries('userProfile');
          toast.success('Avatar updated successfully');
        },
        onError: (error) => {
          toast.error(handleApiError(error));
        }
      }
    );
  };

  // Data export mutation
  const useExportData = () => {
    return useMutation(
      userAPI.exportData,
      {
        onSuccess: (response) => {
          const blob = new Blob([response.data], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `study-guardian-data-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          toast.success('Data exported successfully');
        },
        onError: (error) => {
          toast.error(handleApiError(error));
        }
      }
    );
  };

  // Delete account mutation
  const useDeleteAccount = () => {
    return useMutation(
      userAPI.deleteAccount,
      {
        onSuccess: (data) => {
          queryClient.clear();
          toast.success(data.data.message);
        },
        onError: (error) => {
          toast.error(handleApiError(error));
        }
      }
    );
  };

  // Guardian invitation mutation
  const useInviteGuardian = () => {
    return useMutation(
      userAPI.inviteGuardian,
      {
        onSuccess: () => {
          toast.success('Guardian invitation sent');
        },
        onError: (error) => {
          toast.error(handleApiError(error));
        }
      }
    );
  };

  // Audit logs query
  const useAuditLogs = (params = {}) => {
    return useQuery(
      ['auditLogs', params],
      () => userAPI.getAuditLogs(params),
      {
        keepPreviousData: true,
        staleTime: 2 * 60 * 1000, // 2 minutes
        retry: 1
      }
    );
  };

  // Device queries and mutations
  const useDevices = (activeOnly = false) => {
    return useQuery(
      ['devices', activeOnly],
      () => deviceAPI.getMyDevices(activeOnly),
      {
        staleTime: 5 * 60 * 1000,
        retry: 1
      }
    );
  };

  const useUpdateDeviceAccess = () => {
    return useMutation(
      ({ deviceId, accessData }) => deviceAPI.updateAccess(deviceId, accessData),
      {
        onSuccess: () => {
          queryClient.invalidateQueries('devices');
          toast.success('Device access updated');
        },
        onError: (error) => {
          toast.error(handleApiError(error));
        }
      }
    );
  };

  const useRevokeDeviceAccess = () => {
    return useMutation(
      ({ deviceId, reason }) => deviceAPI.revokeAccess(deviceId, reason),
      {
        onSuccess: () => {
          queryClient.invalidateQueries('devices');
          toast.success('Device access revoked');
        },
        onError: (error) => {
          toast.error(handleApiError(error));
        }
      }
    );
  };

  const useRemoveDevice = () => {
    return useMutation(
      deviceAPI.removeDevice,
      {
        onSuccess: () => {
          queryClient.invalidateQueries('devices');
          toast.success('Device removed');
        },
        onError: (error) => {
          toast.error(handleApiError(error));
        }
      }
    );
  };

  // Simple API call function for direct use
  const apiCall = async (url, options = {}) => {
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      credentials: 'include'
    };

    const config = { ...defaultOptions, ...options };
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5004'}${url}`, config);
      return response;
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  return {
    // User profile
    useUserProfile,
    useUpdateProfile,
    useUpdatePrivacy,
    useUploadAvatar,
    useExportData,
    useDeleteAccount,
    useInviteGuardian,
    useAuditLogs,
    // Devices
    useDevices,
    useUpdateDeviceAccess,
    useRevokeDeviceAccess,
    useRemoveDevice,
    // Direct API call
    apiCall,
  };
};