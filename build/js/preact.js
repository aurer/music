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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInByZWFjdC5qcyJdLCJuYW1lcyI6WyJWTm9kZSIsIm9wdGlvbnMiLCJzdGFjayIsIkVNUFRZX0NISUxEUkVOIiwiaCIsIm5vZGVOYW1lIiwiYXR0cmlidXRlcyIsImNoaWxkcmVuIiwibGFzdFNpbXBsZSIsImNoaWxkIiwic2ltcGxlIiwiaSIsImFyZ3VtZW50cyIsImxlbmd0aCIsInB1c2giLCJwb3AiLCJ1bmRlZmluZWQiLCJTdHJpbmciLCJwIiwia2V5Iiwidm5vZGUiLCJleHRlbmQiLCJvYmoiLCJwcm9wcyIsImFwcGx5UmVmIiwicmVmIiwidmFsdWUiLCJjdXJyZW50IiwiZGVmZXIiLCJQcm9taXNlIiwicmVzb2x2ZSIsInRoZW4iLCJiaW5kIiwic2V0VGltZW91dCIsImNsb25lRWxlbWVudCIsInNsaWNlIiwiY2FsbCIsIklTX05PTl9ESU1FTlNJT05BTCIsIml0ZW1zIiwiZW5xdWV1ZVJlbmRlciIsImNvbXBvbmVudCIsIl9kaXJ0eSIsImRlYm91bmNlUmVuZGVyaW5nIiwicmVyZW5kZXIiLCJyZW5kZXJDb21wb25lbnQiLCJpc1NhbWVOb2RlVHlwZSIsIm5vZGUiLCJoeWRyYXRpbmciLCJzcGxpdFRleHQiLCJfY29tcG9uZW50Q29uc3RydWN0b3IiLCJpc05hbWVkTm9kZSIsIm5vcm1hbGl6ZWROb2RlTmFtZSIsInRvTG93ZXJDYXNlIiwiZ2V0Tm9kZVByb3BzIiwiZGVmYXVsdFByb3BzIiwiY3JlYXRlTm9kZSIsImlzU3ZnIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50TlMiLCJjcmVhdGVFbGVtZW50IiwicmVtb3ZlTm9kZSIsInBhcmVudE5vZGUiLCJyZW1vdmVDaGlsZCIsInNldEFjY2Vzc29yIiwibmFtZSIsIm9sZCIsImNsYXNzTmFtZSIsInN0eWxlIiwiY3NzVGV4dCIsInRlc3QiLCJpbm5lckhUTUwiLCJfX2h0bWwiLCJ1c2VDYXB0dXJlIiwicmVwbGFjZSIsInN1YnN0cmluZyIsImFkZEV2ZW50TGlzdGVuZXIiLCJldmVudFByb3h5IiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsIl9saXN0ZW5lcnMiLCJlIiwicmVtb3ZlQXR0cmlidXRlIiwibnMiLCJyZW1vdmVBdHRyaWJ1dGVOUyIsInNldEF0dHJpYnV0ZU5TIiwic2V0QXR0cmlidXRlIiwidHlwZSIsImV2ZW50IiwibW91bnRzIiwiZGlmZkxldmVsIiwiaXNTdmdNb2RlIiwiZmx1c2hNb3VudHMiLCJjIiwic2hpZnQiLCJhZnRlck1vdW50IiwiY29tcG9uZW50RGlkTW91bnQiLCJkaWZmIiwiZG9tIiwiY29udGV4dCIsIm1vdW50QWxsIiwicGFyZW50IiwiY29tcG9uZW50Um9vdCIsIm93bmVyU1ZHRWxlbWVudCIsInJldCIsImlkaWZmIiwiYXBwZW5kQ2hpbGQiLCJvdXQiLCJwcmV2U3ZnTW9kZSIsIl9jb21wb25lbnQiLCJub2RlVmFsdWUiLCJjcmVhdGVUZXh0Tm9kZSIsInJlcGxhY2VDaGlsZCIsInJlY29sbGVjdE5vZGVUcmVlIiwidm5vZGVOYW1lIiwiYnVpbGRDb21wb25lbnRGcm9tVk5vZGUiLCJmaXJzdENoaWxkIiwiZmMiLCJ2Y2hpbGRyZW4iLCJhIiwibmV4dFNpYmxpbmciLCJpbm5lckRpZmZOb2RlIiwiZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUwiLCJkaWZmQXR0cmlidXRlcyIsImlzSHlkcmF0aW5nIiwib3JpZ2luYWxDaGlsZHJlbiIsImNoaWxkTm9kZXMiLCJrZXllZCIsImtleWVkTGVuIiwibWluIiwibGVuIiwiY2hpbGRyZW5MZW4iLCJ2bGVuIiwiaiIsImYiLCJ2Y2hpbGQiLCJfY2hpbGQiLCJfX2tleSIsInRyaW0iLCJpbnNlcnRCZWZvcmUiLCJ1bm1vdW50T25seSIsInVubW91bnRDb21wb25lbnQiLCJyZW1vdmVDaGlsZHJlbiIsImxhc3RDaGlsZCIsIm5leHQiLCJwcmV2aW91c1NpYmxpbmciLCJhdHRycyIsInJlY3ljbGVyQ29tcG9uZW50cyIsImNyZWF0ZUNvbXBvbmVudCIsIkN0b3IiLCJpbnN0IiwicHJvdG90eXBlIiwicmVuZGVyIiwiQ29tcG9uZW50IiwiY29uc3RydWN0b3IiLCJkb1JlbmRlciIsIm5leHRCYXNlIiwic3BsaWNlIiwic3RhdGUiLCJzZXRDb21wb25lbnRQcm9wcyIsInJlbmRlck1vZGUiLCJfZGlzYWJsZSIsIl9fcmVmIiwiZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzIiwiYmFzZSIsImNvbXBvbmVudFdpbGxNb3VudCIsImNvbXBvbmVudFdpbGxSZWNlaXZlUHJvcHMiLCJwcmV2Q29udGV4dCIsInByZXZQcm9wcyIsInN5bmNDb21wb25lbnRVcGRhdGVzIiwiaXNDaGlsZCIsInByZXZpb3VzUHJvcHMiLCJwcmV2aW91c1N0YXRlIiwicHJldlN0YXRlIiwicHJldmlvdXNDb250ZXh0IiwiaXNVcGRhdGUiLCJpbml0aWFsQmFzZSIsImluaXRpYWxDaGlsZENvbXBvbmVudCIsInNraXAiLCJzbmFwc2hvdCIsInJlbmRlcmVkIiwiY2Jhc2UiLCJzaG91bGRDb21wb25lbnRVcGRhdGUiLCJjb21wb25lbnRXaWxsVXBkYXRlIiwiZ2V0Q2hpbGRDb250ZXh0IiwiZ2V0U25hcHNob3RCZWZvcmVVcGRhdGUiLCJjaGlsZENvbXBvbmVudCIsInRvVW5tb3VudCIsImNoaWxkUHJvcHMiLCJfcGFyZW50Q29tcG9uZW50IiwiYmFzZVBhcmVudCIsImNvbXBvbmVudFJlZiIsInQiLCJjb21wb25lbnREaWRVcGRhdGUiLCJhZnRlclVwZGF0ZSIsIl9yZW5kZXJDYWxsYmFja3MiLCJvcmlnaW5hbENvbXBvbmVudCIsIm9sZERvbSIsImlzRGlyZWN0T3duZXIiLCJpc093bmVyIiwiYmVmb3JlVW5tb3VudCIsImNvbXBvbmVudFdpbGxVbm1vdW50IiwiaW5uZXIiLCJzZXRTdGF0ZSIsImNhbGxiYWNrIiwiZm9yY2VVcGRhdGUiLCJtZXJnZSIsImNyZWF0ZVJlZiIsInByZWFjdCJdLCJtYXBwaW5ncyI6IkFBQUEsSUFBSUEsS0FBSyxHQUFHLFNBQVNBLEtBQVQsR0FBaUIsQ0FBRSxDQUEvQjs7QUFFQSxJQUFJQyxPQUFPLEdBQUcsRUFBZDtBQUVBLElB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LEdBQUc7QUFDWjFNLEVBQUFBLENBQUMsRUFBRUEsQ0FEUztBQUVadUQsRUFBQUEsYUFBYSxFQUFFdkQsQ0FGSDtBQUdaOEIsRUFBQUEsWUFBWSxFQUFFQSxZQUhGO0FBSVoySyxFQUFBQSxTQUFTLEVBQUVBLFNBSkM7QUFLWnRELEVBQUFBLFNBQVMsRUFBRUEsU0FMQztBQU1aRCxFQUFBQSxNQUFNLEVBQUVBLE1BTkk7QUFPWjNHLEVBQUFBLFFBQVEsRUFBRUEsUUFQRTtBQVFaMUMsRUFBQUEsT0FBTyxFQUFFQTtBQVJHLENBQWI7QUFXQSxlQUFlNk0sTUFBZjtBQUNBLFNBQVMxTSxDQUFULEVBQVlBLENBQUMsSUFBSXVELGFBQWpCLEVBQWdDekIsWUFBaEMsRUFBOEMySyxTQUE5QyxFQUF5RHRELFNBQXpELEVBQW9FRCxNQUFwRSxFQUE0RTNHLFFBQTVFLEVBQXNGMUMsT0FBdEYiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgVk5vZGUgPSBmdW5jdGlvbiBWTm9kZSgpIHt9O1xyXG5cclxudmFyIG9wdGlvbnMgPSB7fTtcclxuXHJcbnZhciBzdGFjayA9IFtdO1xyXG5cclxudmFyIEVNUFRZX0NISUxEUkVOID0gW107XHJcblxyXG5mdW5jdGlvbiBoKG5vZGVOYW1lLCBhdHRyaWJ1dGVzKSB7XHJcblx0dmFyIGNoaWxkcmVuID0gRU1QVFlfQ0hJTERSRU4sXHJcblx0ICAgIGxhc3RTaW1wbGUsXHJcblx0ICAgIGNoaWxkLFxyXG5cdCAgICBzaW1wbGUsXHJcblx0ICAgIGk7XHJcblx0Zm9yIChpID0gYXJndW1lbnRzLmxlbmd0aDsgaS0tID4gMjspIHtcclxuXHRcdHN0YWNrLnB1c2goYXJndW1lbnRzW2ldKTtcclxuXHR9XHJcblx0aWYgKGF0dHJpYnV0ZXMgJiYgYXR0cmlidXRlcy5jaGlsZHJlbiAhPSBudWxsKSB7XHJcblx0XHRpZiAoIXN0YWNrLmxlbmd0aCkgc3RhY2sucHVzaChhdHRyaWJ1dGVzLmNoaWxkcmVuKTtcclxuXHRcdGRlbGV0ZSBhdHRyaWJ1dGVzLmNoaWxkcmVuO1xyXG5cdH1cclxuXHR3aGlsZSAoc3RhY2subGVuZ3RoKSB7XHJcblx0XHRpZiAoKGNoaWxkID0gc3RhY2sucG9wKCkpICYmIGNoaWxkLnBvcCAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdGZvciAoaSA9IGNoaWxkLmxlbmd0aDsgaS0tOykge1xyXG5cdFx0XHRcdHN0YWNrLnB1c2goY2hpbGRbaV0pO1xyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRpZiAodHlwZW9mIGNoaWxkID09PSAnYm9vbGVhbicpIGNoaWxkID0gbnVsbDtcclxuXHJcblx0XHRcdGlmIChzaW1wbGUgPSB0eXBlb2Ygbm9kZU5hbWUgIT09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0XHRpZiAoY2hpbGQgPT0gbnVsbCkgY2hpbGQgPSAnJztlbHNlIGlmICh0eXBlb2YgY2hpbGQgPT09ICdudW1iZXInKSBjaGlsZCA9IFN0cmluZyhjaGlsZCk7ZWxzZSBpZiAodHlwZW9mIGNoaWxkICE9PSAnc3RyaW5nJykgc2ltcGxlID0gZmFsc2U7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChzaW1wbGUgJiYgbGFzdFNpbXBsZSkge1xyXG5cdFx0XHRcdGNoaWxkcmVuW2NoaWxkcmVuLmxlbmd0aCAtIDFdICs9IGNoaWxkO1xyXG5cdFx0XHR9IGVsc2UgaWYgKGNoaWxkcmVuID09PSBFTVBUWV9DSElMRFJFTikge1xyXG5cdFx0XHRcdGNoaWxkcmVuID0gW2NoaWxkXTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRjaGlsZHJlbi5wdXNoKGNoaWxkKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0bGFzdFNpbXBsZSA9IHNpbXBsZTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhciBwID0gbmV3IFZOb2RlKCk7XHJcblx0cC5ub2RlTmFtZSA9IG5vZGVOYW1lO1xyXG5cdHAuY2hpbGRyZW4gPSBjaGlsZHJlbjtcclxuXHRwLmF0dHJpYnV0ZXMgPSBhdHRyaWJ1dGVzID09IG51bGwgPyB1bmRlZmluZWQgOiBhdHRyaWJ1dGVzO1xyXG5cdHAua2V5ID0gYXR0cmlidXRlcyA9PSBudWxsID8gdW5kZWZpbmVkIDogYXR0cmlidXRlcy5rZXk7XHJcblxyXG5cdGlmIChvcHRpb25zLnZub2RlICE9PSB1bmRlZmluZWQpIG9wdGlvbnMudm5vZGUocCk7XHJcblxyXG5cdHJldHVybiBwO1xyXG59XHJcblxyXG5mdW5jdGlvbiBleHRlbmQob2JqLCBwcm9wcykge1xyXG4gIGZvciAodmFyIGkgaW4gcHJvcHMpIHtcclxuICAgIG9ialtpXSA9IHByb3BzW2ldO1xyXG4gIH1yZXR1cm4gb2JqO1xyXG59XHJcblxyXG5mdW5jdGlvbiBhcHBseVJlZihyZWYsIHZhbHVlKSB7XHJcbiAgaWYgKHJlZikge1xyXG4gICAgaWYgKHR5cGVvZiByZWYgPT0gJ2Z1bmN0aW9uJykgcmVmKHZhbHVlKTtlbHNlIHJlZi5jdXJyZW50ID0gdmFsdWU7XHJcbiAgfVxyXG59XHJcblxyXG52YXIgZGVmZXIgPSB0eXBlb2YgUHJvbWlzZSA9PSAnZnVuY3Rpb24nID8gUHJvbWlzZS5yZXNvbHZlKCkudGhlbi5iaW5kKFByb21pc2UucmVzb2x2ZSgpKSA6IHNldFRpbWVvdXQ7XHJcblxyXG5mdW5jdGlvbiBjbG9uZUVsZW1lbnQodm5vZGUsIHByb3BzKSB7XHJcbiAgcmV0dXJuIGgodm5vZGUubm9kZU5hbWUsIGV4dGVuZChleHRlbmQoe30sIHZub2RlLmF0dHJpYnV0ZXMpLCBwcm9wcyksIGFyZ3VtZW50cy5sZW5ndGggPiAyID8gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDIpIDogdm5vZGUuY2hpbGRyZW4pO1xyXG59XHJcblxyXG52YXIgSVNfTk9OX0RJTUVOU0lPTkFMID0gL2FjaXR8ZXgoPzpzfGd8bnxwfCQpfHJwaHxvd3N8bW5jfG50d3xpbmVbY2hdfHpvb3xeb3JkL2k7XHJcblxyXG52YXIgaXRlbXMgPSBbXTtcclxuXHJcbmZ1bmN0aW9uIGVucXVldWVSZW5kZXIoY29tcG9uZW50KSB7XHJcblx0aWYgKCFjb21wb25lbnQuX2RpcnR5ICYmIChjb21wb25lbnQuX2RpcnR5ID0gdHJ1ZSkgJiYgaXRlbXMucHVzaChjb21wb25lbnQpID09IDEpIHtcclxuXHRcdChvcHRpb25zLmRlYm91bmNlUmVuZGVyaW5nIHx8IGRlZmVyKShyZXJlbmRlcik7XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiByZXJlbmRlcigpIHtcclxuXHR2YXIgcDtcclxuXHR3aGlsZSAocCA9IGl0ZW1zLnBvcCgpKSB7XHJcblx0XHRpZiAocC5fZGlydHkpIHJlbmRlckNvbXBvbmVudChwKTtcclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzU2FtZU5vZGVUeXBlKG5vZGUsIHZub2RlLCBoeWRyYXRpbmcpIHtcclxuXHRpZiAodHlwZW9mIHZub2RlID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygdm5vZGUgPT09ICdudW1iZXInKSB7XHJcblx0XHRyZXR1cm4gbm9kZS5zcGxpdFRleHQgIT09IHVuZGVmaW5lZDtcclxuXHR9XHJcblx0aWYgKHR5cGVvZiB2bm9kZS5ub2RlTmFtZSA9PT0gJ3N0cmluZycpIHtcclxuXHRcdHJldHVybiAhbm9kZS5fY29tcG9uZW50Q29uc3RydWN0b3IgJiYgaXNOYW1lZE5vZGUobm9kZSwgdm5vZGUubm9kZU5hbWUpO1xyXG5cdH1cclxuXHRyZXR1cm4gaHlkcmF0aW5nIHx8IG5vZGUuX2NvbXBvbmVudENvbnN0cnVjdG9yID09PSB2bm9kZS5ub2RlTmFtZTtcclxufVxyXG5cclxuZnVuY3Rpb24gaXNOYW1lZE5vZGUobm9kZSwgbm9kZU5hbWUpIHtcclxuXHRyZXR1cm4gbm9kZS5ub3JtYWxpemVkTm9kZU5hbWUgPT09IG5vZGVOYW1lIHx8IG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gbm9kZU5hbWUudG9Mb3dlckNhc2UoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2V0Tm9kZVByb3BzKHZub2RlKSB7XHJcblx0dmFyIHByb3BzID0gZXh0ZW5kKHt9LCB2bm9kZS5hdHRyaWJ1dGVzKTtcclxuXHRwcm9wcy5jaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuO1xyXG5cclxuXHR2YXIgZGVmYXVsdFByb3BzID0gdm5vZGUubm9kZU5hbWUuZGVmYXVsdFByb3BzO1xyXG5cdGlmIChkZWZhdWx0UHJvcHMgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0Zm9yICh2YXIgaSBpbiBkZWZhdWx0UHJvcHMpIHtcclxuXHRcdFx0aWYgKHByb3BzW2ldID09PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRwcm9wc1tpXSA9IGRlZmF1bHRQcm9wc1tpXTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIHByb3BzO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVOb2RlKG5vZGVOYW1lLCBpc1N2Zykge1xyXG5cdHZhciBub2RlID0gaXNTdmcgPyBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgbm9kZU5hbWUpIDogZG9jdW1lbnQuY3JlYXRlRWxlbWVudChub2RlTmFtZSk7XHJcblx0bm9kZS5ub3JtYWxpemVkTm9kZU5hbWUgPSBub2RlTmFtZTtcclxuXHRyZXR1cm4gbm9kZTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVtb3ZlTm9kZShub2RlKSB7XHJcblx0dmFyIHBhcmVudE5vZGUgPSBub2RlLnBhcmVudE5vZGU7XHJcblx0aWYgKHBhcmVudE5vZGUpIHBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldEFjY2Vzc29yKG5vZGUsIG5hbWUsIG9sZCwgdmFsdWUsIGlzU3ZnKSB7XHJcblx0aWYgKG5hbWUgPT09ICdjbGFzc05hbWUnKSBuYW1lID0gJ2NsYXNzJztcclxuXHJcblx0aWYgKG5hbWUgPT09ICdrZXknKSB7fSBlbHNlIGlmIChuYW1lID09PSAncmVmJykge1xyXG5cdFx0YXBwbHlSZWYob2xkLCBudWxsKTtcclxuXHRcdGFwcGx5UmVmKHZhbHVlLCBub2RlKTtcclxuXHR9IGVsc2UgaWYgKG5hbWUgPT09ICdjbGFzcycgJiYgIWlzU3ZnKSB7XHJcblx0XHRub2RlLmNsYXNzTmFtZSA9IHZhbHVlIHx8ICcnO1xyXG5cdH0gZWxzZSBpZiAobmFtZSA9PT0gJ3N0eWxlJykge1xyXG5cdFx0aWYgKCF2YWx1ZSB8fCB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBvbGQgPT09ICdzdHJpbmcnKSB7XHJcblx0XHRcdG5vZGUuc3R5bGUuY3NzVGV4dCA9IHZhbHVlIHx8ICcnO1xyXG5cdFx0fVxyXG5cdFx0aWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBvbGQgIT09ICdzdHJpbmcnKSB7XHJcblx0XHRcdFx0Zm9yICh2YXIgaSBpbiBvbGQpIHtcclxuXHRcdFx0XHRcdGlmICghKGkgaW4gdmFsdWUpKSBub2RlLnN0eWxlW2ldID0gJyc7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGZvciAodmFyIGkgaW4gdmFsdWUpIHtcclxuXHRcdFx0XHRub2RlLnN0eWxlW2ldID0gdHlwZW9mIHZhbHVlW2ldID09PSAnbnVtYmVyJyAmJiBJU19OT05fRElNRU5TSU9OQUwudGVzdChpKSA9PT0gZmFsc2UgPyB2YWx1ZVtpXSArICdweCcgOiB2YWx1ZVtpXTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH0gZWxzZSBpZiAobmFtZSA9PT0gJ2Rhbmdlcm91c2x5U2V0SW5uZXJIVE1MJykge1xyXG5cdFx0aWYgKHZhbHVlKSBub2RlLmlubmVySFRNTCA9IHZhbHVlLl9faHRtbCB8fCAnJztcclxuXHR9IGVsc2UgaWYgKG5hbWVbMF0gPT0gJ28nICYmIG5hbWVbMV0gPT0gJ24nKSB7XHJcblx0XHR2YXIgdXNlQ2FwdHVyZSA9IG5hbWUgIT09IChuYW1lID0gbmFtZS5yZXBsYWNlKC9DYXB0dXJlJC8sICcnKSk7XHJcblx0XHRuYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpLnN1YnN0cmluZygyKTtcclxuXHRcdGlmICh2YWx1ZSkge1xyXG5cdFx0XHRpZiAoIW9sZCkgbm9kZS5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGV2ZW50UHJveHksIHVzZUNhcHR1cmUpO1xyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGV2ZW50UHJveHksIHVzZUNhcHR1cmUpO1xyXG5cdFx0fVxyXG5cdFx0KG5vZGUuX2xpc3RlbmVycyB8fCAobm9kZS5fbGlzdGVuZXJzID0ge30pKVtuYW1lXSA9IHZhbHVlO1xyXG5cdH0gZWxzZSBpZiAobmFtZSAhPT0gJ2xpc3QnICYmIG5hbWUgIT09ICd0eXBlJyAmJiAhaXNTdmcgJiYgbmFtZSBpbiBub2RlKSB7XHJcblx0XHR0cnkge1xyXG5cdFx0XHRub2RlW25hbWVdID0gdmFsdWUgPT0gbnVsbCA/ICcnIDogdmFsdWU7XHJcblx0XHR9IGNhdGNoIChlKSB7fVxyXG5cdFx0aWYgKCh2YWx1ZSA9PSBudWxsIHx8IHZhbHVlID09PSBmYWxzZSkgJiYgbmFtZSAhPSAnc3BlbGxjaGVjaycpIG5vZGUucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xyXG5cdH0gZWxzZSB7XHJcblx0XHR2YXIgbnMgPSBpc1N2ZyAmJiBuYW1lICE9PSAobmFtZSA9IG5hbWUucmVwbGFjZSgvXnhsaW5rOj8vLCAnJykpO1xyXG5cclxuXHRcdGlmICh2YWx1ZSA9PSBudWxsIHx8IHZhbHVlID09PSBmYWxzZSkge1xyXG5cdFx0XHRpZiAobnMpIG5vZGUucmVtb3ZlQXR0cmlidXRlTlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnLCBuYW1lLnRvTG93ZXJDYXNlKCkpO2Vsc2Ugbm9kZS5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XHJcblx0XHR9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0XHRpZiAobnMpIG5vZGUuc2V0QXR0cmlidXRlTlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnLCBuYW1lLnRvTG93ZXJDYXNlKCksIHZhbHVlKTtlbHNlIG5vZGUuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGV2ZW50UHJveHkoZSkge1xyXG5cdHJldHVybiB0aGlzLl9saXN0ZW5lcnNbZS50eXBlXShvcHRpb25zLmV2ZW50ICYmIG9wdGlvbnMuZXZlbnQoZSkgfHwgZSk7XHJcbn1cclxuXHJcbnZhciBtb3VudHMgPSBbXTtcclxuXHJcbnZhciBkaWZmTGV2ZWwgPSAwO1xyXG5cclxudmFyIGlzU3ZnTW9kZSA9IGZhbHNlO1xyXG5cclxudmFyIGh5ZHJhdGluZyA9IGZhbHNlO1xyXG5cclxuZnVuY3Rpb24gZmx1c2hNb3VudHMoKSB7XHJcblx0dmFyIGM7XHJcblx0d2hpbGUgKGMgPSBtb3VudHMuc2hpZnQoKSkge1xyXG5cdFx0aWYgKG9wdGlvbnMuYWZ0ZXJNb3VudCkgb3B0aW9ucy5hZnRlck1vdW50KGMpO1xyXG5cdFx0aWYgKGMuY29tcG9uZW50RGlkTW91bnQpIGMuY29tcG9uZW50RGlkTW91bnQoKTtcclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRpZmYoZG9tLCB2bm9kZSwgY29udGV4dCwgbW91bnRBbGwsIHBhcmVudCwgY29tcG9uZW50Um9vdCkge1xyXG5cdGlmICghZGlmZkxldmVsKyspIHtcclxuXHRcdGlzU3ZnTW9kZSA9IHBhcmVudCAhPSBudWxsICYmIHBhcmVudC5vd25lclNWR0VsZW1lbnQgIT09IHVuZGVmaW5lZDtcclxuXHJcblx0XHRoeWRyYXRpbmcgPSBkb20gIT0gbnVsbCAmJiAhKCdfX3ByZWFjdGF0dHJfJyBpbiBkb20pO1xyXG5cdH1cclxuXHJcblx0dmFyIHJldCA9IGlkaWZmKGRvbSwgdm5vZGUsIGNvbnRleHQsIG1vdW50QWxsLCBjb21wb25lbnRSb290KTtcclxuXHJcblx0aWYgKHBhcmVudCAmJiByZXQucGFyZW50Tm9kZSAhPT0gcGFyZW50KSBwYXJlbnQuYXBwZW5kQ2hpbGQocmV0KTtcclxuXHJcblx0aWYgKCEgLS1kaWZmTGV2ZWwpIHtcclxuXHRcdGh5ZHJhdGluZyA9IGZhbHNlO1xyXG5cclxuXHRcdGlmICghY29tcG9uZW50Um9vdCkgZmx1c2hNb3VudHMoKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiByZXQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlkaWZmKGRvbSwgdm5vZGUsIGNvbnRleHQsIG1vdW50QWxsLCBjb21wb25lbnRSb290KSB7XHJcblx0dmFyIG91dCA9IGRvbSxcclxuXHQgICAgcHJldlN2Z01vZGUgPSBpc1N2Z01vZGU7XHJcblxyXG5cdGlmICh2bm9kZSA9PSBudWxsIHx8IHR5cGVvZiB2bm9kZSA9PT0gJ2Jvb2xlYW4nKSB2bm9kZSA9ICcnO1xyXG5cclxuXHRpZiAodHlwZW9mIHZub2RlID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygdm5vZGUgPT09ICdudW1iZXInKSB7XHJcblx0XHRpZiAoZG9tICYmIGRvbS5zcGxpdFRleHQgIT09IHVuZGVmaW5lZCAmJiBkb20ucGFyZW50Tm9kZSAmJiAoIWRvbS5fY29tcG9uZW50IHx8IGNvbXBvbmVudFJvb3QpKSB7XHJcblx0XHRcdGlmIChkb20ubm9kZVZhbHVlICE9IHZub2RlKSB7XHJcblx0XHRcdFx0ZG9tLm5vZGVWYWx1ZSA9IHZub2RlO1xyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRvdXQgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh2bm9kZSk7XHJcblx0XHRcdGlmIChkb20pIHtcclxuXHRcdFx0XHRpZiAoZG9tLnBhcmVudE5vZGUpIGRvbS5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChvdXQsIGRvbSk7XHJcblx0XHRcdFx0cmVjb2xsZWN0Tm9kZVRyZWUoZG9tLCB0cnVlKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdG91dFsnX19wcmVhY3RhdHRyXyddID0gdHJ1ZTtcclxuXHJcblx0XHRyZXR1cm4gb3V0O1xyXG5cdH1cclxuXHJcblx0dmFyIHZub2RlTmFtZSA9IHZub2RlLm5vZGVOYW1lO1xyXG5cdGlmICh0eXBlb2Ygdm5vZGVOYW1lID09PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRyZXR1cm4gYnVpbGRDb21wb25lbnRGcm9tVk5vZGUoZG9tLCB2bm9kZSwgY29udGV4dCwgbW91bnRBbGwpO1xyXG5cdH1cclxuXHJcblx0aXNTdmdNb2RlID0gdm5vZGVOYW1lID09PSAnc3ZnJyA/IHRydWUgOiB2bm9kZU5hbWUgPT09ICdmb3JlaWduT2JqZWN0JyA/IGZhbHNlIDogaXNTdmdNb2RlO1xyXG5cclxuXHR2bm9kZU5hbWUgPSBTdHJpbmcodm5vZGVOYW1lKTtcclxuXHRpZiAoIWRvbSB8fCAhaXNOYW1lZE5vZGUoZG9tLCB2bm9kZU5hbWUpKSB7XHJcblx0XHRvdXQgPSBjcmVhdGVOb2RlKHZub2RlTmFtZSwgaXNTdmdNb2RlKTtcclxuXHJcblx0XHRpZiAoZG9tKSB7XHJcblx0XHRcdHdoaWxlIChkb20uZmlyc3RDaGlsZCkge1xyXG5cdFx0XHRcdG91dC5hcHBlbmRDaGlsZChkb20uZmlyc3RDaGlsZCk7XHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGRvbS5wYXJlbnROb2RlKSBkb20ucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQob3V0LCBkb20pO1xyXG5cclxuXHRcdFx0cmVjb2xsZWN0Tm9kZVRyZWUoZG9tLCB0cnVlKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhciBmYyA9IG91dC5maXJzdENoaWxkLFxyXG5cdCAgICBwcm9wcyA9IG91dFsnX19wcmVhY3RhdHRyXyddLFxyXG5cdCAgICB2Y2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlbjtcclxuXHJcblx0aWYgKHByb3BzID09IG51bGwpIHtcclxuXHRcdHByb3BzID0gb3V0WydfX3ByZWFjdGF0dHJfJ10gPSB7fTtcclxuXHRcdGZvciAodmFyIGEgPSBvdXQuYXR0cmlidXRlcywgaSA9IGEubGVuZ3RoOyBpLS07KSB7XHJcblx0XHRcdHByb3BzW2FbaV0ubmFtZV0gPSBhW2ldLnZhbHVlO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0aWYgKCFoeWRyYXRpbmcgJiYgdmNoaWxkcmVuICYmIHZjaGlsZHJlbi5sZW5ndGggPT09IDEgJiYgdHlwZW9mIHZjaGlsZHJlblswXSA9PT0gJ3N0cmluZycgJiYgZmMgIT0gbnVsbCAmJiBmYy5zcGxpdFRleHQgIT09IHVuZGVmaW5lZCAmJiBmYy5uZXh0U2libGluZyA9PSBudWxsKSB7XHJcblx0XHRpZiAoZmMubm9kZVZhbHVlICE9IHZjaGlsZHJlblswXSkge1xyXG5cdFx0XHRmYy5ub2RlVmFsdWUgPSB2Y2hpbGRyZW5bMF07XHJcblx0XHR9XHJcblx0fSBlbHNlIGlmICh2Y2hpbGRyZW4gJiYgdmNoaWxkcmVuLmxlbmd0aCB8fCBmYyAhPSBudWxsKSB7XHJcblx0XHRcdGlubmVyRGlmZk5vZGUob3V0LCB2Y2hpbGRyZW4sIGNvbnRleHQsIG1vdW50QWxsLCBoeWRyYXRpbmcgfHwgcHJvcHMuZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUwgIT0gbnVsbCk7XHJcblx0XHR9XHJcblxyXG5cdGRpZmZBdHRyaWJ1dGVzKG91dCwgdm5vZGUuYXR0cmlidXRlcywgcHJvcHMpO1xyXG5cclxuXHRpc1N2Z01vZGUgPSBwcmV2U3ZnTW9kZTtcclxuXHJcblx0cmV0dXJuIG91dDtcclxufVxyXG5cclxuZnVuY3Rpb24gaW5uZXJEaWZmTm9kZShkb20sIHZjaGlsZHJlbiwgY29udGV4dCwgbW91bnRBbGwsIGlzSHlkcmF0aW5nKSB7XHJcblx0dmFyIG9yaWdpbmFsQ2hpbGRyZW4gPSBkb20uY2hpbGROb2RlcyxcclxuXHQgICAgY2hpbGRyZW4gPSBbXSxcclxuXHQgICAga2V5ZWQgPSB7fSxcclxuXHQgICAga2V5ZWRMZW4gPSAwLFxyXG5cdCAgICBtaW4gPSAwLFxyXG5cdCAgICBsZW4gPSBvcmlnaW5hbENoaWxkcmVuLmxlbmd0aCxcclxuXHQgICAgY2hpbGRyZW5MZW4gPSAwLFxyXG5cdCAgICB2bGVuID0gdmNoaWxkcmVuID8gdmNoaWxkcmVuLmxlbmd0aCA6IDAsXHJcblx0ICAgIGosXHJcblx0ICAgIGMsXHJcblx0ICAgIGYsXHJcblx0ICAgIHZjaGlsZCxcclxuXHQgICAgY2hpbGQ7XHJcblxyXG5cdGlmIChsZW4gIT09IDApIHtcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcclxuXHRcdFx0dmFyIF9jaGlsZCA9IG9yaWdpbmFsQ2hpbGRyZW5baV0sXHJcblx0XHRcdCAgICBwcm9wcyA9IF9jaGlsZFsnX19wcmVhY3RhdHRyXyddLFxyXG5cdFx0XHQgICAga2V5ID0gdmxlbiAmJiBwcm9wcyA/IF9jaGlsZC5fY29tcG9uZW50ID8gX2NoaWxkLl9jb21wb25lbnQuX19rZXkgOiBwcm9wcy5rZXkgOiBudWxsO1xyXG5cdFx0XHRpZiAoa2V5ICE9IG51bGwpIHtcclxuXHRcdFx0XHRrZXllZExlbisrO1xyXG5cdFx0XHRcdGtleWVkW2tleV0gPSBfY2hpbGQ7XHJcblx0XHRcdH0gZWxzZSBpZiAocHJvcHMgfHwgKF9jaGlsZC5zcGxpdFRleHQgIT09IHVuZGVmaW5lZCA/IGlzSHlkcmF0aW5nID8gX2NoaWxkLm5vZGVWYWx1ZS50cmltKCkgOiB0cnVlIDogaXNIeWRyYXRpbmcpKSB7XHJcblx0XHRcdFx0Y2hpbGRyZW5bY2hpbGRyZW5MZW4rK10gPSBfY2hpbGQ7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGlmICh2bGVuICE9PSAwKSB7XHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHZsZW47IGkrKykge1xyXG5cdFx0XHR2Y2hpbGQgPSB2Y2hpbGRyZW5baV07XHJcblx0XHRcdGNoaWxkID0gbnVsbDtcclxuXHJcblx0XHRcdHZhciBrZXkgPSB2Y2hpbGQua2V5O1xyXG5cdFx0XHRpZiAoa2V5ICE9IG51bGwpIHtcclxuXHRcdFx0XHRpZiAoa2V5ZWRMZW4gJiYga2V5ZWRba2V5XSAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0XHRjaGlsZCA9IGtleWVkW2tleV07XHJcblx0XHRcdFx0XHRrZXllZFtrZXldID0gdW5kZWZpbmVkO1xyXG5cdFx0XHRcdFx0a2V5ZWRMZW4tLTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSBpZiAobWluIDwgY2hpbGRyZW5MZW4pIHtcclxuXHRcdFx0XHRcdGZvciAoaiA9IG1pbjsgaiA8IGNoaWxkcmVuTGVuOyBqKyspIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNoaWxkcmVuW2pdICE9PSB1bmRlZmluZWQgJiYgaXNTYW1lTm9kZVR5cGUoYyA9IGNoaWxkcmVuW2pdLCB2Y2hpbGQsIGlzSHlkcmF0aW5nKSkge1xyXG5cdFx0XHRcdFx0XHRcdGNoaWxkID0gYztcclxuXHRcdFx0XHRcdFx0XHRjaGlsZHJlbltqXSA9IHVuZGVmaW5lZDtcclxuXHRcdFx0XHRcdFx0XHRpZiAoaiA9PT0gY2hpbGRyZW5MZW4gLSAxKSBjaGlsZHJlbkxlbi0tO1xyXG5cdFx0XHRcdFx0XHRcdGlmIChqID09PSBtaW4pIG1pbisrO1xyXG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0Y2hpbGQgPSBpZGlmZihjaGlsZCwgdmNoaWxkLCBjb250ZXh0LCBtb3VudEFsbCk7XHJcblxyXG5cdFx0XHRmID0gb3JpZ2luYWxDaGlsZHJlbltpXTtcclxuXHRcdFx0aWYgKGNoaWxkICYmIGNoaWxkICE9PSBkb20gJiYgY2hpbGQgIT09IGYpIHtcclxuXHRcdFx0XHRpZiAoZiA9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRkb20uYXBwZW5kQ2hpbGQoY2hpbGQpO1xyXG5cdFx0XHRcdH0gZWxzZSBpZiAoY2hpbGQgPT09IGYubmV4dFNpYmxpbmcpIHtcclxuXHRcdFx0XHRcdHJlbW92ZU5vZGUoZik7XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdGRvbS5pbnNlcnRCZWZvcmUoY2hpbGQsIGYpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0aWYgKGtleWVkTGVuKSB7XHJcblx0XHRmb3IgKHZhciBpIGluIGtleWVkKSB7XHJcblx0XHRcdGlmIChrZXllZFtpXSAhPT0gdW5kZWZpbmVkKSByZWNvbGxlY3ROb2RlVHJlZShrZXllZFtpXSwgZmFsc2UpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0d2hpbGUgKG1pbiA8PSBjaGlsZHJlbkxlbikge1xyXG5cdFx0aWYgKChjaGlsZCA9IGNoaWxkcmVuW2NoaWxkcmVuTGVuLS1dKSAhPT0gdW5kZWZpbmVkKSByZWNvbGxlY3ROb2RlVHJlZShjaGlsZCwgZmFsc2UpO1xyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVjb2xsZWN0Tm9kZVRyZWUobm9kZSwgdW5tb3VudE9ubHkpIHtcclxuXHR2YXIgY29tcG9uZW50ID0gbm9kZS5fY29tcG9uZW50O1xyXG5cdGlmIChjb21wb25lbnQpIHtcclxuXHRcdHVubW91bnRDb21wb25lbnQoY29tcG9uZW50KTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0aWYgKG5vZGVbJ19fcHJlYWN0YXR0cl8nXSAhPSBudWxsKSBhcHBseVJlZihub2RlWydfX3ByZWFjdGF0dHJfJ10ucmVmLCBudWxsKTtcclxuXHJcblx0XHRpZiAodW5tb3VudE9ubHkgPT09IGZhbHNlIHx8IG5vZGVbJ19fcHJlYWN0YXR0cl8nXSA9PSBudWxsKSB7XHJcblx0XHRcdHJlbW92ZU5vZGUobm9kZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmVtb3ZlQ2hpbGRyZW4obm9kZSk7XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiByZW1vdmVDaGlsZHJlbihub2RlKSB7XHJcblx0bm9kZSA9IG5vZGUubGFzdENoaWxkO1xyXG5cdHdoaWxlIChub2RlKSB7XHJcblx0XHR2YXIgbmV4dCA9IG5vZGUucHJldmlvdXNTaWJsaW5nO1xyXG5cdFx0cmVjb2xsZWN0Tm9kZVRyZWUobm9kZSwgdHJ1ZSk7XHJcblx0XHRub2RlID0gbmV4dDtcclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRpZmZBdHRyaWJ1dGVzKGRvbSwgYXR0cnMsIG9sZCkge1xyXG5cdHZhciBuYW1lO1xyXG5cclxuXHRmb3IgKG5hbWUgaW4gb2xkKSB7XHJcblx0XHRpZiAoIShhdHRycyAmJiBhdHRyc1tuYW1lXSAhPSBudWxsKSAmJiBvbGRbbmFtZV0gIT0gbnVsbCkge1xyXG5cdFx0XHRzZXRBY2Nlc3Nvcihkb20sIG5hbWUsIG9sZFtuYW1lXSwgb2xkW25hbWVdID0gdW5kZWZpbmVkLCBpc1N2Z01vZGUpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0Zm9yIChuYW1lIGluIGF0dHJzKSB7XHJcblx0XHRpZiAobmFtZSAhPT0gJ2NoaWxkcmVuJyAmJiBuYW1lICE9PSAnaW5uZXJIVE1MJyAmJiAoIShuYW1lIGluIG9sZCkgfHwgYXR0cnNbbmFtZV0gIT09IChuYW1lID09PSAndmFsdWUnIHx8IG5hbWUgPT09ICdjaGVja2VkJyA/IGRvbVtuYW1lXSA6IG9sZFtuYW1lXSkpKSB7XHJcblx0XHRcdHNldEFjY2Vzc29yKGRvbSwgbmFtZSwgb2xkW25hbWVdLCBvbGRbbmFtZV0gPSBhdHRyc1tuYW1lXSwgaXNTdmdNb2RlKTtcclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcbnZhciByZWN5Y2xlckNvbXBvbmVudHMgPSBbXTtcclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZUNvbXBvbmVudChDdG9yLCBwcm9wcywgY29udGV4dCkge1xyXG5cdHZhciBpbnN0LFxyXG5cdCAgICBpID0gcmVjeWNsZXJDb21wb25lbnRzLmxlbmd0aDtcclxuXHJcblx0aWYgKEN0b3IucHJvdG90eXBlICYmIEN0b3IucHJvdG90eXBlLnJlbmRlcikge1xyXG5cdFx0aW5zdCA9IG5ldyBDdG9yKHByb3BzLCBjb250ZXh0KTtcclxuXHRcdENvbXBvbmVudC5jYWxsKGluc3QsIHByb3BzLCBjb250ZXh0KTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0aW5zdCA9IG5ldyBDb21wb25lbnQocHJvcHMsIGNvbnRleHQpO1xyXG5cdFx0aW5zdC5jb25zdHJ1Y3RvciA9IEN0b3I7XHJcblx0XHRpbnN0LnJlbmRlciA9IGRvUmVuZGVyO1xyXG5cdH1cclxuXHJcblx0d2hpbGUgKGktLSkge1xyXG5cdFx0aWYgKHJlY3ljbGVyQ29tcG9uZW50c1tpXS5jb25zdHJ1Y3RvciA9PT0gQ3Rvcikge1xyXG5cdFx0XHRpbnN0Lm5leHRCYXNlID0gcmVjeWNsZXJDb21wb25lbnRzW2ldLm5leHRCYXNlO1xyXG5cdFx0XHRyZWN5Y2xlckNvbXBvbmVudHMuc3BsaWNlKGksIDEpO1xyXG5cdFx0XHRyZXR1cm4gaW5zdDtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJldHVybiBpbnN0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBkb1JlbmRlcihwcm9wcywgc3RhdGUsIGNvbnRleHQpIHtcclxuXHRyZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvcihwcm9wcywgY29udGV4dCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNldENvbXBvbmVudFByb3BzKGNvbXBvbmVudCwgcHJvcHMsIHJlbmRlck1vZGUsIGNvbnRleHQsIG1vdW50QWxsKSB7XHJcblx0aWYgKGNvbXBvbmVudC5fZGlzYWJsZSkgcmV0dXJuO1xyXG5cdGNvbXBvbmVudC5fZGlzYWJsZSA9IHRydWU7XHJcblxyXG5cdGNvbXBvbmVudC5fX3JlZiA9IHByb3BzLnJlZjtcclxuXHRjb21wb25lbnQuX19rZXkgPSBwcm9wcy5rZXk7XHJcblx0ZGVsZXRlIHByb3BzLnJlZjtcclxuXHRkZWxldGUgcHJvcHMua2V5O1xyXG5cclxuXHRpZiAodHlwZW9mIGNvbXBvbmVudC5jb25zdHJ1Y3Rvci5nZXREZXJpdmVkU3RhdGVGcm9tUHJvcHMgPT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRpZiAoIWNvbXBvbmVudC5iYXNlIHx8IG1vdW50QWxsKSB7XHJcblx0XHRcdGlmIChjb21wb25lbnQuY29tcG9uZW50V2lsbE1vdW50KSBjb21wb25lbnQuY29tcG9uZW50V2lsbE1vdW50KCk7XHJcblx0XHR9IGVsc2UgaWYgKGNvbXBvbmVudC5jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKSB7XHJcblx0XHRcdGNvbXBvbmVudC5jb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzKHByb3BzLCBjb250ZXh0KTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGlmIChjb250ZXh0ICYmIGNvbnRleHQgIT09IGNvbXBvbmVudC5jb250ZXh0KSB7XHJcblx0XHRpZiAoIWNvbXBvbmVudC5wcmV2Q29udGV4dCkgY29tcG9uZW50LnByZXZDb250ZXh0ID0gY29tcG9uZW50LmNvbnRleHQ7XHJcblx0XHRjb21wb25lbnQuY29udGV4dCA9IGNvbnRleHQ7XHJcblx0fVxyXG5cclxuXHRpZiAoIWNvbXBvbmVudC5wcmV2UHJvcHMpIGNvbXBvbmVudC5wcmV2UHJvcHMgPSBjb21wb25lbnQucHJvcHM7XHJcblx0Y29tcG9uZW50LnByb3BzID0gcHJvcHM7XHJcblxyXG5cdGNvbXBvbmVudC5fZGlzYWJsZSA9IGZhbHNlO1xyXG5cclxuXHRpZiAocmVuZGVyTW9kZSAhPT0gMCkge1xyXG5cdFx0aWYgKHJlbmRlck1vZGUgPT09IDEgfHwgb3B0aW9ucy5zeW5jQ29tcG9uZW50VXBkYXRlcyAhPT0gZmFsc2UgfHwgIWNvbXBvbmVudC5iYXNlKSB7XHJcblx0XHRcdHJlbmRlckNvbXBvbmVudChjb21wb25lbnQsIDEsIG1vdW50QWxsKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGVucXVldWVSZW5kZXIoY29tcG9uZW50KTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGFwcGx5UmVmKGNvbXBvbmVudC5fX3JlZiwgY29tcG9uZW50KTtcclxufVxyXG5cclxuZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50KGNvbXBvbmVudCwgcmVuZGVyTW9kZSwgbW91bnRBbGwsIGlzQ2hpbGQpIHtcclxuXHRpZiAoY29tcG9uZW50Ll9kaXNhYmxlKSByZXR1cm47XHJcblxyXG5cdHZhciBwcm9wcyA9IGNvbXBvbmVudC5wcm9wcyxcclxuXHQgICAgc3RhdGUgPSBjb21wb25lbnQuc3RhdGUsXHJcblx0ICAgIGNvbnRleHQgPSBjb21wb25lbnQuY29udGV4dCxcclxuXHQgICAgcHJldmlvdXNQcm9wcyA9IGNvbXBvbmVudC5wcmV2UHJvcHMgfHwgcHJvcHMsXHJcblx0ICAgIHByZXZpb3VzU3RhdGUgPSBjb21wb25lbnQucHJldlN0YXRlIHx8IHN0YXRlLFxyXG5cdCAgICBwcmV2aW91c0NvbnRleHQgPSBjb21wb25lbnQucHJldkNvbnRleHQgfHwgY29udGV4dCxcclxuXHQgICAgaXNVcGRhdGUgPSBjb21wb25lbnQuYmFzZSxcclxuXHQgICAgbmV4dEJhc2UgPSBjb21wb25lbnQubmV4dEJhc2UsXHJcblx0ICAgIGluaXRpYWxCYXNlID0gaXNVcGRhdGUgfHwgbmV4dEJhc2UsXHJcblx0ICAgIGluaXRpYWxDaGlsZENvbXBvbmVudCA9IGNvbXBvbmVudC5fY29tcG9uZW50LFxyXG5cdCAgICBza2lwID0gZmFsc2UsXHJcblx0ICAgIHNuYXBzaG90ID0gcHJldmlvdXNDb250ZXh0LFxyXG5cdCAgICByZW5kZXJlZCxcclxuXHQgICAgaW5zdCxcclxuXHQgICAgY2Jhc2U7XHJcblxyXG5cdGlmIChjb21wb25lbnQuY29uc3RydWN0b3IuZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzKSB7XHJcblx0XHRzdGF0ZSA9IGV4dGVuZChleHRlbmQoe30sIHN0YXRlKSwgY29tcG9uZW50LmNvbnN0cnVjdG9yLmdldERlcml2ZWRTdGF0ZUZyb21Qcm9wcyhwcm9wcywgc3RhdGUpKTtcclxuXHRcdGNvbXBvbmVudC5zdGF0ZSA9IHN0YXRlO1xyXG5cdH1cclxuXHJcblx0aWYgKGlzVXBkYXRlKSB7XHJcblx0XHRjb21wb25lbnQucHJvcHMgPSBwcmV2aW91c1Byb3BzO1xyXG5cdFx0Y29tcG9uZW50LnN0YXRlID0gcHJldmlvdXNTdGF0ZTtcclxuXHRcdGNvbXBvbmVudC5jb250ZXh0ID0gcHJldmlvdXNDb250ZXh0O1xyXG5cdFx0aWYgKHJlbmRlck1vZGUgIT09IDIgJiYgY29tcG9uZW50LnNob3VsZENvbXBvbmVudFVwZGF0ZSAmJiBjb21wb25lbnQuc2hvdWxkQ29tcG9uZW50VXBkYXRlKHByb3BzLCBzdGF0ZSwgY29udGV4dCkgPT09IGZhbHNlKSB7XHJcblx0XHRcdHNraXAgPSB0cnVlO1xyXG5cdFx0fSBlbHNlIGlmIChjb21wb25lbnQuY29tcG9uZW50V2lsbFVwZGF0ZSkge1xyXG5cdFx0XHRjb21wb25lbnQuY29tcG9uZW50V2lsbFVwZGF0ZShwcm9wcywgc3RhdGUsIGNvbnRleHQpO1xyXG5cdFx0fVxyXG5cdFx0Y29tcG9uZW50LnByb3BzID0gcHJvcHM7XHJcblx0XHRjb21wb25lbnQuc3RhdGUgPSBzdGF0ZTtcclxuXHRcdGNvbXBvbmVudC5jb250ZXh0ID0gY29udGV4dDtcclxuXHR9XHJcblxyXG5cdGNvbXBvbmVudC5wcmV2UHJvcHMgPSBjb21wb25lbnQucHJldlN0YXRlID0gY29tcG9uZW50LnByZXZDb250ZXh0ID0gY29tcG9uZW50Lm5leHRCYXNlID0gbnVsbDtcclxuXHRjb21wb25lbnQuX2RpcnR5ID0gZmFsc2U7XHJcblxyXG5cdGlmICghc2tpcCkge1xyXG5cdFx0cmVuZGVyZWQgPSBjb21wb25lbnQucmVuZGVyKHByb3BzLCBzdGF0ZSwgY29udGV4dCk7XHJcblxyXG5cdFx0aWYgKGNvbXBvbmVudC5nZXRDaGlsZENvbnRleHQpIHtcclxuXHRcdFx0Y29udGV4dCA9IGV4dGVuZChleHRlbmQoe30sIGNvbnRleHQpLCBjb21wb25lbnQuZ2V0Q2hpbGRDb250ZXh0KCkpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChpc1VwZGF0ZSAmJiBjb21wb25lbnQuZ2V0U25hcHNob3RCZWZvcmVVcGRhdGUpIHtcclxuXHRcdFx0c25hcHNob3QgPSBjb21wb25lbnQuZ2V0U25hcHNob3RCZWZvcmVVcGRhdGUocHJldmlvdXNQcm9wcywgcHJldmlvdXNTdGF0ZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGNoaWxkQ29tcG9uZW50ID0gcmVuZGVyZWQgJiYgcmVuZGVyZWQubm9kZU5hbWUsXHJcblx0XHQgICAgdG9Vbm1vdW50LFxyXG5cdFx0ICAgIGJhc2U7XHJcblxyXG5cdFx0aWYgKHR5cGVvZiBjaGlsZENvbXBvbmVudCA9PT0gJ2Z1bmN0aW9uJykge1xyXG5cclxuXHRcdFx0dmFyIGNoaWxkUHJvcHMgPSBnZXROb2RlUHJvcHMocmVuZGVyZWQpO1xyXG5cdFx0XHRpbnN0ID0gaW5pdGlhbENoaWxkQ29tcG9uZW50O1xyXG5cclxuXHRcdFx0aWYgKGluc3QgJiYgaW5zdC5jb25zdHJ1Y3RvciA9PT0gY2hpbGRDb21wb25lbnQgJiYgY2hpbGRQcm9wcy5rZXkgPT0gaW5zdC5fX2tleSkge1xyXG5cdFx0XHRcdHNldENvbXBvbmVudFByb3BzKGluc3QsIGNoaWxkUHJvcHMsIDEsIGNvbnRleHQsIGZhbHNlKTtcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHR0b1VubW91bnQgPSBpbnN0O1xyXG5cclxuXHRcdFx0XHRjb21wb25lbnQuX2NvbXBvbmVudCA9IGluc3QgPSBjcmVhdGVDb21wb25lbnQoY2hpbGRDb21wb25lbnQsIGNoaWxkUHJvcHMsIGNvbnRleHQpO1xyXG5cdFx0XHRcdGluc3QubmV4dEJhc2UgPSBpbnN0Lm5leHRCYXNlIHx8IG5leHRCYXNlO1xyXG5cdFx0XHRcdGluc3QuX3BhcmVudENvbXBvbmVudCA9IGNvbXBvbmVudDtcclxuXHRcdFx0XHRzZXRDb21wb25lbnRQcm9wcyhpbnN0LCBjaGlsZFByb3BzLCAwLCBjb250ZXh0LCBmYWxzZSk7XHJcblx0XHRcdFx0cmVuZGVyQ29tcG9uZW50KGluc3QsIDEsIG1vdW50QWxsLCB0cnVlKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0YmFzZSA9IGluc3QuYmFzZTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGNiYXNlID0gaW5pdGlhbEJhc2U7XHJcblxyXG5cdFx0XHR0b1VubW91bnQgPSBpbml0aWFsQ2hpbGRDb21wb25lbnQ7XHJcblx0XHRcdGlmICh0b1VubW91bnQpIHtcclxuXHRcdFx0XHRjYmFzZSA9IGNvbXBvbmVudC5fY29tcG9uZW50ID0gbnVsbDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGluaXRpYWxCYXNlIHx8IHJlbmRlck1vZGUgPT09IDEpIHtcclxuXHRcdFx0XHRpZiAoY2Jhc2UpIGNiYXNlLl9jb21wb25lbnQgPSBudWxsO1xyXG5cdFx0XHRcdGJhc2UgPSBkaWZmKGNiYXNlLCByZW5kZXJlZCwgY29udGV4dCwgbW91bnRBbGwgfHwgIWlzVXBkYXRlLCBpbml0aWFsQmFzZSAmJiBpbml0aWFsQmFzZS5wYXJlbnROb2RlLCB0cnVlKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChpbml0aWFsQmFzZSAmJiBiYXNlICE9PSBpbml0aWFsQmFzZSAmJiBpbnN0ICE9PSBpbml0aWFsQ2hpbGRDb21wb25lbnQpIHtcclxuXHRcdFx0dmFyIGJhc2VQYXJlbnQgPSBpbml0aWFsQmFzZS5wYXJlbnROb2RlO1xyXG5cdFx0XHRpZiAoYmFzZVBhcmVudCAmJiBiYXNlICE9PSBiYXNlUGFyZW50KSB7XHJcblx0XHRcdFx0YmFzZVBhcmVudC5yZXBsYWNlQ2hpbGQoYmFzZSwgaW5pdGlhbEJhc2UpO1xyXG5cclxuXHRcdFx0XHRpZiAoIXRvVW5tb3VudCkge1xyXG5cdFx0XHRcdFx0aW5pdGlhbEJhc2UuX2NvbXBvbmVudCA9IG51bGw7XHJcblx0XHRcdFx0XHRyZWNvbGxlY3ROb2RlVHJlZShpbml0aWFsQmFzZSwgZmFsc2UpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICh0b1VubW91bnQpIHtcclxuXHRcdFx0dW5tb3VudENvbXBvbmVudCh0b1VubW91bnQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGNvbXBvbmVudC5iYXNlID0gYmFzZTtcclxuXHRcdGlmIChiYXNlICYmICFpc0NoaWxkKSB7XHJcblx0XHRcdHZhciBjb21wb25lbnRSZWYgPSBjb21wb25lbnQsXHJcblx0XHRcdCAgICB0ID0gY29tcG9uZW50O1xyXG5cdFx0XHR3aGlsZSAodCA9IHQuX3BhcmVudENvbXBvbmVudCkge1xyXG5cdFx0XHRcdChjb21wb25lbnRSZWYgPSB0KS5iYXNlID0gYmFzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRiYXNlLl9jb21wb25lbnQgPSBjb21wb25lbnRSZWY7XHJcblx0XHRcdGJhc2UuX2NvbXBvbmVudENvbnN0cnVjdG9yID0gY29tcG9uZW50UmVmLmNvbnN0cnVjdG9yO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0aWYgKCFpc1VwZGF0ZSB8fCBtb3VudEFsbCkge1xyXG5cdFx0bW91bnRzLnB1c2goY29tcG9uZW50KTtcclxuXHR9IGVsc2UgaWYgKCFza2lwKSB7XHJcblxyXG5cdFx0aWYgKGNvbXBvbmVudC5jb21wb25lbnREaWRVcGRhdGUpIHtcclxuXHRcdFx0Y29tcG9uZW50LmNvbXBvbmVudERpZFVwZGF0ZShwcmV2aW91c1Byb3BzLCBwcmV2aW91c1N0YXRlLCBzbmFwc2hvdCk7XHJcblx0XHR9XHJcblx0XHRpZiAob3B0aW9ucy5hZnRlclVwZGF0ZSkgb3B0aW9ucy5hZnRlclVwZGF0ZShjb21wb25lbnQpO1xyXG5cdH1cclxuXHJcblx0d2hpbGUgKGNvbXBvbmVudC5fcmVuZGVyQ2FsbGJhY2tzLmxlbmd0aCkge1xyXG5cdFx0Y29tcG9uZW50Ll9yZW5kZXJDYWxsYmFja3MucG9wKCkuY2FsbChjb21wb25lbnQpO1xyXG5cdH1pZiAoIWRpZmZMZXZlbCAmJiAhaXNDaGlsZCkgZmx1c2hNb3VudHMoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gYnVpbGRDb21wb25lbnRGcm9tVk5vZGUoZG9tLCB2bm9kZSwgY29udGV4dCwgbW91bnRBbGwpIHtcclxuXHR2YXIgYyA9IGRvbSAmJiBkb20uX2NvbXBvbmVudCxcclxuXHQgICAgb3JpZ2luYWxDb21wb25lbnQgPSBjLFxyXG5cdCAgICBvbGREb20gPSBkb20sXHJcblx0ICAgIGlzRGlyZWN0T3duZXIgPSBjICYmIGRvbS5fY29tcG9uZW50Q29uc3RydWN0b3IgPT09IHZub2RlLm5vZGVOYW1lLFxyXG5cdCAgICBpc093bmVyID0gaXNEaXJlY3RPd25lcixcclxuXHQgICAgcHJvcHMgPSBnZXROb2RlUHJvcHModm5vZGUpO1xyXG5cdHdoaWxlIChjICYmICFpc093bmVyICYmIChjID0gYy5fcGFyZW50Q29tcG9uZW50KSkge1xyXG5cdFx0aXNPd25lciA9IGMuY29uc3RydWN0b3IgPT09IHZub2RlLm5vZGVOYW1lO1xyXG5cdH1cclxuXHJcblx0aWYgKGMgJiYgaXNPd25lciAmJiAoIW1vdW50QWxsIHx8IGMuX2NvbXBvbmVudCkpIHtcclxuXHRcdHNldENvbXBvbmVudFByb3BzKGMsIHByb3BzLCAzLCBjb250ZXh0LCBtb3VudEFsbCk7XHJcblx0XHRkb20gPSBjLmJhc2U7XHJcblx0fSBlbHNlIHtcclxuXHRcdGlmIChvcmlnaW5hbENvbXBvbmVudCAmJiAhaXNEaXJlY3RPd25lcikge1xyXG5cdFx0XHR1bm1vdW50Q29tcG9uZW50KG9yaWdpbmFsQ29tcG9uZW50KTtcclxuXHRcdFx0ZG9tID0gb2xkRG9tID0gbnVsbDtcclxuXHRcdH1cclxuXHJcblx0XHRjID0gY3JlYXRlQ29tcG9uZW50KHZub2RlLm5vZGVOYW1lLCBwcm9wcywgY29udGV4dCk7XHJcblx0XHRpZiAoZG9tICYmICFjLm5leHRCYXNlKSB7XHJcblx0XHRcdGMubmV4dEJhc2UgPSBkb207XHJcblxyXG5cdFx0XHRvbGREb20gPSBudWxsO1xyXG5cdFx0fVxyXG5cdFx0c2V0Q29tcG9uZW50UHJvcHMoYywgcHJvcHMsIDEsIGNvbnRleHQsIG1vdW50QWxsKTtcclxuXHRcdGRvbSA9IGMuYmFzZTtcclxuXHJcblx0XHRpZiAob2xkRG9tICYmIGRvbSAhPT0gb2xkRG9tKSB7XHJcblx0XHRcdG9sZERvbS5fY29tcG9uZW50ID0gbnVsbDtcclxuXHRcdFx0cmVjb2xsZWN0Tm9kZVRyZWUob2xkRG9tLCBmYWxzZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gZG9tO1xyXG59XHJcblxyXG5mdW5jdGlvbiB1bm1vdW50Q29tcG9uZW50KGNvbXBvbmVudCkge1xyXG5cdGlmIChvcHRpb25zLmJlZm9yZVVubW91bnQpIG9wdGlvbnMuYmVmb3JlVW5tb3VudChjb21wb25lbnQpO1xyXG5cclxuXHR2YXIgYmFzZSA9IGNvbXBvbmVudC5iYXNlO1xyXG5cclxuXHRjb21wb25lbnQuX2Rpc2FibGUgPSB0cnVlO1xyXG5cclxuXHRpZiAoY29tcG9uZW50LmNvbXBvbmVudFdpbGxVbm1vdW50KSBjb21wb25lbnQuY29tcG9uZW50V2lsbFVubW91bnQoKTtcclxuXHJcblx0Y29tcG9uZW50LmJhc2UgPSBudWxsO1xyXG5cclxuXHR2YXIgaW5uZXIgPSBjb21wb25lbnQuX2NvbXBvbmVudDtcclxuXHRpZiAoaW5uZXIpIHtcclxuXHRcdHVubW91bnRDb21wb25lbnQoaW5uZXIpO1xyXG5cdH0gZWxzZSBpZiAoYmFzZSkge1xyXG5cdFx0aWYgKGJhc2VbJ19fcHJlYWN0YXR0cl8nXSAhPSBudWxsKSBhcHBseVJlZihiYXNlWydfX3ByZWFjdGF0dHJfJ10ucmVmLCBudWxsKTtcclxuXHJcblx0XHRjb21wb25lbnQubmV4dEJhc2UgPSBiYXNlO1xyXG5cclxuXHRcdHJlbW92ZU5vZGUoYmFzZSk7XHJcblx0XHRyZWN5Y2xlckNvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xyXG5cclxuXHRcdHJlbW92ZUNoaWxkcmVuKGJhc2UpO1xyXG5cdH1cclxuXHJcblx0YXBwbHlSZWYoY29tcG9uZW50Ll9fcmVmLCBudWxsKTtcclxufVxyXG5cclxuZnVuY3Rpb24gQ29tcG9uZW50KHByb3BzLCBjb250ZXh0KSB7XHJcblx0dGhpcy5fZGlydHkgPSB0cnVlO1xyXG5cclxuXHR0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xyXG5cclxuXHR0aGlzLnByb3BzID0gcHJvcHM7XHJcblxyXG5cdHRoaXMuc3RhdGUgPSB0aGlzLnN0YXRlIHx8IHt9O1xyXG5cclxuXHR0aGlzLl9yZW5kZXJDYWxsYmFja3MgPSBbXTtcclxufVxyXG5cclxuZXh0ZW5kKENvbXBvbmVudC5wcm90b3R5cGUsIHtcclxuXHRzZXRTdGF0ZTogZnVuY3Rpb24gc2V0U3RhdGUoc3RhdGUsIGNhbGxiYWNrKSB7XHJcblx0XHRpZiAoIXRoaXMucHJldlN0YXRlKSB0aGlzLnByZXZTdGF0ZSA9IHRoaXMuc3RhdGU7XHJcblx0XHR0aGlzLnN0YXRlID0gZXh0ZW5kKGV4dGVuZCh7fSwgdGhpcy5zdGF0ZSksIHR5cGVvZiBzdGF0ZSA9PT0gJ2Z1bmN0aW9uJyA/IHN0YXRlKHRoaXMuc3RhdGUsIHRoaXMucHJvcHMpIDogc3RhdGUpO1xyXG5cdFx0aWYgKGNhbGxiYWNrKSB0aGlzLl9yZW5kZXJDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XHJcblx0XHRlbnF1ZXVlUmVuZGVyKHRoaXMpO1xyXG5cdH0sXHJcblx0Zm9yY2VVcGRhdGU6IGZ1bmN0aW9uIGZvcmNlVXBkYXRlKGNhbGxiYWNrKSB7XHJcblx0XHRpZiAoY2FsbGJhY2spIHRoaXMuX3JlbmRlckNhbGxiYWNrcy5wdXNoKGNhbGxiYWNrKTtcclxuXHRcdHJlbmRlckNvbXBvbmVudCh0aGlzLCAyKTtcclxuXHR9LFxyXG5cdHJlbmRlcjogZnVuY3Rpb24gcmVuZGVyKCkge31cclxufSk7XHJcblxyXG5mdW5jdGlvbiByZW5kZXIodm5vZGUsIHBhcmVudCwgbWVyZ2UpIHtcclxuICByZXR1cm4gZGlmZihtZXJnZSwgdm5vZGUsIHt9LCBmYWxzZSwgcGFyZW50LCBmYWxzZSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZVJlZigpIHtcclxuXHRyZXR1cm4ge307XHJcbn1cclxuXHJcbnZhciBwcmVhY3QgPSB7XHJcblx0aDogaCxcclxuXHRjcmVhdGVFbGVtZW50OiBoLFxyXG5cdGNsb25lRWxlbWVudDogY2xvbmVFbGVtZW50LFxyXG5cdGNyZWF0ZVJlZjogY3JlYXRlUmVmLFxyXG5cdENvbXBvbmVudDogQ29tcG9uZW50LFxyXG5cdHJlbmRlcjogcmVuZGVyLFxyXG5cdHJlcmVuZGVyOiByZXJlbmRlcixcclxuXHRvcHRpb25zOiBvcHRpb25zXHJcbn07XHJcblxyXG5leHBvcnQgZGVmYXVsdCBwcmVhY3Q7XHJcbmV4cG9ydCB7IGgsIGggYXMgY3JlYXRlRWxlbWVudCwgY2xvbmVFbGVtZW50LCBjcmVhdGVSZWYsIENvbXBvbmVudCwgcmVuZGVyLCByZXJlbmRlciwgb3B0aW9ucyB9O1xyXG4iXSwiZmlsZSI6InByZWFjdC5qcyJ9