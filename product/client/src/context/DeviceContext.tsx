import React, { createContext, useContext, useState, useEffect } from 'react';

export type DeviceType = 'Desktop' | 'Laptop' | 'Tablet' | 'Android Phone' | 'iPhone' | 'Large Screen' | 'Small Screen';

interface DeviceContextProps {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  isLargeScreen: boolean;
  isSmallScreen: boolean;
  isAndroid: boolean;
  isiPhone: boolean;
}

const DeviceContext = createContext<DeviceContextProps | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getDeviceDetails = (): DeviceContextProps => {
    const w = window.innerWidth;
    const ua = navigator.userAgent.toLowerCase();
    
    // User Agent detections
    const isiPhone = /iphone/.test(ua);
    const isAndroidMobile = /android/.test(ua) && /mobile/.test(ua);
    const isIPad = /ipad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidTablet = /android/.test(ua) && !/mobile/.test(ua);
    const isTabletDevice = isIPad || isAndroidTablet;
    
    // Breakpoint and UA Priority Resolution
    let type: DeviceType = 'Desktop';
    if (w < 375) {
      type = 'Small Screen';
    } else if (isiPhone) {
      type = 'iPhone';
    } else if (isAndroidMobile) {
      type = 'Android Phone';
    } else if (isTabletDevice || (w >= 768 && w < 1024)) {
      type = 'Tablet';
    } else if (w >= 1024 && w < 1440) {
      type = 'Laptop';
    } else if (w >= 1440 && w < 2048) {
      type = 'Desktop';
    } else {
      type = 'Large Screen';
    }
    
    const isMobile = type === 'iPhone' || type === 'Android Phone' || type === 'Small Screen';
    const isTablet = type === 'Tablet';
    const isLaptop = type === 'Laptop';
    const isDesktop = type === 'Desktop';
    const isLargeScreen = type === 'Large Screen';
    const isSmallScreen = type === 'Small Screen';
    const isAndroid = /android/.test(ua);
    
    return {
      deviceType: type,
      isMobile,
      isTablet,
      isLaptop,
      isDesktop,
      isLargeScreen,
      isSmallScreen,
      isAndroid,
      isiPhone
    };
  };

  const [details, setDetails] = useState<DeviceContextProps>(() => getDeviceDetails());

  useEffect(() => {
    const handleResize = () => {
      setDetails(getDeviceDetails());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <DeviceContext.Provider value={details}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = () => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
};
