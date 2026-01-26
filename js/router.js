class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;
    this.params = {};
    
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  addRoute(path, handler) {
    this.routes.set(path, handler);
    return this;
  }

  parseHash(hash) {
    const cleanHash = hash.replace(/^#\/?/, '') || 'editor';
    const parts = cleanHash.split('/');
    const route = parts[0];
    const params = {};
    
    if (parts[1]) {
      params.id = parts[1];
    }
    
    return { route, params };
  }

  handleRoute() {
    const { route, params } = this.parseHash(window.location.hash);
    this.params = params;
    this.currentRoute = route;
    
    this.updateNavLinks();
    
    const handler = this.routes.get(route);
    if (handler) {
      handler(params);
    } else {
      const defaultHandler = this.routes.get('editor');
      if (defaultHandler) defaultHandler({});
    }
  }

  updateNavLinks() {
    document.querySelectorAll('.nav-link').forEach(link => {
      const linkRoute = link.dataset.route;
      link.classList.toggle('active', linkRoute === this.currentRoute);
    });
  }

  navigate(path) {
    window.location.hash = path;
  }

  getCurrentRoute() {
    return this.currentRoute;
  }

  getParams() {
    return this.params;
  }
}

export const router = new Router();
export default router;
