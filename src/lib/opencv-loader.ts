// This loader properly isolates OpenCV from the build process
// and loads it in a way that works with Next.js builds

export async function loadOpenCv() {
  if (typeof window === 'undefined') {
    // Only run in browser environment
    return null;
  }
  
  // Check if already loaded
  if ((window as any).cv) {
    return (window as any).cv;
  }
  
  // Dynamically import OpenCV
  const opencvModule = await import('@techstark/opencv-js');
  const cv = opencvModule.default;
  
  // Wait for OpenCV to fully initialize
  await new Promise((resolve) => {
    if (typeof cv.getBuildInformation === 'function' && cv.getBuildInformation()) {
      resolve(true);
    } else {
      const checkCvReady = () => {
        if (typeof cv.getBuildInformation === 'function' && cv.getBuildInformation()) {
          resolve(true);
        } else {
          setTimeout(checkCvReady, 100);
        }
      };
      checkCvReady();
    }
  });
  
  // Assign to window for access by other components
  (window as any).cv = cv;
  
  return cv;
}

// Check if OpenCV is loaded
export function isOpencvLoaded() {
  return typeof (window as any).cv !== 'undefined';
}