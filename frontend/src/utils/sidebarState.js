// Simple event emitter for sidebar state
class SidebarState {
  constructor() {
    this.collapsed = false
    this.mobileMenuOpen = false
    this.listeners = []
  }

  subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  notify() {
    this.listeners.forEach(listener => listener(this.getState()))
  }

  getState() {
    return {
      collapsed: this.collapsed,
      mobileMenuOpen: this.mobileMenuOpen
    }
  }

  toggleSidebar() {
    if (window.innerWidth < 768) {
      this.mobileMenuOpen = !this.mobileMenuOpen
    } else {
      this.collapsed = !this.collapsed
    }
    this.notify()
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false
    this.notify()
  }
}

export const sidebarState = new SidebarState()
