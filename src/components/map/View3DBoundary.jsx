import { Component } from "react";

/* Anything that goes wrong in the 3D view — the lazy chunk failing to load,
 * a driver error during context creation, a render throw — drops the page
 * back to the 2D plan, which is the source of truth anyway. */
export default class View3DBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("[Plot3DView] falling back to 2D:", error);
    this.props.onFail?.(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
