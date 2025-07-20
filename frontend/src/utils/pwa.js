// PWA工具函数
class PWAUtils {
  constructor() {
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
  }

  // 设置事件监听
  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onOffline();
    });
  }

  // 检查是否在线
  isOnline() {
    return this.isOnline;
  }

  // 在线时触发
  onOnline() {
    console.log('网络已连接');
    // 可以在这里触发数据同步
    this.syncOfflineData();
  }

  // 离线时触发
  onOffline() {
    console.log('网络已断开');
    // 可以在这里显示离线提示
  }

  // 检查Service Worker是否可用
  async checkServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      } catch (error) {
        console.error('检查Service Worker失败:', error);
        return false;
      }
    }
    return false;
  }

  // 注册推送通知
  async registerPushNotification() {
    if (!('Notification' in window)) {
      console.log('此浏览器不支持推送通知');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('推送通知权限被拒绝');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('请求推送通知权限失败:', error);
      return false;
    }
  }

  // 发送推送通知
  sendNotification(title, options = {}) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    }
  }

  // 同步离线数据
  async syncOfflineData() {
    try {
      // 这里可以实现离线数据的同步逻辑
      console.log('开始同步离线数据...');
      
      // 示例：同步离线缓存的历史记录
      const cache = await caches.open('api-v1');
      const requests = await cache.keys();
      
      for (const request of requests) {
        // 处理离线缓存的数据
        console.log('同步缓存数据:', request.url);
      }
      
      console.log('离线数据同步完成');
    } catch (error) {
      console.error('同步离线数据失败:', error);
    }
  }

  // 清除缓存
  async clearCache() {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('缓存已清除');
      return true;
    } catch (error) {
      console.error('清除缓存失败:', error);
      return false;
    }
  }

  // 获取缓存大小
  async getCacheSize() {
    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const requests = await cache.keys();
        
        for (const request of requests) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }

      return this.formatBytes(totalSize);
    } catch (error) {
      console.error('获取缓存大小失败:', error);
      return '0 B';
    }
  }

  // 格式化字节大小
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 安装PWA提示
  showInstallPrompt() {
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      
      // 显示安装提示
      if (window.confirm('是否安装此应用到桌面？')) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('用户接受安装');
          } else {
            console.log('用户拒绝安装');
          }
          deferredPrompt = null;
        });
      }
    });
  }
}

// 创建全局实例
const pwaUtils = new PWAUtils();

export default pwaUtils; 