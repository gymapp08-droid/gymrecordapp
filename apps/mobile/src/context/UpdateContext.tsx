import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UpdateService, UpdateInfo } from '../services/updateService';
import { usePerformance } from './PerformanceContext';
import { Alert } from 'react-native';

interface UpdateContextValue {
  updateInfo: UpdateInfo;
  checkForUpdate: (isManual?: boolean) => Promise<boolean>;
  applyUpdate: () => Promise<boolean>;
  dismissUpdateBanner: () => void;
  isWorkoutInProgress: boolean;
}

const UpdateContext = createContext<UpdateContextValue | null>(null);

export const UpdateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>(UpdateService.getState());
  const { workout } = usePerformance();

  // Determine if user has an active session where an interruptive modal/reload is prohibited
  const isWorkoutInProgress = workout?.status === 'IN_PROGRESS';

  useEffect(() => {
    const unsubscribe = UpdateService.subscribe((info) => {
      setUpdateInfo(info);
    });

    // Initial check on app launch (with slight delay so UI finishes initial render)
    const initialTimer = setTimeout(() => {
      UpdateService.checkForUpdate({ isManual: false, isWorkoutActive: isWorkoutInProgress });
    }, 2500);

    return () => {
      unsubscribe();
      clearTimeout(initialTimer);
    };
  }, []);

  const checkForUpdate = useCallback(
    async (isManual = true): Promise<boolean> => {
      return UpdateService.checkForUpdate({ isManual, isWorkoutActive: isWorkoutInProgress });
    },
    [isWorkoutInProgress],
  );

  const applyUpdate = useCallback(async (): Promise<boolean> => {
    if (isWorkoutInProgress) {
      Alert.alert(
        'Workout In Progress',
        'You have an active workout session. Please complete or log your workout before restarting to prevent data loss.',
        [{ text: 'OK' }],
      );
      return false;
    }

    return UpdateService.reloadApp(false);
  }, [isWorkoutInProgress]);

  const dismissUpdateBanner = useCallback(() => {
    UpdateService.dismissNotification();
  }, []);

  return (
    <UpdateContext.Provider
      value={{
        updateInfo,
        checkForUpdate,
        applyUpdate,
        dismissUpdateBanner,
        isWorkoutInProgress,
      }}
    >
      {children}
    </UpdateContext.Provider>
  );
};

export const useUpdate = (): UpdateContextValue => {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdate must be used within an UpdateProvider');
  }
  return context;
};
