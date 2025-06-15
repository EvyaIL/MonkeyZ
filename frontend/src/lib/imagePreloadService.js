// Image preloading service for better performance
class ImagePreloadService {
  constructor() {
    this.preloadedImages = new Set();
    this.preloadQueue = [];
    this.isProcessing = false;
    this.maxConcurrent = 3; // Limit concurrent preloads
    this.currentPreloads = 0;
  }

  // Preload a single image
  preloadImage(src) {
    return new Promise((resolve, reject) => {
      if (!src || this.preloadedImages.has(src)) {
        resolve(src);
        return;
      }

      const img = new Image();
      img.onload = () => {
        this.preloadedImages.add(src);
        resolve(src);
      };
      img.onerror = () => {
        reject(new Error(`Failed to preload image: ${src}`));
      };
      
      // Add crossorigin for external images
      if (src.startsWith('http')) {
        img.crossOrigin = 'anonymous';
      }
      
      img.src = src;
    });
  }

  // Add image to preload queue
  queuePreload(src) {
    if (!src || this.preloadedImages.has(src)) return;
    
    if (!this.preloadQueue.includes(src)) {
      this.preloadQueue.push(src);
    }
    
    this.processQueue();
  }

  // Process preload queue with concurrency limit
  async processQueue() {
    if (this.isProcessing || this.currentPreloads >= this.maxConcurrent) return;
    
    this.isProcessing = true;
    
    while (this.preloadQueue.length > 0 && this.currentPreloads < this.maxConcurrent) {
      const src = this.preloadQueue.shift();
      this.currentPreloads++;
      
      this.preloadImage(src)
        .catch(() => {
          // Silently handle preload failures
        })
        .finally(() => {
          this.currentPreloads--;
          this.processQueue();
        });
    }
    
    this.isProcessing = false;
  }

  // Preload array of images with priority
  preloadImages(imageUrls, priority = 'normal') {
    const validUrls = imageUrls.filter(url => url && typeof url === 'string');
    
    if (priority === 'high') {
      // Add to front of queue for high priority
      this.preloadQueue.unshift(...validUrls);
    } else {
      // Add to end for normal priority
      validUrls.forEach(url => this.queuePreload(url));
    }
  }

  // Check if image is preloaded
  isPreloaded(src) {
    return this.preloadedImages.has(src);
  }

  // Clear preload cache
  clearCache() {
    this.preloadedImages.clear();
    this.preloadQueue.length = 0;
  }
}

// Create singleton instance
const imagePreloadService = new ImagePreloadService();

export default imagePreloadService;
