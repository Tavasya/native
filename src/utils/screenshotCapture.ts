import html2canvas from 'html2canvas';

export const captureScreenshot = async (): Promise<string | null> => {
  try {
    // Find all modal overlays and dialogs to hide them
    const modals = document.querySelectorAll('[role="dialog"], [data-radix-dialog-overlay], .fixed.inset-0');
    const originalStyles: { element: HTMLElement; display: string }[] = [];
    
    // Hide all modal elements
    modals.forEach(modal => {
      const element = modal as HTMLElement;
      originalStyles.push({
        element,
        display: element.style.display
      });
      element.style.display = 'none';
    });

    // Wait a bit for the DOM to update
    await new Promise(resolve => setTimeout(resolve, 50));

    // Capture the screenshot
    const canvas = await html2canvas(document.body, {
      scale: 0.5, // Reduce quality to save space
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: window.innerWidth,
      height: window.innerHeight,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      ignoreElements: (element) => {
        // Additional check to ignore any modal-related elements
        return element.getAttribute('role') === 'dialog' || 
               element.classList.contains('fixed') && element.classList.contains('inset-0');
      }
    });

    // Restore all modal elements
    originalStyles.forEach(({ element, display }) => {
      element.style.display = display;
    });

    // Convert to blob
    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.7);
    });

    if (!blob) return null;

    // Convert to base64 for storage
    const reader = new FileReader();
    return new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    return null;
  }
};

export const uploadScreenshot = async (base64Data: string): Promise<string | null> => {
  try {
    // For now, we'll store the base64 directly in the database
    // In production, you'd want to upload to a cloud storage service like S3
    return base64Data;
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    return null;
  }
};