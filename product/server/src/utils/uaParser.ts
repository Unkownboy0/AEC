export interface UserAgentDetails {
  browser: string;
  device: string;
}

export function parseUserAgent(ua: string | undefined): UserAgentDetails {
  if (!ua) {
    return { browser: 'Unknown', device: 'Unknown' };
  }

  let browser = 'Unknown Browser';
  let device = 'Desktop';

  const lowerUa = ua.toLowerCase();

  // 1. Parse Browser
  if (lowerUa.includes('edg/')) {
    browser = 'Edge';
  } else if (lowerUa.includes('chrome/') || lowerUa.includes('chromium/')) {
    browser = 'Chrome';
  } else if (lowerUa.includes('firefox/')) {
    browser = 'Firefox';
  } else if (lowerUa.includes('safari/') && !lowerUa.includes('chrome/')) {
    browser = 'Safari';
  } else if (lowerUa.includes('opr/') || lowerUa.includes('opera/')) {
    browser = 'Opera';
  } else if (lowerUa.includes('msie') || lowerUa.includes('trident/')) {
    browser = 'Internet Explorer';
  }

  // 2. Parse Device
  if (lowerUa.includes('mobile') || lowerUa.includes('iphone') || lowerUa.includes('android')) {
    device = 'Mobile';
  } else if (lowerUa.includes('tablet') || lowerUa.includes('ipad')) {
    device = 'Tablet';
  } else if (lowerUa.includes('bot') || lowerUa.includes('crawler') || lowerUa.includes('spider')) {
    device = 'Bot';
  }

  return { browser, device };
}
