var VNode = function VNode() {};

var options = {};
var stack = [];
var EMPTY_CHILDREN = [];

function h(nodeName, attributes) {
  var children = EMPTY_CHILDREN,
      lastSimple,
      child,
      simple,
      i;

  for (i = arguments.length; i-- > 2;) {
    stack.push(arguments[i]);
  }

  if (attributes && attributes.children != null) {
    if (!stack.length) stack.push(attributes.children);
    delete attributes.children;
  }

  while (stack.length) {
    if ((child = stack.pop()) && child.pop !== undefined) {
      for (i = child.length; i--;) {
        stack.push(child[i]);
      }
    } else {
      if (typeof child === 'boolean') child = null;

      if (simple = typeof nodeName !== 'function') {
        if (child == null) child = '';else if (typeof child === 'number') child = String(child);else if (typeof child !== 'string') simple = false;
      }

      if (simple && lastSimple) {
        children[children.length - 1] += child;
      } else if (children === EMPTY_CHILDREN) {
        children = [child];
      } else {
        children.push(child);
      }

      lastSimple = simple;
    }
  }

  var p = new VNode();
  p.nodeName = nodeName;
  p.children = children;
  p.attributes = attributes == null ? undefined : attributes;
  p.key = attributes == null ? undefined : attributes.key;
  if (options.vnode !== undefined) options.vnode(p);
  return p;
}

function extend(obj, props) {
  for (var i in props) {
    obj[i] = props[i];
  }

  return obj;
}

function applyRef(ref, value) {
  if (ref) {
    if (typeof ref == 'function') ref(value);else ref.current = value;
  }
}

var defer = typeof Promise == 'function' ? Promise.resolve().then.bind(Promise.resolve()) : setTimeout;

function cloneElement(vnode, props) {
  return h(vnode.nodeName, extend(extend({}, vnode.attributes), props), arguments.length > 2 ? [].slice.call(arguments, 2) : vnode.children);
}

var IS_NON_DIMENSIONAL = /acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i;
var items = [];

function enqueueRender(component) {
  if (!component._dirty && (component._dirty = true) && items.push(component) == 1) {
    (options.debounceRendering || defer)(rerender);
  }
}

function rerender() {
  var p;

  while (p = items.pop()) {
    if (p._dirty) renderComponent(p);
  }
}

function isSameNodeType(node, vnode, hydrating) {
  if (typeof vnode === 'string' || typeof vnode === 'number') {
    return node.splitText !== undefined;
  }

  if (typeof vnode.nodeName === 'string') {
    return !node._componentConstructor && isNamedNode(node, vnode.nodeName);
  }

  return hydrating || node._componentConstructor === vnode.nodeName;
}

function isNamedNode(node, nodeName) {
  return node.normalizedNodeName === nodeName || node.nodeName.toLowerCase() === nodeName.toLowerCase();
}

function getNodeProps(vnode) {
  var props = extend({}, vnode.attributes);
  props.children = vnode.children;
  var defaultProps = vnode.nodeName.defaultProps;

  if (defaultProps !== undefined) {
    for (var i in defaultProps) {
      if (props[i] === undefined) {
        props[i] = defaultProps[i];
      }
    }
  }

  return props;
}

function createNode(nodeName, isSvg) {
  var node = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', nodeName) : document.createElement(nodeName);
  node.normalizedNodeName = nodeName;
  return node;
}

function removeNode(node) {
  var parentNode = node.parentNode;
  if (parentNode) parentNode.removeChild(node);
}

function setAccessor(node, name, old, value, isSvg) {
  if (name === 'className') name = 'class';

  if (name === 'key') {} else if (name === 'ref') {
    applyRef(old, null);
    applyRef(value, node);
  } else if (name === 'class' && !isSvg) {
    node.className = value || '';
  } else if (name === 'style') {
    if (!value || typeof value === 'string' || typeof old === 'string') {
      node.style.cssText = value || '';
    }

    if (value && typeof value === 'object') {
      if (typeof old !== 'string') {
        for (var i in old) {
          if (!(i in value)) node.style[i] = '';
        }
      }

      for (var i in value) {
        node.style[i] = typeof value[i] === 'number' && IS_NON_DIMENSIONAL.test(i) === false ? value[i] + 'px' : value[i];
      }
    }
  } else if (name === 'dangerouslySetInnerHTML') {
    if (value) node.innerHTML = value.__html || '';
  } else if (name[0] == 'o' && name[1] == 'n') {
    var useCapture = name !== (name = name.replace(/Capture$/, ''));
    name = name.toLowerCase().substring(2);

    if (value) {
      if (!old) node.addEventListener(name, eventProxy, useCapture);
    } else {
      node.removeEventListener(name, eventProxy, useCapture);
    }

    (node._listeners || (node._listeners = {}))[name] = value;
  } else if (name !== 'list' && name !== 'type' && !isSvg && name in node) {
    try {
      node[name] = value == null ? '' : value;
    } catch (e) {}

    if ((value == null || value === false) && name != 'spellcheck') node.removeAttribute(name);
  } else {
    var ns = isSvg && name !== (name = name.replace(/^xlink:?/, ''));

    if (value == null || value === false) {
      if (ns) node.removeAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase());else node.removeAttribute(name);
    } else if (typeof value !== 'function') {
      if (ns) node.setAttributeNS('http://www.w3.org/1999/xlink', name.toLowerCase(), value);else node.setAttribute(name, value);
    }
  }
}

function eventProxy(e) {
  return this._listeners[e.type](options.event && options.event(e) || e);
}

var mounts = [];
var diffLevel = 0;
var isSvgMode = false;
var hydrating = false;

function flushMounts() {
  var c;

  while (c = mounts.shift()) {
    if (options.afterMount) options.afterMount(c);
    if (c.componentDidMount) c.componentDidMount();
  }
}

function diff(dom, vnode, context, mountAll, parent, componentRoot) {
  if (!diffLevel++) {
    isSvgMode = parent != null && parent.ownerSVGElement !== undefined;
    hydrating = dom != null && !('__preactattr_' in dom);
  }

  var ret = idiff(dom, vnode, context, mountAll, componentRoot);
  if (parent && ret.parentNode !== parent) parent.appendChild(ret);

  if (! --diffLevel) {
    hydrating = false;
    if (!componentRoot) flushMounts();
  }

  return ret;
}

function idiff(dom, vnode, context, mountAll, componentRoot) {
  var out = dom,
      prevSvgMode = isSvgMode;
  if (vnode == null || typeof vnode === 'boolean') vnode = '';

  if (typeof vnode === 'string' || typeof vnode === 'number') {
    if (dom && dom.splitText !== undefined && dom.parentNode && (!dom._component || componentRoot)) {
      if (dom.nodeValue != vnode) {
        dom.nodeValue = vnode;
      }
    } else {
      out = document.createTextNode(vnode);

      if (dom) {
        if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
        recollectNodeTree(dom, true);
      }
    }

    out['__preactattr_'] = true;
    return out;
  }

  var vnodeName = vnode.nodeName;

  if (typeof vnodeName === 'function') {
    return buildComponentFromVNode(dom, vnode, context, mountAll);
  }

  isSvgMode = vnodeName === 'svg' ? true : vnodeName === 'foreignObject' ? false : isSvgMode;
  vnodeName = String(vnodeName);

  if (!dom || !isNamedNode(dom, vnodeName)) {
    out = createNode(vnodeName, isSvgMode);

    if (dom) {
      while (dom.firstChild) {
        out.appendChild(dom.firstChild);
      }

      if (dom.parentNode) dom.parentNode.replaceChild(out, dom);
      recollectNodeTree(dom, true);
    }
  }

  var fc = out.firstChild,
      props = out['__preactattr_'],
      vchildren = vnode.children;

  if (props == null) {
    props = out['__preactattr_'] = {};

    for (var a = out.attributes, i = a.length; i--;) {
      props[a[i].name] = a[i].value;
    }
  }

  if (!hydrating && vchildren && vchildren.length === 1 && typeof vchildren[0] === 'string' && fc != null && fc.splitText !== undefined && fc.nextSibling == null) {
    if (fc.nodeValue != vchildren[0]) {
      fc.nodeValue = vchildren[0];
    }
  } else if (vchildren && vchildren.length || fc != null) {
    innerDiffNode(out, vchildren, context, mountAll, hydrating || props.dangerouslySetInnerHTML != null);
  }

  diffAttributes(out, vnode.attributes, props);
  isSvgMode = prevSvgMode;
  return out;
}

function innerDiffNode(dom, vchildren, context, mountAll, isHydrating) {
  var originalChildren = dom.childNodes,
      children = [],
      keyed = {},
      keyedLen = 0,
      min = 0,
      len = originalChildren.length,
      childrenLen = 0,
      vlen = vchildren ? vchildren.length : 0,
      j,
      c,
      f,
      vchild,
      child;

  if (len !== 0) {
    for (var i = 0; i < len; i++) {
      var _child = originalChildren[i],
          props = _child['__preactattr_'],
          key = vlen && props ? _child._component ? _child._component.__key : props.key : null;

      if (key != null) {
        keyedLen++;
        keyed[key] = _child;
      } else if (props || (_child.splitText !== undefined ? isHydrating ? _child.nodeValue.trim() : true : isHydrating)) {
        children[childrenLen++] = _child;
      }
    }
  }

  if (vlen !== 0) {
    for (var i = 0; i < vlen; i++) {
      vchild = vchildren[i];
      child = null;
      var key = vchild.key;

      if (key != null) {
        if (keyedLen && keyed[key] !== undefined) {
          child = keyed[key];
          keyed[key] = undefined;
          keyedLen--;
        }
      } else if (min < childrenLen) {
        for (j = min; j < childrenLen; j++) {
          if (children[j] !== undefined && isSameNodeType(c = children[j], vchild, isHydrating)) {
            child = c;
            children[j] = undefined;
            if (j === childrenLen - 1) childrenLen--;
            if (j === min) min++;
            break;
          }
        }
      }

      child = idiff(child, vchild, context, mountAll);
      f = originalChildren[i];

      if (child && child !== dom && child !== f) {
        if (f == null) {
          dom.appendChild(child);
        } else if (child === f.nextSibling) {
          removeNode(f);
        } else {
          dom.insertBefore(child, f);
        }
      }
    }
  }

  if (keyedLen) {
    for (var i in keyed) {
      if (keyed[i] !== undefined) recollectNodeTree(keyed[i], false);
    }
  }

  while (min <= childrenLen) {
    if ((child = children[childrenLen--]) !== undefined) recollectNodeTree(child, false);
  }
}

function recollectNodeTree(node, unmountOnly) {
  var component = node._component;

  if (component) {
    unmountComponent(component);
  } else {
    if (node['__preactattr_'] != null) applyRef(node['__preactattr_'].ref, null);

    if (unmountOnly === false || node['__preactattr_'] == null) {
      removeNode(node);
    }

    removeChildren(node);
  }
}

function removeChildren(node) {
  node = node.lastChild;

  while (node) {
    var next = node.previousSibling;
    recollectNodeTree(node, true);
    node = next;
  }
}

function diffAttributes(dom, attrs, old) {
  var name;

  for (name in old) {
    if (!(attrs && attrs[name] != null) && old[name] != null) {
      setAccessor(dom, name, old[name], old[name] = undefined, isSvgMode);
    }
  }

  for (name in attrs) {
    if (name !== 'children' && name !== 'innerHTML' && (!(name in old) || attrs[name] !== (name === 'value' || name === 'checked' ? dom[name] : old[name]))) {
      setAccessor(dom, name, old[name], old[name] = attrs[name], isSvgMode);
    }
  }
}

var recyclerComponents = [];

function createComponent(Ctor, props, context) {
  var inst,
      i = recyclerComponents.length;

  if (Ctor.prototype && Ctor.prototype.render) {
    inst = new Ctor(props, context);
    Component.call(inst, props, context);
  } else {
    inst = new Component(props, context);
    inst.constructor = Ctor;
    inst.render = doRender;
  }

  while (i--) {
    if (recyclerComponents[i].constructor === Ctor) {
      inst.nextBase = recyclerComponents[i].nextBase;
      recyclerComponents.splice(i, 1);
      return inst;
    }
  }

  return inst;
}

function doRender(props, state, context) {
  return this.constructor(props, context);
}

function setComponentProps(component, props, renderMode, context, mountAll) {
  if (component._disable) return;
  component._disable = true;
  component.__ref = props.ref;
  component.__key = props.key;
  delete props.ref;
  delete props.key;

  if (typeof component.constructor.getDerivedStateFromProps === 'undefined') {
    if (!component.base || mountAll) {
      if (component.componentWillMount) component.componentWillMount();
    } else if (component.componentWillReceiveProps) {
      component.componentWillReceiveProps(props, context);
    }
  }

  if (context && context !== component.context) {
    if (!component.prevContext) component.prevContext = component.context;
    component.context = context;
  }

  if (!component.prevProps) component.prevProps = component.props;
  component.props = props;
  component._disable = false;

  if (renderMode !== 0) {
    if (renderMode === 1 || options.syncComponentUpdates !== false || !component.base) {
      renderComponent(component, 1, mountAll);
    } else {
      enqueueRender(component);
    }
  }

  applyRef(component.__ref, component);
}

function renderComponent(component, renderMode, mountAll, isChild) {
  if (component._disable) return;
  var props = component.props,
      state = component.state,
      context = component.context,
      previousProps = component.prevProps || props,
      previousState = component.prevState || state,
      previousContext = component.prevContext || context,
      isUpdate = component.base,
      nextBase = component.nextBase,
      initialBase = isUpdate || nextBase,
      initialChildComponent = component._component,
      skip = false,
      snapshot = previousContext,
      rendered,
      inst,
      cbase;

  if (component.constructor.getDerivedStateFromProps) {
    state = extend(extend({}, state), component.constructor.getDerivedStateFromProps(props, state));
    component.state = state;
  }

  if (isUpdate) {
    component.props = previousProps;
    component.state = previousState;
    component.context = previousContext;

    if (renderMode !== 2 && component.shouldComponentUpdate && component.shouldComponentUpdate(props, state, context) === false) {
      skip = true;
    } else if (component.componentWillUpdate) {
      component.componentWillUpdate(props, state, context);
    }

    component.props = props;
    component.state = state;
    component.context = context;
  }

  component.prevProps = component.prevState = component.prevContext = component.nextBase = null;
  component._dirty = false;

  if (!skip) {
    rendered = component.render(props, state, context);

    if (component.getChildContext) {
      context = extend(extend({}, context), component.getChildContext());
    }

    if (isUpdate && component.getSnapshotBeforeUpdate) {
      snapshot = component.getSnapshotBeforeUpdate(previousProps, previousState);
    }

    var childComponent = rendered && rendered.nodeName,
        toUnmount,
        base;

    if (typeof childComponent === 'function') {
      var childProps = getNodeProps(rendered);
      inst = initialChildComponent;

      if (inst && inst.constructor === childComponent && childProps.key == inst.__key) {
        setComponentProps(inst, childProps, 1, context, false);
      } else {
        toUnmount = inst;
        component._component = inst = createComponent(childComponent, childProps, context);
        inst.nextBase = inst.nextBase || nextBase;
        inst._parentComponent = component;
        setComponentProps(inst, childProps, 0, context, false);
        renderComponent(inst, 1, mountAll, true);
      }

      base = inst.base;
    } else {
      cbase = initialBase;
      toUnmount = initialChildComponent;

      if (toUnmount) {
        cbase = component._component = null;
      }

      if (initialBase || renderMode === 1) {
        if (cbase) cbase._component = null;
        base = diff(cbase, rendered, context, mountAll || !isUpdate, initialBase && initialBase.parentNode, true);
      }
    }

    if (initialBase && base !== initialBase && inst !== initialChildComponent) {
      var baseParent = initialBase.parentNode;

      if (baseParent && base !== baseParent) {
        baseParent.replaceChild(base, initialBase);

        if (!toUnmount) {
          initialBase._component = null;
          recollectNodeTree(initialBase, false);
        }
      }
    }

    if (toUnmount) {
      unmountComponent(toUnmount);
    }

    component.base = base;

    if (base && !isChild) {
      var componentRef = component,
          t = component;

      while (t = t._parentComponent) {
        (componentRef = t).base = base;
      }

      base._component = componentRef;
      base._componentConstructor = componentRef.constructor;
    }
  }

  if (!isUpdate || mountAll) {
    mounts.push(component);
  } else if (!skip) {
    if (component.componentDidUpdate) {
      component.componentDidUpdate(previousProps, previousState, snapshot);
    }

    if (options.afterUpdate) options.afterUpdate(component);
  }

  while (component._renderCallbacks.length) {
    component._renderCallbacks.pop().call(component);
  }

  if (!diffLevel && !isChild) flushMounts();
}

function buildComponentFromVNode(dom, vnode, context, mountAll) {
  var c = dom && dom._component,
      originalComponent = c,
      oldDom = dom,
      isDirectOwner = c && dom._componentConstructor === vnode.nodeName,
      isOwner = isDirectOwner,
      props = getNodeProps(vnode);

  while (c && !isOwner && (c = c._parentComponent)) {
    isOwner = c.constructor === vnode.nodeName;
  }

  if (c && isOwner && (!mountAll || c._component)) {
    setComponentProps(c, props, 3, context, mountAll);
    dom = c.base;
  } else {
    if (originalComponent && !isDirectOwner) {
      unmountComponent(originalComponent);
      dom = oldDom = null;
    }

    c = createComponent(vnode.nodeName, props, context);

    if (dom && !c.nextBase) {
      c.nextBase = dom;
      oldDom = null;
    }

    setComponentProps(c, props, 1, context, mountAll);
    dom = c.base;

    if (oldDom && dom !== oldDom) {
      oldDom._component = null;
      recollectNodeTree(oldDom, false);
    }
  }

  return dom;
}

function unmountComponent(component) {
  if (options.beforeUnmount) options.beforeUnmount(component);
  var base = component.base;
  component._disable = true;
  if (component.componentWillUnmount) component.componentWillUnmount();
  component.base = null;
  var inner = component._component;

  if (inner) {
    unmountComponent(inner);
  } else if (base) {
    if (base['__preactattr_'] != null) applyRef(base['__preactattr_'].ref, null);
    component.nextBase = base;
    removeNode(base);
    recyclerComponents.push(component);
    removeChildren(base);
  }

  applyRef(component.__ref, null);
}

function Component(props, context) {
  this._dirty = true;
  this.context = context;
  this.props = props;
  this.state = this.state || {};
  this._renderCallbacks = [];
}

extend(Component.prototype, {
  setState: function setState(state, callback) {
    if (!this.prevState) this.prevState = this.state;
    this.state = extend(extend({}, this.state), typeof state === 'function' ? state(this.state, this.props) : state);
    if (callback) this._renderCallbacks.push(callback);
    enqueueRender(this);
  },
  forceUpdate: function forceUpdate(callback) {
    if (callback) this._renderCallbacks.push(callback);
    renderComponent(this, 2);
  },
  render: function render() {}
});

function render(vnode, parent, merge) {
  return diff(merge, vnode, {}, false, parent, false);
}

function createRef() {
  return {};
}

var preact = {
  h: h,
  createElement: h,
  cloneElement: cloneElement,
  createRef: createRef,
  Component: Component,
  render: render,
  rerender: rerender,
  options: options
};
export default preact;
export { h, h as createElement, cloneElement, createRef, Component, render, rerender, options };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9wcmVhY3QuanMiXSwibmFtZXMiOlsiVk5vZGUiLCJvcHRpb25zIiwic3RhY2siLCJFTVBUWV9DSElMRFJFTiIsImgiLCJub2RlTmFtZSIsImF0dHJpYnV0ZXMiLCJjaGlsZHJlbiIsImxhc3RTaW1wbGUiLCJjaGlsZCIsInNpbXBsZSIsImkiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJwdXNoIiwicG9wIiwidW5kZWZpbmVkIiwiU3RyaW5nIiwicCIsImtleSIsInZub2RlIiwiZXh0ZW5kIiwib2JqIiwicHJvcHMiLCJhcHBseVJlZiIsInJlZiIsInZhbHVlIiwiY3VycmVudCIsImRlZmVyIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0aGVuIiwiYmluZCIsInNldFRpbWVvdXQiLCJjbG9uZUVsZW1lbnQiLCJzbGljZSIsImNhbGwiLCJJU19OT05fRElNRU5TSU9OQUwiLCJpdGVtcyIsImVucXVldWVSZW5kZXIiLCJjb21wb25lbnQiLCJfZGlydHkiLCJkZWJvdW5jZVJlbmRlcmluZyIsInJlcmVuZGVyIiwicmVuZGVyQ29tcG9uZW50IiwiaXNTYW1lTm9kZVR5cGUiLCJub2RlIiwiaHlkcmF0aW5nIiwic3BsaXRUZXh0IiwiX2NvbXBvbmVudENvbnN0cnVjdG9yIiwiaXNOYW1lZE5vZGUiLCJub3JtYWxpemVkTm9kZU5hbWUiLCJ0b0xvd2VyQ2FzZSIsImdldE5vZGVQcm9wcyIsImRlZmF1bHRQcm9wcyIsImNyZWF0ZU5vZGUiLCJpc1N2ZyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudE5TIiwiY3JlYXRlRWxlbWVudCIsInJlbW92ZU5vZGUiLCJwYXJlbnROb2RlIiwicmVtb3ZlQ2hpbGQiLCJzZXRBY2Nlc3NvciIsIm5hbWUiLCJvbGQiLCJjbGFzc05hbWUiLCJzdHlsZSIsImNzc1RleHQiLCJ0ZXN0IiwiaW5uZXJIVE1MIiwiX19odG1sIiwidXNlQ2FwdHVyZSIsInJlcGxhY2UiLCJzdWJzdHJpbmciLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnRQcm94eSIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJfbGlzdGVuZXJzIiwiZSIsInJlbW92ZUF0dHJpYnV0ZSIsIm5zIiwicmVtb3ZlQXR0cmlidXRlTlMiLCJzZXRBdHRyaWJ1dGVOUyIsInNldEF0dHJpYnV0ZSIsInR5cGUiLCJldmVudCIsIm1vdW50cyIsImRpZmZMZXZlbCIsImlzU3ZnTW9kZSIsImZsdXNoTW91bnRzIiwiYyIsInNoaWZ0IiwiYWZ0ZXJNb3VudCIsImNvbXBvbmVudERpZE1vdW50IiwiZGlmZiIsImRvbSIsImNvbnRleHQiLCJtb3VudEFsbCIsInBhcmVudCIsImNvbXBvbmVudFJvb3QiLCJvd25lclNWR0VsZW1lbnQiLCJyZXQiLCJpZGlmZiIsImFwcGVuZENoaWxkIiwib3V0IiwicHJldlN2Z01vZGUiLCJfY29tcG9uZW50Iiwibm9kZVZhbHVlIiwiY3JlYXRlVGV4dE5vZGUiLCJyZXBsYWNlQ2hpbGQiLCJyZWNvbGxlY3ROb2RlVHJlZSIsInZub2RlTmFtZSIsImJ1aWxkQ29tcG9uZW50RnJvbVZOb2RlIiwiZmlyc3RDaGlsZCIsImZjIiwidmNoaWxkcmVuIiwiYSIsIm5leHRTaWJsaW5nIiwiaW5uZXJEaWZmTm9kZSIsImRhbmdlcm91c2x5U2V0SW5uZXJIVE1MIiwiZGlmZkF0dHJpYnV0ZXMiLCJpc0h5ZHJhdGluZyIsIm9yaWdpbmFsQ2hpbGRyZW4iLCJjaGlsZE5vZGVzIiwia2V5ZWQiLCJrZXllZExlbiIsIm1pbiIsImxlbiIsImNoaWxkcmVuTGVuIiwidmxlbiIsImoiLCJmIiwidmNoaWxkIiwiX2NoaWxkIiwiX19rZXkiLCJ0cmltIiwiaW5zZXJ0QmVmb3JlIiwidW5tb3VudE9ubHkiLCJ1bm1vdW50Q29tcG9uZW50IiwicmVtb3ZlQ2hpbGRyZW4iLCJsYXN0Q2hpbGQiLCJuZXh0IiwicHJldmlvdXNTaWJsaW5nIiwiYXR0cnMiLCJyZWN5Y2xlckNvbXBvbmVudHMiLCJjcmVhdGVDb21wb25lbnQiLCJDdG9yIiwiaW5zdCIsInByb3RvdHlwZSIsInJlbmRlciIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwiZG9SZW5kZXIiLCJuZXh0QmFzZSIsInNwbGljZSIsInN0YXRlIiwic2V0Q29tcG9uZW50UHJvcHMiLCJyZW5kZXJNb2RlIiwiX2Rpc2FibGUiLCJfX3JlZiIsImdldERlcml2ZWRTdGF0ZUZyb21Qcm9wcyIsImJhc2UiLCJjb21wb25lbnRXaWxsTW91bnQiLCJjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzIiwicHJldkNvbnRleHQiLCJwcmV2UHJvcHMiLCJzeW5jQ29tcG9uZW50VXBkYXRlcyIsImlzQ2hpbGQiLCJwcmV2aW91c1Byb3BzIiwicHJldmlvdXNTdGF0ZSIsInByZXZTdGF0ZSIsInByZXZpb3VzQ29udGV4dCIsImlzVXBkYXRlIiwiaW5pdGlhbEJhc2UiLCJpbml0aWFsQ2hpbGRDb21wb25lbnQiLCJza2lwIiwic25hcHNob3QiLCJyZW5kZXJlZCIsImNiYXNlIiwic2hvdWxkQ29tcG9uZW50VXBkYXRlIiwiY29tcG9uZW50V2lsbFVwZGF0ZSIsImdldENoaWxkQ29udGV4dCIsImdldFNuYXBzaG90QmVmb3JlVXBkYXRlIiwiY2hpbGRDb21wb25lbnQiLCJ0b1VubW91bnQiLCJjaGlsZFByb3BzIiwiX3BhcmVudENvbXBvbmVudCIsImJhc2VQYXJlbnQiLCJjb21wb25lbnRSZWYiLCJ0IiwiY29tcG9uZW50RGlkVXBkYXRlIiwiYWZ0ZXJVcGRhdGUiLCJfcmVuZGVyQ2FsbGJhY2tzIiwib3JpZ2luYWxDb21wb25lbnQiLCJvbGREb20iLCJpc0RpcmVjdE93bmVyIiwiaXNPd25lciIsImJlZm9yZVVubW91bnQiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsImlubmVyIiwic2V0U3RhdGUiLCJjYWxsYmFjayIsImZvcmNlVXBkYXRlIiwibWVyZ2UiLCJjcmVhdGVSZWYiLCJwcmVhY3QiXSwibWFwcGluZ3MiOiJBQUFBLElBQUlBLEtBQUssR0FBRyxTQUFTQSxLQUFULEdBQWlCLENBQUUsQ0FBL0I7O0FBRUEsSUFBSUMsT0FBTyxHQUFHLEVBQWQ7QUFF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TUFBTSxHQUFHO0FBQ1oxTSxFQUFBQSxDQUFDLEVBQUVBLENBRFM7QUFFWnVELEVBQUFBLGFBQWEsRUFBRXZELENBRkg7QUFHWjhCLEVBQUFBLFlBQVksRUFBRUEsWUFIRjtBQUlaMkssRUFBQUEsU0FBUyxFQUFFQSxTQUpDO0FBS1p0RCxFQUFBQSxTQUFTLEVBQUVBLFNBTEM7QUFNWkQsRUFBQUEsTUFBTSxFQUFFQSxNQU5JO0FBT1ozRyxFQUFBQSxRQUFRLEVBQUVBLFFBUEU7QUFRWjFDLEVBQUFBLE9BQU8sRUFBRUE7QUFSRyxDQUFiO0FBV0EsZUFBZTZNLE1BQWY7QUFDQSxTQUFTMU0sQ0FBVCxFQUFZQSxDQUFDLElBQUl1RCxhQUFqQixFQUFnQ3pCLFlBQWhDLEVBQThDMkssU0FBOUMsRUFBeUR0RCxTQUF6RCxFQUFvRUQsTUFBcEUsRUFBNEUzRyxRQUE1RSxFQUFzRjFDLE9BQXRGIiwic291cmNlc0NvbnRlbnQiOlsidmFyIFZOb2RlID0gZnVuY3Rpb24gVk5vZGUoKSB7fTtcblxudmFyIG9wdGlvbnMgPSB7fTtcblxudmFyIHN0YWNrID0gW107XG5cbnZhciBFTVBUWV9DSElMRFJFTiA9IFtdO1xuXG5mdW5jdGlvbiBoKG5vZGVOYW1lLCBhdHRyaWJ1dGVzKSB7XG5cdHZhciBjaGlsZHJlbiA9IEVNUFRZX0NISUxEUkVOLFxuXHQgICAgbGFzdFNpbXBsZSxcblx0ICAgIGNoaWxkLFxuXHQgICAgc2ltcGxlLFxuXHQgICAgaTtcblx0Zm9yIChpID0gYXJndW1lbnRzLmxlbmd0aDsgaS0tID4gMjspIHtcblx0XHRzdGFjay5wdXNoKGFyZ3VtZW50c1tpXSk7XG5cdH1cblx0aWYgKGF0dHJpYnV0ZXMgJiYgYXR0cmlidXRlcy5jaGlsZHJlbiAhPSBudWxsKSB7XG5cdFx0aWYgKCFzdGFjay5sZW5ndGgpIHN0YWNrLnB1c2goYXR0cmlidXRlcy5jaGlsZHJlbik7XG5cdFx0ZGVsZXRlIGF0dHJpYnV0ZXMuY2hpbGRyZW47XG5cdH1cblx0d2hpbGUgKHN0YWNrLmxlbmd0aCkge1xuXHRcdGlmICgoY2hpbGQgPSBzdGFjay5wb3AoKSkgJiYgY2hpbGQucG9wICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGZvciAoaSA9IGNoaWxkLmxlbmd0aDsgaS0tOykge1xuXHRcdFx0XHRzdGFjay5wdXNoKGNoaWxkW2ldKTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKHR5cGVvZiBjaGlsZCA9PT0gJ2Jvb2xlYW4nKSBjaGlsZCA9IG51bGw7XG5cblx0XHRcdGlmIChzaW1wbGUgPSB0eXBlb2Ygbm9kZU5hbWUgIT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0aWYgKGNoaWxkID09IG51bGwpIGNoaWxkID0gJyc7ZWxzZSBpZiAodHlwZW9mIGNoaWxkID09PSAnbnVtYmVyJykgY2hpbGQgPSBTdHJpbmcoY2hpbGQpO2Vsc2UgaWYgKHR5cGVvZiBjaGlsZCAhPT0gJ3N0cmluZycpIHNpbXBsZSA9IGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc2ltcGxlICYmIGxhc3RTaW1wbGUpIHtcblx0XHRcdFx0Y2hpbGRyZW5bY2hpbGRyZW4ubGVuZ3RoIC0gMV0gKz0gY2hpbGQ7XG5cdFx0XHR9IGVsc2UgaWYgKGNoaWxkcmVuID09PSBFTVBUWV9DSElMRFJFTikge1xuXHRcdFx0XHRjaGlsZHJlbiA9IFtjaGlsZF07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjaGlsZHJlbi5wdXNoKGNoaWxkKTtcblx0XHRcdH1cblxuXHRcdFx0bGFzdFNpbXBsZSA9IHNpbXBsZTtcblx0XHR9XG5cdH1cblxuXHR2YXIgcCA9IG5ldyBWTm9kZSgpO1xuXHRwLm5vZGVOYW1lID0gbm9kZU5hbWU7XG5cdHAuY2hpbGRyZW4gPSBjaGlsZHJlbjtcblx0cC5hdHRyaWJ1dGVzID0gYXR0cmlidXRlcyA9PSBudWxsID8gdW5kZWZpbmVkIDogYXR0cmlidXRlcztcblx0cC5rZXkgPSBhdHRyaWJ1dGVzID09IG51bGwgPyB1bmRlZmluZWQgOiBhdHRyaWJ1dGVzLmtleTtcblxuXHRpZiAob3B0aW9ucy52bm9kZSAhPT0gdW5kZWZpbmVkKSBvcHRpb25zLnZub2RlKHApO1xuXG5cdHJldHVybiBwO1xufVxuXG5mdW5jdGlvbiBleHRlbmQob2JqLCBwcm9wcykge1xuICBmb3IgKHZhciBpIGluIHByb3BzKSB7XG4gICAgb2JqW2ldID0gcHJvcHNbaV07XG4gIH1yZXR1cm4gb2JqO1xufVxuXG5mdW5jdGlvbiBhcHBseVJlZihyZWYsIHZhbHVlKSB7XG4gIGlmIChyZWYpIHtcbiAgICBpZiAodHlwZW9mIHJlZiA9PSAnZnVuY3Rpb24nKSByZWYodmFsdWUpO2Vsc2UgcmVmLmN1cnJlbnQgPSB2YWx1ZTtcbiAgfVxufVxuXG52YXIgZGVmZXIgPSB0eXBlb2YgUHJvbWlzZSA9PSAnZnVuY3Rpb24nID8gUHJvbWlzZS5yZXNvbHZlKCkudGhlbi5iaW5kKFByb21pc2UucmVzb2x2ZSgpKSA6IHNldFRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGNsb25lRWxlbWVudCh2bm9kZSwgcHJvcHMpIHtcbiAgcmV0dXJuIGgodm5vZGUubm9kZU5hbWUsIGV4dGVuZChleHRlbmQoe30sIHZub2RlLmF0dHJpYnV0ZXMpLCBwcm9wcyksIGFyZ3VtZW50cy5sZW5ndGggPiAyID8gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpIDogdm5vZGUuY2hpbGRyZW4pO1xufVxuXG52YXIgSVNfTk9OX0RJTUVOU0lPTkFMID0gL2FjaXR8ZXgoPzpzfGd8bnxwfCQpfHJwaHxvd3N8bW5jfG50d3xpbmVbY2hdfHpvb3xeb3JkL2k7XG5cbnZhciBpdGVtcyA9IFtdO1xuXG5mdW5jdGlvbiBlbnF1ZXVlUmVuZGVyKGNvbXBvbmVudCkge1xuXHRpZiAoIWNvbXBvbmVudC5fZGlydHkgJiYgKGNvbXBvbmVudC5fZGlydHkgPSB0cnVlKSAmJiBpdGVtcy5wdXNoKGNvbXBvbmVudCkgPT0gMSkge1xuXHRcdChvcHRpb25zLmRlYm91bmNlUmVuZGVyaW5nIHx8IGRlZmVyKShyZXJlbmRlcik7XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVyZW5kZXIoKSB7XG5cdHZhciBwO1xuXHR3aGlsZSAocCA9IGl0ZW1zLnBvcCgpKSB7XG5cdFx0aWYgKHAuX2RpcnR5KSByZW5kZXJDb21wb25lbnQocCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gaXNTYW1lTm9kZVR5cGUobm9kZSwgdm5vZGUsIGh5ZHJhdGluZykge1xuXHRpZiAodHlwZW9mIHZub2RlID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygdm5vZGUgPT09ICdudW1iZXInKSB7XG5cdFx0cmV0dXJuIG5vZGUuc3BsaXRUZXh0ICE9PSB1bmRlZmluZWQ7XG5cdH1cblx0aWYgKHR5cGVvZiB2bm9kZS5ub2RlTmFtZSA9PT0gJ3N0cmluZycpIHtcblx0XHRyZXR1cm4gIW5vZGUuX2NvbXBvbmVudENvbnN0cnVjdG9yICYmIGlzTmFtZWROb2RlKG5vZGUsIHZub2RlLm5vZGVOYW1lKTtcblx0fVxuXHRyZXR1cm4gaHlkcmF0aW5nIHx8IG5vZGUuX2NvbXBvbmVudENvbnN0cnVjdG9yID09PSB2bm9kZS5ub2RlTmFtZTtcbn1cblxuZnVuY3Rpb24gaXNOYW1lZE5vZGUobm9kZSwgbm9kZU5hbWUpIHtcblx0cmV0dXJuIG5vZGUubm9ybWFsaXplZE5vZGVOYW1lID09PSBub2RlTmFtZSB8fCBub2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IG5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XG59XG5cbmZ1bmN0aW9uIGdldE5vZGVQcm9wcyh2bm9kZSkge1xuXHR2YXIgcHJvcHMgPSBleHRlbmQoe30sIHZub2RlLmF0dHJpYnV0ZXMpO1xuXHRwcm9wcy5jaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuO1xuXG5cdHZhciBkZWZhdWx0UHJvcHMgPSB2bm9kZS5ub2RlTmFtZS5kZWZhdWx0UHJvcHM7XG5cdGlmIChkZWZhdWx0UHJvcHMgIT09IHVuZGVmaW5lZCkge1xuXHRcdGZvciAodmFyIGkgaW4gZGVmYXVsdFByb3BzKSB7XG5cdFx0XHRpZiAocHJvcHNbaV0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRwcm9wc1tpXSA9IGRlZmF1bHRQcm9wc1tpXTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gcHJvcHM7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU5vZGUobm9kZU5hbWUsIGlzU3ZnKSB7XG5cdHZhciBub2RlID0gaXNTdmcgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgbm9kZU5hbWUpIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudChub2RlTmFtZSk7XG5cdG5vZGUubm9ybWFsaXplZE5vZGVOYW1lID0gbm9kZU5hbWU7XG5cdHJldHVybiBub2RlO1xufVxuXG5mdW5jdGlvbiByZW1vdmVOb2RlKG5vZGUpIHtcblx0dmFyIHBhcmVudE5vZGUgPSBub2RlLnBhcmVudE5vZGU7XG5cdGlmIChwYXJlbnROb2RlKSBwYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xufVxuXG5mdW5jdGlvbiBzZXRBY2Nlc3Nvcihub2RlLCBuYW1lLCBvbGQsIHZhbHVlLCBpc1N2Zykge1xuXHRpZiAobmFtZSA9PT0gJ2NsYXNzTmFtZScpIG5hbWUgPSAnY2xhc3MnO1xuXG5cdGlmIChuYW1lID09PSAna2V5Jykge30gZWxzZSBpZiAobmFtZSA9PT0gJ3JlZicpIHtcblx0XHRhcHBseVJlZihvbGQsIG51bGwpO1xuXHRcdGFwcGx5UmVmKHZhbHVlLCBub2RlKTtcblx0fSBlbHNlIGlmIChuYW1lID09PSAnY2xhc3MnICYmICFpc1N2Zykge1xuXHRcdG5vZGUuY2xhc3NOYW1lID0gdmFsdWUgfHwgJyc7XG5cdH0gZWxzZSBpZiAobmFtZSA9PT0gJ3N0eWxlJykge1xuXHRcdGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygb2xkID09PSAnc3RyaW5nJykge1xuXHRcdFx0bm9kZS5zdHlsZS5jc3NUZXh0ID0gdmFsdWUgfHwgJyc7XG5cdFx0fVxuXHRcdGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRpZiAodHlwZW9mIG9sZCAhPT0gJ3N0cmluZycpIHtcblx0XHRcdFx0Zm9yICh2YXIgaSBpbiBvbGQpIHtcblx0XHRcdFx0XHRpZiAoIShpIGluIHZhbHVlKSkgbm9kZS5zdHlsZVtpXSA9ICcnO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRmb3IgKHZhciBpIGluIHZhbHVlKSB7XG5cdFx0XHRcdG5vZGUuc3R5bGVbaV0gPSB0eXBlb2YgdmFsdWVbaV0gPT09ICdudW1iZXInICYmIElTX05PTl9ESU1FTlNJT05BTC50ZXN0KGkpID09PSBmYWxzZSA/IHZhbHVlW2ldICsgJ3B4JyA6IHZhbHVlW2ldO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIGlmIChuYW1lID09PSAnZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUwnKSB7XG5cdFx0aWYgKHZhbHVlKSBub2RlLmlubmVySFRNTCA9IHZhbHVlLl9faHRtbCB8fCAnJztcblx0fSBlbHNlIGlmIChuYW1lWzBdID09ICdvJyAmJiBuYW1lWzFdID09ICduJykge1xuXHRcdHZhciB1c2VDYXB0dXJlID0gbmFtZSAhPT0gKG5hbWUgPSBuYW1lLnJlcGxhY2UoL0NhcHR1cmUkLywgJycpKTtcblx0XHRuYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpLnN1YnN0cmluZygyKTtcblx0XHRpZiAodmFsdWUpIHtcblx0XHRcdGlmICghb2xkKSBub2RlLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgZXZlbnRQcm94eSwgdXNlQ2FwdHVyZSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBldmVudFByb3h5LCB1c2VDYXB0dXJlKTtcblx0XHR9XG5cdFx0KG5vZGUuX2xpc3RlbmVycyB8fCAobm9kZS5fbGlzdGVuZXJzID0ge30pKVtuYW1lXSA9IHZhbHVlO1xuXHR9IGVsc2UgaWYgKG5hbWUgIT09ICdsaXN0JyAmJiBuYW1lICE9PSAndHlwZScgJiYgIWlzU3ZnICYmIG5hbWUgaW4gbm9kZSkge1xuXHRcdHRyeSB7XG5cdFx0XHRub2RlW25hbWVdID0gdmFsdWUgPT0gbnVsbCA/ICcnIDogdmFsdWU7XG5cdFx0fSBjYXRjaCAoZSkge31cblx0XHRpZiAoKHZhbHVlID09IG51bGwgfHwgdmFsdWUgPT09IGZhbHNlKSAmJiBuYW1lICE9ICdzcGVsbGNoZWNrJykgbm9kZS5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG5cdH0gZWxzZSB7XG5cdFx0dmFyIG5zID0gaXNTdmcgJiYgbmFtZSAhPT0gKG5hbWUgPSBuYW1lLnJlcGxhY2UoL154bGluazo/LywgJycpKTtcblxuXHRcdGlmICh2YWx1ZSA9PSBudWxsIHx8IHZhbHVlID09PSBmYWxzZSkge1xuXHRcdFx0aWYgKG5zKSBub2RlLnJlbW92ZUF0dHJpYnV0ZU5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJywgbmFtZS50b0xvd2VyQ2FzZSgpKTtlbHNlIG5vZGUucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlICE9PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRpZiAobnMpIG5vZGUuc2V0QXR0cmlidXRlTlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnLCBuYW1lLnRvTG93ZXJDYXNlKCksIHZhbHVlKTtlbHNlIG5vZGUuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gZXZlbnRQcm94eShlKSB7XG5cdHJldHVybiB0aGlzLl9saXN0ZW5lcnNbZS50eXBlXShvcHRpb25zLmV2ZW50ICYmIG9wdGlvbnMuZXZlbnQoZSkgfHwgZSk7XG59XG5cbnZhciBtb3VudHMgPSBbXTtcblxudmFyIGRpZmZMZXZlbCA9IDA7XG5cbnZhciBpc1N2Z01vZGUgPSBmYWxzZTtcblxudmFyIGh5ZHJhdGluZyA9IGZhbHNlO1xuXG5mdW5jdGlvbiBmbHVzaE1vdW50cygpIHtcblx0dmFyIGM7XG5cdHdoaWxlIChjID0gbW91bnRzLnNoaWZ0KCkpIHtcblx0XHRpZiAob3B0aW9ucy5hZnRlck1vdW50KSBvcHRpb25zLmFmdGVyTW91bnQoYyk7XG5cdFx0aWYgKGMuY29tcG9uZW50RGlkTW91bnQpIGMuY29tcG9uZW50RGlkTW91bnQoKTtcblx0fVxufVxuXG5mdW5jdGlvbiBkaWZmKGRvbSwgdm5vZGUsIGNvbnRleHQsIG1vdW50QWxsLCBwYXJlbnQsIGNvbXBvbmVudFJvb3QpIHtcblx0aWYgKCFkaWZmTGV2ZWwrKykge1xuXHRcdGlzU3ZnTW9kZSA9IHBhcmVudCAhPSBudWxsICYmIHBhcmVudC5vd25lclNWR0VsZW1lbnQgIT09IHVuZGVmaW5lZDtcblxuXHRcdGh5ZHJhdGluZyA9IGRvbSAhPSBudWxsICYmICEoJ19fcHJlYWN0YXR0cl8nIGluIGRvbSk7XG5cdH1cblxuXHR2YXIgcmV0ID0gaWRpZmYoZG9tLCB2bm9kZSwgY29udGV4dCwgbW91bnRBbGwsIGNvbXBvbmVudFJvb3QpO1xuXG5cdGlmIChwYXJlbnQgJiYgcmV0LnBhcmVudE5vZGUgIT09IHBhcmVudCkgcGFyZW50LmFwcGVuZENoaWxkKHJldCk7XG5cblx0aWYgKCEgLS1kaWZmTGV2ZWwpIHtcblx0XHRoeWRyYXRpbmcgPSBmYWxzZTtcblxuXHRcdGlmICghY29tcG9uZW50Um9vdCkgZmx1c2hNb3VudHMoKTtcblx0fVxuXG5cdHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIGlkaWZmKGRvbSwgdm5vZGUsIGNvbnRleHQsIG1vdW50QWxsLCBjb21wb25lbnRSb290KSB7XG5cdHZhciBvdXQgPSBkb20sXG5cdCAgICBwcmV2U3ZnTW9kZSA9IGlzU3ZnTW9kZTtcblxuXHRpZiAodm5vZGUgPT0gbnVsbCB8fCB0eXBlb2Ygdm5vZGUgPT09ICdib29sZWFuJykgdm5vZGUgPSAnJztcblxuXHRpZiAodHlwZW9mIHZub2RlID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygdm5vZGUgPT09ICdudW1iZXInKSB7XG5cdFx0aWYgKGRvbSAmJiBkb20uc3BsaXRUZXh0ICE9PSB1bmRlZmluZWQgJiYgZG9tLnBhcmVudE5vZGUgJiYgKCFkb20uX2NvbXBvbmVudCB8fCBjb21wb25lbnRSb290KSkge1xuXHRcdFx0aWYgKGRvbS5ub2RlVmFsdWUgIT0gdm5vZGUpIHtcblx0XHRcdFx0ZG9tLm5vZGVWYWx1ZSA9IHZub2RlO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHRvdXQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh2bm9kZSk7XG5cdFx0XHRpZiAoZG9tKSB7XG5cdFx0XHRcdGlmIChkb20ucGFyZW50Tm9kZSkgZG9tLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG91dCwgZG9tKTtcblx0XHRcdFx0cmVjb2xsZWN0Tm9kZVRyZWUoZG9tLCB0cnVlKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRvdXRbJ19fcHJlYWN0YXR0cl8nXSA9IHRydWU7XG5cblx0XHRyZXR1cm4gb3V0O1xuXHR9XG5cblx0dmFyIHZub2RlTmFtZSA9IHZub2RlLm5vZGVOYW1lO1xuXHRpZiAodHlwZW9mIHZub2RlTmFtZSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiBidWlsZENvbXBvbmVudEZyb21WTm9kZShkb20sIHZub2RlLCBjb250ZXh0LCBtb3VudEFsbCk7XG5cdH1cblxuXHRpc1N2Z01vZGUgPSB2bm9kZU5hbWUgPT09ICdzdmcnID8gdHJ1ZSA6IHZub2RlTmFtZSA9PT0gJ2ZvcmVpZ25PYmplY3QnID8gZmFsc2UgOiBpc1N2Z01vZGU7XG5cblx0dm5vZGVOYW1lID0gU3RyaW5nKHZub2RlTmFtZSk7XG5cdGlmICghZG9tIHx8ICFpc05hbWVkTm9kZShkb20sIHZub2RlTmFtZSkpIHtcblx0XHRvdXQgPSBjcmVhdGVOb2RlKHZub2RlTmFtZSwgaXNTdmdNb2RlKTtcblxuXHRcdGlmIChkb20pIHtcblx0XHRcdHdoaWxlIChkb20uZmlyc3RDaGlsZCkge1xuXHRcdFx0XHRvdXQuYXBwZW5kQ2hpbGQoZG9tLmZpcnN0Q2hpbGQpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGRvbS5wYXJlbnROb2RlKSBkb20ucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQob3V0LCBkb20pO1xuXG5cdFx0XHRyZWNvbGxlY3ROb2RlVHJlZShkb20sIHRydWUpO1xuXHRcdH1cblx0fVxuXG5cdHZhciBmYyA9IG91dC5maXJzdENoaWxkLFxuXHQgICAgcHJvcHMgPSBvdXRbJ19fcHJlYWN0YXR0cl8nXSxcblx0ICAgIHZjaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuO1xuXG5cdGlmIChwcm9wcyA9PSBudWxsKSB7XG5cdFx0cHJvcHMgPSBvdXRbJ19fcHJlYWN0YXR0cl8nXSA9IHt9O1xuXHRcdGZvciAodmFyIGEgPSBvdXQuYXR0cmlidXRlcywgaSA9IGEubGVuZ3RoOyBpLS07KSB7XG5cdFx0XHRwcm9wc1thW2ldLm5hbWVdID0gYVtpXS52YWx1ZTtcblx0XHR9XG5cdH1cblxuXHRpZiAoIWh5ZHJhdGluZyAmJiB2Y2hpbGRyZW4gJiYgdmNoaWxkcmVuLmxlbmd0aCA9PT0gMSAmJiB0eXBlb2YgdmNoaWxkcmVuWzBdID09PSAnc3RyaW5nJyAmJiBmYyAhPSBudWxsICYmIGZjLnNwbGl0VGV4dCAhPT0gdW5kZWZpbmVkICYmIGZjLm5leHRTaWJsaW5nID09IG51bGwpIHtcblx0XHRpZiAoZmMubm9kZVZhbHVlICE9IHZjaGlsZHJlblswXSkge1xuXHRcdFx0ZmMubm9kZVZhbHVlID0gdmNoaWxkcmVuWzBdO1xuXHRcdH1cblx0fSBlbHNlIGlmICh2Y2hpbGRyZW4gJiYgdmNoaWxkcmVuLmxlbmd0aCB8fCBmYyAhPSBudWxsKSB7XG5cdFx0XHRpbm5lckRpZmZOb2RlKG91dCwgdmNoaWxkcmVuLCBjb250ZXh0LCBtb3VudEFsbCwgaHlkcmF0aW5nIHx8IHByb3BzLmRhbmdlcm91c2x5U2V0SW5uZXJIVE1MICE9IG51bGwpO1xuXHRcdH1cblxuXHRkaWZmQXR0cmlidXRlcyhvdXQsIHZub2RlLmF0dHJpYnV0ZXMsIHByb3BzKTtcblxuXHRpc1N2Z01vZGUgPSBwcmV2U3ZnTW9kZTtcblxuXHRyZXR1cm4gb3V0O1xufVxuXG5mdW5jdGlvbiBpbm5lckRpZmZOb2RlKGRvbSwgdmNoaWxkcmVuLCBjb250ZXh0LCBtb3VudEFsbCwgaXNIeWRyYXRpbmcpIHtcblx0dmFyIG9yaWdpbmFsQ2hpbGRyZW4gPSBkb20uY2hpbGROb2Rlcyxcblx0ICAgIGNoaWxkcmVuID0gW10sXG5cdCAgICBrZXllZCA9IHt9LFxuXHQgICAga2V5ZWRMZW4gPSAwLFxuXHQgICAgbWluID0gMCxcblx0ICAgIGxlbiA9IG9yaWdpbmFsQ2hpbGRyZW4ubGVuZ3RoLFxuXHQgICAgY2hpbGRyZW5MZW4gPSAwLFxuXHQgICAgdmxlbiA9IHZjaGlsZHJlbiA/IHZjaGlsZHJlbi5sZW5ndGggOiAwLFxuXHQgICAgaixcblx0ICAgIGMsXG5cdCAgICBmLFxuXHQgICAgdmNoaWxkLFxuXHQgICAgY2hpbGQ7XG5cblx0aWYgKGxlbiAhPT0gMCkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdHZhciBfY2hpbGQgPSBvcmlnaW5hbENoaWxkcmVuW2ldLFxuXHRcdFx0ICAgIHByb3BzID0gX2NoaWxkWydfX3ByZWFjdGF0dHJfJ10sXG5cdFx0XHQgICAga2V5ID0gdmxlbiAmJiBwcm9wcyA/IF9jaGlsZC5fY29tcG9uZW50ID8gX2NoaWxkLl9jb21wb25lbnQuX19rZXkgOiBwcm9wcy5rZXkgOiBudWxsO1xuXHRcdFx0aWYgKGtleSAhPSBudWxsKSB7XG5cdFx0XHRcdGtleWVkTGVuKys7XG5cdFx0XHRcdGtleWVkW2tleV0gPSBfY2hpbGQ7XG5cdFx0XHR9IGVsc2UgaWYgKHByb3BzIHx8IChfY2hpbGQuc3BsaXRUZXh0ICE9PSB1bmRlZmluZWQgPyBpc0h5ZHJhdGluZyA/IF9jaGlsZC5ub2RlVmFsdWUudHJpbSgpIDogdHJ1ZSA6IGlzSHlkcmF0aW5nKSkge1xuXHRcdFx0XHRjaGlsZHJlbltjaGlsZHJlbkxlbisrXSA9IF9jaGlsZDtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRpZiAodmxlbiAhPT0gMCkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdmxlbjsgaSsrKSB7XG5cdFx0XHR2Y2hpbGQgPSB2Y2hpbGRyZW5baV07XG5cdFx0XHRjaGlsZCA9IG51bGw7XG5cblx0XHRcdHZhciBrZXkgPSB2Y2hpbGQua2V5O1xuXHRcdFx0aWYgKGtleSAhPSBudWxsKSB7XG5cdFx0XHRcdGlmIChrZXllZExlbiAmJiBrZXllZFtrZXldICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0XHRjaGlsZCA9IGtleWVkW2tleV07XG5cdFx0XHRcdFx0a2V5ZWRba2V5XSA9IHVuZGVmaW5lZDtcblx0XHRcdFx0XHRrZXllZExlbi0tO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKG1pbiA8IGNoaWxkcmVuTGVuKSB7XG5cdFx0XHRcdFx0Zm9yIChqID0gbWluOyBqIDwgY2hpbGRyZW5MZW47IGorKykge1xuXHRcdFx0XHRcdFx0aWYgKGNoaWxkcmVuW2pdICE9PSB1bmRlZmluZWQgJiYgaXNTYW1lTm9kZVR5cGUoYyA9IGNoaWxkcmVuW2pdLCB2Y2hpbGQsIGlzSHlkcmF0aW5nKSkge1xuXHRcdFx0XHRcdFx0XHRjaGlsZCA9IGM7XG5cdFx0XHRcdFx0XHRcdGNoaWxkcmVuW2pdID0gdW5kZWZpbmVkO1xuXHRcdFx0XHRcdFx0XHRpZiAoaiA9PT0gY2hpbGRyZW5MZW4gLSAxKSBjaGlsZHJlbkxlbi0tO1xuXHRcdFx0XHRcdFx0XHRpZiAoaiA9PT0gbWluKSBtaW4rKztcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdGNoaWxkID0gaWRpZmYoY2hpbGQsIHZjaGlsZCwgY29udGV4dCwgbW91bnRBbGwpO1xuXG5cdFx0XHRmID0gb3JpZ2luYWxDaGlsZHJlbltpXTtcblx0XHRcdGlmIChjaGlsZCAmJiBjaGlsZCAhPT0gZG9tICYmIGNoaWxkICE9PSBmKSB7XG5cdFx0XHRcdGlmIChmID09IG51bGwpIHtcblx0XHRcdFx0XHRkb20uYXBwZW5kQ2hpbGQoY2hpbGQpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGNoaWxkID09PSBmLm5leHRTaWJsaW5nKSB7XG5cdFx0XHRcdFx0cmVtb3ZlTm9kZShmKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRkb20uaW5zZXJ0QmVmb3JlKGNoaWxkLCBmKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGlmIChrZXllZExlbikge1xuXHRcdGZvciAodmFyIGkgaW4ga2V5ZWQpIHtcblx0XHRcdGlmIChrZXllZFtpXSAhPT0gdW5kZWZpbmVkKSByZWNvbGxlY3ROb2RlVHJlZShrZXllZFtpXSwgZmFsc2UpO1xuXHRcdH1cblx0fVxuXG5cdHdoaWxlIChtaW4gPD0gY2hpbGRyZW5MZW4pIHtcblx0XHRpZiAoKGNoaWxkID0gY2hpbGRyZW5bY2hpbGRyZW5MZW4tLV0pICE9PSB1bmRlZmluZWQpIHJlY29sbGVjdE5vZGVUcmVlKGNoaWxkLCBmYWxzZSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVjb2xsZWN0Tm9kZVRyZWUobm9kZSwgdW5tb3VudE9ubHkpIHtcblx0dmFyIGNvbXBvbmVudCA9IG5vZGUuX2NvbXBvbmVudDtcblx0aWYgKGNvbXBvbmVudCkge1xuXHRcdHVubW91bnRDb21wb25lbnQoY29tcG9uZW50KTtcblx0fSBlbHNlIHtcblx0XHRpZiAobm9kZVsnX19wcmVhY3RhdHRyXyddICE9IG51bGwpIGFwcGx5UmVmKG5vZGVbJ19fcHJlYWN0YXR0cl8nXS5yZWYsIG51bGwpO1xuXG5cdFx0aWYgKHVubW91bnRPbmx5ID09PSBmYWxzZSB8fCBub2RlWydfX3ByZWFjdGF0dHJfJ10gPT0gbnVsbCkge1xuXHRcdFx0cmVtb3ZlTm9kZShub2RlKTtcblx0XHR9XG5cblx0XHRyZW1vdmVDaGlsZHJlbihub2RlKTtcblx0fVxufVxuXG5mdW5jdGlvbiByZW1vdmVDaGlsZHJlbihub2RlKSB7XG5cdG5vZGUgPSBub2RlLmxhc3RDaGlsZDtcblx0d2hpbGUgKG5vZGUpIHtcblx0XHR2YXIgbmV4dCA9IG5vZGUucHJldmlvdXNTaWJsaW5nO1xuXHRcdHJlY29sbGVjdE5vZGVUcmVlKG5vZGUsIHRydWUpO1xuXHRcdG5vZGUgPSBuZXh0O1xuXHR9XG59XG5cbmZ1bmN0aW9uIGRpZmZBdHRyaWJ1dGVzKGRvbSwgYXR0cnMsIG9sZCkge1xuXHR2YXIgbmFtZTtcblxuXHRmb3IgKG5hbWUgaW4gb2xkKSB7XG5cdFx0aWYgKCEoYXR0cnMgJiYgYXR0cnNbbmFtZV0gIT0gbnVsbCkgJiYgb2xkW25hbWVdICE9IG51bGwpIHtcblx0XHRcdHNldEFjY2Vzc29yKGRvbSwgbmFtZSwgb2xkW25hbWVdLCBvbGRbbmFtZV0gPSB1bmRlZmluZWQsIGlzU3ZnTW9kZSk7XG5cdFx0fVxuXHR9XG5cblx0Zm9yIChuYW1lIGluIGF0dHJzKSB7XG5cdFx0aWYgKG5hbWUgIT09ICdjaGlsZHJlbicgJiYgbmFtZSAhPT0gJ2lubmVySFRNTCcgJiYgKCEobmFtZSBpbiBvbGQpIHx8IGF0dHJzW25hbWVdICE9PSAobmFtZSA9PT0gJ3ZhbHVlJyB8fCBuYW1lID09PSAnY2hlY2tlZCcgPyBkb21bbmFtZV0gOiBvbGRbbmFtZV0pKSkge1xuXHRcdFx0c2V0QWNjZXNzb3IoZG9tLCBuYW1lLCBvbGRbbmFtZV0sIG9sZFtuYW1lXSA9IGF0dHJzW25hbWVdLCBpc1N2Z01vZGUpO1xuXHRcdH1cblx0fVxufVxuXG52YXIgcmVjeWNsZXJDb21wb25lbnRzID0gW107XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvbXBvbmVudChDdG9yLCBwcm9wcywgY29udGV4dCkge1xuXHR2YXIgaW5zdCxcblx0ICAgIGkgPSByZWN5Y2xlckNvbXBvbmVudHMubGVuZ3RoO1xuXG5cdGlmIChDdG9yLnByb3RvdHlwZSAmJiBDdG9yLnByb3RvdHlwZS5yZW5kZXIpIHtcblx0XHRpbnN0ID0gbmV3IEN0b3IocHJvcHMsIGNvbnRleHQpO1xuXHRcdENvbXBvbmVudC5jYWxsKGluc3QsIHByb3BzLCBjb250ZXh0KTtcblx0fSBlbHNlIHtcblx0XHRpbnN0ID0gbmV3IENvbXBvbmVudChwcm9wcywgY29udGV4dCk7XG5cdFx0aW5zdC5jb25zdHJ1Y3RvciA9IEN0b3I7XG5cdFx0aW5zdC5yZW5kZXIgPSBkb1JlbmRlcjtcblx0fVxuXG5cdHdoaWxlIChpLS0pIHtcblx0XHRpZiAocmVjeWNsZXJDb21wb25lbnRzW2ldLmNvbnN0cnVjdG9yID09PSBDdG9yKSB7XG5cdFx0XHRpbnN0Lm5leHRCYXNlID0gcmVjeWNsZXJDb21wb25lbnRzW2ldLm5leHRCYXNlO1xuXHRcdFx0cmVjeWNsZXJDb21wb25lbnRzLnNwbGljZShpLCAxKTtcblx0XHRcdHJldHVybiBpbnN0O1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBpbnN0O1xufVxuXG5mdW5jdGlvbiBkb1JlbmRlcihwcm9wcywgc3RhdGUsIGNvbnRleHQpIHtcblx0cmV0dXJuIHRoaXMuY29uc3RydWN0b3IocHJvcHMsIGNvbnRleHQpO1xufVxuXG5mdW5jdGlvbiBzZXRDb21wb25lbnRQcm9wcyhjb21wb25lbnQsIHByb3BzLCByZW5kZXJNb2RlLCBjb250ZXh0LCBtb3VudEFsbCkge1xuXHRpZiAoY29tcG9uZW50Ll9kaXNhYmxlKSByZXR1cm47XG5cdGNvbXBvbmVudC5fZGlzYWJsZSA9IHRydWU7XG5cblx0Y29tcG9uZW50Ll9fcmVmID0gcHJvcHMucmVmO1xuXHRjb21wb25lbnQuX19rZXkgPSBwcm9wcy5rZXk7XG5cdGRlbGV0ZSBwcm9wcy5yZWY7XG5cdGRlbGV0ZSBwcm9wcy5rZXk7XG5cblx0aWYgKHR5cGVvZiBjb21wb25lbnQuY29uc3RydWN0b3IuZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzID09PSAndW5kZWZpbmVkJykge1xuXHRcdGlmICghY29tcG9uZW50LmJhc2UgfHwgbW91bnRBbGwpIHtcblx0XHRcdGlmIChjb21wb25lbnQuY29tcG9uZW50V2lsbE1vdW50KSBjb21wb25lbnQuY29tcG9uZW50V2lsbE1vdW50KCk7XG5cdFx0fSBlbHNlIGlmIChjb21wb25lbnQuY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcykge1xuXHRcdFx0Y29tcG9uZW50LmNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMocHJvcHMsIGNvbnRleHQpO1xuXHRcdH1cblx0fVxuXG5cdGlmIChjb250ZXh0ICYmIGNvbnRleHQgIT09IGNvbXBvbmVudC5jb250ZXh0KSB7XG5cdFx0aWYgKCFjb21wb25lbnQucHJldkNvbnRleHQpIGNvbXBvbmVudC5wcmV2Q29udGV4dCA9IGNvbXBvbmVudC5jb250ZXh0O1xuXHRcdGNvbXBvbmVudC5jb250ZXh0ID0gY29udGV4dDtcblx0fVxuXG5cdGlmICghY29tcG9uZW50LnByZXZQcm9wcykgY29tcG9uZW50LnByZXZQcm9wcyA9IGNvbXBvbmVudC5wcm9wcztcblx0Y29tcG9uZW50LnByb3BzID0gcHJvcHM7XG5cblx0Y29tcG9uZW50Ll9kaXNhYmxlID0gZmFsc2U7XG5cblx0aWYgKHJlbmRlck1vZGUgIT09IDApIHtcblx0XHRpZiAocmVuZGVyTW9kZSA9PT0gMSB8fCBvcHRpb25zLnN5bmNDb21wb25lbnRVcGRhdGVzICE9PSBmYWxzZSB8fCAhY29tcG9uZW50LmJhc2UpIHtcblx0XHRcdHJlbmRlckNvbXBvbmVudChjb21wb25lbnQsIDEsIG1vdW50QWxsKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZW5xdWV1ZVJlbmRlcihjb21wb25lbnQpO1xuXHRcdH1cblx0fVxuXG5cdGFwcGx5UmVmKGNvbXBvbmVudC5fX3JlZiwgY29tcG9uZW50KTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50KGNvbXBvbmVudCwgcmVuZGVyTW9kZSwgbW91bnRBbGwsIGlzQ2hpbGQpIHtcblx0aWYgKGNvbXBvbmVudC5fZGlzYWJsZSkgcmV0dXJuO1xuXG5cdHZhciBwcm9wcyA9IGNvbXBvbmVudC5wcm9wcyxcblx0ICAgIHN0YXRlID0gY29tcG9uZW50LnN0YXRlLFxuXHQgICAgY29udGV4dCA9IGNvbXBvbmVudC5jb250ZXh0LFxuXHQgICAgcHJldmlvdXNQcm9wcyA9IGNvbXBvbmVudC5wcmV2UHJvcHMgfHwgcHJvcHMsXG5cdCAgICBwcmV2aW91c1N0YXRlID0gY29tcG9uZW50LnByZXZTdGF0ZSB8fCBzdGF0ZSxcblx0ICAgIHByZXZpb3VzQ29udGV4dCA9IGNvbXBvbmVudC5wcmV2Q29udGV4dCB8fCBjb250ZXh0LFxuXHQgICAgaXNVcGRhdGUgPSBjb21wb25lbnQuYmFzZSxcblx0ICAgIG5leHRCYXNlID0gY29tcG9uZW50Lm5leHRCYXNlLFxuXHQgICAgaW5pdGlhbEJhc2UgPSBpc1VwZGF0ZSB8fCBuZXh0QmFzZSxcblx0ICAgIGluaXRpYWxDaGlsZENvbXBvbmVudCA9IGNvbXBvbmVudC5fY29tcG9uZW50LFxuXHQgICAgc2tpcCA9IGZhbHNlLFxuXHQgICAgc25hcHNob3QgPSBwcmV2aW91c0NvbnRleHQsXG5cdCAgICByZW5kZXJlZCxcblx0ICAgIGluc3QsXG5cdCAgICBjYmFzZTtcblxuXHRpZiAoY29tcG9uZW50LmNvbnN0cnVjdG9yLmdldERlcml2ZWRTdGF0ZUZyb21Qcm9wcykge1xuXHRcdHN0YXRlID0gZXh0ZW5kKGV4dGVuZCh7fSwgc3RhdGUpLCBjb21wb25lbnQuY29uc3RydWN0b3IuZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzKHByb3BzLCBzdGF0ZSkpO1xuXHRcdGNvbXBvbmVudC5zdGF0ZSA9IHN0YXRlO1xuXHR9XG5cblx0aWYgKGlzVXBkYXRlKSB7XG5cdFx0Y29tcG9uZW50LnByb3BzID0gcHJldmlvdXNQcm9wcztcblx0XHRjb21wb25lbnQuc3RhdGUgPSBwcmV2aW91c1N0YXRlO1xuXHRcdGNvbXBvbmVudC5jb250ZXh0ID0gcHJldmlvdXNDb250ZXh0O1xuXHRcdGlmIChyZW5kZXJNb2RlICE9PSAyICYmIGNvbXBvbmVudC5zaG91bGRDb21wb25lbnRVcGRhdGUgJiYgY29tcG9uZW50LnNob3VsZENvbXBvbmVudFVwZGF0ZShwcm9wcywgc3RhdGUsIGNvbnRleHQpID09PSBmYWxzZSkge1xuXHRcdFx0c2tpcCA9IHRydWU7XG5cdFx0fSBlbHNlIGlmIChjb21wb25lbnQuY29tcG9uZW50V2lsbFVwZGF0ZSkge1xuXHRcdFx0Y29tcG9uZW50LmNvbXBvbmVudFdpbGxVcGRhdGUocHJvcHMsIHN0YXRlLCBjb250ZXh0KTtcblx0XHR9XG5cdFx0Y29tcG9uZW50LnByb3BzID0gcHJvcHM7XG5cdFx0Y29tcG9uZW50LnN0YXRlID0gc3RhdGU7XG5cdFx0Y29tcG9uZW50LmNvbnRleHQgPSBjb250ZXh0O1xuXHR9XG5cblx0Y29tcG9uZW50LnByZXZQcm9wcyA9IGNvbXBvbmVudC5wcmV2U3RhdGUgPSBjb21wb25lbnQucHJldkNvbnRleHQgPSBjb21wb25lbnQubmV4dEJhc2UgPSBudWxsO1xuXHRjb21wb25lbnQuX2RpcnR5ID0gZmFsc2U7XG5cblx0aWYgKCFza2lwKSB7XG5cdFx0cmVuZGVyZWQgPSBjb21wb25lbnQucmVuZGVyKHByb3BzLCBzdGF0ZSwgY29udGV4dCk7XG5cblx0XHRpZiAoY29tcG9uZW50LmdldENoaWxkQ29udGV4dCkge1xuXHRcdFx0Y29udGV4dCA9IGV4dGVuZChleHRlbmQoe30sIGNvbnRleHQpLCBjb21wb25lbnQuZ2V0Q2hpbGRDb250ZXh0KCkpO1xuXHRcdH1cblxuXHRcdGlmIChpc1VwZGF0ZSAmJiBjb21wb25lbnQuZ2V0U25hcHNob3RCZWZvcmVVcGRhdGUpIHtcblx0XHRcdHNuYXBzaG90ID0gY29tcG9uZW50LmdldFNuYXBzaG90QmVmb3JlVXBkYXRlKHByZXZpb3VzUHJvcHMsIHByZXZpb3VzU3RhdGUpO1xuXHRcdH1cblxuXHRcdHZhciBjaGlsZENvbXBvbmVudCA9IHJlbmRlcmVkICYmIHJlbmRlcmVkLm5vZGVOYW1lLFxuXHRcdCAgICB0b1VubW91bnQsXG5cdFx0ICAgIGJhc2U7XG5cblx0XHRpZiAodHlwZW9mIGNoaWxkQ29tcG9uZW50ID09PSAnZnVuY3Rpb24nKSB7XG5cblx0XHRcdHZhciBjaGlsZFByb3BzID0gZ2V0Tm9kZVByb3BzKHJlbmRlcmVkKTtcblx0XHRcdGluc3QgPSBpbml0aWFsQ2hpbGRDb21wb25lbnQ7XG5cblx0XHRcdGlmIChpbnN0ICYmIGluc3QuY29uc3RydWN0b3IgPT09IGNoaWxkQ29tcG9uZW50ICYmIGNoaWxkUHJvcHMua2V5ID09IGluc3QuX19rZXkpIHtcblx0XHRcdFx0c2V0Q29tcG9uZW50UHJvcHMoaW5zdCwgY2hpbGRQcm9wcywgMSwgY29udGV4dCwgZmFsc2UpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dG9Vbm1vdW50ID0gaW5zdDtcblxuXHRcdFx0XHRjb21wb25lbnQuX2NvbXBvbmVudCA9IGluc3QgPSBjcmVhdGVDb21wb25lbnQoY2hpbGRDb21wb25lbnQsIGNoaWxkUHJvcHMsIGNvbnRleHQpO1xuXHRcdFx0XHRpbnN0Lm5leHRCYXNlID0gaW5zdC5uZXh0QmFzZSB8fCBuZXh0QmFzZTtcblx0XHRcdFx0aW5zdC5fcGFyZW50Q29tcG9uZW50ID0gY29tcG9uZW50O1xuXHRcdFx0XHRzZXRDb21wb25lbnRQcm9wcyhpbnN0LCBjaGlsZFByb3BzLCAwLCBjb250ZXh0LCBmYWxzZSk7XG5cdFx0XHRcdHJlbmRlckNvbXBvbmVudChpbnN0LCAxLCBtb3VudEFsbCwgdHJ1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdGJhc2UgPSBpbnN0LmJhc2U7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNiYXNlID0gaW5pdGlhbEJhc2U7XG5cblx0XHRcdHRvVW5tb3VudCA9IGluaXRpYWxDaGlsZENvbXBvbmVudDtcblx0XHRcdGlmICh0b1VubW91bnQpIHtcblx0XHRcdFx0Y2Jhc2UgPSBjb21wb25lbnQuX2NvbXBvbmVudCA9IG51bGw7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChpbml0aWFsQmFzZSB8fCByZW5kZXJNb2RlID09PSAxKSB7XG5cdFx0XHRcdGlmIChjYmFzZSkgY2Jhc2UuX2NvbXBvbmVudCA9IG51bGw7XG5cdFx0XHRcdGJhc2UgPSBkaWZmKGNiYXNlLCByZW5kZXJlZCwgY29udGV4dCwgbW91bnRBbGwgfHwgIWlzVXBkYXRlLCBpbml0aWFsQmFzZSAmJiBpbml0aWFsQmFzZS5wYXJlbnROb2RlLCB0cnVlKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoaW5pdGlhbEJhc2UgJiYgYmFzZSAhPT0gaW5pdGlhbEJhc2UgJiYgaW5zdCAhPT0gaW5pdGlhbENoaWxkQ29tcG9uZW50KSB7XG5cdFx0XHR2YXIgYmFzZVBhcmVudCA9IGluaXRpYWxCYXNlLnBhcmVudE5vZGU7XG5cdFx0XHRpZiAoYmFzZVBhcmVudCAmJiBiYXNlICE9PSBiYXNlUGFyZW50KSB7XG5cdFx0XHRcdGJhc2VQYXJlbnQucmVwbGFjZUNoaWxkKGJhc2UsIGluaXRpYWxCYXNlKTtcblxuXHRcdFx0XHRpZiAoIXRvVW5tb3VudCkge1xuXHRcdFx0XHRcdGluaXRpYWxCYXNlLl9jb21wb25lbnQgPSBudWxsO1xuXHRcdFx0XHRcdHJlY29sbGVjdE5vZGVUcmVlKGluaXRpYWxCYXNlLCBmYWxzZSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAodG9Vbm1vdW50KSB7XG5cdFx0XHR1bm1vdW50Q29tcG9uZW50KHRvVW5tb3VudCk7XG5cdFx0fVxuXG5cdFx0Y29tcG9uZW50LmJhc2UgPSBiYXNlO1xuXHRcdGlmIChiYXNlICYmICFpc0NoaWxkKSB7XG5cdFx0XHR2YXIgY29tcG9uZW50UmVmID0gY29tcG9uZW50LFxuXHRcdFx0ICAgIHQgPSBjb21wb25lbnQ7XG5cdFx0XHR3aGlsZSAodCA9IHQuX3BhcmVudENvbXBvbmVudCkge1xuXHRcdFx0XHQoY29tcG9uZW50UmVmID0gdCkuYmFzZSA9IGJhc2U7XG5cdFx0XHR9XG5cdFx0XHRiYXNlLl9jb21wb25lbnQgPSBjb21wb25lbnRSZWY7XG5cdFx0XHRiYXNlLl9jb21wb25lbnRDb25zdHJ1Y3RvciA9IGNvbXBvbmVudFJlZi5jb25zdHJ1Y3Rvcjtcblx0XHR9XG5cdH1cblxuXHRpZiAoIWlzVXBkYXRlIHx8IG1vdW50QWxsKSB7XG5cdFx0bW91bnRzLnB1c2goY29tcG9uZW50KTtcblx0fSBlbHNlIGlmICghc2tpcCkge1xuXG5cdFx0aWYgKGNvbXBvbmVudC5jb21wb25lbnREaWRVcGRhdGUpIHtcblx0XHRcdGNvbXBvbmVudC5jb21wb25lbnREaWRVcGRhdGUocHJldmlvdXNQcm9wcywgcHJldmlvdXNTdGF0ZSwgc25hcHNob3QpO1xuXHRcdH1cblx0XHRpZiAob3B0aW9ucy5hZnRlclVwZGF0ZSkgb3B0aW9ucy5hZnRlclVwZGF0ZShjb21wb25lbnQpO1xuXHR9XG5cblx0d2hpbGUgKGNvbXBvbmVudC5fcmVuZGVyQ2FsbGJhY2tzLmxlbmd0aCkge1xuXHRcdGNvbXBvbmVudC5fcmVuZGVyQ2FsbGJhY2tzLnBvcCgpLmNhbGwoY29tcG9uZW50KTtcblx0fWlmICghZGlmZkxldmVsICYmICFpc0NoaWxkKSBmbHVzaE1vdW50cygpO1xufVxuXG5mdW5jdGlvbiBidWlsZENvbXBvbmVudEZyb21WTm9kZShkb20sIHZub2RlLCBjb250ZXh0LCBtb3VudEFsbCkge1xuXHR2YXIgYyA9IGRvbSAmJiBkb20uX2NvbXBvbmVudCxcblx0ICAgIG9yaWdpbmFsQ29tcG9uZW50ID0gYyxcblx0ICAgIG9sZERvbSA9IGRvbSxcblx0ICAgIGlzRGlyZWN0T3duZXIgPSBjICYmIGRvbS5fY29tcG9uZW50Q29uc3RydWN0b3IgPT09IHZub2RlLm5vZGVOYW1lLFxuXHQgICAgaXNPd25lciA9IGlzRGlyZWN0T3duZXIsXG5cdCAgICBwcm9wcyA9IGdldE5vZGVQcm9wcyh2bm9kZSk7XG5cdHdoaWxlIChjICYmICFpc093bmVyICYmIChjID0gYy5fcGFyZW50Q29tcG9uZW50KSkge1xuXHRcdGlzT3duZXIgPSBjLmNvbnN0cnVjdG9yID09PSB2bm9kZS5ub2RlTmFtZTtcblx0fVxuXG5cdGlmIChjICYmIGlzT3duZXIgJiYgKCFtb3VudEFsbCB8fCBjLl9jb21wb25lbnQpKSB7XG5cdFx0c2V0Q29tcG9uZW50UHJvcHMoYywgcHJvcHMsIDMsIGNvbnRleHQsIG1vdW50QWxsKTtcblx0XHRkb20gPSBjLmJhc2U7XG5cdH0gZWxzZSB7XG5cdFx0aWYgKG9yaWdpbmFsQ29tcG9uZW50ICYmICFpc0RpcmVjdE93bmVyKSB7XG5cdFx0XHR1bm1vdW50Q29tcG9uZW50KG9yaWdpbmFsQ29tcG9uZW50KTtcblx0XHRcdGRvbSA9IG9sZERvbSA9IG51bGw7XG5cdFx0fVxuXG5cdFx0YyA9IGNyZWF0ZUNvbXBvbmVudCh2bm9kZS5ub2RlTmFtZSwgcHJvcHMsIGNvbnRleHQpO1xuXHRcdGlmIChkb20gJiYgIWMubmV4dEJhc2UpIHtcblx0XHRcdGMubmV4dEJhc2UgPSBkb207XG5cblx0XHRcdG9sZERvbSA9IG51bGw7XG5cdFx0fVxuXHRcdHNldENvbXBvbmVudFByb3BzKGMsIHByb3BzLCAxLCBjb250ZXh0LCBtb3VudEFsbCk7XG5cdFx0ZG9tID0gYy5iYXNlO1xuXG5cdFx0aWYgKG9sZERvbSAmJiBkb20gIT09IG9sZERvbSkge1xuXHRcdFx0b2xkRG9tLl9jb21wb25lbnQgPSBudWxsO1xuXHRcdFx0cmVjb2xsZWN0Tm9kZVRyZWUob2xkRG9tLCBmYWxzZSk7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGRvbTtcbn1cblxuZnVuY3Rpb24gdW5tb3VudENvbXBvbmVudChjb21wb25lbnQpIHtcblx0aWYgKG9wdGlvbnMuYmVmb3JlVW5tb3VudCkgb3B0aW9ucy5iZWZvcmVVbm1vdW50KGNvbXBvbmVudCk7XG5cblx0dmFyIGJhc2UgPSBjb21wb25lbnQuYmFzZTtcblxuXHRjb21wb25lbnQuX2Rpc2FibGUgPSB0cnVlO1xuXG5cdGlmIChjb21wb25lbnQuY29tcG9uZW50V2lsbFVubW91bnQpIGNvbXBvbmVudC5jb21wb25lbnRXaWxsVW5tb3VudCgpO1xuXG5cdGNvbXBvbmVudC5iYXNlID0gbnVsbDtcblxuXHR2YXIgaW5uZXIgPSBjb21wb25lbnQuX2NvbXBvbmVudDtcblx0aWYgKGlubmVyKSB7XG5cdFx0dW5tb3VudENvbXBvbmVudChpbm5lcik7XG5cdH0gZWxzZSBpZiAoYmFzZSkge1xuXHRcdGlmIChiYXNlWydfX3ByZWFjdGF0dHJfJ10gIT0gbnVsbCkgYXBwbHlSZWYoYmFzZVsnX19wcmVhY3RhdHRyXyddLnJlZiwgbnVsbCk7XG5cblx0XHRjb21wb25lbnQubmV4dEJhc2UgPSBiYXNlO1xuXG5cdFx0cmVtb3ZlTm9kZShiYXNlKTtcblx0XHRyZWN5Y2xlckNvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuXG5cdFx0cmVtb3ZlQ2hpbGRyZW4oYmFzZSk7XG5cdH1cblxuXHRhcHBseVJlZihjb21wb25lbnQuX19yZWYsIG51bGwpO1xufVxuXG5mdW5jdGlvbiBDb21wb25lbnQocHJvcHMsIGNvbnRleHQpIHtcblx0dGhpcy5fZGlydHkgPSB0cnVlO1xuXG5cdHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG5cblx0dGhpcy5wcm9wcyA9IHByb3BzO1xuXG5cdHRoaXMuc3RhdGUgPSB0aGlzLnN0YXRlIHx8IHt9O1xuXG5cdHRoaXMuX3JlbmRlckNhbGxiYWNrcyA9IFtdO1xufVxuXG5leHRlbmQoQ29tcG9uZW50LnByb3RvdHlwZSwge1xuXHRzZXRTdGF0ZTogZnVuY3Rpb24gc2V0U3RhdGUoc3RhdGUsIGNhbGxiYWNrKSB7XG5cdFx0aWYgKCF0aGlzLnByZXZTdGF0ZSkgdGhpcy5wcmV2U3RhdGUgPSB0aGlzLnN0YXRlO1xuXHRcdHRoaXMuc3RhdGUgPSBleHRlbmQoZXh0ZW5kKHt9LCB0aGlzLnN0YXRlKSwgdHlwZW9mIHN0YXRlID09PSAnZnVuY3Rpb24nID8gc3RhdGUodGhpcy5zdGF0ZSwgdGhpcy5wcm9wcykgOiBzdGF0ZSk7XG5cdFx0aWYgKGNhbGxiYWNrKSB0aGlzLl9yZW5kZXJDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG5cdFx0ZW5xdWV1ZVJlbmRlcih0aGlzKTtcblx0fSxcblx0Zm9yY2VVcGRhdGU6IGZ1bmN0aW9uIGZvcmNlVXBkYXRlKGNhbGxiYWNrKSB7XG5cdFx0aWYgKGNhbGxiYWNrKSB0aGlzLl9yZW5kZXJDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG5cdFx0cmVuZGVyQ29tcG9uZW50KHRoaXMsIDIpO1xuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHt9XG59KTtcblxuZnVuY3Rpb24gcmVuZGVyKHZub2RlLCBwYXJlbnQsIG1lcmdlKSB7XG4gIHJldHVybiBkaWZmKG1lcmdlLCB2bm9kZSwge30sIGZhbHNlLCBwYXJlbnQsIGZhbHNlKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlUmVmKCkge1xuXHRyZXR1cm4ge307XG59XG5cbnZhciBwcmVhY3QgPSB7XG5cdGg6IGgsXG5cdGNyZWF0ZUVsZW1lbnQ6IGgsXG5cdGNsb25lRWxlbWVudDogY2xvbmVFbGVtZW50LFxuXHRjcmVhdGVSZWY6IGNyZWF0ZVJlZixcblx0Q29tcG9uZW50OiBDb21wb25lbnQsXG5cdHJlbmRlcjogcmVuZGVyLFxuXHRyZXJlbmRlcjogcmVyZW5kZXIsXG5cdG9wdGlvbnM6IG9wdGlvbnNcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHByZWFjdDtcbmV4cG9ydCB7IGgsIGggYXMgY3JlYXRlRWxlbWVudCwgY2xvbmVFbGVtZW50LCBjcmVhdGVSZWYsIENvbXBvbmVudCwgcmVuZGVyLCByZXJlbmRlciwgb3B0aW9ucyB9O1xuIl0sImZpbGUiOiJsaWIvcHJlYWN0LmpzIn0=