// Mobile utility functions for better device compatibility

export interface MobileDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  browser: string;
}

export function detectMobile(): MobileDetectionResult {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|tablet|kindle|silk/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);
  const isAndroid = /android/i.test(userAgent);
  
  let browser = 'unknown';
  if (userAgent.includes('chrome')) browser = 'chrome';
  else if (userAgent.includes('safari')) browser = 'safari';
  else if (userAgent.includes('firefox')) browser = 'firefox';
  else if (userAgent.includes('edge')) browser = 'edge';
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isIOS,
    isAndroid,
    browser
  };
}

export interface DownloadOptions {
  filename: string;
  mimeType?: string;
  forceDownload?: boolean;
}

/**
 * Mobile-optimized download function that handles various device limitations
 */
export function mobileOptimizedDownload(
  data: string | Blob,
  options: DownloadOptions
): boolean {
  const { isMobile, isIOS, isAndroid } = detectMobile();
  const { filename, mimeType = 'application/pdf', forceDownload = true } = options;
  
  try {
    let blob: Blob;
    let url: string;
    
    // Create blob from data
    if (typeof data === 'string') {
      if (data.startsWith('data:')) {
        // Handle data URLs
        const [header, base64Data] = data.split(',');
        const actualMimeType = header.split(':')[1]?.split(';')[0] || mimeType;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: actualMimeType });
      } else if (data.startsWith('blob:')) {
        // Handle blob URLs
        url = data;
      } else {
        // Handle plain text
        blob = new Blob([data], { type: mimeType });
      }
    } else {
      // Data is already a blob
      blob = data;
    }
    
    // Create URL if we have a blob
    if (blob && !url) {
      url = URL.createObjectURL(blob);
    }
    
    if (!url) {
      throw new Error('Could not create download URL');
    }
    
    // Mobile-specific download strategies
    if (isMobile) {
      if (isIOS) {
        // iOS strategy: Try download link first, fallback to new window
        return downloadWithIOSFallback(url, filename);
      } else if (isAndroid) {
        // Android strategy: Use download attribute with click event
        return downloadWithAndroidOptimization(url, filename);
      } else {
        // Generic mobile strategy
        return downloadWithMobileFallback(url, filename);
      }
    } else {
      // Desktop strategy
      return downloadWithDesktopOptimization(url, filename);
    }
    
  } catch (error) {
    console.error('Mobile download failed:', error);
    return false;
  }
}

function downloadWithIOSFallback(url: string, filename: string): boolean {
  try {
    // Method 1: Try standard download approach
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Add to DOM and trigger
    document.body.appendChild(link);
    
    // Try programmatic click
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: false
    });
    
    const clicked = link.dispatchEvent(clickEvent);
    document.body.removeChild(link);
    
    if (clicked) {
      setTimeout(() => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      }, 1000);
      return true;
    }
    
    // Method 2: Fallback to new window (iOS Safari often blocks downloads)
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      setTimeout(() => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      }, 2000);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('iOS download failed:', error);
    return false;
  }
}

function downloadWithAndroidOptimization(url: string, filename: string): boolean {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // Style the link to be invisible but accessible
    link.style.position = 'fixed';
    link.style.top = '-1000px';
    link.style.left = '-1000px';
    link.style.width = '1px';
    link.style.height = '1px';
    
    document.body.appendChild(link);
    
    // Try multiple click methods for Android compatibility
    link.focus();
    link.click();
    
    // Also try direct event dispatch
    const event = new Event('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(event);
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('Android download failed:', error);
    return false;
  }
}

function downloadWithMobileFallback(url: string, filename: string): boolean {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Try click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('Mobile fallback download failed:', error);
    return false;
  }
}

function downloadWithDesktopOptimization(url: string, filename: string): boolean {
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Desktop download failed:', error);
    return false;
  }
}

/**
 * Check if the device supports file downloads
 */
export function supportsDownload(): boolean {
  const { isMobile, isIOS, browser } = detectMobile();
  
  // iOS Safari has limited download support
  if (isIOS && browser === 'safari') {
    return false;
  }
  
  // Check if download attribute is supported
  const link = document.createElement('a');
  return typeof link.download !== 'undefined';
}

/**
 * Get appropriate file picker accept attribute for mobile
 */
export function getMobileFileAccept(type: 'image' | 'pdf' | 'any'): string {
  const { isMobile } = detectMobile();
  
  if (!isMobile) {
    // Desktop - use specific MIME types
    switch (type) {
      case 'image':
        return 'image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp';
      case 'pdf':
        return 'application/pdf,.pdf';
      case 'any':
        return '*/*';
      default:
        return '*/*';
    }
  } else {
    // Mobile - use broader accepts for better compatibility
    switch (type) {
      case 'image':
        return 'image/*';
      case 'pdf':
        return '.pdf,application/pdf';
      case 'any':
        return '*/*';
      default:
        return '*/*';
    }
  }
}

/**
 * Show appropriate download instructions based on device
 */
export function getDownloadInstructions(): string {
  const { isMobile, isIOS, isAndroid } = detectMobile();
  
  if (isIOS) {
    return "On iOS: Tap and hold the download link, then select 'Download Linked File' or 'Save to Files'";
  } else if (isAndroid) {
    return "On Android: The file will download to your Downloads folder. Check your notification panel.";
  } else if (isMobile) {
    return "On mobile: The file will be downloaded to your device's download folder.";
  } else {
    return "The file will be downloaded to your default downloads folder.";
  }
}
