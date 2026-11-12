import { Component } from 'react';

// React only catches errors from class components.
// useGLTF throws when the file is missing (404) or invalid, so we catch it here.
export default class ModelErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('[ModelErrorBoundary] Failed to load drone model:', error);
    this.props.onError?.(error);
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
