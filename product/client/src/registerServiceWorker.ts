export function register() {
  if ('serviceWorker' in navigator && (import.meta as any).env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('CampusOS ServiceWorker registered successfully: ', reg.scope);
        })
        .catch((err) => {
          console.warn('CampusOS ServiceWorker registration failed: ', err);
        });
    });
  }
}
