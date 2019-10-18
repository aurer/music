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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImxpYi9wcmVhY3QuanMiXSwibmFtZXMiOlsiVk5vZGUiLCJvcHRpb25zIiwic3RhY2siLCJFTVBUWV9DSElMRFJFTiIsImgiLCJub2RlTmFtZSIsImF0dHJpYnV0ZXMiLCJjaGlsZHJlbiIsImxhc3RTaW1wbGUiLCJjaGlsZCIsInNpbXBsZSIsImkiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJwdXNoIiwicG9wIiwidW5kZWZpbmVkIiwiU3RyaW5nIiwicCIsImtleSIsInZub2RlIiwiZXh0ZW5kIiwib2JqIiwicHJvcHMiLCJhcHBseVJlZiIsInJlZiIsInZhbHVlIiwiY3VycmVudCIsImRlZmVyIiwiUHJvbWlzZSIsInJlc29sdmUiLCJ0aGVuIiwiYmluZCIsInNldFRpbWVvdXQiLCJjbG9uZUVsZW1lbnQiLCJzbGljZSIsImNhbGwiLCJJU19OT05fRElNRU5TSU9OQUwiLCJpdGVtcyIsImVucXVldWVSZW5kZXIiLCJjb21wb25lbnQiLCJfZGlydHkiLCJkZWJvdW5jZVJlbmRlcmluZyIsInJlcmVuZGVyIiwicmVuZGVyQ29tcG9uZW50IiwiaXNTYW1lTm9kZVR5cGUiLCJub2RlIiwiaHlkcmF0aW5nIiwic3BsaXRUZXh0IiwiX2NvbXBvbmVudENvbnN0cnVjdG9yIiwiaXNOYW1lZE5vZGUiLCJub3JtYWxpemVkTm9kZU5hbWUiLCJ0b0xvd2VyQ2FzZSIsImdldE5vZGVQcm9wcyIsImRlZmF1bHRQcm9wcyIsImNyZWF0ZU5vZGUiLCJpc1N2ZyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudE5TIiwiY3JlYXRlRWxlbWVudCIsInJlbW92ZU5vZGUiLCJwYXJlbnROb2RlIiwicmVtb3ZlQ2hpbGQiLCJzZXRBY2Nlc3NvciIsIm5hbWUiLCJvbGQiLCJjbGFzc05hbWUiLCJzdHlsZSIsImNzc1RleHQiLCJ0ZXN0IiwiaW5uZXJIVE1MIiwiX19odG1sIiwidXNlQ2FwdHVyZSIsInJlcGxhY2UiLCJzdWJzdHJpbmciLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnRQcm94eSIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJfbGlzdGVuZXJzIiwiZSIsInJlbW92ZUF0dHJpYnV0ZSIsIm5zIiwicmVtb3ZlQXR0cmlidXRlTlMiLCJzZXRBdHRyaWJ1dGVOUyIsInNldEF0dHJpYnV0ZSIsInR5cGUiLCJldmVudCIsIm1vdW50cyIsImRpZmZMZXZlbCIsImlzU3ZnTW9kZSIsImZsdXNoTW91bnRzIiwiYyIsInNoaWZ0IiwiYWZ0ZXJNb3VudCIsImNvbXBvbmVudERpZE1vdW50IiwiZGlmZiIsImRvbSIsImNvbnRleHQiLCJtb3VudEFsbCIsInBhcmVudCIsImNvbXBvbmVudFJvb3QiLCJvd25lclNWR0VsZW1lbnQiLCJyZXQiLCJpZGlmZiIsImFwcGVuZENoaWxkIiwib3V0IiwicHJldlN2Z01vZGUiLCJfY29tcG9uZW50Iiwibm9kZVZhbHVlIiwiY3JlYXRlVGV4dE5vZGUiLCJyZXBsYWNlQ2hpbGQiLCJyZWNvbGxlY3ROb2RlVHJlZSIsInZub2RlTmFtZSIsImJ1aWxkQ29tcG9uZW50RnJvbVZOb2RlIiwiZmlyc3RDaGlsZCIsImZjIiwidmNoaWxkcmVuIiwiYSIsIm5leHRTaWJsaW5nIiwiaW5uZXJEaWZmTm9kZSIsImRhbmdlcm91c2x5U2V0SW5uZXJIVE1MIiwiZGlmZkF0dHJpYnV0ZXMiLCJpc0h5ZHJhdGluZyIsIm9yaWdpbmFsQ2hpbGRyZW4iLCJjaGlsZE5vZGVzIiwia2V5ZWQiLCJrZXllZExlbiIsIm1pbiIsImxlbiIsImNoaWxkcmVuTGVuIiwidmxlbiIsImoiLCJmIiwidmNoaWxkIiwiX2NoaWxkIiwiX19rZXkiLCJ0cmltIiwiaW5zZXJ0QmVmb3JlIiwidW5tb3VudE9ubHkiLCJ1bm1vdW50Q29tcG9uZW50IiwicmVtb3ZlQ2hpbGRyZW4iLCJsYXN0Q2hpbGQiLCJuZXh0IiwicHJldmlvdXNTaWJsaW5nIiwiYXR0cnMiLCJyZWN5Y2xlckNvbXBvbmVudHMiLCJjcmVhdGVDb21wb25lbnQiLCJDdG9yIiwiaW5zdCIsInByb3RvdHlwZSIsInJlbmRlciIsIkNvbXBvbmVudCIsImNvbnN0cnVjdG9yIiwiZG9SZW5kZXIiLCJuZXh0QmFzZSIsInNwbGljZSIsInN0YXRlIiwic2V0Q29tcG9uZW50UHJvcHMiLCJyZW5kZXJNb2RlIiwiX2Rpc2FibGUiLCJfX3JlZiIsImdldERlcml2ZWRTdGF0ZUZyb21Qcm9wcyIsImJhc2UiLCJjb21wb25lbnRXaWxsTW91bnQiLCJjb21wb25lbnRXaWxsUmVjZWl2ZVByb3BzIiwicHJldkNvbnRleHQiLCJwcmV2UHJvcHMiLCJzeW5jQ29tcG9uZW50VXBkYXRlcyIsImlzQ2hpbGQiLCJwcmV2aW91c1Byb3BzIiwicHJldmlvdXNTdGF0ZSIsInByZXZTdGF0ZSIsInByZXZpb3VzQ29udGV4dCIsImlzVXBkYXRlIiwiaW5pdGlhbEJhc2UiLCJpbml0aWFsQ2hpbGRDb21wb25lbnQiLCJza2lwIiwic25hcHNob3QiLCJyZW5kZXJlZCIsImNiYXNlIiwic2hvdWxkQ29tcG9uZW50VXBkYXRlIiwiY29tcG9uZW50V2lsbFVwZGF0ZSIsImdldENoaWxkQ29udGV4dCIsImdldFNuYXBzaG90QmVmb3JlVXBkYXRlIiwiY2hpbGRDb21wb25lbnQiLCJ0b1VubW91bnQiLCJjaGlsZFByb3BzIiwiX3BhcmVudENvbXBvbmVudCIsImJhc2VQYXJlbnQiLCJjb21wb25lbnRSZWYiLCJ0IiwiY29tcG9uZW50RGlkVXBkYXRlIiwiYWZ0ZXJVcGRhdGUiLCJfcmVuZGVyQ2FsbGJhY2tzIiwib3JpZ2luYWxDb21wb25lbnQiLCJvbGREb20iLCJpc0RpcmVjdE93bmVyIiwiaXNPd25lciIsImJlZm9yZVVubW91bnQiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsImlubmVyIiwic2V0U3RhdGUiLCJjYWxsYmFjayIsImZvcmNlVXBkYXRlIiwibWVyZ2UiLCJjcmVhdGVSZWYiLCJwcmVhY3QiXSwibWFwcGluZ3MiOiJBQUFBLElBQUlBLEtBQUssR0FBRyxTQUFTQSxLQUFULEdBQWlCLENBQUUsQ0FBL0I7O0FBRUEsSUFBSUMsT0FBTyxHQUFHLEVBQWQ7QUFF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TUFBTSxHQUFHO0FBQ1oxTSxFQUFBQSxDQUFDLEVBQUVBLENBRFM7QUFFWnVELEVBQUFBLGFBQWEsRUFBRXZELENBRkg7QUFHWjhCLEVBQUFBLFlBQVksRUFBRUEsWUFIRjtBQUlaMkssRUFBQUEsU0FBUyxFQUFFQSxTQUpDO0FBS1p0RCxFQUFBQSxTQUFTLEVBQUVBLFNBTEM7QUFNWkQsRUFBQUEsTUFBTSxFQUFFQSxNQU5JO0FBT1ozRyxFQUFBQSxRQUFRLEVBQUVBLFFBUEU7QUFRWjFDLEVBQUFBLE9BQU8sRUFBRUE7QUFSRyxDQUFiO0FBV0EsZUFBZTZNLE1BQWY7QUFDQSxTQUFTMU0sQ0FBVCxFQUFZQSxDQUFDLElBQUl1RCxhQUFqQixFQUFnQ3pCLFlBQWhDLEVBQThDMkssU0FBOUMsRUFBeUR0RCxTQUF6RCxFQUFvRUQsTUFBcEUsRUFBNEUzRyxRQUE1RSxFQUFzRjFDLE9BQXRGIiwic291cmNlc0NvbnRlbnQiOlsidmFyIFZOb2RlID0gZnVuY3Rpb24gVk5vZGUoKSB7fTtcclxuXHJcbnZhciBvcHRpb25zID0ge307XHJcblxyXG52YXIgc3RhY2sgPSBbXTtcclxuXHJcbnZhciBFTVBUWV9DSElMRFJFTiA9IFtdO1xyXG5cclxuZnVuY3Rpb24gaChub2RlTmFtZSwgYXR0cmlidXRlcykge1xyXG5cdHZhciBjaGlsZHJlbiA9IEVNUFRZX0NISUxEUkVOLFxyXG5cdCAgICBsYXN0U2ltcGxlLFxyXG5cdCAgICBjaGlsZCxcclxuXHQgICAgc2ltcGxlLFxyXG5cdCAgICBpO1xyXG5cdGZvciAoaSA9IGFyZ3VtZW50cy5sZW5ndGg7IGktLSA+IDI7KSB7XHJcblx0XHRzdGFjay5wdXNoKGFyZ3VtZW50c1tpXSk7XHJcblx0fVxyXG5cdGlmIChhdHRyaWJ1dGVzICYmIGF0dHJpYnV0ZXMuY2hpbGRyZW4gIT0gbnVsbCkge1xyXG5cdFx0aWYgKCFzdGFjay5sZW5ndGgpIHN0YWNrLnB1c2goYXR0cmlidXRlcy5jaGlsZHJlbik7XHJcblx0XHRkZWxldGUgYXR0cmlidXRlcy5jaGlsZHJlbjtcclxuXHR9XHJcblx0d2hpbGUgKHN0YWNrLmxlbmd0aCkge1xyXG5cdFx0aWYgKChjaGlsZCA9IHN0YWNrLnBvcCgpKSAmJiBjaGlsZC5wb3AgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRmb3IgKGkgPSBjaGlsZC5sZW5ndGg7IGktLTspIHtcclxuXHRcdFx0XHRzdGFjay5wdXNoKGNoaWxkW2ldKTtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0aWYgKHR5cGVvZiBjaGlsZCA9PT0gJ2Jvb2xlYW4nKSBjaGlsZCA9IG51bGw7XHJcblxyXG5cdFx0XHRpZiAoc2ltcGxlID0gdHlwZW9mIG5vZGVOYW1lICE9PSAnZnVuY3Rpb24nKSB7XHJcblx0XHRcdFx0aWYgKGNoaWxkID09IG51bGwpIGNoaWxkID0gJyc7ZWxzZSBpZiAodHlwZW9mIGNoaWxkID09PSAnbnVtYmVyJykgY2hpbGQgPSBTdHJpbmcoY2hpbGQpO2Vsc2UgaWYgKHR5cGVvZiBjaGlsZCAhPT0gJ3N0cmluZycpIHNpbXBsZSA9IGZhbHNlO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoc2ltcGxlICYmIGxhc3RTaW1wbGUpIHtcclxuXHRcdFx0XHRjaGlsZHJlbltjaGlsZHJlbi5sZW5ndGggLSAxXSArPSBjaGlsZDtcclxuXHRcdFx0fSBlbHNlIGlmIChjaGlsZHJlbiA9PT0gRU1QVFlfQ0hJTERSRU4pIHtcclxuXHRcdFx0XHRjaGlsZHJlbiA9IFtjaGlsZF07XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Y2hpbGRyZW4ucHVzaChjaGlsZCk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGxhc3RTaW1wbGUgPSBzaW1wbGU7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR2YXIgcCA9IG5ldyBWTm9kZSgpO1xyXG5cdHAubm9kZU5hbWUgPSBub2RlTmFtZTtcclxuXHRwLmNoaWxkcmVuID0gY2hpbGRyZW47XHJcblx0cC5hdHRyaWJ1dGVzID0gYXR0cmlidXRlcyA9PSBudWxsID8gdW5kZWZpbmVkIDogYXR0cmlidXRlcztcclxuXHRwLmtleSA9IGF0dHJpYnV0ZXMgPT0gbnVsbCA/IHVuZGVmaW5lZCA6IGF0dHJpYnV0ZXMua2V5O1xyXG5cclxuXHRpZiAob3B0aW9ucy52bm9kZSAhPT0gdW5kZWZpbmVkKSBvcHRpb25zLnZub2RlKHApO1xyXG5cclxuXHRyZXR1cm4gcDtcclxufVxyXG5cclxuZnVuY3Rpb24gZXh0ZW5kKG9iaiwgcHJvcHMpIHtcclxuICBmb3IgKHZhciBpIGluIHByb3BzKSB7XHJcbiAgICBvYmpbaV0gPSBwcm9wc1tpXTtcclxuICB9cmV0dXJuIG9iajtcclxufVxyXG5cclxuZnVuY3Rpb24gYXBwbHlSZWYocmVmLCB2YWx1ZSkge1xyXG4gIGlmIChyZWYpIHtcclxuICAgIGlmICh0eXBlb2YgcmVmID09ICdmdW5jdGlvbicpIHJlZih2YWx1ZSk7ZWxzZSByZWYuY3VycmVudCA9IHZhbHVlO1xyXG4gIH1cclxufVxyXG5cclxudmFyIGRlZmVyID0gdHlwZW9mIFByb21pc2UgPT0gJ2Z1bmN0aW9uJyA/IFByb21pc2UucmVzb2x2ZSgpLnRoZW4uYmluZChQcm9taXNlLnJlc29sdmUoKSkgOiBzZXRUaW1lb3V0O1xyXG5cclxuZnVuY3Rpb24gY2xvbmVFbGVtZW50KHZub2RlLCBwcm9wcykge1xyXG4gIHJldHVybiBoKHZub2RlLm5vZGVOYW1lLCBleHRlbmQoZXh0ZW5kKHt9LCB2bm9kZS5hdHRyaWJ1dGVzKSwgcHJvcHMpLCBhcmd1bWVudHMubGVuZ3RoID4gMiA/IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAyKSA6IHZub2RlLmNoaWxkcmVuKTtcclxufVxyXG5cclxudmFyIElTX05PTl9ESU1FTlNJT05BTCA9IC9hY2l0fGV4KD86c3xnfG58cHwkKXxycGh8b3dzfG1uY3xudHd8aW5lW2NoXXx6b298Xm9yZC9pO1xyXG5cclxudmFyIGl0ZW1zID0gW107XHJcblxyXG5mdW5jdGlvbiBlbnF1ZXVlUmVuZGVyKGNvbXBvbmVudCkge1xyXG5cdGlmICghY29tcG9uZW50Ll9kaXJ0eSAmJiAoY29tcG9uZW50Ll9kaXJ0eSA9IHRydWUpICYmIGl0ZW1zLnB1c2goY29tcG9uZW50KSA9PSAxKSB7XHJcblx0XHQob3B0aW9ucy5kZWJvdW5jZVJlbmRlcmluZyB8fCBkZWZlcikocmVyZW5kZXIpO1xyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVyZW5kZXIoKSB7XHJcblx0dmFyIHA7XHJcblx0d2hpbGUgKHAgPSBpdGVtcy5wb3AoKSkge1xyXG5cdFx0aWYgKHAuX2RpcnR5KSByZW5kZXJDb21wb25lbnQocCk7XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBpc1NhbWVOb2RlVHlwZShub2RlLCB2bm9kZSwgaHlkcmF0aW5nKSB7XHJcblx0aWYgKHR5cGVvZiB2bm9kZSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHZub2RlID09PSAnbnVtYmVyJykge1xyXG5cdFx0cmV0dXJuIG5vZGUuc3BsaXRUZXh0ICE9PSB1bmRlZmluZWQ7XHJcblx0fVxyXG5cdGlmICh0eXBlb2Ygdm5vZGUubm9kZU5hbWUgPT09ICdzdHJpbmcnKSB7XHJcblx0XHRyZXR1cm4gIW5vZGUuX2NvbXBvbmVudENvbnN0cnVjdG9yICYmIGlzTmFtZWROb2RlKG5vZGUsIHZub2RlLm5vZGVOYW1lKTtcclxuXHR9XHJcblx0cmV0dXJuIGh5ZHJhdGluZyB8fCBub2RlLl9jb21wb25lbnRDb25zdHJ1Y3RvciA9PT0gdm5vZGUubm9kZU5hbWU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlzTmFtZWROb2RlKG5vZGUsIG5vZGVOYW1lKSB7XHJcblx0cmV0dXJuIG5vZGUubm9ybWFsaXplZE5vZGVOYW1lID09PSBub2RlTmFtZSB8fCBub2RlLm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09IG5vZGVOYW1lLnRvTG93ZXJDYXNlKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldE5vZGVQcm9wcyh2bm9kZSkge1xyXG5cdHZhciBwcm9wcyA9IGV4dGVuZCh7fSwgdm5vZGUuYXR0cmlidXRlcyk7XHJcblx0cHJvcHMuY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlbjtcclxuXHJcblx0dmFyIGRlZmF1bHRQcm9wcyA9IHZub2RlLm5vZGVOYW1lLmRlZmF1bHRQcm9wcztcclxuXHRpZiAoZGVmYXVsdFByb3BzICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdGZvciAodmFyIGkgaW4gZGVmYXVsdFByb3BzKSB7XHJcblx0XHRcdGlmIChwcm9wc1tpXSA9PT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0cHJvcHNbaV0gPSBkZWZhdWx0UHJvcHNbaV07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHJldHVybiBwcm9wcztcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlTm9kZShub2RlTmFtZSwgaXNTdmcpIHtcclxuXHR2YXIgbm9kZSA9IGlzU3ZnID8gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIG5vZGVOYW1lKSA6IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobm9kZU5hbWUpO1xyXG5cdG5vZGUubm9ybWFsaXplZE5vZGVOYW1lID0gbm9kZU5hbWU7XHJcblx0cmV0dXJuIG5vZGU7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbW92ZU5vZGUobm9kZSkge1xyXG5cdHZhciBwYXJlbnROb2RlID0gbm9kZS5wYXJlbnROb2RlO1xyXG5cdGlmIChwYXJlbnROb2RlKSBwYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRBY2Nlc3Nvcihub2RlLCBuYW1lLCBvbGQsIHZhbHVlLCBpc1N2Zykge1xyXG5cdGlmIChuYW1lID09PSAnY2xhc3NOYW1lJykgbmFtZSA9ICdjbGFzcyc7XHJcblxyXG5cdGlmIChuYW1lID09PSAna2V5Jykge30gZWxzZSBpZiAobmFtZSA9PT0gJ3JlZicpIHtcclxuXHRcdGFwcGx5UmVmKG9sZCwgbnVsbCk7XHJcblx0XHRhcHBseVJlZih2YWx1ZSwgbm9kZSk7XHJcblx0fSBlbHNlIGlmIChuYW1lID09PSAnY2xhc3MnICYmICFpc1N2Zykge1xyXG5cdFx0bm9kZS5jbGFzc05hbWUgPSB2YWx1ZSB8fCAnJztcclxuXHR9IGVsc2UgaWYgKG5hbWUgPT09ICdzdHlsZScpIHtcclxuXHRcdGlmICghdmFsdWUgfHwgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygb2xkID09PSAnc3RyaW5nJykge1xyXG5cdFx0XHRub2RlLnN0eWxlLmNzc1RleHQgPSB2YWx1ZSB8fCAnJztcclxuXHRcdH1cclxuXHRcdGlmICh2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnKSB7XHJcblx0XHRcdGlmICh0eXBlb2Ygb2xkICE9PSAnc3RyaW5nJykge1xyXG5cdFx0XHRcdGZvciAodmFyIGkgaW4gb2xkKSB7XHJcblx0XHRcdFx0XHRpZiAoIShpIGluIHZhbHVlKSkgbm9kZS5zdHlsZVtpXSA9ICcnO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRmb3IgKHZhciBpIGluIHZhbHVlKSB7XHJcblx0XHRcdFx0bm9kZS5zdHlsZVtpXSA9IHR5cGVvZiB2YWx1ZVtpXSA9PT0gJ251bWJlcicgJiYgSVNfTk9OX0RJTUVOU0lPTkFMLnRlc3QoaSkgPT09IGZhbHNlID8gdmFsdWVbaV0gKyAncHgnIDogdmFsdWVbaV07XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9IGVsc2UgaWYgKG5hbWUgPT09ICdkYW5nZXJvdXNseVNldElubmVySFRNTCcpIHtcclxuXHRcdGlmICh2YWx1ZSkgbm9kZS5pbm5lckhUTUwgPSB2YWx1ZS5fX2h0bWwgfHwgJyc7XHJcblx0fSBlbHNlIGlmIChuYW1lWzBdID09ICdvJyAmJiBuYW1lWzFdID09ICduJykge1xyXG5cdFx0dmFyIHVzZUNhcHR1cmUgPSBuYW1lICE9PSAobmFtZSA9IG5hbWUucmVwbGFjZSgvQ2FwdHVyZSQvLCAnJykpO1xyXG5cdFx0bmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKS5zdWJzdHJpbmcoMik7XHJcblx0XHRpZiAodmFsdWUpIHtcclxuXHRcdFx0aWYgKCFvbGQpIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBldmVudFByb3h5LCB1c2VDYXB0dXJlKTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBldmVudFByb3h5LCB1c2VDYXB0dXJlKTtcclxuXHRcdH1cclxuXHRcdChub2RlLl9saXN0ZW5lcnMgfHwgKG5vZGUuX2xpc3RlbmVycyA9IHt9KSlbbmFtZV0gPSB2YWx1ZTtcclxuXHR9IGVsc2UgaWYgKG5hbWUgIT09ICdsaXN0JyAmJiBuYW1lICE9PSAndHlwZScgJiYgIWlzU3ZnICYmIG5hbWUgaW4gbm9kZSkge1xyXG5cdFx0dHJ5IHtcclxuXHRcdFx0bm9kZVtuYW1lXSA9IHZhbHVlID09IG51bGwgPyAnJyA6IHZhbHVlO1xyXG5cdFx0fSBjYXRjaCAoZSkge31cclxuXHRcdGlmICgodmFsdWUgPT0gbnVsbCB8fCB2YWx1ZSA9PT0gZmFsc2UpICYmIG5hbWUgIT0gJ3NwZWxsY2hlY2snKSBub2RlLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcclxuXHR9IGVsc2Uge1xyXG5cdFx0dmFyIG5zID0gaXNTdmcgJiYgbmFtZSAhPT0gKG5hbWUgPSBuYW1lLnJlcGxhY2UoL154bGluazo/LywgJycpKTtcclxuXHJcblx0XHRpZiAodmFsdWUgPT0gbnVsbCB8fCB2YWx1ZSA9PT0gZmFsc2UpIHtcclxuXHRcdFx0aWYgKG5zKSBub2RlLnJlbW92ZUF0dHJpYnV0ZU5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJywgbmFtZS50b0xvd2VyQ2FzZSgpKTtlbHNlIG5vZGUucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xyXG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgIT09ICdmdW5jdGlvbicpIHtcclxuXHRcdFx0aWYgKG5zKSBub2RlLnNldEF0dHJpYnV0ZU5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJywgbmFtZS50b0xvd2VyQ2FzZSgpLCB2YWx1ZSk7ZWxzZSBub2RlLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBldmVudFByb3h5KGUpIHtcclxuXHRyZXR1cm4gdGhpcy5fbGlzdGVuZXJzW2UudHlwZV0ob3B0aW9ucy5ldmVudCAmJiBvcHRpb25zLmV2ZW50KGUpIHx8IGUpO1xyXG59XHJcblxyXG52YXIgbW91bnRzID0gW107XHJcblxyXG52YXIgZGlmZkxldmVsID0gMDtcclxuXHJcbnZhciBpc1N2Z01vZGUgPSBmYWxzZTtcclxuXHJcbnZhciBoeWRyYXRpbmcgPSBmYWxzZTtcclxuXHJcbmZ1bmN0aW9uIGZsdXNoTW91bnRzKCkge1xyXG5cdHZhciBjO1xyXG5cdHdoaWxlIChjID0gbW91bnRzLnNoaWZ0KCkpIHtcclxuXHRcdGlmIChvcHRpb25zLmFmdGVyTW91bnQpIG9wdGlvbnMuYWZ0ZXJNb3VudChjKTtcclxuXHRcdGlmIChjLmNvbXBvbmVudERpZE1vdW50KSBjLmNvbXBvbmVudERpZE1vdW50KCk7XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBkaWZmKGRvbSwgdm5vZGUsIGNvbnRleHQsIG1vdW50QWxsLCBwYXJlbnQsIGNvbXBvbmVudFJvb3QpIHtcclxuXHRpZiAoIWRpZmZMZXZlbCsrKSB7XHJcblx0XHRpc1N2Z01vZGUgPSBwYXJlbnQgIT0gbnVsbCAmJiBwYXJlbnQub3duZXJTVkdFbGVtZW50ICE9PSB1bmRlZmluZWQ7XHJcblxyXG5cdFx0aHlkcmF0aW5nID0gZG9tICE9IG51bGwgJiYgISgnX19wcmVhY3RhdHRyXycgaW4gZG9tKTtcclxuXHR9XHJcblxyXG5cdHZhciByZXQgPSBpZGlmZihkb20sIHZub2RlLCBjb250ZXh0LCBtb3VudEFsbCwgY29tcG9uZW50Um9vdCk7XHJcblxyXG5cdGlmIChwYXJlbnQgJiYgcmV0LnBhcmVudE5vZGUgIT09IHBhcmVudCkgcGFyZW50LmFwcGVuZENoaWxkKHJldCk7XHJcblxyXG5cdGlmICghIC0tZGlmZkxldmVsKSB7XHJcblx0XHRoeWRyYXRpbmcgPSBmYWxzZTtcclxuXHJcblx0XHRpZiAoIWNvbXBvbmVudFJvb3QpIGZsdXNoTW91bnRzKCk7XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gcmV0O1xyXG59XHJcblxyXG5mdW5jdGlvbiBpZGlmZihkb20sIHZub2RlLCBjb250ZXh0LCBtb3VudEFsbCwgY29tcG9uZW50Um9vdCkge1xyXG5cdHZhciBvdXQgPSBkb20sXHJcblx0ICAgIHByZXZTdmdNb2RlID0gaXNTdmdNb2RlO1xyXG5cclxuXHRpZiAodm5vZGUgPT0gbnVsbCB8fCB0eXBlb2Ygdm5vZGUgPT09ICdib29sZWFuJykgdm5vZGUgPSAnJztcclxuXHJcblx0aWYgKHR5cGVvZiB2bm9kZSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHZub2RlID09PSAnbnVtYmVyJykge1xyXG5cdFx0aWYgKGRvbSAmJiBkb20uc3BsaXRUZXh0ICE9PSB1bmRlZmluZWQgJiYgZG9tLnBhcmVudE5vZGUgJiYgKCFkb20uX2NvbXBvbmVudCB8fCBjb21wb25lbnRSb290KSkge1xyXG5cdFx0XHRpZiAoZG9tLm5vZGVWYWx1ZSAhPSB2bm9kZSkge1xyXG5cdFx0XHRcdGRvbS5ub2RlVmFsdWUgPSB2bm9kZTtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0b3V0ID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodm5vZGUpO1xyXG5cdFx0XHRpZiAoZG9tKSB7XHJcblx0XHRcdFx0aWYgKGRvbS5wYXJlbnROb2RlKSBkb20ucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQob3V0LCBkb20pO1xyXG5cdFx0XHRcdHJlY29sbGVjdE5vZGVUcmVlKGRvbSwgdHJ1ZSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRvdXRbJ19fcHJlYWN0YXR0cl8nXSA9IHRydWU7XHJcblxyXG5cdFx0cmV0dXJuIG91dDtcclxuXHR9XHJcblxyXG5cdHZhciB2bm9kZU5hbWUgPSB2bm9kZS5ub2RlTmFtZTtcclxuXHRpZiAodHlwZW9mIHZub2RlTmFtZSA9PT0gJ2Z1bmN0aW9uJykge1xyXG5cdFx0cmV0dXJuIGJ1aWxkQ29tcG9uZW50RnJvbVZOb2RlKGRvbSwgdm5vZGUsIGNvbnRleHQsIG1vdW50QWxsKTtcclxuXHR9XHJcblxyXG5cdGlzU3ZnTW9kZSA9IHZub2RlTmFtZSA9PT0gJ3N2ZycgPyB0cnVlIDogdm5vZGVOYW1lID09PSAnZm9yZWlnbk9iamVjdCcgPyBmYWxzZSA6IGlzU3ZnTW9kZTtcclxuXHJcblx0dm5vZGVOYW1lID0gU3RyaW5nKHZub2RlTmFtZSk7XHJcblx0aWYgKCFkb20gfHwgIWlzTmFtZWROb2RlKGRvbSwgdm5vZGVOYW1lKSkge1xyXG5cdFx0b3V0ID0gY3JlYXRlTm9kZSh2bm9kZU5hbWUsIGlzU3ZnTW9kZSk7XHJcblxyXG5cdFx0aWYgKGRvbSkge1xyXG5cdFx0XHR3aGlsZSAoZG9tLmZpcnN0Q2hpbGQpIHtcclxuXHRcdFx0XHRvdXQuYXBwZW5kQ2hpbGQoZG9tLmZpcnN0Q2hpbGQpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGlmIChkb20ucGFyZW50Tm9kZSkgZG9tLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG91dCwgZG9tKTtcclxuXHJcblx0XHRcdHJlY29sbGVjdE5vZGVUcmVlKGRvbSwgdHJ1ZSk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR2YXIgZmMgPSBvdXQuZmlyc3RDaGlsZCxcclxuXHQgICAgcHJvcHMgPSBvdXRbJ19fcHJlYWN0YXR0cl8nXSxcclxuXHQgICAgdmNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW47XHJcblxyXG5cdGlmIChwcm9wcyA9PSBudWxsKSB7XHJcblx0XHRwcm9wcyA9IG91dFsnX19wcmVhY3RhdHRyXyddID0ge307XHJcblx0XHRmb3IgKHZhciBhID0gb3V0LmF0dHJpYnV0ZXMsIGkgPSBhLmxlbmd0aDsgaS0tOykge1xyXG5cdFx0XHRwcm9wc1thW2ldLm5hbWVdID0gYVtpXS52YWx1ZTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGlmICghaHlkcmF0aW5nICYmIHZjaGlsZHJlbiAmJiB2Y2hpbGRyZW4ubGVuZ3RoID09PSAxICYmIHR5cGVvZiB2Y2hpbGRyZW5bMF0gPT09ICdzdHJpbmcnICYmIGZjICE9IG51bGwgJiYgZmMuc3BsaXRUZXh0ICE9PSB1bmRlZmluZWQgJiYgZmMubmV4dFNpYmxpbmcgPT0gbnVsbCkge1xyXG5cdFx0aWYgKGZjLm5vZGVWYWx1ZSAhPSB2Y2hpbGRyZW5bMF0pIHtcclxuXHRcdFx0ZmMubm9kZVZhbHVlID0gdmNoaWxkcmVuWzBdO1xyXG5cdFx0fVxyXG5cdH0gZWxzZSBpZiAodmNoaWxkcmVuICYmIHZjaGlsZHJlbi5sZW5ndGggfHwgZmMgIT0gbnVsbCkge1xyXG5cdFx0XHRpbm5lckRpZmZOb2RlKG91dCwgdmNoaWxkcmVuLCBjb250ZXh0LCBtb3VudEFsbCwgaHlkcmF0aW5nIHx8IHByb3BzLmRhbmdlcm91c2x5U2V0SW5uZXJIVE1MICE9IG51bGwpO1xyXG5cdFx0fVxyXG5cclxuXHRkaWZmQXR0cmlidXRlcyhvdXQsIHZub2RlLmF0dHJpYnV0ZXMsIHByb3BzKTtcclxuXHJcblx0aXNTdmdNb2RlID0gcHJldlN2Z01vZGU7XHJcblxyXG5cdHJldHVybiBvdXQ7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGlubmVyRGlmZk5vZGUoZG9tLCB2Y2hpbGRyZW4sIGNvbnRleHQsIG1vdW50QWxsLCBpc0h5ZHJhdGluZykge1xyXG5cdHZhciBvcmlnaW5hbENoaWxkcmVuID0gZG9tLmNoaWxkTm9kZXMsXHJcblx0ICAgIGNoaWxkcmVuID0gW10sXHJcblx0ICAgIGtleWVkID0ge30sXHJcblx0ICAgIGtleWVkTGVuID0gMCxcclxuXHQgICAgbWluID0gMCxcclxuXHQgICAgbGVuID0gb3JpZ2luYWxDaGlsZHJlbi5sZW5ndGgsXHJcblx0ICAgIGNoaWxkcmVuTGVuID0gMCxcclxuXHQgICAgdmxlbiA9IHZjaGlsZHJlbiA/IHZjaGlsZHJlbi5sZW5ndGggOiAwLFxyXG5cdCAgICBqLFxyXG5cdCAgICBjLFxyXG5cdCAgICBmLFxyXG5cdCAgICB2Y2hpbGQsXHJcblx0ICAgIGNoaWxkO1xyXG5cclxuXHRpZiAobGVuICE9PSAwKSB7XHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XHJcblx0XHRcdHZhciBfY2hpbGQgPSBvcmlnaW5hbENoaWxkcmVuW2ldLFxyXG5cdFx0XHQgICAgcHJvcHMgPSBfY2hpbGRbJ19fcHJlYWN0YXR0cl8nXSxcclxuXHRcdFx0ICAgIGtleSA9IHZsZW4gJiYgcHJvcHMgPyBfY2hpbGQuX2NvbXBvbmVudCA/IF9jaGlsZC5fY29tcG9uZW50Ll9fa2V5IDogcHJvcHMua2V5IDogbnVsbDtcclxuXHRcdFx0aWYgKGtleSAhPSBudWxsKSB7XHJcblx0XHRcdFx0a2V5ZWRMZW4rKztcclxuXHRcdFx0XHRrZXllZFtrZXldID0gX2NoaWxkO1xyXG5cdFx0XHR9IGVsc2UgaWYgKHByb3BzIHx8IChfY2hpbGQuc3BsaXRUZXh0ICE9PSB1bmRlZmluZWQgPyBpc0h5ZHJhdGluZyA/IF9jaGlsZC5ub2RlVmFsdWUudHJpbSgpIDogdHJ1ZSA6IGlzSHlkcmF0aW5nKSkge1xyXG5cdFx0XHRcdGNoaWxkcmVuW2NoaWxkcmVuTGVuKytdID0gX2NoaWxkO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRpZiAodmxlbiAhPT0gMCkge1xyXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB2bGVuOyBpKyspIHtcclxuXHRcdFx0dmNoaWxkID0gdmNoaWxkcmVuW2ldO1xyXG5cdFx0XHRjaGlsZCA9IG51bGw7XHJcblxyXG5cdFx0XHR2YXIga2V5ID0gdmNoaWxkLmtleTtcclxuXHRcdFx0aWYgKGtleSAhPSBudWxsKSB7XHJcblx0XHRcdFx0aWYgKGtleWVkTGVuICYmIGtleWVkW2tleV0gIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0Y2hpbGQgPSBrZXllZFtrZXldO1xyXG5cdFx0XHRcdFx0a2V5ZWRba2V5XSA9IHVuZGVmaW5lZDtcclxuXHRcdFx0XHRcdGtleWVkTGVuLS07XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2UgaWYgKG1pbiA8IGNoaWxkcmVuTGVuKSB7XHJcblx0XHRcdFx0XHRmb3IgKGogPSBtaW47IGogPCBjaGlsZHJlbkxlbjsgaisrKSB7XHJcblx0XHRcdFx0XHRcdGlmIChjaGlsZHJlbltqXSAhPT0gdW5kZWZpbmVkICYmIGlzU2FtZU5vZGVUeXBlKGMgPSBjaGlsZHJlbltqXSwgdmNoaWxkLCBpc0h5ZHJhdGluZykpIHtcclxuXHRcdFx0XHRcdFx0XHRjaGlsZCA9IGM7XHJcblx0XHRcdFx0XHRcdFx0Y2hpbGRyZW5bal0gPSB1bmRlZmluZWQ7XHJcblx0XHRcdFx0XHRcdFx0aWYgKGogPT09IGNoaWxkcmVuTGVuIC0gMSkgY2hpbGRyZW5MZW4tLTtcclxuXHRcdFx0XHRcdFx0XHRpZiAoaiA9PT0gbWluKSBtaW4rKztcclxuXHRcdFx0XHRcdFx0XHRicmVhaztcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdGNoaWxkID0gaWRpZmYoY2hpbGQsIHZjaGlsZCwgY29udGV4dCwgbW91bnRBbGwpO1xyXG5cclxuXHRcdFx0ZiA9IG9yaWdpbmFsQ2hpbGRyZW5baV07XHJcblx0XHRcdGlmIChjaGlsZCAmJiBjaGlsZCAhPT0gZG9tICYmIGNoaWxkICE9PSBmKSB7XHJcblx0XHRcdFx0aWYgKGYgPT0gbnVsbCkge1xyXG5cdFx0XHRcdFx0ZG9tLmFwcGVuZENoaWxkKGNoaWxkKTtcclxuXHRcdFx0XHR9IGVsc2UgaWYgKGNoaWxkID09PSBmLm5leHRTaWJsaW5nKSB7XHJcblx0XHRcdFx0XHRyZW1vdmVOb2RlKGYpO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRkb20uaW5zZXJ0QmVmb3JlKGNoaWxkLCBmKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGlmIChrZXllZExlbikge1xyXG5cdFx0Zm9yICh2YXIgaSBpbiBrZXllZCkge1xyXG5cdFx0XHRpZiAoa2V5ZWRbaV0gIT09IHVuZGVmaW5lZCkgcmVjb2xsZWN0Tm9kZVRyZWUoa2V5ZWRbaV0sIGZhbHNlKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHdoaWxlIChtaW4gPD0gY2hpbGRyZW5MZW4pIHtcclxuXHRcdGlmICgoY2hpbGQgPSBjaGlsZHJlbltjaGlsZHJlbkxlbi0tXSkgIT09IHVuZGVmaW5lZCkgcmVjb2xsZWN0Tm9kZVRyZWUoY2hpbGQsIGZhbHNlKTtcclxuXHR9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlY29sbGVjdE5vZGVUcmVlKG5vZGUsIHVubW91bnRPbmx5KSB7XHJcblx0dmFyIGNvbXBvbmVudCA9IG5vZGUuX2NvbXBvbmVudDtcclxuXHRpZiAoY29tcG9uZW50KSB7XHJcblx0XHR1bm1vdW50Q29tcG9uZW50KGNvbXBvbmVudCk7XHJcblx0fSBlbHNlIHtcclxuXHRcdGlmIChub2RlWydfX3ByZWFjdGF0dHJfJ10gIT0gbnVsbCkgYXBwbHlSZWYobm9kZVsnX19wcmVhY3RhdHRyXyddLnJlZiwgbnVsbCk7XHJcblxyXG5cdFx0aWYgKHVubW91bnRPbmx5ID09PSBmYWxzZSB8fCBub2RlWydfX3ByZWFjdGF0dHJfJ10gPT0gbnVsbCkge1xyXG5cdFx0XHRyZW1vdmVOb2RlKG5vZGUpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJlbW92ZUNoaWxkcmVuKG5vZGUpO1xyXG5cdH1cclxufVxyXG5cclxuZnVuY3Rpb24gcmVtb3ZlQ2hpbGRyZW4obm9kZSkge1xyXG5cdG5vZGUgPSBub2RlLmxhc3RDaGlsZDtcclxuXHR3aGlsZSAobm9kZSkge1xyXG5cdFx0dmFyIG5leHQgPSBub2RlLnByZXZpb3VzU2libGluZztcclxuXHRcdHJlY29sbGVjdE5vZGVUcmVlKG5vZGUsIHRydWUpO1xyXG5cdFx0bm9kZSA9IG5leHQ7XHJcblx0fVxyXG59XHJcblxyXG5mdW5jdGlvbiBkaWZmQXR0cmlidXRlcyhkb20sIGF0dHJzLCBvbGQpIHtcclxuXHR2YXIgbmFtZTtcclxuXHJcblx0Zm9yIChuYW1lIGluIG9sZCkge1xyXG5cdFx0aWYgKCEoYXR0cnMgJiYgYXR0cnNbbmFtZV0gIT0gbnVsbCkgJiYgb2xkW25hbWVdICE9IG51bGwpIHtcclxuXHRcdFx0c2V0QWNjZXNzb3IoZG9tLCBuYW1lLCBvbGRbbmFtZV0sIG9sZFtuYW1lXSA9IHVuZGVmaW5lZCwgaXNTdmdNb2RlKTtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZvciAobmFtZSBpbiBhdHRycykge1xyXG5cdFx0aWYgKG5hbWUgIT09ICdjaGlsZHJlbicgJiYgbmFtZSAhPT0gJ2lubmVySFRNTCcgJiYgKCEobmFtZSBpbiBvbGQpIHx8IGF0dHJzW25hbWVdICE9PSAobmFtZSA9PT0gJ3ZhbHVlJyB8fCBuYW1lID09PSAnY2hlY2tlZCcgPyBkb21bbmFtZV0gOiBvbGRbbmFtZV0pKSkge1xyXG5cdFx0XHRzZXRBY2Nlc3Nvcihkb20sIG5hbWUsIG9sZFtuYW1lXSwgb2xkW25hbWVdID0gYXR0cnNbbmFtZV0sIGlzU3ZnTW9kZSk7XHJcblx0XHR9XHJcblx0fVxyXG59XHJcblxyXG52YXIgcmVjeWNsZXJDb21wb25lbnRzID0gW107XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVDb21wb25lbnQoQ3RvciwgcHJvcHMsIGNvbnRleHQpIHtcclxuXHR2YXIgaW5zdCxcclxuXHQgICAgaSA9IHJlY3ljbGVyQ29tcG9uZW50cy5sZW5ndGg7XHJcblxyXG5cdGlmIChDdG9yLnByb3RvdHlwZSAmJiBDdG9yLnByb3RvdHlwZS5yZW5kZXIpIHtcclxuXHRcdGluc3QgPSBuZXcgQ3Rvcihwcm9wcywgY29udGV4dCk7XHJcblx0XHRDb21wb25lbnQuY2FsbChpbnN0LCBwcm9wcywgY29udGV4dCk7XHJcblx0fSBlbHNlIHtcclxuXHRcdGluc3QgPSBuZXcgQ29tcG9uZW50KHByb3BzLCBjb250ZXh0KTtcclxuXHRcdGluc3QuY29uc3RydWN0b3IgPSBDdG9yO1xyXG5cdFx0aW5zdC5yZW5kZXIgPSBkb1JlbmRlcjtcclxuXHR9XHJcblxyXG5cdHdoaWxlIChpLS0pIHtcclxuXHRcdGlmIChyZWN5Y2xlckNvbXBvbmVudHNbaV0uY29uc3RydWN0b3IgPT09IEN0b3IpIHtcclxuXHRcdFx0aW5zdC5uZXh0QmFzZSA9IHJlY3ljbGVyQ29tcG9uZW50c1tpXS5uZXh0QmFzZTtcclxuXHRcdFx0cmVjeWNsZXJDb21wb25lbnRzLnNwbGljZShpLCAxKTtcclxuXHRcdFx0cmV0dXJuIGluc3Q7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRyZXR1cm4gaW5zdDtcclxufVxyXG5cclxuZnVuY3Rpb24gZG9SZW5kZXIocHJvcHMsIHN0YXRlLCBjb250ZXh0KSB7XHJcblx0cmV0dXJuIHRoaXMuY29uc3RydWN0b3IocHJvcHMsIGNvbnRleHQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzZXRDb21wb25lbnRQcm9wcyhjb21wb25lbnQsIHByb3BzLCByZW5kZXJNb2RlLCBjb250ZXh0LCBtb3VudEFsbCkge1xyXG5cdGlmIChjb21wb25lbnQuX2Rpc2FibGUpIHJldHVybjtcclxuXHRjb21wb25lbnQuX2Rpc2FibGUgPSB0cnVlO1xyXG5cclxuXHRjb21wb25lbnQuX19yZWYgPSBwcm9wcy5yZWY7XHJcblx0Y29tcG9uZW50Ll9fa2V5ID0gcHJvcHMua2V5O1xyXG5cdGRlbGV0ZSBwcm9wcy5yZWY7XHJcblx0ZGVsZXRlIHByb3BzLmtleTtcclxuXHJcblx0aWYgKHR5cGVvZiBjb21wb25lbnQuY29uc3RydWN0b3IuZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzID09PSAndW5kZWZpbmVkJykge1xyXG5cdFx0aWYgKCFjb21wb25lbnQuYmFzZSB8fCBtb3VudEFsbCkge1xyXG5cdFx0XHRpZiAoY29tcG9uZW50LmNvbXBvbmVudFdpbGxNb3VudCkgY29tcG9uZW50LmNvbXBvbmVudFdpbGxNb3VudCgpO1xyXG5cdFx0fSBlbHNlIGlmIChjb21wb25lbnQuY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcykge1xyXG5cdFx0XHRjb21wb25lbnQuY29tcG9uZW50V2lsbFJlY2VpdmVQcm9wcyhwcm9wcywgY29udGV4dCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRpZiAoY29udGV4dCAmJiBjb250ZXh0ICE9PSBjb21wb25lbnQuY29udGV4dCkge1xyXG5cdFx0aWYgKCFjb21wb25lbnQucHJldkNvbnRleHQpIGNvbXBvbmVudC5wcmV2Q29udGV4dCA9IGNvbXBvbmVudC5jb250ZXh0O1xyXG5cdFx0Y29tcG9uZW50LmNvbnRleHQgPSBjb250ZXh0O1xyXG5cdH1cclxuXHJcblx0aWYgKCFjb21wb25lbnQucHJldlByb3BzKSBjb21wb25lbnQucHJldlByb3BzID0gY29tcG9uZW50LnByb3BzO1xyXG5cdGNvbXBvbmVudC5wcm9wcyA9IHByb3BzO1xyXG5cclxuXHRjb21wb25lbnQuX2Rpc2FibGUgPSBmYWxzZTtcclxuXHJcblx0aWYgKHJlbmRlck1vZGUgIT09IDApIHtcclxuXHRcdGlmIChyZW5kZXJNb2RlID09PSAxIHx8IG9wdGlvbnMuc3luY0NvbXBvbmVudFVwZGF0ZXMgIT09IGZhbHNlIHx8ICFjb21wb25lbnQuYmFzZSkge1xyXG5cdFx0XHRyZW5kZXJDb21wb25lbnQoY29tcG9uZW50LCAxLCBtb3VudEFsbCk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRlbnF1ZXVlUmVuZGVyKGNvbXBvbmVudCk7XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRhcHBseVJlZihjb21wb25lbnQuX19yZWYsIGNvbXBvbmVudCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlckNvbXBvbmVudChjb21wb25lbnQsIHJlbmRlck1vZGUsIG1vdW50QWxsLCBpc0NoaWxkKSB7XHJcblx0aWYgKGNvbXBvbmVudC5fZGlzYWJsZSkgcmV0dXJuO1xyXG5cclxuXHR2YXIgcHJvcHMgPSBjb21wb25lbnQucHJvcHMsXHJcblx0ICAgIHN0YXRlID0gY29tcG9uZW50LnN0YXRlLFxyXG5cdCAgICBjb250ZXh0ID0gY29tcG9uZW50LmNvbnRleHQsXHJcblx0ICAgIHByZXZpb3VzUHJvcHMgPSBjb21wb25lbnQucHJldlByb3BzIHx8IHByb3BzLFxyXG5cdCAgICBwcmV2aW91c1N0YXRlID0gY29tcG9uZW50LnByZXZTdGF0ZSB8fCBzdGF0ZSxcclxuXHQgICAgcHJldmlvdXNDb250ZXh0ID0gY29tcG9uZW50LnByZXZDb250ZXh0IHx8IGNvbnRleHQsXHJcblx0ICAgIGlzVXBkYXRlID0gY29tcG9uZW50LmJhc2UsXHJcblx0ICAgIG5leHRCYXNlID0gY29tcG9uZW50Lm5leHRCYXNlLFxyXG5cdCAgICBpbml0aWFsQmFzZSA9IGlzVXBkYXRlIHx8IG5leHRCYXNlLFxyXG5cdCAgICBpbml0aWFsQ2hpbGRDb21wb25lbnQgPSBjb21wb25lbnQuX2NvbXBvbmVudCxcclxuXHQgICAgc2tpcCA9IGZhbHNlLFxyXG5cdCAgICBzbmFwc2hvdCA9IHByZXZpb3VzQ29udGV4dCxcclxuXHQgICAgcmVuZGVyZWQsXHJcblx0ICAgIGluc3QsXHJcblx0ICAgIGNiYXNlO1xyXG5cclxuXHRpZiAoY29tcG9uZW50LmNvbnN0cnVjdG9yLmdldERlcml2ZWRTdGF0ZUZyb21Qcm9wcykge1xyXG5cdFx0c3RhdGUgPSBleHRlbmQoZXh0ZW5kKHt9LCBzdGF0ZSksIGNvbXBvbmVudC5jb25zdHJ1Y3Rvci5nZXREZXJpdmVkU3RhdGVGcm9tUHJvcHMocHJvcHMsIHN0YXRlKSk7XHJcblx0XHRjb21wb25lbnQuc3RhdGUgPSBzdGF0ZTtcclxuXHR9XHJcblxyXG5cdGlmIChpc1VwZGF0ZSkge1xyXG5cdFx0Y29tcG9uZW50LnByb3BzID0gcHJldmlvdXNQcm9wcztcclxuXHRcdGNvbXBvbmVudC5zdGF0ZSA9IHByZXZpb3VzU3RhdGU7XHJcblx0XHRjb21wb25lbnQuY29udGV4dCA9IHByZXZpb3VzQ29udGV4dDtcclxuXHRcdGlmIChyZW5kZXJNb2RlICE9PSAyICYmIGNvbXBvbmVudC5zaG91bGRDb21wb25lbnRVcGRhdGUgJiYgY29tcG9uZW50LnNob3VsZENvbXBvbmVudFVwZGF0ZShwcm9wcywgc3RhdGUsIGNvbnRleHQpID09PSBmYWxzZSkge1xyXG5cdFx0XHRza2lwID0gdHJ1ZTtcclxuXHRcdH0gZWxzZSBpZiAoY29tcG9uZW50LmNvbXBvbmVudFdpbGxVcGRhdGUpIHtcclxuXHRcdFx0Y29tcG9uZW50LmNvbXBvbmVudFdpbGxVcGRhdGUocHJvcHMsIHN0YXRlLCBjb250ZXh0KTtcclxuXHRcdH1cclxuXHRcdGNvbXBvbmVudC5wcm9wcyA9IHByb3BzO1xyXG5cdFx0Y29tcG9uZW50LnN0YXRlID0gc3RhdGU7XHJcblx0XHRjb21wb25lbnQuY29udGV4dCA9IGNvbnRleHQ7XHJcblx0fVxyXG5cclxuXHRjb21wb25lbnQucHJldlByb3BzID0gY29tcG9uZW50LnByZXZTdGF0ZSA9IGNvbXBvbmVudC5wcmV2Q29udGV4dCA9IGNvbXBvbmVudC5uZXh0QmFzZSA9IG51bGw7XHJcblx0Y29tcG9uZW50Ll9kaXJ0eSA9IGZhbHNlO1xyXG5cclxuXHRpZiAoIXNraXApIHtcclxuXHRcdHJlbmRlcmVkID0gY29tcG9uZW50LnJlbmRlcihwcm9wcywgc3RhdGUsIGNvbnRleHQpO1xyXG5cclxuXHRcdGlmIChjb21wb25lbnQuZ2V0Q2hpbGRDb250ZXh0KSB7XHJcblx0XHRcdGNvbnRleHQgPSBleHRlbmQoZXh0ZW5kKHt9LCBjb250ZXh0KSwgY29tcG9uZW50LmdldENoaWxkQ29udGV4dCgpKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoaXNVcGRhdGUgJiYgY29tcG9uZW50LmdldFNuYXBzaG90QmVmb3JlVXBkYXRlKSB7XHJcblx0XHRcdHNuYXBzaG90ID0gY29tcG9uZW50LmdldFNuYXBzaG90QmVmb3JlVXBkYXRlKHByZXZpb3VzUHJvcHMsIHByZXZpb3VzU3RhdGUpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBjaGlsZENvbXBvbmVudCA9IHJlbmRlcmVkICYmIHJlbmRlcmVkLm5vZGVOYW1lLFxyXG5cdFx0ICAgIHRvVW5tb3VudCxcclxuXHRcdCAgICBiYXNlO1xyXG5cclxuXHRcdGlmICh0eXBlb2YgY2hpbGRDb21wb25lbnQgPT09ICdmdW5jdGlvbicpIHtcclxuXHJcblx0XHRcdHZhciBjaGlsZFByb3BzID0gZ2V0Tm9kZVByb3BzKHJlbmRlcmVkKTtcclxuXHRcdFx0aW5zdCA9IGluaXRpYWxDaGlsZENvbXBvbmVudDtcclxuXHJcblx0XHRcdGlmIChpbnN0ICYmIGluc3QuY29uc3RydWN0b3IgPT09IGNoaWxkQ29tcG9uZW50ICYmIGNoaWxkUHJvcHMua2V5ID09IGluc3QuX19rZXkpIHtcclxuXHRcdFx0XHRzZXRDb21wb25lbnRQcm9wcyhpbnN0LCBjaGlsZFByb3BzLCAxLCBjb250ZXh0LCBmYWxzZSk7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dG9Vbm1vdW50ID0gaW5zdDtcclxuXHJcblx0XHRcdFx0Y29tcG9uZW50Ll9jb21wb25lbnQgPSBpbnN0ID0gY3JlYXRlQ29tcG9uZW50KGNoaWxkQ29tcG9uZW50LCBjaGlsZFByb3BzLCBjb250ZXh0KTtcclxuXHRcdFx0XHRpbnN0Lm5leHRCYXNlID0gaW5zdC5uZXh0QmFzZSB8fCBuZXh0QmFzZTtcclxuXHRcdFx0XHRpbnN0Ll9wYXJlbnRDb21wb25lbnQgPSBjb21wb25lbnQ7XHJcblx0XHRcdFx0c2V0Q29tcG9uZW50UHJvcHMoaW5zdCwgY2hpbGRQcm9wcywgMCwgY29udGV4dCwgZmFsc2UpO1xyXG5cdFx0XHRcdHJlbmRlckNvbXBvbmVudChpbnN0LCAxLCBtb3VudEFsbCwgdHJ1ZSk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGJhc2UgPSBpbnN0LmJhc2U7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjYmFzZSA9IGluaXRpYWxCYXNlO1xyXG5cclxuXHRcdFx0dG9Vbm1vdW50ID0gaW5pdGlhbENoaWxkQ29tcG9uZW50O1xyXG5cdFx0XHRpZiAodG9Vbm1vdW50KSB7XHJcblx0XHRcdFx0Y2Jhc2UgPSBjb21wb25lbnQuX2NvbXBvbmVudCA9IG51bGw7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChpbml0aWFsQmFzZSB8fCByZW5kZXJNb2RlID09PSAxKSB7XHJcblx0XHRcdFx0aWYgKGNiYXNlKSBjYmFzZS5fY29tcG9uZW50ID0gbnVsbDtcclxuXHRcdFx0XHRiYXNlID0gZGlmZihjYmFzZSwgcmVuZGVyZWQsIGNvbnRleHQsIG1vdW50QWxsIHx8ICFpc1VwZGF0ZSwgaW5pdGlhbEJhc2UgJiYgaW5pdGlhbEJhc2UucGFyZW50Tm9kZSwgdHJ1ZSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoaW5pdGlhbEJhc2UgJiYgYmFzZSAhPT0gaW5pdGlhbEJhc2UgJiYgaW5zdCAhPT0gaW5pdGlhbENoaWxkQ29tcG9uZW50KSB7XHJcblx0XHRcdHZhciBiYXNlUGFyZW50ID0gaW5pdGlhbEJhc2UucGFyZW50Tm9kZTtcclxuXHRcdFx0aWYgKGJhc2VQYXJlbnQgJiYgYmFzZSAhPT0gYmFzZVBhcmVudCkge1xyXG5cdFx0XHRcdGJhc2VQYXJlbnQucmVwbGFjZUNoaWxkKGJhc2UsIGluaXRpYWxCYXNlKTtcclxuXHJcblx0XHRcdFx0aWYgKCF0b1VubW91bnQpIHtcclxuXHRcdFx0XHRcdGluaXRpYWxCYXNlLl9jb21wb25lbnQgPSBudWxsO1xyXG5cdFx0XHRcdFx0cmVjb2xsZWN0Tm9kZVRyZWUoaW5pdGlhbEJhc2UsIGZhbHNlKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAodG9Vbm1vdW50KSB7XHJcblx0XHRcdHVubW91bnRDb21wb25lbnQodG9Vbm1vdW50KTtcclxuXHRcdH1cclxuXHJcblx0XHRjb21wb25lbnQuYmFzZSA9IGJhc2U7XHJcblx0XHRpZiAoYmFzZSAmJiAhaXNDaGlsZCkge1xyXG5cdFx0XHR2YXIgY29tcG9uZW50UmVmID0gY29tcG9uZW50LFxyXG5cdFx0XHQgICAgdCA9IGNvbXBvbmVudDtcclxuXHRcdFx0d2hpbGUgKHQgPSB0Ll9wYXJlbnRDb21wb25lbnQpIHtcclxuXHRcdFx0XHQoY29tcG9uZW50UmVmID0gdCkuYmFzZSA9IGJhc2U7XHJcblx0XHRcdH1cclxuXHRcdFx0YmFzZS5fY29tcG9uZW50ID0gY29tcG9uZW50UmVmO1xyXG5cdFx0XHRiYXNlLl9jb21wb25lbnRDb25zdHJ1Y3RvciA9IGNvbXBvbmVudFJlZi5jb25zdHJ1Y3RvcjtcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGlmICghaXNVcGRhdGUgfHwgbW91bnRBbGwpIHtcclxuXHRcdG1vdW50cy5wdXNoKGNvbXBvbmVudCk7XHJcblx0fSBlbHNlIGlmICghc2tpcCkge1xyXG5cclxuXHRcdGlmIChjb21wb25lbnQuY29tcG9uZW50RGlkVXBkYXRlKSB7XHJcblx0XHRcdGNvbXBvbmVudC5jb21wb25lbnREaWRVcGRhdGUocHJldmlvdXNQcm9wcywgcHJldmlvdXNTdGF0ZSwgc25hcHNob3QpO1xyXG5cdFx0fVxyXG5cdFx0aWYgKG9wdGlvbnMuYWZ0ZXJVcGRhdGUpIG9wdGlvbnMuYWZ0ZXJVcGRhdGUoY29tcG9uZW50KTtcclxuXHR9XHJcblxyXG5cdHdoaWxlIChjb21wb25lbnQuX3JlbmRlckNhbGxiYWNrcy5sZW5ndGgpIHtcclxuXHRcdGNvbXBvbmVudC5fcmVuZGVyQ2FsbGJhY2tzLnBvcCgpLmNhbGwoY29tcG9uZW50KTtcclxuXHR9aWYgKCFkaWZmTGV2ZWwgJiYgIWlzQ2hpbGQpIGZsdXNoTW91bnRzKCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ1aWxkQ29tcG9uZW50RnJvbVZOb2RlKGRvbSwgdm5vZGUsIGNvbnRleHQsIG1vdW50QWxsKSB7XHJcblx0dmFyIGMgPSBkb20gJiYgZG9tLl9jb21wb25lbnQsXHJcblx0ICAgIG9yaWdpbmFsQ29tcG9uZW50ID0gYyxcclxuXHQgICAgb2xkRG9tID0gZG9tLFxyXG5cdCAgICBpc0RpcmVjdE93bmVyID0gYyAmJiBkb20uX2NvbXBvbmVudENvbnN0cnVjdG9yID09PSB2bm9kZS5ub2RlTmFtZSxcclxuXHQgICAgaXNPd25lciA9IGlzRGlyZWN0T3duZXIsXHJcblx0ICAgIHByb3BzID0gZ2V0Tm9kZVByb3BzKHZub2RlKTtcclxuXHR3aGlsZSAoYyAmJiAhaXNPd25lciAmJiAoYyA9IGMuX3BhcmVudENvbXBvbmVudCkpIHtcclxuXHRcdGlzT3duZXIgPSBjLmNvbnN0cnVjdG9yID09PSB2bm9kZS5ub2RlTmFtZTtcclxuXHR9XHJcblxyXG5cdGlmIChjICYmIGlzT3duZXIgJiYgKCFtb3VudEFsbCB8fCBjLl9jb21wb25lbnQpKSB7XHJcblx0XHRzZXRDb21wb25lbnRQcm9wcyhjLCBwcm9wcywgMywgY29udGV4dCwgbW91bnRBbGwpO1xyXG5cdFx0ZG9tID0gYy5iYXNlO1xyXG5cdH0gZWxzZSB7XHJcblx0XHRpZiAob3JpZ2luYWxDb21wb25lbnQgJiYgIWlzRGlyZWN0T3duZXIpIHtcclxuXHRcdFx0dW5tb3VudENvbXBvbmVudChvcmlnaW5hbENvbXBvbmVudCk7XHJcblx0XHRcdGRvbSA9IG9sZERvbSA9IG51bGw7XHJcblx0XHR9XHJcblxyXG5cdFx0YyA9IGNyZWF0ZUNvbXBvbmVudCh2bm9kZS5ub2RlTmFtZSwgcHJvcHMsIGNvbnRleHQpO1xyXG5cdFx0aWYgKGRvbSAmJiAhYy5uZXh0QmFzZSkge1xyXG5cdFx0XHRjLm5leHRCYXNlID0gZG9tO1xyXG5cclxuXHRcdFx0b2xkRG9tID0gbnVsbDtcclxuXHRcdH1cclxuXHRcdHNldENvbXBvbmVudFByb3BzKGMsIHByb3BzLCAxLCBjb250ZXh0LCBtb3VudEFsbCk7XHJcblx0XHRkb20gPSBjLmJhc2U7XHJcblxyXG5cdFx0aWYgKG9sZERvbSAmJiBkb20gIT09IG9sZERvbSkge1xyXG5cdFx0XHRvbGREb20uX2NvbXBvbmVudCA9IG51bGw7XHJcblx0XHRcdHJlY29sbGVjdE5vZGVUcmVlKG9sZERvbSwgZmFsc2UpO1xyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0cmV0dXJuIGRvbTtcclxufVxyXG5cclxuZnVuY3Rpb24gdW5tb3VudENvbXBvbmVudChjb21wb25lbnQpIHtcclxuXHRpZiAob3B0aW9ucy5iZWZvcmVVbm1vdW50KSBvcHRpb25zLmJlZm9yZVVubW91bnQoY29tcG9uZW50KTtcclxuXHJcblx0dmFyIGJhc2UgPSBjb21wb25lbnQuYmFzZTtcclxuXHJcblx0Y29tcG9uZW50Ll9kaXNhYmxlID0gdHJ1ZTtcclxuXHJcblx0aWYgKGNvbXBvbmVudC5jb21wb25lbnRXaWxsVW5tb3VudCkgY29tcG9uZW50LmNvbXBvbmVudFdpbGxVbm1vdW50KCk7XHJcblxyXG5cdGNvbXBvbmVudC5iYXNlID0gbnVsbDtcclxuXHJcblx0dmFyIGlubmVyID0gY29tcG9uZW50Ll9jb21wb25lbnQ7XHJcblx0aWYgKGlubmVyKSB7XHJcblx0XHR1bm1vdW50Q29tcG9uZW50KGlubmVyKTtcclxuXHR9IGVsc2UgaWYgKGJhc2UpIHtcclxuXHRcdGlmIChiYXNlWydfX3ByZWFjdGF0dHJfJ10gIT0gbnVsbCkgYXBwbHlSZWYoYmFzZVsnX19wcmVhY3RhdHRyXyddLnJlZiwgbnVsbCk7XHJcblxyXG5cdFx0Y29tcG9uZW50Lm5leHRCYXNlID0gYmFzZTtcclxuXHJcblx0XHRyZW1vdmVOb2RlKGJhc2UpO1xyXG5cdFx0cmVjeWNsZXJDb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcclxuXHJcblx0XHRyZW1vdmVDaGlsZHJlbihiYXNlKTtcclxuXHR9XHJcblxyXG5cdGFwcGx5UmVmKGNvbXBvbmVudC5fX3JlZiwgbnVsbCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIENvbXBvbmVudChwcm9wcywgY29udGV4dCkge1xyXG5cdHRoaXMuX2RpcnR5ID0gdHJ1ZTtcclxuXHJcblx0dGhpcy5jb250ZXh0ID0gY29udGV4dDtcclxuXHJcblx0dGhpcy5wcm9wcyA9IHByb3BzO1xyXG5cclxuXHR0aGlzLnN0YXRlID0gdGhpcy5zdGF0ZSB8fCB7fTtcclxuXHJcblx0dGhpcy5fcmVuZGVyQ2FsbGJhY2tzID0gW107XHJcbn1cclxuXHJcbmV4dGVuZChDb21wb25lbnQucHJvdG90eXBlLCB7XHJcblx0c2V0U3RhdGU6IGZ1bmN0aW9uIHNldFN0YXRlKHN0YXRlLCBjYWxsYmFjaykge1xyXG5cdFx0aWYgKCF0aGlzLnByZXZTdGF0ZSkgdGhpcy5wcmV2U3RhdGUgPSB0aGlzLnN0YXRlO1xyXG5cdFx0dGhpcy5zdGF0ZSA9IGV4dGVuZChleHRlbmQoe30sIHRoaXMuc3RhdGUpLCB0eXBlb2Ygc3RhdGUgPT09ICdmdW5jdGlvbicgPyBzdGF0ZSh0aGlzLnN0YXRlLCB0aGlzLnByb3BzKSA6IHN0YXRlKTtcclxuXHRcdGlmIChjYWxsYmFjaykgdGhpcy5fcmVuZGVyQ2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xyXG5cdFx0ZW5xdWV1ZVJlbmRlcih0aGlzKTtcclxuXHR9LFxyXG5cdGZvcmNlVXBkYXRlOiBmdW5jdGlvbiBmb3JjZVVwZGF0ZShjYWxsYmFjaykge1xyXG5cdFx0aWYgKGNhbGxiYWNrKSB0aGlzLl9yZW5kZXJDYWxsYmFja3MucHVzaChjYWxsYmFjayk7XHJcblx0XHRyZW5kZXJDb21wb25lbnQodGhpcywgMik7XHJcblx0fSxcclxuXHRyZW5kZXI6IGZ1bmN0aW9uIHJlbmRlcigpIHt9XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gcmVuZGVyKHZub2RlLCBwYXJlbnQsIG1lcmdlKSB7XHJcbiAgcmV0dXJuIGRpZmYobWVyZ2UsIHZub2RlLCB7fSwgZmFsc2UsIHBhcmVudCwgZmFsc2UpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBjcmVhdGVSZWYoKSB7XHJcblx0cmV0dXJuIHt9O1xyXG59XHJcblxyXG52YXIgcHJlYWN0ID0ge1xyXG5cdGg6IGgsXHJcblx0Y3JlYXRlRWxlbWVudDogaCxcclxuXHRjbG9uZUVsZW1lbnQ6IGNsb25lRWxlbWVudCxcclxuXHRjcmVhdGVSZWY6IGNyZWF0ZVJlZixcclxuXHRDb21wb25lbnQ6IENvbXBvbmVudCxcclxuXHRyZW5kZXI6IHJlbmRlcixcclxuXHRyZXJlbmRlcjogcmVyZW5kZXIsXHJcblx0b3B0aW9uczogb3B0aW9uc1xyXG59O1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgcHJlYWN0O1xyXG5leHBvcnQgeyBoLCBoIGFzIGNyZWF0ZUVsZW1lbnQsIGNsb25lRWxlbWVudCwgY3JlYXRlUmVmLCBDb21wb25lbnQsIHJlbmRlciwgcmVyZW5kZXIsIG9wdGlvbnMgfTtcclxuIl0sImZpbGUiOiJsaWIvcHJlYWN0LmpzIn0=