// Сгенерировано: npm run build:glass. Источник — src/glass/entry.ts + @vire/vireglass.
var VireBookGlass = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ../vire/node_modules/.pnpm/react@19.2.4/node_modules/react/cjs/react.development.js
  var require_react_development = __commonJS({
    "../vire/node_modules/.pnpm/react@19.2.4/node_modules/react/cjs/react.development.js"(exports, module) {
      "use strict";
      (function() {
        function defineDeprecationWarning(methodName, info) {
          Object.defineProperty(Component.prototype, methodName, {
            get: function() {
              console.warn(
                "%s(...) is deprecated in plain JavaScript React classes. %s",
                info[0],
                info[1]
              );
            }
          });
        }
        function getIteratorFn(maybeIterable) {
          if (null === maybeIterable || "object" !== typeof maybeIterable)
            return null;
          maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
          return "function" === typeof maybeIterable ? maybeIterable : null;
        }
        function warnNoop(publicInstance, callerName) {
          publicInstance = (publicInstance = publicInstance.constructor) && (publicInstance.displayName || publicInstance.name) || "ReactClass";
          var warningKey = publicInstance + "." + callerName;
          didWarnStateUpdateForUnmountedComponent[warningKey] || (console.error(
            "Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.",
            callerName,
            publicInstance
          ), didWarnStateUpdateForUnmountedComponent[warningKey] = true);
        }
        function Component(props, context, updater) {
          this.props = props;
          this.context = context;
          this.refs = emptyObject;
          this.updater = updater || ReactNoopUpdateQueue;
        }
        function ComponentDummy() {
        }
        function PureComponent(props, context, updater) {
          this.props = props;
          this.context = context;
          this.refs = emptyObject;
          this.updater = updater || ReactNoopUpdateQueue;
        }
        function noop() {
        }
        function testStringCoercion(value) {
          return "" + value;
        }
        function checkKeyStringCoercion(value) {
          try {
            testStringCoercion(value);
            var JSCompiler_inline_result = false;
          } catch (e) {
            JSCompiler_inline_result = true;
          }
          if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(
              JSCompiler_inline_result,
              "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
              JSCompiler_inline_result$jscomp$0
            );
            return testStringCoercion(value);
          }
        }
        function getComponentNameFromType(type) {
          if (null == type) return null;
          if ("function" === typeof type)
            return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
          if ("string" === typeof type) return type;
          switch (type) {
            case REACT_FRAGMENT_TYPE:
              return "Fragment";
            case REACT_PROFILER_TYPE:
              return "Profiler";
            case REACT_STRICT_MODE_TYPE:
              return "StrictMode";
            case REACT_SUSPENSE_TYPE:
              return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
              return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
              return "Activity";
          }
          if ("object" === typeof type)
            switch ("number" === typeof type.tag && console.error(
              "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
            ), type.$$typeof) {
              case REACT_PORTAL_TYPE:
                return "Portal";
              case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
              case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
              case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
              case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
              case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                  return getComponentNameFromType(type(innerType));
                } catch (x) {
                }
            }
          return null;
        }
        function getTaskName(type) {
          if (type === REACT_FRAGMENT_TYPE) return "<>";
          if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
            return "<...>";
          try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
          } catch (x) {
            return "<...>";
          }
        }
        function getOwner() {
          var dispatcher = ReactSharedInternals.A;
          return null === dispatcher ? null : dispatcher.getOwner();
        }
        function UnknownOwner() {
          return Error("react-stack-top-frame");
        }
        function hasValidKey(config) {
          if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return false;
          }
          return void 0 !== config.key;
        }
        function defineKeyPropWarningGetter(props, displayName) {
          function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
              "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
              displayName
            ));
          }
          warnAboutAccessingKey.isReactWarning = true;
          Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: true
          });
        }
        function elementRefGetterWithDeprecationWarning() {
          var componentName = getComponentNameFromType(this.type);
          didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
            "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
          ));
          componentName = this.props.ref;
          return void 0 !== componentName ? componentName : null;
        }
        function ReactElement(type, key, props, owner, debugStack, debugTask) {
          var refProp = props.ref;
          type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type,
            key,
            props,
            _owner: owner
          };
          null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: false,
            get: elementRefGetterWithDeprecationWarning
          }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
          type._store = {};
          Object.defineProperty(type._store, "validated", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: 0
          });
          Object.defineProperty(type, "_debugInfo", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: null
          });
          Object.defineProperty(type, "_debugStack", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: debugStack
          });
          Object.defineProperty(type, "_debugTask", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: debugTask
          });
          Object.freeze && (Object.freeze(type.props), Object.freeze(type));
          return type;
        }
        function cloneAndReplaceKey(oldElement, newKey) {
          newKey = ReactElement(
            oldElement.type,
            newKey,
            oldElement.props,
            oldElement._owner,
            oldElement._debugStack,
            oldElement._debugTask
          );
          oldElement._store && (newKey._store.validated = oldElement._store.validated);
          return newKey;
        }
        function validateChildKeys(node) {
          isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
        }
        function isValidElement(object) {
          return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
        }
        function escape(key) {
          var escaperLookup = { "=": "=0", ":": "=2" };
          return "$" + key.replace(/[=:]/g, function(match) {
            return escaperLookup[match];
          });
        }
        function getElementKey(element, index) {
          return "object" === typeof element && null !== element && null != element.key ? (checkKeyStringCoercion(element.key), escape("" + element.key)) : index.toString(36);
        }
        function resolveThenable(thenable) {
          switch (thenable.status) {
            case "fulfilled":
              return thenable.value;
            case "rejected":
              throw thenable.reason;
            default:
              switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
                function(fulfilledValue) {
                  "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
                },
                function(error) {
                  "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
                }
              )), thenable.status) {
                case "fulfilled":
                  return thenable.value;
                case "rejected":
                  throw thenable.reason;
              }
          }
          throw thenable;
        }
        function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
          var type = typeof children;
          if ("undefined" === type || "boolean" === type) children = null;
          var invokeCallback = false;
          if (null === children) invokeCallback = true;
          else
            switch (type) {
              case "bigint":
              case "string":
              case "number":
                invokeCallback = true;
                break;
              case "object":
                switch (children.$$typeof) {
                  case REACT_ELEMENT_TYPE:
                  case REACT_PORTAL_TYPE:
                    invokeCallback = true;
                    break;
                  case REACT_LAZY_TYPE:
                    return invokeCallback = children._init, mapIntoArray(
                      invokeCallback(children._payload),
                      array,
                      escapedPrefix,
                      nameSoFar,
                      callback
                    );
                }
            }
          if (invokeCallback) {
            invokeCallback = children;
            callback = callback(invokeCallback);
            var childKey = "" === nameSoFar ? "." + getElementKey(invokeCallback, 0) : nameSoFar;
            isArrayImpl(callback) ? (escapedPrefix = "", null != childKey && (escapedPrefix = childKey.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
              return c;
            })) : null != callback && (isValidElement(callback) && (null != callback.key && (invokeCallback && invokeCallback.key === callback.key || checkKeyStringCoercion(callback.key)), escapedPrefix = cloneAndReplaceKey(
              callback,
              escapedPrefix + (null == callback.key || invokeCallback && invokeCallback.key === callback.key ? "" : ("" + callback.key).replace(
                userProvidedKeyEscapeRegex,
                "$&/"
              ) + "/") + childKey
            ), "" !== nameSoFar && null != invokeCallback && isValidElement(invokeCallback) && null == invokeCallback.key && invokeCallback._store && !invokeCallback._store.validated && (escapedPrefix._store.validated = 2), callback = escapedPrefix), array.push(callback));
            return 1;
          }
          invokeCallback = 0;
          childKey = "" === nameSoFar ? "." : nameSoFar + ":";
          if (isArrayImpl(children))
            for (var i = 0; i < children.length; i++)
              nameSoFar = children[i], type = childKey + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
                nameSoFar,
                array,
                escapedPrefix,
                type,
                callback
              );
          else if (i = getIteratorFn(children), "function" === typeof i)
            for (i === children.entries && (didWarnAboutMaps || console.warn(
              "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
            ), didWarnAboutMaps = true), children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
              nameSoFar = nameSoFar.value, type = childKey + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
                nameSoFar,
                array,
                escapedPrefix,
                type,
                callback
              );
          else if ("object" === type) {
            if ("function" === typeof children.then)
              return mapIntoArray(
                resolveThenable(children),
                array,
                escapedPrefix,
                nameSoFar,
                callback
              );
            array = String(children);
            throw Error(
              "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
            );
          }
          return invokeCallback;
        }
        function mapChildren(children, func, context) {
          if (null == children) return children;
          var result = [], count = 0;
          mapIntoArray(children, result, "", "", function(child) {
            return func.call(context, child, count++);
          });
          return result;
        }
        function lazyInitializer(payload) {
          if (-1 === payload._status) {
            var ioInfo = payload._ioInfo;
            null != ioInfo && (ioInfo.start = ioInfo.end = performance.now());
            ioInfo = payload._result;
            var thenable = ioInfo();
            thenable.then(
              function(moduleObject) {
                if (0 === payload._status || -1 === payload._status) {
                  payload._status = 1;
                  payload._result = moduleObject;
                  var _ioInfo = payload._ioInfo;
                  null != _ioInfo && (_ioInfo.end = performance.now());
                  void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
                }
              },
              function(error) {
                if (0 === payload._status || -1 === payload._status) {
                  payload._status = 2;
                  payload._result = error;
                  var _ioInfo2 = payload._ioInfo;
                  null != _ioInfo2 && (_ioInfo2.end = performance.now());
                  void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
                }
              }
            );
            ioInfo = payload._ioInfo;
            if (null != ioInfo) {
              ioInfo.value = thenable;
              var displayName = thenable.displayName;
              "string" === typeof displayName && (ioInfo.name = displayName);
            }
            -1 === payload._status && (payload._status = 0, payload._result = thenable);
          }
          if (1 === payload._status)
            return ioInfo = payload._result, void 0 === ioInfo && console.error(
              "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?",
              ioInfo
            ), "default" in ioInfo || console.error(
              "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))",
              ioInfo
            ), ioInfo.default;
          throw payload._result;
        }
        function resolveDispatcher() {
          var dispatcher = ReactSharedInternals.H;
          null === dispatcher && console.error(
            "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
          );
          return dispatcher;
        }
        function releaseAsyncTransition() {
          ReactSharedInternals.asyncTransitions--;
        }
        function enqueueTask(task) {
          if (null === enqueueTaskImpl)
            try {
              var requireString = ("require" + Math.random()).slice(0, 7);
              enqueueTaskImpl = (module && module[requireString]).call(
                module,
                "timers"
              ).setImmediate;
            } catch (_err) {
              enqueueTaskImpl = function(callback) {
                false === didWarnAboutMessageChannel && (didWarnAboutMessageChannel = true, "undefined" === typeof MessageChannel && console.error(
                  "This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."
                ));
                var channel2 = new MessageChannel();
                channel2.port1.onmessage = callback;
                channel2.port2.postMessage(void 0);
              };
            }
          return enqueueTaskImpl(task);
        }
        function aggregateErrors(errors) {
          return 1 < errors.length && "function" === typeof AggregateError ? new AggregateError(errors) : errors[0];
        }
        function popActScope(prevActQueue, prevActScopeDepth) {
          prevActScopeDepth !== actScopeDepth - 1 && console.error(
            "You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "
          );
          actScopeDepth = prevActScopeDepth;
        }
        function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
          var queue = ReactSharedInternals.actQueue;
          if (null !== queue)
            if (0 !== queue.length)
              try {
                flushActQueue(queue);
                enqueueTask(function() {
                  return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                });
                return;
              } catch (error) {
                ReactSharedInternals.thrownErrors.push(error);
              }
            else ReactSharedInternals.actQueue = null;
          0 < ReactSharedInternals.thrownErrors.length ? (queue = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(queue)) : resolve(returnValue);
        }
        function flushActQueue(queue) {
          if (!isFlushing) {
            isFlushing = true;
            var i = 0;
            try {
              for (; i < queue.length; i++) {
                var callback = queue[i];
                do {
                  ReactSharedInternals.didUsePromise = false;
                  var continuation = callback(false);
                  if (null !== continuation) {
                    if (ReactSharedInternals.didUsePromise) {
                      queue[i] = callback;
                      queue.splice(0, i);
                      return;
                    }
                    callback = continuation;
                  } else break;
                } while (1);
              }
              queue.length = 0;
            } catch (error) {
              queue.splice(0, i + 1), ReactSharedInternals.thrownErrors.push(error);
            } finally {
              isFlushing = false;
            }
          }
        }
        "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
        var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator, didWarnStateUpdateForUnmountedComponent = {}, ReactNoopUpdateQueue = {
          isMounted: function() {
            return false;
          },
          enqueueForceUpdate: function(publicInstance) {
            warnNoop(publicInstance, "forceUpdate");
          },
          enqueueReplaceState: function(publicInstance) {
            warnNoop(publicInstance, "replaceState");
          },
          enqueueSetState: function(publicInstance) {
            warnNoop(publicInstance, "setState");
          }
        }, assign = Object.assign, emptyObject = {};
        Object.freeze(emptyObject);
        Component.prototype.isReactComponent = {};
        Component.prototype.setState = function(partialState, callback) {
          if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
            throw Error(
              "takes an object of state variables to update or a function which returns an object of state variables."
            );
          this.updater.enqueueSetState(this, partialState, callback, "setState");
        };
        Component.prototype.forceUpdate = function(callback) {
          this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
        };
        var deprecatedAPIs = {
          isMounted: [
            "isMounted",
            "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."
          ],
          replaceState: [
            "replaceState",
            "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."
          ]
        };
        for (fnName in deprecatedAPIs)
          deprecatedAPIs.hasOwnProperty(fnName) && defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
        ComponentDummy.prototype = Component.prototype;
        deprecatedAPIs = PureComponent.prototype = new ComponentDummy();
        deprecatedAPIs.constructor = PureComponent;
        assign(deprecatedAPIs, Component.prototype);
        deprecatedAPIs.isPureReactComponent = true;
        var isArrayImpl = Array.isArray, REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference"), ReactSharedInternals = {
          H: null,
          A: null,
          T: null,
          S: null,
          actQueue: null,
          asyncTransitions: 0,
          isBatchingLegacy: false,
          didScheduleLegacyUpdate: false,
          didUsePromise: false,
          thrownErrors: [],
          getCurrentStack: null,
          recentlyCreatedOwnerStacks: 0
        }, hasOwnProperty = Object.prototype.hasOwnProperty, createTask = console.createTask ? console.createTask : function() {
          return null;
        };
        deprecatedAPIs = {
          react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
          }
        };
        var specialPropKeyWarningShown, didWarnAboutOldJSXRuntime;
        var didWarnAboutElementRef = {};
        var unknownOwnerDebugStack = deprecatedAPIs.react_stack_bottom_frame.bind(
          deprecatedAPIs,
          UnknownOwner
        )();
        var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
        var didWarnAboutMaps = false, userProvidedKeyEscapeRegex = /\/+/g, reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
          if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
            var event = new window.ErrorEvent("error", {
              bubbles: true,
              cancelable: true,
              message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
              error
            });
            if (!window.dispatchEvent(event)) return;
          } else if ("object" === typeof process && "function" === typeof process.emit) {
            process.emit("uncaughtException", error);
            return;
          }
          console.error(error);
        }, didWarnAboutMessageChannel = false, enqueueTaskImpl = null, actScopeDepth = 0, didWarnNoAwaitAct = false, isFlushing = false, queueSeveralMicrotasks = "function" === typeof queueMicrotask ? function(callback) {
          queueMicrotask(function() {
            return queueMicrotask(callback);
          });
        } : enqueueTask;
        deprecatedAPIs = Object.freeze({
          __proto__: null,
          c: function(size) {
            return resolveDispatcher().useMemoCache(size);
          }
        });
        var fnName = {
          map: mapChildren,
          forEach: function(children, forEachFunc, forEachContext) {
            mapChildren(
              children,
              function() {
                forEachFunc.apply(this, arguments);
              },
              forEachContext
            );
          },
          count: function(children) {
            var n = 0;
            mapChildren(children, function() {
              n++;
            });
            return n;
          },
          toArray: function(children) {
            return mapChildren(children, function(child) {
              return child;
            }) || [];
          },
          only: function(children) {
            if (!isValidElement(children))
              throw Error(
                "React.Children.only expected to receive a single React element child."
              );
            return children;
          }
        };
        exports.Activity = REACT_ACTIVITY_TYPE;
        exports.Children = fnName;
        exports.Component = Component;
        exports.Fragment = REACT_FRAGMENT_TYPE;
        exports.Profiler = REACT_PROFILER_TYPE;
        exports.PureComponent = PureComponent;
        exports.StrictMode = REACT_STRICT_MODE_TYPE;
        exports.Suspense = REACT_SUSPENSE_TYPE;
        exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
        exports.__COMPILER_RUNTIME = deprecatedAPIs;
        exports.act = function(callback) {
          var prevActQueue = ReactSharedInternals.actQueue, prevActScopeDepth = actScopeDepth;
          actScopeDepth++;
          var queue = ReactSharedInternals.actQueue = null !== prevActQueue ? prevActQueue : [], didAwaitActCall = false;
          try {
            var result = callback();
          } catch (error) {
            ReactSharedInternals.thrownErrors.push(error);
          }
          if (0 < ReactSharedInternals.thrownErrors.length)
            throw popActScope(prevActQueue, prevActScopeDepth), callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
          if (null !== result && "object" === typeof result && "function" === typeof result.then) {
            var thenable = result;
            queueSeveralMicrotasks(function() {
              didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
                "You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"
              ));
            });
            return {
              then: function(resolve, reject) {
                didAwaitActCall = true;
                thenable.then(
                  function(returnValue) {
                    popActScope(prevActQueue, prevActScopeDepth);
                    if (0 === prevActScopeDepth) {
                      try {
                        flushActQueue(queue), enqueueTask(function() {
                          return recursivelyFlushAsyncActWork(
                            returnValue,
                            resolve,
                            reject
                          );
                        });
                      } catch (error$0) {
                        ReactSharedInternals.thrownErrors.push(error$0);
                      }
                      if (0 < ReactSharedInternals.thrownErrors.length) {
                        var _thrownError = aggregateErrors(
                          ReactSharedInternals.thrownErrors
                        );
                        ReactSharedInternals.thrownErrors.length = 0;
                        reject(_thrownError);
                      }
                    } else resolve(returnValue);
                  },
                  function(error) {
                    popActScope(prevActQueue, prevActScopeDepth);
                    0 < ReactSharedInternals.thrownErrors.length ? (error = aggregateErrors(
                      ReactSharedInternals.thrownErrors
                    ), ReactSharedInternals.thrownErrors.length = 0, reject(error)) : reject(error);
                  }
                );
              }
            };
          }
          var returnValue$jscomp$0 = result;
          popActScope(prevActQueue, prevActScopeDepth);
          0 === prevActScopeDepth && (flushActQueue(queue), 0 !== queue.length && queueSeveralMicrotasks(function() {
            didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
              "A component suspended inside an `act` scope, but the `act` call was not awaited. When testing React components that depend on asynchronous data, you must await the result:\n\nawait act(() => ...)"
            ));
          }), ReactSharedInternals.actQueue = null);
          if (0 < ReactSharedInternals.thrownErrors.length)
            throw callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
          return {
            then: function(resolve, reject) {
              didAwaitActCall = true;
              0 === prevActScopeDepth ? (ReactSharedInternals.actQueue = queue, enqueueTask(function() {
                return recursivelyFlushAsyncActWork(
                  returnValue$jscomp$0,
                  resolve,
                  reject
                );
              })) : resolve(returnValue$jscomp$0);
            }
          };
        };
        exports.cache = function(fn) {
          return function() {
            return fn.apply(null, arguments);
          };
        };
        exports.cacheSignal = function() {
          return null;
        };
        exports.captureOwnerStack = function() {
          var getCurrentStack = ReactSharedInternals.getCurrentStack;
          return null === getCurrentStack ? null : getCurrentStack();
        };
        exports.cloneElement = function(element, config, children) {
          if (null === element || void 0 === element)
            throw Error(
              "The argument must be a React element, but you passed " + element + "."
            );
          var props = assign({}, element.props), key = element.key, owner = element._owner;
          if (null != config) {
            var JSCompiler_inline_result;
            a: {
              if (hasOwnProperty.call(config, "ref") && (JSCompiler_inline_result = Object.getOwnPropertyDescriptor(
                config,
                "ref"
              ).get) && JSCompiler_inline_result.isReactWarning) {
                JSCompiler_inline_result = false;
                break a;
              }
              JSCompiler_inline_result = void 0 !== config.ref;
            }
            JSCompiler_inline_result && (owner = getOwner());
            hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key);
            for (propName in config)
              !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
          }
          var propName = arguments.length - 2;
          if (1 === propName) props.children = children;
          else if (1 < propName) {
            JSCompiler_inline_result = Array(propName);
            for (var i = 0; i < propName; i++)
              JSCompiler_inline_result[i] = arguments[i + 2];
            props.children = JSCompiler_inline_result;
          }
          props = ReactElement(
            element.type,
            key,
            props,
            owner,
            element._debugStack,
            element._debugTask
          );
          for (key = 2; key < arguments.length; key++)
            validateChildKeys(arguments[key]);
          return props;
        };
        exports.createContext = function(defaultValue) {
          defaultValue = {
            $$typeof: REACT_CONTEXT_TYPE,
            _currentValue: defaultValue,
            _currentValue2: defaultValue,
            _threadCount: 0,
            Provider: null,
            Consumer: null
          };
          defaultValue.Provider = defaultValue;
          defaultValue.Consumer = {
            $$typeof: REACT_CONSUMER_TYPE,
            _context: defaultValue
          };
          defaultValue._currentRenderer = null;
          defaultValue._currentRenderer2 = null;
          return defaultValue;
        };
        exports.createElement = function(type, config, children) {
          for (var i = 2; i < arguments.length; i++)
            validateChildKeys(arguments[i]);
          i = {};
          var key = null;
          if (null != config)
            for (propName in didWarnAboutOldJSXRuntime || !("__self" in config) || "key" in config || (didWarnAboutOldJSXRuntime = true, console.warn(
              "Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform"
            )), hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key), config)
              hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (i[propName] = config[propName]);
          var childrenLength = arguments.length - 2;
          if (1 === childrenLength) i.children = children;
          else if (1 < childrenLength) {
            for (var childArray = Array(childrenLength), _i = 0; _i < childrenLength; _i++)
              childArray[_i] = arguments[_i + 2];
            Object.freeze && Object.freeze(childArray);
            i.children = childArray;
          }
          if (type && type.defaultProps)
            for (propName in childrenLength = type.defaultProps, childrenLength)
              void 0 === i[propName] && (i[propName] = childrenLength[propName]);
          key && defineKeyPropWarningGetter(
            i,
            "function" === typeof type ? type.displayName || type.name || "Unknown" : type
          );
          var propName = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
          return ReactElement(
            type,
            key,
            i,
            getOwner(),
            propName ? Error("react-stack-top-frame") : unknownOwnerDebugStack,
            propName ? createTask(getTaskName(type)) : unknownOwnerDebugTask
          );
        };
        exports.createRef = function() {
          var refObject = { current: null };
          Object.seal(refObject);
          return refObject;
        };
        exports.forwardRef = function(render) {
          null != render && render.$$typeof === REACT_MEMO_TYPE ? console.error(
            "forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...))."
          ) : "function" !== typeof render ? console.error(
            "forwardRef requires a render function but was given %s.",
            null === render ? "null" : typeof render
          ) : 0 !== render.length && 2 !== render.length && console.error(
            "forwardRef render functions accept exactly two parameters: props and ref. %s",
            1 === render.length ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."
          );
          null != render && null != render.defaultProps && console.error(
            "forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?"
          );
          var elementType = { $$typeof: REACT_FORWARD_REF_TYPE, render }, ownName;
          Object.defineProperty(elementType, "displayName", {
            enumerable: false,
            configurable: true,
            get: function() {
              return ownName;
            },
            set: function(name) {
              ownName = name;
              render.name || render.displayName || (Object.defineProperty(render, "name", { value: name }), render.displayName = name);
            }
          });
          return elementType;
        };
        exports.isValidElement = isValidElement;
        exports.lazy = function(ctor) {
          ctor = { _status: -1, _result: ctor };
          var lazyType = {
            $$typeof: REACT_LAZY_TYPE,
            _payload: ctor,
            _init: lazyInitializer
          }, ioInfo = {
            name: "lazy",
            start: -1,
            end: -1,
            value: null,
            owner: null,
            debugStack: Error("react-stack-top-frame"),
            debugTask: console.createTask ? console.createTask("lazy()") : null
          };
          ctor._ioInfo = ioInfo;
          lazyType._debugInfo = [{ awaited: ioInfo }];
          return lazyType;
        };
        exports.memo = function(type, compare) {
          null == type && console.error(
            "memo: The first argument must be a component. Instead received: %s",
            null === type ? "null" : typeof type
          );
          compare = {
            $$typeof: REACT_MEMO_TYPE,
            type,
            compare: void 0 === compare ? null : compare
          };
          var ownName;
          Object.defineProperty(compare, "displayName", {
            enumerable: false,
            configurable: true,
            get: function() {
              return ownName;
            },
            set: function(name) {
              ownName = name;
              type.name || type.displayName || (Object.defineProperty(type, "name", { value: name }), type.displayName = name);
            }
          });
          return compare;
        };
        exports.startTransition = function(scope) {
          var prevTransition = ReactSharedInternals.T, currentTransition = {};
          currentTransition._updatedFibers = /* @__PURE__ */ new Set();
          ReactSharedInternals.T = currentTransition;
          try {
            var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
            null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
            "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && (ReactSharedInternals.asyncTransitions++, returnValue.then(releaseAsyncTransition, releaseAsyncTransition), returnValue.then(noop, reportGlobalError));
          } catch (error) {
            reportGlobalError(error);
          } finally {
            null === prevTransition && currentTransition._updatedFibers && (scope = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < scope && console.warn(
              "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
            )), null !== prevTransition && null !== currentTransition.types && (null !== prevTransition.types && prevTransition.types !== currentTransition.types && console.error(
              "We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."
            ), prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
          }
        };
        exports.unstable_useCacheRefresh = function() {
          return resolveDispatcher().useCacheRefresh();
        };
        exports.use = function(usable) {
          return resolveDispatcher().use(usable);
        };
        exports.useActionState = function(action, initialState, permalink) {
          return resolveDispatcher().useActionState(
            action,
            initialState,
            permalink
          );
        };
        exports.useCallback = function(callback, deps) {
          return resolveDispatcher().useCallback(callback, deps);
        };
        exports.useContext = function(Context) {
          var dispatcher = resolveDispatcher();
          Context.$$typeof === REACT_CONSUMER_TYPE && console.error(
            "Calling useContext(Context.Consumer) is not supported and will cause bugs. Did you mean to call useContext(Context) instead?"
          );
          return dispatcher.useContext(Context);
        };
        exports.useDebugValue = function(value, formatterFn) {
          return resolveDispatcher().useDebugValue(value, formatterFn);
        };
        exports.useDeferredValue = function(value, initialValue) {
          return resolveDispatcher().useDeferredValue(value, initialValue);
        };
        exports.useEffect = function(create, deps) {
          null == create && console.warn(
            "React Hook useEffect requires an effect callback. Did you forget to pass a callback to the hook?"
          );
          return resolveDispatcher().useEffect(create, deps);
        };
        exports.useEffectEvent = function(callback) {
          return resolveDispatcher().useEffectEvent(callback);
        };
        exports.useId = function() {
          return resolveDispatcher().useId();
        };
        exports.useImperativeHandle = function(ref, create, deps) {
          return resolveDispatcher().useImperativeHandle(ref, create, deps);
        };
        exports.useInsertionEffect = function(create, deps) {
          null == create && console.warn(
            "React Hook useInsertionEffect requires an effect callback. Did you forget to pass a callback to the hook?"
          );
          return resolveDispatcher().useInsertionEffect(create, deps);
        };
        exports.useLayoutEffect = function(create, deps) {
          null == create && console.warn(
            "React Hook useLayoutEffect requires an effect callback. Did you forget to pass a callback to the hook?"
          );
          return resolveDispatcher().useLayoutEffect(create, deps);
        };
        exports.useMemo = function(create, deps) {
          return resolveDispatcher().useMemo(create, deps);
        };
        exports.useOptimistic = function(passthrough, reducer) {
          return resolveDispatcher().useOptimistic(passthrough, reducer);
        };
        exports.useReducer = function(reducer, initialArg, init) {
          return resolveDispatcher().useReducer(reducer, initialArg, init);
        };
        exports.useRef = function(initialValue) {
          return resolveDispatcher().useRef(initialValue);
        };
        exports.useState = function(initialState) {
          return resolveDispatcher().useState(initialState);
        };
        exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
          return resolveDispatcher().useSyncExternalStore(
            subscribe,
            getSnapshot,
            getServerSnapshot
          );
        };
        exports.useTransition = function() {
          return resolveDispatcher().useTransition();
        };
        exports.version = "19.2.4";
        "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
      })();
    }
  });

  // ../vire/node_modules/.pnpm/react@19.2.4/node_modules/react/index.js
  var require_react = __commonJS({
    "../vire/node_modules/.pnpm/react@19.2.4/node_modules/react/index.js"(exports, module) {
      "use strict";
      if (false) {
        module.exports = null;
      } else {
        module.exports = require_react_development();
      }
    }
  });

  // src/glass/entry.ts
  var entry_exports = {};
  __export(entry_exports, {
    createGlassSurface: () => createGlassSurface
  });

  // ../vire/packages/vireglass/src/optics.ts
  var clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  var clamp01 = (v) => clamp(v, 0, 1);
  var fresnelF0 = (ior) => ((ior - 1) / (ior + 1)) ** 2;
  var FRESNEL_GAIN = 17.5;
  var fresnelStrength = (ior) => clamp01(fresnelF0(ior) * FRESNEL_GAIN);
  var FRESNEL_EXPONENT = 5;
  var refractionStrength = (ior) => clamp01((ior - 1) / 0.6);
  var MAGNIFY_PER_DP = 6e-3;
  var refractionScale = (ior, thicknessDp) => 1 + MAGNIFY_PER_DP * thicknessDp * (1 - 1 / Math.max(ior, 1));
  var DISPERSION_PER_IOR = 1.1;
  var dispersion = (ior) => clamp01((ior - 1) * DISPERSION_PER_IOR);
  var ABSORB_PER_DP = 0.017;
  var absorption = (pathDp) => 1 - Math.exp(-ABSORB_PER_DP * Math.max(pathDp, 0));
  var edgeDensity = (thicknessDp, bevelDp2) => {
    const body = absorption(thicknessDp);
    if (body <= 0) return 1;
    return clamp(absorption(thicknessDp + bevelDp2) / body, 1, 4);
  };
  var BLUR_MAX = 12;
  var blur = (roughness) => clamp01(roughness) * BLUR_MAX;
  var specularPower = (roughness) => 160 - clamp01(roughness) * 152;
  var specularStrength = (ior, roughness) => clamp01(fresnelStrength(ior) * (1 - clamp01(roughness) * 0.6));
  var EDGE_PUSH_PER_BEVEL = 2.6;
  var edgePush = (ior, bevelDp2) => refractionStrength(ior) * EDGE_PUSH_PER_BEVEL * Math.max(bevelDp2, 0);
  var COOL = { r: 0.86, g: 1, b: 1.08 };
  var NEUTRAL = { r: 1, g: 1.02, b: 0.99 };
  var WARM = { r: 1.08, g: 1, b: 0.88 };
  var mixHue = (a, b, t) => ({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t
  });
  function mediumTint(ior) {
    const t = clamp01((ior - 1.2) / 0.55);
    const hue = t < 0.5 ? mixHue(COOL, NEUTRAL, t * 2) : mixHue(NEUTRAL, WARM, (t - 0.5) * 2);
    const lift = 0.34 + fresnelF0(ior) * 2.4;
    return { r: clamp01(hue.r * lift), g: clamp01(hue.g * lift), b: clamp01(hue.b * lift) };
  }
  var GATHER_PER_BEVEL = 4;
  var GATHER_MAX = 28;
  var gatherRadius = (bevelDp2) => clamp(Math.max(bevelDp2, 1) * GATHER_PER_BEVEL, 4, GATHER_MAX);
  var BODY_DENSITY = 0.19;
  var bodyDensity = (thicknessDp) => BODY_DENSITY * absorption(thicknessDp);
  var EDGE_LIGHT_GAIN = 6;
  var edgeLight = (ior) => clamp01(fresnelF0(ior) * EDGE_LIGHT_GAIN);
  var iridescence = (ior, filmNm) => filmNm <= 0 ? 0 : clamp01(fresnelStrength(ior) * 1.6);
  var diffraction = (ior) => clamp01(dispersion(ior) * 0.5);
  var colorPickup = (ior) => clamp(fresnelStrength(ior) * 0.9, 0, 0.42);

  // ../vire/packages/vireglass/src/material.ts
  var MATERIAL_RANGES = {
    ior: [1, 2],
    thickness: [0, 60],
    bevel: [0, 40],
    roughness: [0, 1],
    environment: [0, 1],
    legibility: [0, 1],
    ink: [0, 1],
    presence: [0, 0.6],
    film: [0, 900]
  };
  var ADAPT_RADIUS = 22;
  var clamp2 = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  var VIREGLASS_MATERIAL_V4 = {
    ior: 1.33,
    thickness: 14,
    bevel: 5,
    roughness: 0.05,
    environment: 0.27,
    legibility: 0.26,
    ink: 1,
    presence: 0.05,
    film: 340
  };
  var VIREGLASS_MATERIAL_V5 = {
    ior: 1.5,
    thickness: 16,
    bevel: 8,
    roughness: 0.06,
    environment: 0.27,
    legibility: 0.26,
    ink: 1,
    presence: 0.05,
    film: 340
  };
  var VIREGLASS_SHEET_MATERIAL = {
    ...VIREGLASS_MATERIAL_V5,
    roughness: 0.85
  };
  var VIREGLASS_LYRICS_MATERIAL = {
    ...VIREGLASS_MATERIAL_V5,
    legibility: 0.95
  };
  var VIREGLASS_CONTROL_MATERIAL = {
    ...VIREGLASS_MATERIAL_V5,
    ior: 1.69,
    thickness: 24,
    bevel: 16,
    roughness: 0.035,
    presence: 0.176
  };
  var VIREGLASS_MATERIAL = VIREGLASS_MATERIAL_V5;
  function materialForInk(material, carriesInk) {
    return { ...material, legibility: carriesInk ? VIREGLASS_LYRICS_MATERIAL.legibility : 0 };
  }
  function activeMaterial(material, on) {
    const k = Math.min(Math.max(on, 0), 1);
    return {
      ...material,
      ior: material.ior + 0.35 * k,
      thickness: material.thickness * (1 + 0.9 * k),
      bevel: material.bevel * (1 + 1.8 * k),
      roughness: material.roughness * (1 - 0.75 * k),
      presence: material.presence + 0.12 * k
    };
  }
  function resolveMaterial(patch = {}) {
    const m = { ...VIREGLASS_MATERIAL, ...patch };
    const out = { ...m };
    for (const key of Object.keys(MATERIAL_RANGES)) {
      const [lo, hi] = MATERIAL_RANGES[key];
      out[key] = clamp2(out[key], lo, hi);
    }
    return out;
  }
  function resolveOptics(patch = {}) {
    const m = resolveMaterial(patch);
    return {
      blur: blur(m.roughness),
      refraction: refractionStrength(m.ior),
      refractionScale: refractionScale(m.ior, m.thickness),
      bevelDp: m.bevel,
      edgePushDp: edgePush(m.ior, m.bevel),
      gatherRadiusDp: gatherRadius(m.bevel),
      fresnel: fresnelStrength(m.ior),
      fresnelPower: FRESNEL_EXPONENT,
      specular: specularStrength(m.ior, m.roughness),
      specularPower: specularPower(m.roughness),
      dispersion: dispersion(m.ior),
      tint: mediumTint(m.ior),
      tintStrength: absorption(m.thickness),
      edgeDensity: edgeDensity(m.thickness, m.bevel),
      environment: m.environment,
      legibility: m.legibility,
      ink: m.ink,
      presence: m.presence,
      adaptRadius: ADAPT_RADIUS,
      bodyDensity: bodyDensity(m.thickness),
      edgeLight: edgeLight(m.ior),
      film: m.film,
      iridescence: iridescence(m.ior, m.film),
      diffraction: diffraction(m.ior),
      colorPickup: colorPickup(m.ior)
    };
  }
  var LEGACY_OPTICS = {
    "v3 \u0432\u0440\u0443\u0447\u043D\u0443\u044E": {
      blur: 4.32,
      refraction: 0.49,
      refractionScale: 1.05,
      bevelDp: 12.6,
      edgePushDp: 32.7,
      gatherRadiusDp: 40,
      fresnel: 0.77,
      fresnelPower: 2.86,
      specular: 0.3,
      specularPower: 74.58,
      dispersion: 0.54,
      tint: { r: 0.4, g: 0.4, b: 0.44 },
      tintStrength: 0.35,
      edgeDensity: 1.5,
      environment: 0.27,
      legibility: 0.55,
      ink: 1,
      presence: 0,
      adaptRadius: ADAPT_RADIUS,
      bodyDensity: 0.14,
      edgeLight: 0.35,
      film: 0,
      iridescence: 0,
      diffraction: 0,
      colorPickup: 0
    },
    "v2": {
      blur: 5,
      refraction: 0.95,
      refractionScale: 1.34,
      bevelDp: 14,
      edgePushDp: 30,
      gatherRadiusDp: 40,
      fresnel: 0.72,
      fresnelPower: 2.4,
      specular: 0.38,
      specularPower: 46,
      dispersion: 0.3,
      tint: { r: 0.4, g: 0.4, b: 0.44 },
      tintStrength: 0.1,
      edgeDensity: 3.63,
      environment: 0,
      legibility: 0,
      ink: 1,
      presence: 0,
      adaptRadius: ADAPT_RADIUS,
      bodyDensity: 0.14,
      edgeLight: 0.35,
      film: 0,
      iridescence: 0,
      diffraction: 0,
      colorPickup: 0
    },
    "v1": {
      blur: 12,
      refraction: 0.55,
      refractionScale: 1.14,
      bevelDp: 10,
      edgePushDp: 22,
      gatherRadiusDp: 40,
      fresnel: 0.5,
      fresnelPower: 3.2,
      specular: 0.42,
      specularPower: 58,
      dispersion: 0.22,
      tint: { r: 0.4, g: 0.4, b: 0.44 },
      tintStrength: 0.16,
      edgeDensity: 3.63,
      environment: 0,
      legibility: 0,
      ink: 1,
      presence: 0,
      adaptRadius: ADAPT_RADIUS,
      bodyDensity: 0.14,
      edgeLight: 0.35,
      film: 0,
      iridescence: 0,
      diffraction: 0,
      colorPickup: 0
    }
  };
  var LEGACY_NAMES = Object.keys(LEGACY_OPTICS);
  var MATERIAL_PRESETS = {
    \u0412\u043E\u0434\u0430: VIREGLASS_MATERIAL_V4,
    \u0421\u0442\u0435\u043A\u043B\u043E: { ...VIREGLASS_MATERIAL_V4, ior: 1.45, thickness: 25, bevel: 12.6, roughness: 0.17 },
    \u041A\u0440\u0438\u0441\u0442\u0430\u043B\u043B: { ...VIREGLASS_MATERIAL_V4, ior: 1.7, thickness: 30, bevel: 16, roughness: 0.02 },
    \u041C\u0430\u0442\u043E\u0432\u043E\u0435: { ...VIREGLASS_MATERIAL_V4, roughness: 0.55 },
    \u0422\u043E\u043B\u0441\u0442\u043E\u0435: { ...VIREGLASS_MATERIAL_V4, thickness: 48, bevel: 22 },
    \u041F\u043B\u0451\u043D\u043A\u0430: { ...VIREGLASS_MATERIAL_V4, thickness: 4, bevel: 3 },
    \u0411\u0435\u043D\u0437\u0438\u043D: { ...VIREGLASS_MATERIAL_V4, ior: 1.5, thickness: 8, bevel: 6, film: 620 }
  };
  var PRESET_NAMES = Object.keys(MATERIAL_PRESETS);
  var EFFECTS = [
    "backdrop",
    "blur",
    "refraction",
    "fresnel",
    "bevel",
    "specular",
    "dispersion",
    "tint",
    "environment",
    "legibility",
    "interference",
    "diffraction"
  ];
  var ALL_EFFECTS_ON = EFFECTS.reduce(
    (acc, e) => ({ ...acc, [e]: true }),
    {}
  );
  function applyToggles(optics, toggles = {}) {
    const on = { ...ALL_EFFECTS_ON, ...toggles };
    const o = { ...optics, tint: { ...optics.tint } };
    if (!on.blur) o.blur = 0;
    if (!on.refraction) {
      o.refraction = 0;
      o.refractionScale = 1;
      o.edgePushDp = 0;
    }
    if (!on.fresnel) o.fresnel = 0;
    if (!on.bevel) o.bevelDp = 1;
    if (!on.specular) o.specular = 0;
    if (!on.dispersion) o.dispersion = 0;
    if (!on.tint) o.tintStrength = 0;
    if (!on.environment) o.environment = 0;
    if (!on.legibility) o.legibility = 0;
    if (!on.interference) o.iridescence = 0;
    if (!on.diffraction) o.diffraction = 0;
    return o;
  }
  var DEBUG_MODES = [
    "normal",
    "sdf",
    "mask",
    "edge",
    "fresnel",
    "refraction",
    "backdrop",
    "specular",
    "dispersion",
    "normals",
    "spectral",
    "adapt"
  ];
  function debugIndex(mode) {
    return DEBUG_MODES.indexOf(mode);
  }

  // ../vire/packages/vireglass/src/geometry.ts
  var roundedRectGeometry = (width, height, cornerRadius) => ({ width, height, cornerRadius });
  var halfMinDp = (g) => Math.max(Math.min(g.width, g.height) / 2, 1);
  var MAX_STRETCH = 0.34;
  var MAX_BEVEL_FRACTION = 0.5;
  var MAX_PUSH_FRACTION = 0.85;
  var bevelFraction = (g, o) => Math.min(MAX_BEVEL_FRACTION, o.bevelDp / halfMinDp(g));
  var bevelDp = (g, o) => Math.max(bevelFraction(g, o) * halfMinDp(g), 1);
  var edgePushDp = (g, o) => Math.min(o.edgePushDp, MAX_PUSH_FRACTION * halfMinDp(g));
  var SPHERICAL_PER_BEVEL = 0.26;
  var CHROMA_PER_BEVEL = 0.3;
  var sphericalDp = (g, o) => o.refraction * SPHERICAL_PER_BEVEL * bevelDp(g, o);
  var chromaDp = (g, o) => o.dispersion * CHROMA_PER_BEVEL * bevelDp(g, o);
  var shadowReachDp = (g) => Math.min(halfMinDp(g) * 0.16, 7);
  function morphReachDp(g, morph) {
    if (!morph || morph.smoothing <= 0) return 0;
    return Math.max(
      0,
      Math.abs(morph.offsetX) + morph.width / 2 - g.width / 2,
      Math.abs(morph.offsetY) + morph.height / 2 - g.height / 2
    );
  }
  var PAD_STEP = 8;
  var quantise = (v) => Math.ceil(v / PAD_STEP) * PAD_STEP;
  function lensPadDp(g, o, morph, dragLimit = 0) {
    const sampling = Math.max(
      edgePushDp(g, o) + sphericalDp(g, o) + chromaDp(g, o) + o.blur,
      o.gatherRadiusDp
    );
    const stretch = halfMinDp(g) * MAX_STRETCH;
    return quantise(sampling + dragLimit + stretch + morphReachDp(g, morph) + 2);
  }
  function surfacePadDp(g, dragLimit = 0, morph) {
    return quantise(shadowReachDp(g) * 1.2 + dragLimit + morphReachDp(g, morph) + 2);
  }

  // ../vire/packages/vireglass/src/sdf.ts
  var VG_SDF = `
float vgRoundRect(float2 p, float2 halfSize, float corner) {
  float2 q = abs(p) - halfSize + corner;
  return min(max(q.x, q.y), 0.0) + length(max(q, float2(0.0))) - corner;
}

float vgSmin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// \u0421\u0446\u0435\u043D\u0430 = \u043E\u0434\u043D\u0430 \u0444\u043E\u0440\u043C\u0430, \u0430 \u043F\u0440\u0438 k > 0 \u2014 \u0433\u043B\u0430\u0434\u043A\u043E\u0435 \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u0434\u0432\u0443\u0445 (\u043C\u043E\u0440\u0444\u0438\u043D\u0433-\u044D\u043A\u0441\u043F\u0435\u0440\u0438\u043C\u0435\u043D\u0442).
float vgScene(float2 p, float2 halfSize, float corner,
              float2 offsetB, float2 halfB, float cornerB, float k) {
  float a = vgRoundRect(p, halfSize, corner);
  if (k <= 0.0) { return a; }
  return vgSmin(a, vgRoundRect(p - offsetB, halfB, cornerB), k);
}

// \u041E\u0442\u043A\u043B\u0438\u043A \u043D\u0430 \u043F\u0430\u043B\u0435\u0446. \u0414\u0435\u0444\u043E\u0440\u043C\u0438\u0440\u0443\u0435\u0442\u0441\u044F \u041F\u041E\u041B\u0415 \u0432\u043E\u043A\u0440\u0443\u0433 \u0442\u043E\u0447\u043A\u0438 \u043A\u0430\u0441\u0430\u043D\u0438\u044F, \u0430 \u043D\u0435 \u0433\u0430\u0431\u0430\u0440\u0438\u0442 \u0444\u043E\u0440\u043C\u044B: \u043C\u0430\u0441\u0448\u0442\u0430\u0431\u0438\u0440\u0443\u044F
// \u0448\u0438\u0440\u0438\u043D\u0443, \u0442\u044F\u0433\u0443 \u0437\u0430 \u043F\u0440\u0430\u0432\u044B\u0439 \u043A\u0440\u0430\u0439 \u043F\u043E\u043B\u0443\u0447\u0430\u0435\u0448\u044C \u0438 \u043D\u0430 \u043B\u0435\u0432\u043E\u043C \u2014 \u0443 \u0436\u0438\u0434\u043A\u043E\u0441\u0442\u0438 \u0442\u0430\u043A \u043D\u0435 \u0431\u044B\u0432\u0430\u0435\u0442. \u0417\u0434\u0435\u0441\u044C \u0441\u043C\u0435\u0449\u0435\u043D\u0438\u0435
// \u0437\u0430\u0442\u0443\u0445\u0430\u0435\u0442 \u0441 \u0440\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u0435\u043C \u043E\u0442 \u043F\u0430\u043B\u044C\u0446\u0430, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0434\u0430\u043B\u044C\u043D\u0438\u0439 \u043A\u0440\u0430\u0439 \u0441\u0442\u043E\u0438\u0442 \u043D\u0430 \u043C\u0435\u0441\u0442\u0435.
//
// \u041F\u043E\u0440\u044F\u0434\u043E\u043A \u0441\u043B\u0430\u0433\u0430\u0435\u043C\u044B\u0445 \u0437\u043D\u0430\u0447\u0438\u043C: \u0442\u044F\u0433\u0430 \u0441\u0434\u0432\u0438\u0433\u0430\u0435\u0442 \u043F\u043E\u043B\u0435, \u043D\u0430\u0436\u0430\u0442\u0438\u0435 \u0441\u0442\u044F\u0433\u0438\u0432\u0430\u0435\u0442 \u0435\u0433\u043E \u043A \u043F\u0430\u043B\u044C\u0446\u0443, \u0432\u043E\u043B\u043D\u0430 \u0438\u0434\u0451\u0442
// \u043F\u043E\u0432\u0435\u0440\u0445 \u0443\u0436\u0435 \u0441\u043C\u0435\u0449\u0451\u043D\u043D\u043E\u0433\u043E \u2014 \u0438\u043D\u0430\u0447\u0435 \u0440\u044F\u0431\u044C \u043E\u0442\u0432\u044F\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043E\u0442 \u0434\u0435\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u0438 \u0438 \u0436\u0438\u0432\u0451\u0442 \u0441\u0430\u043C\u0430 \u043F\u043E \u0441\u0435\u0431\u0435.
float2 vgTouchWarp(float2 p, float2 touch, float2 pull, float press, float radius,
                   float waveAmp, float wavePhase) {
  if (radius <= 0.0) { return p; }
  float2 d = p - touch;
  float r = length(d);

  // \u041F\u0430\u043B\u0435\u0446 \u2014 \u041F\u042F\u0422\u041D\u041E, \u0430 \u043D\u0435 \u0442\u043E\u0447\u043A\u0430, \u043D\u043E \u0438 \u043D\u0435 \u0436\u0451\u0441\u0442\u043A\u0438\u0439 \u0448\u0442\u0430\u043C\u043F: \u0432\u0435\u0440\u0448\u0438\u043D\u0430 \u0448\u0438\u0440\u043E\u043A\u0430\u044F, \u043A\u0440\u0430\u044F \u043C\u044F\u0433\u043A\u0438\u0435. \u041F\u043B\u043E\u0441\u043A\u0430\u044F
  // \u043F\u043B\u043E\u0449\u0430\u0434\u043A\u0430 \u0441 \u043E\u0431\u0440\u044B\u0432\u043E\u043C \u043D\u0430 \u043A\u0440\u0430\u044E \u0441\u0434\u0432\u0438\u0433\u0430\u0435\u0442 \u0443\u0447\u0430\u0441\u0442\u043E\u043A \u0446\u0435\u043B\u0438\u043A\u043E\u043C, \u0438 \u043F\u0440\u044F\u043C\u0430\u044F \u043B\u0438\u043D\u0438\u044F \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u043B\u043E\u043C\u0430\u0435\u0442\u0441\u044F
  // \u0441\u0442\u0443\u043F\u0435\u043D\u044C\u044E \u2014 \u0434\u0435\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u043F\u0440\u044F\u043C\u043E\u0443\u0433\u043E\u043B\u044C\u043D\u043E\u0439, \u0445\u043E\u0442\u044F \u043F\u0430\u043B\u0435\u0446 \u043A\u0440\u0443\u0433\u043B\u044B\u0439. \u0414\u0432\u043E\u0439\u043D\u043E\u0439 smoothstep
  // \u0434\u0430\u0451\u0442 \u0442\u0443 \u0436\u0435 \u0448\u0438\u0440\u0438\u043D\u0443 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u0430 \u0431\u0435\u0437 \u044D\u0442\u043E\u0439 \u0441\u0442\u0443\u043F\u0435\u043D\u0438.
  //
  // \u0412\u043B\u0438\u044F\u043D\u0438\u0435 \u043E\u0431\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u0440\u0430\u0434\u0438\u0443\u0441\u0435, \u0430 \u043D\u0435 \u0440\u0430\u0441\u0442\u0432\u043E\u0440\u044F\u0435\u0442\u0441\u044F \u0431\u0435\u0441\u043A\u043E\u043D\u0435\u0447\u043D\u044B\u043C \u0445\u0432\u043E\u0441\u0442\u043E\u043C, \u043A\u0430\u043A \u0443 \u0433\u0430\u0443\u0441\u0441\u0438\u0430\u043D\u044B:
  // \u0441 \u0445\u0432\u043E\u0441\u0442\u043E\u043C \u0434\u0435\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u0440\u0430\u0441\u043F\u043B\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043F\u0443\u0437\u044B\u0440\u0451\u043C \u2014 \xAB\u0440\u0435\u0437\u0438\u043D\u043E\u0432\u044B\u0439 \u043C\u0430\u0442\u0440\u0430\u0446\xBB.
  float k = clamp((radius - r) / radius, 0.0, 1.0);
  float s = k * k * (3.0 - 2.0 * k);
  float core = s * s * (3.0 - 2.0 * s);
  // \u041A\u043E\u043B\u044C\u0446\u043E \u0432\u043E\u043A\u0440\u0443\u0433 \u043F\u044F\u0442\u043D\u0430: \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B, \u0443\u0448\u0435\u0434\u0448\u0438\u0439 \u0438\u0437-\u043F\u043E\u0434 \u043F\u0430\u043B\u044C\u0446\u0430, \u043E\u0431\u044F\u0437\u0430\u043D \u0433\u0434\u0435-\u0442\u043E \u043E\u043A\u0430\u0437\u0430\u0442\u044C\u0441\u044F. \u0411\u0435\u0437 \u044D\u0442\u043E\u0433\u043E
  // \u0432\u0430\u043B\u0438\u043A\u0430 \u0444\u043E\u0440\u043C\u0430 \u043F\u0440\u043E\u0441\u0442\u043E \u0440\u0430\u0437\u0434\u0443\u0432\u0430\u0435\u0442\u0441\u044F, \u0430 \u043F\u043B\u043E\u0442\u043D\u0430\u044F \u0441\u0440\u0435\u0434\u0430 \u0442\u0430\u043A \u0441\u0435\u0431\u044F \u043D\u0435 \u0432\u0435\u0434\u0451\u0442.
  float rim = k * k * (1.0 - k) * 4.0;

  float2 q = p - pull * (core - 0.42 * rim);
  q -= d * (press * 0.16 * core);

  // \u0423 \u0432\u043E\u043B\u043D\u044B \u0441\u0432\u043E\u0439 \u043C\u0430\u0441\u0448\u0442\u0430\u0431, \u0432\u0434\u0432\u043E\u0435 \u0448\u0438\u0440\u0435 \u0440\u0430\u0434\u0438\u0443\u0441\u0430 \u0442\u044F\u0433\u0438: \u0440\u044F\u0431\u044C \u043E\u0431\u044F\u0437\u0430\u043D\u0430 \u0434\u043E\u0431\u0435\u0436\u0430\u0442\u044C \u0434\u043E \u0434\u0430\u043B\u044C\u043D\u0435\u0433\u043E \u043A\u0440\u0430\u044F,
  // \u0438\u043D\u0430\u0447\u0435 \u043E\u043D\u0430 \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u043A\u0430\u043A \u0434\u0440\u043E\u0436\u0430\u043D\u0438\u0435 \u043F\u043E\u0434 \u043F\u0430\u043B\u044C\u0446\u0435\u043C, \u0430 \u043D\u0435 \u043A\u0430\u043A \u0432\u043E\u043B\u043D\u0430 \u043F\u043E \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438. \u0414\u043B\u0438\u043D\u0430 \u0432\u043E\u043B\u043D\u044B
  // \u043A\u043E\u0440\u043E\u0442\u043A\u0430\u044F: \u0432 \u043F\u043B\u043E\u0442\u043D\u043E\u0439 \u0441\u0440\u0435\u0434\u0435 \u0440\u044F\u0431\u044C \u0447\u0430\u0441\u0442\u0430\u044F \u0438 \u043C\u0435\u043B\u043A\u0430\u044F, \u0434\u043B\u0438\u043D\u043D\u044B\u0435 \u043F\u043E\u043B\u043E\u0433\u0438\u0435 \u0432\u0430\u043B\u044B \u2014 \u044D\u0442\u043E \u0432\u043E\u0434\u0430.
  if (waveAmp > 0.0 && r > 0.0001) {
    float span = radius * 2.0;
    float ring = sin(r / (span * 0.17) - wavePhase * 6.2831853) * exp(-r / (span * 0.7));
    q -= (d / r) * ring * waveAmp;
  }
  return q;
}

// \u0410\u043D\u0430\u043B\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043D\u043E\u0440\u043C\u0430\u043B\u044C \u043E\u0434\u0438\u043D\u043E\u0447\u043D\u043E\u0439 \u0444\u043E\u0440\u043C\u044B: \u0440\u0430\u0434\u0438\u0430\u043B\u044C\u043D\u0430\u044F \u043D\u0430 \u0441\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u0438, \u043E\u0441\u0435\u0432\u0430\u044F \u043D\u0430 \u043F\u0440\u044F\u043C\u044B\u0445 \u0443\u0447\u0430\u0441\u0442\u043A\u0430\u0445.
float2 vgRoundRectNormal(float2 p, float2 halfSize, float corner) {
  float2 q = abs(p) - halfSize + corner;
  float2 g = (q.x > 0.0 && q.y > 0.0)
    ? normalize(max(q, float2(0.0001)))
    : (q.x > q.y ? float2(1.0, 0.0) : float2(0.0, 1.0));
  return g * sign(p);
}

// \u041D\u043E\u0440\u043C\u0430\u043B\u044C \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F \u2014 \u0410\u041D\u0410\u041B\u0418\u0422\u0418\u0427\u0415\u0421\u041A\u0410\u042F, \u043A\u043E\u043D\u0435\u0447\u043D\u044B\u0445 \u0440\u0430\u0437\u043D\u043E\u0441\u0442\u0435\u0439 \u0437\u0434\u0435\u0441\u044C \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435\u0442.
//
// \u0412\u044B\u0432\u043E\u0434: \u0443 smin \u0434\u0432\u0430 \u0441\u043B\u0430\u0433\u0430\u0435\u043C\u044B\u0445, mix(b,a,h) \u0438 \u2212k\xB7h\xB7(1\u2212h). \u0418\u0445 \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u043D\u044B\u0435 \u043F\u043E h \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442
// \u043C\u043D\u043E\u0436\u0438\u0442\u0435\u043B\u044C (1\u22122h) \u0441 \u043F\u0440\u043E\u0442\u0438\u0432\u043E\u043F\u043E\u043B\u043E\u0436\u043D\u044B\u043C\u0438 \u0437\u043D\u0430\u043A\u0430\u043C\u0438 \u0438 \u0441\u043E\u043A\u0440\u0430\u0449\u0430\u044E\u0442\u0441\u044F \u0440\u043E\u0432\u043D\u043E, \u043F\u043E\u0442\u043E\u043C\u0443 \u0447\u0442\u043E h \u043B\u0438\u043D\u0435\u0439\u043D\u0430
// \u043F\u043E (b\u2212a)/k. \u041E\u0441\u0442\u0430\u0451\u0442\u0441\u044F mix(\u2207b, \u2207a, h) \u2014 \u0442\u043E \u0435\u0441\u0442\u044C \u043D\u043E\u0440\u043C\u0430\u043B\u0438 \u0434\u0432\u0443\u0445 \u0444\u043E\u0440\u043C, \u0441\u043C\u0435\u0448\u0430\u043D\u043D\u044B\u0435 \u0442\u0435\u043C \u0436\u0435 \u0432\u0435\u0441\u043E\u043C,
// \u043A\u0430\u043A\u0438\u043C \u0441\u043C\u0435\u0448\u0430\u043D\u044B \u0441\u0430\u043C\u0438 \u0440\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u044F.
//
// \u041F\u0440\u0435\u0436\u043D\u0438\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442 \u0431\u0440\u0430\u043B \u0447\u0435\u0442\u044B\u0440\u0435 \u0414\u041E\u041F\u041E\u041B\u041D\u0418\u0422\u0415\u041B\u042C\u041D\u042B\u0425 \u0432\u044B\u0447\u0438\u0441\u043B\u0435\u043D\u0438\u044F \u0441\u0446\u0435\u043D\u044B \u043D\u0430 \u043F\u0438\u043A\u0441\u0435\u043B\u044C (\u043A\u0430\u0436\u0434\u043E\u0435 \u2014 \u0434\u0432\u0435
// \u0444\u043E\u0440\u043C\u044B \u043F\u043B\u044E\u0441 smin) \u0438 \u043F\u0440\u0438 \u044D\u0442\u043E\u043C \u0431\u044B\u043B \u043F\u0440\u0438\u0431\u043B\u0438\u0436\u0435\u043D\u0438\u0435\u043C. \u0417\u0434\u0435\u0441\u044C \u0434\u0432\u0435 \u0444\u043E\u0440\u043C\u044B, \u0442\u043E\u0447\u043D\u043E.
float2 vgSceneNormal(float2 p, float2 halfSize, float corner,
                     float2 offsetB, float2 halfB, float cornerB, float k) {
  float2 na = vgRoundRectNormal(p, halfSize, corner);
  if (k <= 0.0) { return na; }
  float2 q = p - offsetB;
  float a = vgRoundRect(p, halfSize, corner);
  float b = vgRoundRect(q, halfB, cornerB);
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return normalize(mix(vgRoundRectNormal(q, halfB, cornerB), na, h) + float2(1e-5, 1e-5));
}

// \u041F\u043E\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0432 \u0444\u0430\u0441\u043A\u0435: 0 \u2014 \u043F\u043B\u043E\u0441\u043A\u0430\u044F \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0430, 1 \u2014 \u0441\u0430\u043C\u0430\u044F \u043A\u0440\u043E\u043C\u043A\u0430. \u041E\u0434\u043D\u0430 \u044D\u0442\u0430 \u0432\u0435\u043B\u0438\u0447\u0438\u043D\u0430 \u043F\u0438\u0442\u0430\u0435\u0442
// \u043C\u0430\u0441\u043A\u0443, \u0442\u043E\u043B\u0449\u0438\u043D\u0443, \u043F\u0440\u0435\u043B\u043E\u043C\u043B\u0435\u043D\u0438\u0435, \u0430\u0431\u0435\u0440\u0440\u0430\u0446\u0438\u0438 \u0438 \u0448\u0438\u0440\u0438\u043D\u0443 \u0441\u0432\u0435\u0442\u043E\u0432\u043E\u0439 \u043A\u0440\u043E\u043C\u043A\u0438.
float vgBevelT(float sd, float bevel) {
  return clamp((sd + bevel) / bevel, 0.0, 1.0);
}

// \u041D\u0430\u043A\u043B\u043E\u043D \u043F\u0440\u043E\u0444\u0438\u043B\u044F \u0444\u0430\u0441\u043A\u0438 \u2014 \u0441\u0444\u0435\u0440\u0438\u0447\u0435\u0441\u043A\u0438\u0439: t / sqrt(1 - t\xB2), \u043A\u0430\u043A \u0443 \u0448\u0430\u0440\u043E\u0432\u043E\u0433\u043E \u0441\u0435\u0433\u043C\u0435\u043D\u0442\u0430. \u041F\u0440\u0435\u0436\u043D\u0438\u0439
// t\xB2 \u0434\u0435\u0440\u0436\u0430\u043B \u043D\u0430\u043A\u043B\u043E\u043D \u043E\u043A\u043E\u043B\u043E \u043D\u0443\u043B\u044F \u043F\u043E\u0447\u0442\u0438 \u0432\u0441\u044E \u0444\u0430\u0441\u043A\u0443 \u0438 \u0432\u0437\u043B\u0435\u0442\u0430\u043B \u0443 \u0441\u0430\u043C\u043E\u0439 \u043A\u0440\u043E\u043C\u043A\u0438, \u043E\u0442\u0447\u0435\u0433\u043E \u0432\u0441\u044F \u043E\u043F\u0442\u0438\u043A\u0430
// \u0441\u043E\u0431\u0438\u0440\u0430\u043B\u0430\u0441\u044C \u0432 \u0443\u0437\u043A\u043E\u0435 \u043A\u043E\u043B\u044C\u0446\u043E \u0438 \u0434\u0435\u0442\u0430\u043B\u044C \u0447\u0438\u0442\u0430\u043B\u0430\u0441\u044C \u0428\u0410\u0419\u0411\u041E\u0419 \u2014 \u043F\u043B\u043E\u0441\u043A\u0438\u0439 \u0432\u0435\u0440\u0445 \u0438 \u0441\u0442\u0435\u043D\u043A\u0430 \u043F\u043E \u0431\u043E\u0440\u0442\u0443.
// \u0417\u0434\u0435\u0441\u044C \u043A\u0440\u0438\u0432\u0438\u0437\u043D\u0430 \u0440\u0430\u0441\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0430 \u043F\u043E \u0444\u0430\u0441\u043A\u0435, \u0438 \u043A\u0440\u043E\u043C\u043A\u0430 \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u0451\u0442 \u0431\u044B\u0442\u044C \u043B\u0438\u043D\u0438\u0435\u0439.
//
// \u041F\u043E\u043B\u0435\u043C \u0437\u0440\u0435\u043D\u0438\u044F \u044D\u0442\u043E \u043F\u043E-\u043F\u0440\u0435\u0436\u043D\u0435\u043C\u0443 \u043D\u0435 \u043F\u0440\u0430\u0432\u0438\u0442: \u0433\u043D\u0451\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0444\u0430\u0441\u043A\u0430, \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0430 \u043F\u043B\u043E\u0441\u043A\u0430\u044F, \u0438\u043D\u0430\u0447\u0435
// \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u043C\u044B\u043B\u044C\u043D\u044B\u043C \u043F\u0443\u0437\u044B\u0440\u0451\u043C.
float vgBevelSlope(float t) {
  return min(t * inversesqrt(max(1.0 - t * t * 0.94, 0.02)), 3.2);
}

// \u0421\u042B\u0413\u0420\u0410\u041D\u041D\u0410\u042F \u0414\u041E\u041B\u042F. \u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u2014 \u044D\u0442\u043E \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435, \u0441\u0442\u0430\u0432\u0448\u0435\u0435 \u041F\u041E\u041B\u0415\u041C: \u0441\u043B\u0435\u0432\u0430 \u043E\u0442 \u0433\u0440\u0430\u043D\u0438\u0446\u044B \u0434\u0435\u0442\u0430\u043B\u044C
// \u0430\u043A\u0442\u0438\u0432\u043D\u0430, \u0441\u043F\u0440\u0430\u0432\u0430 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u043E\u0431\u044B\u0447\u043D\u044B\u043C \u0441\u0442\u0435\u043A\u043B\u043E\u043C, \u0438 \u0433\u0440\u0430\u043D\u0438\u0446\u0430 \u0435\u0434\u0435\u0442. \u041E\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0432\u044B\u043A\u043B\u044E\u0447\u0430\u0435\u0442
// \u043F\u043E\u043B\u0435 \u0446\u0435\u043B\u0438\u043A\u043E\u043C \u2014 \u043D\u043E\u043B\u044C \u0437\u0430\u043D\u044F\u0442 \u043D\u0430\u0447\u0430\u043B\u043E\u043C \u0442\u0440\u0435\u043A\u0430 \u0438 \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435\u043C \u0431\u044B\u0442\u044C \u043D\u0435 \u043C\u043E\u0436\u0435\u0442.
//
// \u0413\u0440\u0430\u043D\u0438\u0446\u0430 \u041C\u042F\u0413\u041A\u0410\u042F. \u0420\u0435\u0437\u043A\u0438\u0439 \u0441\u0442\u044B\u043A \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0441\u043A\u043B\u0435\u0439\u043A\u043E\u0439 \u0434\u0432\u0443\u0445 \u0440\u0430\u0437\u043D\u044B\u0445 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u043E\u0432, \u0430 \u043D\u0435 \u0434\u0432\u0443\u043C\u044F
// \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F\u043C\u0438 \u043E\u0434\u043D\u043E\u0433\u043E; \u0448\u0438\u0440\u0438\u043D\u0430 \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u0430 \u0431\u0435\u0440\u0451\u0442\u0441\u044F \u0434\u043E\u043B\u0435\u0439 \u043F\u043E\u043B\u0443\u0448\u0438\u0440\u0438\u043D\u044B, \u0447\u0442\u043E\u0431\u044B \u043D\u0430 \u043A\u0440\u0443\u043F\u043D\u043E\u0439 \u0434\u0435\u0442\u0430\u043B\u0438
// \u043E\u043D \u043D\u0435 \u0432\u044B\u0433\u043B\u044F\u0434\u0435\u043B \u043D\u0438\u0442\u043A\u043E\u0439, \u0430 \u043D\u0430 \u043C\u0435\u043B\u043A\u043E\u0439 \u043D\u0435 \u0441\u044A\u0435\u0434\u0430\u043B \u0435\u0451 \u0446\u0435\u043B\u0438\u043A\u043E\u043C.
float vgProgress(float2 p, float2 halfSize, float progress) {
  if (progress < 0.0) { return 0.0; }
  float edge = mix(-halfSize.x, halfSize.x, clamp(progress, 0.0, 1.0));
  float soft = max(halfSize.x * 0.05, 1.0);
  return 1.0 - smoothstep(edge - soft, edge + soft, p.x);
}
`;
  var VG_FALLOFF = 2.6;

  // ../vire/packages/vireglass/src/touch-response.ts
  var HOLD_STIFFNESS = 260;
  var HOLD_DAMPING = 46;
  var RELEASE_STIFFNESS = 420;
  var RELEASE_DAMPING = 34;
  var PRESS_ATTACK = 0.07;
  var PRESS_RELEASE = 0.16;
  var WAVE_DECAY = 0.22;
  var WAVE_TURNS_PER_SECOND = 3;
  function createDeform() {
    let touchX = 0;
    let touchY = 0;
    let targetTouchX = 0;
    let targetTouchY = 0;
    let pullX = 0;
    let pullY = 0;
    let vx = 0;
    let vy = 0;
    let targetX = 0;
    let targetY = 0;
    let held = false;
    let press = 0;
    let active = 0;
    let waveAmp = 0;
    let wavePhase = 0;
    function grab(x, y, waveStart) {
      const atRest = idle();
      held = true;
      targetTouchX = x;
      targetTouchY = y;
      if (atRest) {
        touchX = x;
        touchY = y;
      }
      targetX = 0;
      targetY = 0;
      waveAmp = Math.min(waveAmp + waveStart, waveStart * 1.6);
    }
    function drag(dx, dy, limit) {
      if (!held) return;
      const len = Math.hypot(dx, dy);
      const scale = len > 1e-3 ? limit * Math.tanh(len / limit) / len : 0;
      targetX = dx * scale;
      targetY = dy * scale;
    }
    function release(waveStart) {
      held = false;
      targetX = 0;
      targetY = 0;
      waveAmp = Math.min(waveAmp + waveStart, waveStart * 2);
    }
    function integrate(dt) {
      const k = held ? HOLD_STIFFNESS : RELEASE_STIFFNESS;
      const c = held ? HOLD_DAMPING : RELEASE_DAMPING;
      vx += (k * (targetX - pullX) - c * vx) * dt;
      vy += (k * (targetY - pullY) - c * vy) * dt;
      pullX += vx * dt;
      pullY += vy * dt;
      const pressTarget = held ? 1 : 0;
      const tau = held ? PRESS_ATTACK : PRESS_RELEASE;
      press += (pressTarget - press) * (1 - Math.exp(-dt / tau));
      active += (pressTarget - active) * (1 - Math.exp(-dt / 0.09));
      const follow = 1 - Math.exp(-dt / 0.045);
      touchX += (targetTouchX - touchX) * follow;
      touchY += (targetTouchY - touchY) * follow;
      wavePhase += dt * WAVE_TURNS_PER_SECOND;
      waveAmp *= Math.exp(-dt / WAVE_DECAY);
      if (waveAmp < 0.01) waveAmp = 0;
    }
    function step(dt) {
      let rest = Math.min(Math.max(dt, 0), 0.25);
      const h = 1 / 120;
      while (rest > 1e-6) {
        const slice = Math.min(h, rest);
        integrate(slice);
        rest -= slice;
      }
      if (idle()) {
        pullX = 0;
        pullY = 0;
        vx = 0;
        vy = 0;
        press = 0;
        active = 0;
        wavePhase = 0;
      }
    }
    function idle() {
      return !held && Math.abs(pullX) < 0.05 && Math.abs(pullY) < 0.05 && Math.hypot(vx, vy) < 0.5 && press < 4e-3 && active < 4e-3 && waveAmp === 0;
    }
    function sample() {
      return { touchX, touchY, pullX, pullY, press, active, waveAmp, wavePhase };
    }
    return { grab, drag, release, step, idle, sample };
  }

  // ../vire/packages/vireglass/src/lens-shader.ts
  var LENS_SHADER = `
uniform shader content;

// \u0417\u043D\u0430\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0441\u0430\u043C\u0430 \u0432\u044C\u044E\u0445\u0430: \u0441\u0432\u043E\u0439 \u0440\u0430\u0437\u043C\u0435\u0440 \u0438 \u0441\u0432\u043E\u0451 \u043C\u0435\u0441\u0442\u043E \u043D\u0430 \u044D\u043A\u0440\u0430\u043D\u0435.
uniform float2 u_center;
uniform float  u_reach;
uniform float2 u_contentMin;
uniform float2 u_contentMax;
// \u041E\u0446\u0435\u043D\u043A\u0430 \u0444\u043E\u043D\u0430 \u041F\u041E\u0414 \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u0438\u0437 \u043D\u0430\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u0437\u043E\u043D\u0434\u0430: \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0430, \u043F\u0435\u0441\u0442\u0440\u043E\u0442\u0430 \u0438 \u0441\u0440\u0435\u0434\u043D\u0438\u0439 \u0446\u0432\u0435\u0442, \u0443\u0436\u0435
// \u0441\u0433\u043B\u0430\u0436\u0435\u043D\u043D\u044B\u0435 \u043F\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438. \u041E\u0442\u0440\u0438\u0446\u0430\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0430 \u2014 \u0437\u043E\u043D\u0434\u0430 \u0435\u0449\u0451 \u043D\u0435\u0442, \u0434\u0435\u0440\u0436\u0438\u043C\u0441\u044F \u043D\u0430 \u0441\u0432\u043E\u0438\u0445 \u043E\u0442\u0441\u0447\u0451\u0442\u0430\u0445.
uniform float  u_probeLuma;
uniform float  u_probeBusy;
// \u041A\u0440\u0430\u044F \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0430 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u044B \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C. \u0421\u0443\u0434\u0438\u0442\u044C \u043F\u043E \u0441\u0440\u0435\u0434\u043D\u0435\u043C\u0443 \u043D\u0435\u043B\u044C\u0437\u044F: \u043D\u0430\u0434 \u0433\u0440\u0430\u043D\u0438\u0446\u0435\u0439 \u0447\u0451\u0440\u043D\u043E\u0433\u043E \u0438
// \u0431\u0435\u043B\u043E\u0433\u043E \u0441\u0440\u0435\u0434\u043D\u0435\u0435 \u2014 \u0441\u0435\u0440\u044B\u0439, \u043F\u0440\u0438 \u043A\u043E\u0442\u043E\u0440\u043E\u043C \xAB\u0432\u0441\u0451 \u0432 \u043F\u043E\u0440\u044F\u0434\u043A\u0435\xBB, \u0430 \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u0442\u043E\u043D\u0435\u0442 \u043D\u0430\u0434 \u0441\u0432\u0435\u0442\u043B\u043E\u0439 \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u043E\u0439.
uniform float2 u_probeRange;
// \u041D\u0430\u043A\u043B\u043E\u043D \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u044B \u043F\u043E \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438, \u0434\u043E\u043B\u0438 \u043D\u0430 \u043F\u043E\u043B\u0443\u0440\u0430\u0437\u043C\u0435\u0440. \u0422\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0413\u0420\u0410\u0414\u0418\u0415\u041D\u0422\u041D\u041E\u0415: \u0442\u0430\u043C, \u0433\u0434\u0435 \u043F\u043E\u0434
// \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u043E\u0434\u043D\u0430 \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u0430 \u0441\u0432\u0435\u0442\u043B\u0435\u0435 \u0434\u0440\u0443\u0433\u043E\u0439, \u043E\u0434\u043D\u0430 \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C \u043D\u0430 \u0432\u0441\u044E \u0434\u0435\u0442\u0430\u043B\u044C \u043D\u0435 \u0440\u0430\u0437\u0432\u043E\u0434\u0438\u0442 \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u043D\u0438
// \u0441 \u043E\u0434\u043D\u043E\u0439 \u0438\u0437 \u043D\u0438\u0445. \u041F\u043B\u043E\u0441\u043A\u043E\u0441\u0442\u044C \u2014 \u0441\u0430\u043C\u0430\u044F \u0433\u0440\u0443\u0431\u0430\u044F \u043C\u043E\u0434\u0435\u043B\u044C, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u044D\u0442\u043E \u043E\u043F\u0438\u0441\u044B\u0432\u0430\u0435\u0442, \u0438 \u0435\u0434\u0438\u043D\u0441\u0442\u0432\u0435\u043D\u043D\u0430\u044F
// \u0433\u043B\u0430\u0434\u043A\u0430\u044F \u043F\u043E \u043F\u043E\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u044E: \u0442\u043E\u0447\u0435\u0447\u043D\u0430\u044F \u043E\u0446\u0435\u043D\u043A\u0430 \u043D\u0430 \u0438\u0437\u043B\u043E\u043C\u0435 \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u0438 \u0434\u0430\u0432\u0430\u043B\u0430 \u043F\u0440\u0438\u0437\u0440\u0430\u0447\u043D\u044B\u0435 \u043A\u043E\u043F\u0438\u0438 \u0442\u0435\u043A\u0441\u0442\u0430.
uniform float2 u_probeSlope;
uniform float3 u_probe;

// \u041C\u0430\u0442\u0435\u0440\u0438\u0430\u043B \u2014 \u043E\u0431\u0449\u0438\u043C \u043A\u0430\u043D\u0430\u043B\u043E\u043C \u0438\u0437 JS, \u0443\u0436\u0435 \u0432 \u043F\u0438\u043A\u0441\u0435\u043B\u044F\u0445 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430.
uniform float2 u_halfSize;
uniform float  u_corner;
uniform float  u_bevel;
uniform float  u_magnify;
uniform float  u_edgePush;
uniform float  u_chroma;
uniform float  u_spherical;
uniform float  u_frost;
uniform float  u_ink;
uniform float  u_legibility;
uniform float  u_presence;
uniform float  u_progress;
uniform float  u_adaptRadius;
uniform float3 u_bodyTint;
uniform float  u_bodyDensity;
uniform float  u_edgeLight;
uniform float  u_fresnel;
uniform float  u_fresnelPower;
uniform float  u_reflectReach;
uniform float  u_film;
uniform float  u_iridescence;
uniform float  u_diffraction;
uniform float  u_colorPickup;
uniform float2 u_morphOffset;
uniform float2 u_morphHalf;
uniform float  u_morphCorner;
uniform float  u_morphK;
uniform float  u_debug;
uniform float2 u_touch;
uniform float2 u_pull;
uniform float  u_touchPress;
uniform float  u_touchRadius;
uniform float2 u_wave;

${VG_SDF}

const float VG_FALLOFF = ${VG_FALLOFF};
// \u041E\u0442\u0441\u0447\u0451\u0442\u043E\u0432 \u0432 \u0434\u0438\u0441\u043A\u043E\u0432\u043E\u043C \u0441\u0431\u043E\u0440\u0435. \u0414\u0432\u0435\u043D\u0430\u0434\u0446\u0430\u0442\u0438 \u0445\u0432\u0430\u0442\u0430\u043B\u043E, \u043F\u043E\u043A\u0430 \u0440\u0430\u0434\u0438\u0443\u0441 \u0431\u044B\u043B \u043C\u0430\u043B; \u0441 \u0440\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u0435\u043C \u043F\u043E
// \u0440\u0430\u0437\u043C\u0430\u0445\u0443 \u0444\u043E\u043D\u0430 \u043E\u043D \u0434\u043E\u0445\u043E\u0434\u0438\u0442 \u0434\u043E \u0434\u0432\u0443\u0445 \u0434\u0435\u0441\u044F\u0442\u043A\u043E\u0432 \u043F\u0438\u043A\u0441\u0435\u043B\u0435\u0439, \u0438 \u043D\u0430 \u0440\u0435\u0437\u043A\u043E\u0439 \u0433\u0440\u0430\u043D\u0438\u0446\u0435 \u0434\u0432\u0435\u043D\u0430\u0434\u0446\u0430\u0442\u044C
// \u043E\u0442\u0441\u0447\u0451\u0442\u043E\u0432 \u0447\u0438\u0442\u0430\u044E\u0442\u0441\u044F \u0441\u0442\u0443\u043F\u0435\u043D\u044C\u043A\u0430\u043C\u0438 \u2014 \u043D\u0435 \u0440\u0430\u0437\u043C\u044B\u0442\u0438\u0435, \u0430 \u043B\u0435\u0441\u0435\u043D\u043A\u0430 \u0438\u0437 \u043A\u043E\u043F\u0438\u0439.
const int   VG_FROST_TAPS = 20;
// \u0427\u0438\u0441\u043B\u043E \u043F\u0440\u043E\u0431 \u0440\u0430\u0441\u0442\u0451\u0442 \u0441 \u041F\u041B\u041E\u0429\u0410\u0414\u042C\u042E \u043A\u0440\u0443\u0433\u0430, \u0430 \u043D\u0435 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u044B\u043C. \u0428\u0443\u043C \u043E\u0446\u0435\u043D\u043A\u0438 \u2014 \u044D\u0442\u043E \u0440\u0430\u0437\u0431\u0440\u043E\u0441
// \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0433\u043E \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C, \u0434\u0435\u043B\u0451\u043D\u043D\u044B\u0439 \u043D\u0430 \u043A\u043E\u0440\u0435\u043D\u044C \u0438\u0437 \u0447\u0438\u0441\u043B\u0430 \u043F\u0440\u043E\u0431: \u043D\u0430 \u0440\u0435\u0437\u043A\u043E\u043C \u0442\u0435\u043A\u0441\u0442\u0435 \u0434\u0432\u0430\u0434\u0446\u0430\u0442\u0438 \u043F\u0440\u043E\u0431
// \u043D\u0430 \u0440\u0430\u0434\u0438\u0443\u0441\u0435 \u0432 \u0441\u0435\u043C\u044C \u043F\u0438\u043A\u0441\u0435\u043B\u0435\u0439 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u043D\u0430 \xB118 \u0438\u0437 255, \u0438 \u0434\u0435\u0442\u0430\u043B\u044C \u043F\u043E\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043A\u0440\u0443\u043F\u043E\u0439. \u041F\u043E\u0442\u043E\u043B\u043E\u043A
// \u0441\u0442\u043E\u0438\u0442 \u043F\u043E\u0442\u043E\u043C\u0443, \u0447\u0442\u043E \u0432\u044B\u0431\u043E\u0440\u043A\u0430 \u0442\u0435\u043A\u0441\u0442\u0443\u0440\u044B \u2014 \u0441\u0430\u043C\u043E\u0435 \u0434\u043E\u0440\u043E\u0433\u043E\u0435 \u0437\u0434\u0435\u0441\u044C, \u0430 \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435\u0433\u043E \u0440\u0430\u0434\u0438\u0443\u0441 \u0443\u0445\u043E\u0434\u0438\u0442
// \u0442\u043E\u043B\u044C\u043A\u043E \u0443 \u0441\u0430\u043C\u043E\u0439 \u043A\u0440\u043E\u043C\u043A\u0438.
const int   VG_FROST_TAPS_MAX = 64;
/* \u041F\u043E\u043F\u0440\u0430\u0432\u043A\u0430 \u043D\u0430 \u0441\u0436\u0430\u0442\u0438\u0435 \u0443 \u0444\u0430\u0441\u043A\u0438 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0430. \u041E\u043D\u0430 \u0447\u0435\u0441\u0442\u043D\u043E \u0440\u0430\u0441\u0442\u0451\u0442 \u0434\u043E \u0431\u0435\u0441\u043A\u043E\u043D\u0435\u0447\u043D\u043E\u0441\u0442\u0438 \u0443 \u0441\u0430\u043C\u043E\u0439 \u043A\u0440\u043E\u043C\u043A\u0438,
   \u0430 \u0441 \u043D\u0435\u0439 \u0440\u0430\u0441\u0442\u0451\u0442 \u0438 \u0440\u0430\u0434\u0438\u0443\u0441 \u0441\u0431\u043E\u0440\u0430 \u2014 \u0442\u043E \u0435\u0441\u0442\u044C \u0448\u0443\u043C \u043E\u0446\u0435\u043D\u043A\u0438 \u0438 \u0446\u0435\u043D\u0430. \u0414\u0430\u043B\u044C\u0448\u0435 \u044D\u0442\u043E\u0433\u043E \u043F\u0440\u0435\u0434\u0435\u043B\u0430 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443
   \u0443 \u043A\u0440\u043E\u043C\u043A\u0438 \u0441\u043D\u0438\u043C\u0430\u0435\u0442 \u043D\u0435 \u0440\u0430\u0434\u0438\u0443\u0441, \u0430 \u043F\u043E\u0434\u043B\u043E\u0436\u043A\u0430 \u043F\u043E\u0434 \u043A\u0440\u0430\u0441\u043A\u043E\u0439. */
const float VG_FOOTPRINT_MAX = 1.8;
const float VG_TAU = 6.28318530718;
// \u0420\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043F\u043E \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0435, \u043A\u043E\u0442\u043E\u0440\u043E\u0435 \u0441\u0442\u0435\u043A\u043B\u043E \u043E\u0431\u044F\u0437\u0430\u043D\u043E \u043E\u0431\u0435\u0441\u043F\u0435\u0447\u0438\u0442\u044C \u043D\u0430\u0434\u043F\u0438\u0441\u0438 \u043F\u043E\u0432\u0435\u0440\u0445 \u0441\u0435\u0431\u044F \u043F\u0440\u0438
// \u043F\u043E\u043B\u043D\u043E\u0439 \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0441\u0442\u0438. \u0412\u0435\u043B\u0438\u0447\u0438\u043D\u0430 \u043C\u043E\u0434\u0435\u043B\u0438, \u0430 \u043D\u0435 \u0440\u0443\u0447\u043A\u0430: \u043D\u0438\u0436\u0435 \u043D\u0435\u0451 \u0442\u0435\u043A\u0441\u0442 \u043D\u0430\u0447\u0438\u043D\u0430\u0435\u0442 \u0442\u043E\u043D\u0443\u0442\u044C.
// \u041F\u0440\u0435\u0434\u0435\u043B, \u0437\u0430 \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u0442\u0435\u043B\u0443 \u043D\u0435\u043B\u044C\u0437\u044F \u0432\u044B\u043F\u0443\u0441\u043A\u0430\u0442\u044C \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0443, \u0447\u0442\u043E\u0431\u044B \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u043F\u043E\u0432\u0435\u0440\u0445 \u043E\u0441\u0442\u0430\u043B\u0430\u0441\u044C \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0439.
// \u042D\u0442\u043E \u041F\u041E\u0422\u041E\u041B\u041E\u041A, \u0430 \u043D\u0435 \u0440\u0430\u0437\u043D\u043E\u0441\u0442\u044C: \u043F\u0440\u0435\u0436\u043D\u044F\u044F \u043C\u043E\u0434\u0435\u043B\u044C \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043B\u0430 \u0431\u044B\u0442\u044C \xAB\u043D\u0430 sep \u0442\u0435\u043C\u043D\u0435\u0435\xBB \u043D\u0430\u0434\u043F\u0438\u0441\u0438, \u0438 \u043D\u0430
// \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0435 0.86 \u0441\u0447\u0438\u0442\u0430\u043B\u0430 \u0431\u0435\u043B\u044B\u0439 \u0442\u0435\u043A\u0441\u0442 \u0447\u0438\u0442\u0430\u0435\u043C\u044B\u043C \u2014 \u0430 \u043E\u043D \u0442\u0430\u043C \u043D\u0435 \u0432\u0438\u0434\u0435\u043D \u0432\u043E\u0432\u0441\u0435. \u041E\u0442\u0441\u044E\u0434\u0430 \u0438 \u0431\u0440\u0430\u043B\u0438\u0441\u044C
// \u0431\u0435\u043B\u044B\u0435 \u0438\u043A\u043E\u043D\u043A\u0438, \u0442\u043E\u043D\u0443\u0449\u0438\u0435 \u043D\u0430 \u0436\u0451\u043B\u0442\u043E\u043C \u0438 \u0437\u0435\u043B\u0451\u043D\u043E\u043C.
const float VG_BODY_CAP_LOOSE = 0.62;
const float VG_BODY_CAP_TIGHT = 0.38;
// \u0421\u0432\u0435\u0442\u043B\u043E\u0442\u0430 \u0442\u0438\u043D\u0442\u0430 \u0432 \u0434\u0432\u0443\u0445 \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F\u0445. \u041D\u0435 \u0447\u0438\u0441\u0442\u044B\u0435 0 \u0438 1: \u0443 \u0441\u0442\u0435\u043A\u043B\u0430 \u0442\u0435\u043B\u043E \u043D\u0435 \u0431\u044B\u0432\u0430\u0435\u0442 \u043D\u0438 \u0443\u0433\u043E\u043B\u044C\u043D\u044B\u043C,
// \u043D\u0438 \u0431\u0443\u043C\u0430\u0436\u043D\u044B\u043C, \u0438 \u0443\u043F\u043E\u0440 \u0432 \u043A\u0440\u0430\u044F \u0434\u0430\u0451\u0442 \u043F\u043B\u043E\u0441\u043A\u0443\u044E \u0437\u0430\u043B\u0438\u0432\u043A\u0443 \u0432\u043C\u0435\u0441\u0442\u043E \u0441\u0440\u0435\u0434\u044B.
const float VG_TINT_DARK = 0.07;
const float VG_TINT_LIGHT = 0.94;
/* \u041D\u0430\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u044B\u0433\u0440\u0430\u043D\u043D\u0430\u044F \u0447\u0430\u0441\u0442\u044C \u0440\u0430\u0437\u043B\u0438\u0447\u0438\u043C\u0435\u0435 \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u043E\u0439 \u0434\u0435\u0442\u0430\u043B\u0438. \u0414\u0435\u0440\u0436\u0438\u0442\u0441\u044F \u0432 \u0442\u0435\u0445 \u0436\u0435 \u0435\u0434\u0438\u043D\u0438\u0446\u0430\u0445, \u0447\u0442\u043E \u0438
   \u0441\u0430\u043C\u043E \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u0435 \u043F\u0440\u0438\u0441\u0443\u0442\u0441\u0442\u0432\u0438\u044F, \u0438 \u041D\u0415\u0412\u042B\u0421\u041E\u041A\u0418\u041C: \u043D\u0430\u0434 \u0440\u043E\u0432\u043D\u044B\u043C \u0442\u0451\u043C\u043D\u044B\u043C \u0444\u043E\u043D\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u0430\u044F \u043F\u0440\u0438\u0431\u0430\u0432\u043A\u0430
   \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u0443 \u0434\u0435\u0442\u0430\u043B\u0438 \u0432 \u043C\u0430\u0442\u043E\u0432\u044B\u0439 \u0434\u0438\u0441\u043A \u2014 \u0440\u043E\u0432\u043D\u043E \u0442\u043E, \u0447\u0435\u0433\u043E \u043C\u043E\u0434\u0435\u043B\u044C \u0432\u0435\u043B\u0438\u0442 \u0438\u0437\u0431\u0435\u0433\u0430\u0442\u044C. */
const float VG_PROGRESS_PRESENCE = 0.10;
// \u041E\u043F\u043E\u0440\u043D\u044B\u0435 \u0434\u043B\u0438\u043D\u044B \u0432\u043E\u043B\u043D \u043A\u0430\u043D\u0430\u043B\u043E\u0432, \u043D\u043C. \u041E\u0442\u0441\u044E\u0434\u0430 \u0436\u0438\u0432\u0443\u0442 \u0412\u0421\u0415 \u0442\u0440\u0438 \u0441\u043F\u0435\u043A\u0442\u0440\u0430\u043B\u044C\u043D\u044B\u0445 \u044F\u0432\u043B\u0435\u043D\u0438\u044F \u0441\u0440\u0430\u0437\u0443:
// \u0434\u0438\u0441\u043F\u0435\u0440\u0441\u0438\u044F (\u043F\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u044C \u043F\u0440\u0435\u043B\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u043E\u0442 \u03BB), \u0434\u0438\u0444\u0440\u0430\u043A\u0446\u0438\u044F \u0438 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0440\u0435\u043D\u0446\u0438\u044F (\u0444\u0430\u0437\u0430 \u0437\u0430\u0432\u0438\u0441\u0438\u0442
// \u043E\u0442 \u03BB). \u041E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0445 \xAB\u0441\u0438\u043B \u0440\u0430\u0434\u0443\u0433\u0438\xBB \u0432 \u043C\u043E\u0434\u0435\u043B\u0438 \u043D\u0435\u0442.
const float3 VG_LAMBDA = float3(610.0, 550.0, 460.0);
// \u041E\u0442\u043D\u043E\u0441\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0435 \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u0438\u0435 \u043A\u0430\u043D\u0430\u043B\u0430 \u043F\u0440\u0438 \u0434\u0438\u0441\u043F\u0435\u0440\u0441\u0438\u0438, \u043D\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u043E \u043F\u043E \u0437\u0435\u043B\u0451\u043D\u043E\u043C\u0443 (\u041A\u043E\u0448\u0438, n ~ A+B/\u03BB\xB2).
// \u0417\u043D\u0430\u043A \u0432\u0430\u0436\u0435\u043D: \u0441\u0438\u043D\u0438\u0439 \u0433\u043D\u0451\u0442\u0441\u044F \u0421\u0418\u041B\u042C\u041D\u0415\u0415 \u043A\u0440\u0430\u0441\u043D\u043E\u0433\u043E, \u0438 \u043E\u0431\u0430 \u0432 \u043E\u0434\u043D\u0443 \u0441\u0442\u043E\u0440\u043E\u043D\u0443. \u0421\u0438\u043C\u043C\u0435\u0442\u0440\u0438\u0447\u043D\u0430\u044F \u043A\u0430\u0439\u043C\u0430,
// \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u0431\u044B\u043B\u0430 \u0437\u0434\u0435\u0441\u044C \u0440\u0430\u043D\u044C\u0448\u0435, \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0446\u0432\u0435\u0442\u043D\u043E\u0439 \u043E\u0431\u0432\u043E\u0434\u043A\u043E\u0439, \u0430 \u043D\u0435 \u0440\u0430\u0441\u0449\u0435\u043F\u043B\u0435\u043D\u0438\u0435\u043C \u043B\u0443\u0447\u0430.
const float3 VG_CAUCHY = float3(-0.21, 0.0, 0.49);
// \u041F\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u044C \u043F\u0440\u0435\u043B\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043F\u043B\u0451\u043D\u043A\u0438. \u041D\u0435 \u0440\u0443\u0447\u043A\u0430: \u0443 \u0432\u0441\u0435\u0445 \u0442\u043E\u043D\u043A\u0438\u0445 \u043F\u043B\u0451\u043D\u043E\u043A \u043D\u0430 \u0441\u0442\u0435\u043A\u043B\u0435 \u043E\u043D \u043E\u043A\u043E\u043B\u043E \u044D\u0442\u043E\u0433\u043E.
const float VG_FILM_IOR = 1.35;

float vgLuma(float3 c) { return dot(c, float3(0.2126, 0.7152, 0.0722)); }

// \u0412\u043E\u0441\u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0435\u043C\u0430\u044F \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0430 \u0438 \u043E\u0431\u0440\u0430\u0442\u043D\u044B\u0439 \u043F\u0435\u0440\u0435\u0445\u043E\u0434 (CIE L*, \u043D\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u043E \u0432 0\u20261). \u041D\u0443\u0436\u043D\u044B \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044E
// \u0440\u0430\u0437\u043B\u0438\u0447\u0438\u043C\u043E\u0441\u0442\u0438: \u0433\u043B\u0430\u0437 \u0441\u0447\u0438\u0442\u0430\u0435\u0442 \u0448\u0430\u0433\u0438 \u0440\u0430\u0432\u043D\u044B\u043C\u0438 \u0432 L*, \u0430 \u043D\u0435 \u0432 \u044F\u0440\u043A\u043E\u0441\u0442\u0438, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0432 \u043B\u0438\u043D\u0435\u0439\u043D\u044B\u0445 \u0435\u0434\u0438\u043D\u0438\u0446\u0430\u0445
// \u043E\u0434\u0438\u043D \u0438 \u0442\u043E\u0442 \u0436\u0435 \u0448\u0430\u0433 \u0432 \u0442\u0435\u043D\u044F\u0445 \u0442\u0435\u0440\u044F\u0435\u0442\u0441\u044F, \u0430 \u0432 \u0441\u0432\u0435\u0442\u0430\u0445 \u043A\u0440\u0438\u0447\u0438\u0442.
float vgLstar(float y) {
  return y > 0.008856 ? 1.16 * pow(y, 1.0 / 3.0) - 0.16 : 9.033 * y;
}

float vgUnLstar(float l) {
  return l > 0.08 ? pow((l + 0.16) / 1.16, 3.0) : l / 9.033;
}

// \u0420\u0430\u0437\u0432\u043E\u0440\u043E\u0442 premultiplied \u0432 \u043E\u0431\u044B\u0447\u043D\u044B\u0439 \u0446\u0432\u0435\u0442. \u0414\u0435\u043B\u0435\u043D\u0438\u0435 \u043E\u0434\u043D\u043E \u0438 \u0432 float: \u0443 half \u043E\u043A\u043E\u043B\u043E \u043D\u0443\u043B\u044F \u0448\u0430\u0433
// \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0433\u0440\u0443\u0431\u044B\u0439, \u0438 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0434\u0435\u043B\u0435\u043D\u0438\u0439 \u043F\u043E\u0434\u0440\u044F\u0434 \u043F\u043E\u0434\u043D\u0438\u043C\u0430\u044E\u0442 \u0448\u0443\u043C.
float3 vgUnpack(half4 c) {
  float a = float(c.a);
  return a > 0.004 ? float3(c.rgb) / a : float3(0.0);
}

// \u0417\u0430\u0445\u0432\u0430\u0442 \u043A\u043E\u043D\u0447\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u043A\u0440\u0430\u044E \u044D\u043A\u0440\u0430\u043D\u0430. \u0412\u044B\u0431\u043E\u0440\u043A\u0430, \u0443\u0448\u0435\u0434\u0448\u0430\u044F \u0437\u0430 \u043D\u0435\u0433\u043E, \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u043F\u0443\u0441\u0442\u043E\u0442\u0443, \u0438 \u0443
// \u0441\u0442\u0435\u043A\u043B\u0430 \u0432\u043E \u0432\u0441\u044E \u0448\u0438\u0440\u0438\u043D\u0443 \u0432\u0434\u043E\u043B\u044C \u043B\u0435\u0432\u043E\u0439 \u0438 \u043F\u0440\u0430\u0432\u043E\u0439 \u043A\u0440\u043E\u043C\u043E\u043A \u043F\u043E\u044F\u0432\u043B\u044F\u043B\u0430\u0441\u044C \u043F\u043E\u043B\u043E\u0441\u0430 \u0432\u043E\u043E\u0431\u0449\u0435 \u0431\u0435\u0437
// \u043F\u0440\u0435\u043B\u043E\u043C\u043B\u0435\u043D\u0438\u044F. \u041F\u0440\u0438\u0436\u0438\u043C\u0430\u0435\u043C \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u0443 \u043A \u043F\u0440\u044F\u043C\u043E\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A\u0443, \u0433\u0434\u0435 \u043A\u043E\u043D\u0442\u0435\u043D\u0442 \u0435\u0441\u0442\u044C: \u043A\u0440\u043E\u043C\u043A\u0430 \u0442\u043E\u0433\u0434\u0430
// \u0441\u0436\u0438\u043C\u0430\u0435\u0442 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0439 \u043A\u0443\u0441\u043E\u043A \u0444\u043E\u043D\u0430, \u0430 \u043D\u0435 \u043F\u0440\u043E\u0432\u0430\u043B\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0432 \u0434\u044B\u0440\u0443.
float2 vgInContent(float2 q) { return clamp(q, u_contentMin, u_contentMax); }

// \u041E\u0442\u0442\u0435\u043D\u043E\u043A \u0431\u0435\u0437 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u044B. \u041D\u0443\u0436\u0435\u043D \u0442\u0430\u043C, \u0433\u0434\u0435 \u0446\u0432\u0435\u0442 \u0431\u0435\u0440\u0443\u0442 \u0443 \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430, \u0430 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0443 \u043E\u0441\u0442\u0430\u0432\u043B\u044F\u044E\u0442 \u0441\u0432\u043E\u044E:
// \u0434\u0435\u043B\u0438\u0442\u044C \u043D\u0430 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0443 \u043D\u0430\u043F\u0440\u044F\u043C\u0443\u044E \u043D\u0435\u043B\u044C\u0437\u044F \u2014 \u0443 \u043D\u0430\u0441\u044B\u0449\u0435\u043D\u043D\u043E\u0433\u043E \u0441\u0438\u043D\u0435\u0433\u043E \u043E\u043D\u0430 0.07, \u0438 \u043C\u043D\u043E\u0436\u0438\u0442\u0435\u043B\u044C \u0443\u043B\u0435\u0442\u0430\u0435\u0442.
float3 vgHue(float3 c) {
  float l = vgLuma(c);
  // \u041D\u0438\u0436\u0435 \u043F\u043E\u0440\u043E\u0433\u0430 \u0443 \u0446\u0432\u0435\u0442\u0430 \u043E\u0442\u0442\u0435\u043D\u043A\u0430 \u043D\u0435\u0442: \u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043D\u0430 \u043A\u043E\u043D\u0441\u0442\u0430\u043D\u0442\u0443 \u043D\u0435 \u043D\u043E\u0440\u043C\u0438\u0440\u0443\u0435\u0442, \u0430 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u043F\u043E\u0447\u0442\u0438
  // \u0447\u0451\u0440\u043D\u043E\u0435 \u2014 \u0438 \u0432\u0441\u0451, \u0447\u0442\u043E \u043A\u0440\u0430\u0441\u0438\u0442\u0441\u044F \u0442\u0430\u043A\u0438\u043C \xAB\u043E\u0442\u0442\u0435\u043D\u043A\u043E\u043C\xBB, \u0442\u0435\u0440\u044F\u0435\u0442 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0443 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u043D\u0438\u043C. \u041D\u0430\u0434 \u0442\u0451\u043C\u043D\u044B\u043C
  // \u0444\u043E\u043D\u043E\u043C \u0442\u0435\u043B\u043E \u043E\u0442 \u044D\u0442\u043E\u0433\u043E \u043D\u0435\u0434\u043E\u0431\u0438\u0440\u0430\u043B\u043E \u0432\u0442\u0440\u043E\u0435, \u0430 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u0435 \u0440\u0430\u0437\u043B\u0438\u0447\u0438\u043C\u043E\u0441\u0442\u0438 \u043D\u0435 \u043C\u043E\u0433\u043B\u043E \u0435\u0433\u043E \u0432\u044B\u0442\u044F\u043D\u0443\u0442\u044C.
  if (l < 0.02) { return float3(1.0); }
  return clamp(c / l, float3(0.0), float3(2.0));
}

// \u0418\u041D\u0422\u0415\u0420\u0424\u0415\u0420\u0415\u041D\u0426\u0418\u042F \u0432 \u0442\u043E\u043D\u043A\u043E\u0439 \u043F\u043B\u0451\u043D\u043A\u0435. \u041B\u0443\u0447, \u043E\u0442\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0439 \u043E\u0442 \u0432\u0435\u0440\u0445\u043D\u0435\u0439 \u0433\u0440\u0430\u043D\u0438\u0446\u044B, \u0438 \u043B\u0443\u0447, \u043E\u0442\u0440\u0430\u0436\u0451\u043D\u043D\u044B\u0439 \u043E\u0442
// \u043D\u0438\u0436\u043D\u0435\u0439, \u043F\u0440\u0438\u0445\u043E\u0434\u044F\u0442 \u0441 \u0440\u0430\u0437\u043D\u043E\u0441\u0442\u044C\u044E \u0445\u043E\u0434\u0430 2\xB7n\xB7d\xB7cos\u03B8t. \u0413\u0434\u0435 \u043E\u043D\u0430 \u043A\u0440\u0430\u0442\u043D\u0430 \u0434\u043B\u0438\u043D\u0435 \u0432\u043E\u043B\u043D\u044B \u2014 \u043A\u0430\u043D\u0430\u043B
// \u0443\u0441\u0438\u043B\u0438\u0432\u0430\u0435\u0442\u0441\u044F, \u0433\u0434\u0435 \u043F\u043E\u043B\u0443\u0446\u0435\u043B\u043E\u0439 \u2014 \u0433\u0430\u0441\u0438\u0442\u0441\u044F; \u0443 \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u043A\u0430\u043D\u0430\u043B\u0430 \u0441\u0432\u043E\u044F \u03BB, \u043E\u0442\u0441\u044E\u0434\u0430 \u043F\u0435\u0440\u0435\u043B\u0438\u0432\u044B. \u03C0 \u0432 \u0444\u0430\u0437\u0435
// \u2014 \u0441\u043A\u0430\u0447\u043E\u043A \u043F\u0440\u0438 \u043E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u0438 \u043E\u0442 \u0431\u043E\u043B\u0435\u0435 \u043F\u043B\u043E\u0442\u043D\u043E\u0439 \u0441\u0440\u0435\u0434\u044B.
//
// \u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044F \u041E\u0422\u0422\u0415\u041D\u041E\u041A: \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u043D\u043E\u0440\u043C\u0438\u0440\u043E\u0432\u0430\u043D \u043D\u0430 \u0441\u0432\u043E\u0451 \u0441\u0440\u0435\u0434\u043D\u0435\u0435, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0440\u0435\u043D\u0446\u0438\u044F \u043A\u0440\u0430\u0441\u0438\u0442
// \u043E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u0435, \u043D\u043E \u043D\u0435 \u0434\u0435\u043B\u0430\u0435\u0442 \u0435\u0433\u043E \u044F\u0440\u0447\u0435 \u0438\u043B\u0438 \u0442\u0435\u043C\u043D\u0435\u0435. \u0418\u043D\u0430\u0447\u0435 \u043D\u0430 \u0431\u0435\u043B\u043E\u043C \u0444\u043E\u043D\u0435 \u043E\u043D\u0430 \u0432\u044B\u0431\u0438\u0432\u0430\u043B\u0430 \u0431\u044B \u043A\u0430\u043D\u0430\u043B.
float3 vgInterference(float cosI) {
  float sinT2 = (1.0 - cosI * cosI) / (VG_FILM_IOR * VG_FILM_IOR);
  float cosT = sqrt(max(1.0 - sinT2, 0.0));
  float opd = 2.0 * VG_FILM_IOR * u_film * cosT;
  float3 i = 0.5 + 0.5 * cos(VG_TAU * opd / VG_LAMBDA + 3.14159265);
  return i / max((i.r + i.g + i.b) / 3.0, 0.001);
}

// \u0414\u0418\u0424\u0420\u0410\u041A\u0426\u0418\u042F \u043D\u0430 \u043A\u0440\u043E\u043C\u043A\u0435. \u0412\u043E\u043B\u043D\u0430, \u043E\u0431\u043E\u0433\u043D\u0443\u0432\u0448\u0430\u044F \u043A\u0440\u0430\u0439, \u043F\u0440\u0438\u0445\u043E\u0434\u0438\u0442 \u0432 \u0442\u043E\u0447\u043A\u0443 \u0434\u0432\u0443\u043C\u044F \u043F\u0443\u0442\u044F\u043C\u0438, \u0438 \u0440\u0430\u0437\u043D\u043E\u0441\u0442\u044C
// \u0445\u043E\u0434\u0430 \u0440\u0430\u0441\u0442\u0451\u0442 \u043F\u043E \u043C\u0435\u0440\u0435 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u043E\u0442 \u043A\u0440\u0430\u044F. \u041F\u043E\u043B\u043E\u0441\u044B \u0442\u0435\u043C \u0447\u0430\u0449\u0435, \u0447\u0435\u043C \u043E\u0441\u0442\u0440\u0435\u0435 \u0444\u0430\u0441\u043A\u0430, \u2014 \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0435\u0451
// \u0448\u0438\u0440\u0438\u043D\u0430 \u0441\u0442\u043E\u0438\u0442 \u0432 \u0437\u043D\u0430\u043C\u0435\u043D\u0430\u0442\u0435\u043B\u0435. \u0422\u043E\u0436\u0435 \u043D\u043E\u0440\u043C\u0438\u0440\u0443\u0435\u0442\u0441\u044F \u043D\u0430 \u0441\u0440\u0435\u0434\u043D\u0435\u0435: \u044D\u0442\u043E \u0446\u0432\u0435\u0442, \u043D\u0435 \u044F\u0440\u043A\u043E\u0441\u0442\u044C.
float3 vgDiffraction(float distFromEdge, float bevel) {
  float phase = VG_TAU * 4.0 * distFromEdge / max(bevel, 1.0);
  float3 d = 0.5 + 0.5 * cos(phase * (550.0 / VG_LAMBDA));
  return d / max((d.r + d.g + d.b) / 3.0, 0.001);
}

// \u041C\u044F\u0433\u043A\u043E\u0435 \u0441\u0436\u0430\u0442\u0438\u0435 \u0432\u043C\u0435\u0441\u0442\u043E \u0436\u0451\u0441\u0442\u043A\u043E\u0433\u043E \u043A\u043B\u0430\u043C\u043F\u0430. \u041D\u0430 \u0431\u0435\u043B\u043E\u043C \u0444\u043E\u043D\u0435 \u0434\u043E\u0431\u0430\u0432\u043A\u0430 \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u044F \u0432\u044B\u0431\u0438\u0432\u0430\u043B\u0430 \u043A\u0430\u043D\u0430\u043B \u0432
// \u0435\u0434\u0438\u043D\u0438\u0446\u0443, \u0438 \u0441\u0442\u0435\u043A\u043B\u043E \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u043B\u043E\u0441\u044C \u0432 \u043F\u043B\u043E\u0441\u043A\u043E\u0435 \u043F\u044F\u0442\u043D\u043E \u0431\u0435\u0437 \u0435\u0434\u0438\u043D\u043E\u0439 \u0434\u0435\u0442\u0430\u043B\u0438 \u2014 \u043F\u0440\u0438 \u0442\u043E\u043C \u0447\u0442\u043E \u0434\u0435\u0442\u0430\u043B\u044C
// \u043F\u043E\u0434 \u043D\u0438\u043C \u0435\u0441\u0442\u044C. \u0417\u0434\u0435\u0441\u044C \u0432\u0441\u0451 \u0432\u044B\u0448\u0435 \u043F\u043E\u0440\u043E\u0433\u0430 \u0441\u0436\u0438\u043C\u0430\u0435\u0442\u0441\u044F \u0432 \u043E\u0441\u0442\u0430\u0442\u043E\u043A \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0430 \u0438 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0442\u0435\u0440\u044F\u0435\u0442\u0441\u044F.
float vgHash(float2 p) {
  return fract(sin(dot(p, float2(12.9898, 78.233))) * 43758.5453);
}

float3 vgSoftClip(float3 c) {
  float3 over = max(c - 0.86, float3(0.0));
  return min(c, float3(0.86)) + over * 0.14 / (0.14 + over);
}


// \u0421\u041E\u0411\u0421\u0422\u0412\u0415\u041D\u041D\u041E\u0415 \u0420\u0410\u0417\u041C\u042B\u0422\u0418\u0415. \u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0435\u043D\u043D\u044B\u0439 \u0431\u043B\u044E\u0440 (dimezisBlurView) \u0443\u043C\u0435\u043D\u044C\u0448\u0430\u0435\u0442 \u0432\u044C\u044E\u0445\u0443, \u0440\u0430\u0437\u043C\u044B\u0432\u0430\u0435\u0442 \u0438
// \u0440\u0430\u0441\u0442\u044F\u0433\u0438\u0432\u0430\u0435\u0442 \u043E\u0431\u0440\u0430\u0442\u043D\u043E, \u0430 \u043F\u043E\u043B\u043E\u0441\u044B \u043E\u0442 8-\u0431\u0438\u0442\u043D\u043E\u0433\u043E \u043E\u043A\u0440\u0443\u0433\u043B\u0435\u043D\u0438\u044F \u0440\u0430\u0437\u0431\u0438\u0432\u0430\u0435\u0442 \u0434\u0438\u0437\u0435\u0440\u0438\u043D\u0433\u043E\u043C \u2014 \u044D\u0442\u043E \u0438 \u0435\u0441\u0442\u044C
// \u0437\u0435\u0440\u043D\u043E, \u043A\u043E\u0442\u043E\u0440\u043E\u0435 \u0432\u0438\u0434\u043D\u043E \u043D\u0430 \u0442\u0451\u043C\u043D\u044B\u0445 \u0443\u0447\u0430\u0441\u0442\u043A\u0430\u0445. \u041F\u043E\u044D\u0442\u043E\u043C\u0443 \u0437\u0430\u0445\u0432\u0430\u0442 \u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D \u0447\u0438\u0441\u0442\u044B\u043C (RenderNode \u0431\u0435\u0437
// \u044D\u0444\u0444\u0435\u043A\u0442\u043E\u0432), \u0430 \u0440\u0430\u0437\u043C\u044B\u0432\u0430\u0435\u0442 \u0448\u0435\u0439\u0434\u0435\u0440: \u0443\u0441\u0440\u0435\u0434\u043D\u0435\u043D\u0438\u0435 \u043E\u0442\u0441\u0447\u0451\u0442\u043E\u0432 \u0432 float \u0441\u0430\u043C\u043E \u0441\u0433\u043B\u0430\u0436\u0438\u0432\u0430\u0435\u0442 \u043F\u043E\u043B\u043E\u0441\u044B \u0438
// \u0441\u0432\u043E\u0435\u0433\u043E \u0448\u0443\u043C\u0430 \u043D\u0435 \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0435\u0442.
//
// \u041E\u0442\u0441\u0447\u0451\u0442\u044B \u0438\u0434\u0443\u0442 \u043F\u043E \u0441\u043F\u0438\u0440\u0430\u043B\u0438 \u0441 \u0437\u043E\u043B\u043E\u0442\u044B\u043C \u0443\u0433\u043B\u043E\u043C \u2014 \u0440\u0430\u0432\u043D\u043E\u043C\u0435\u0440\u043D\u043E\u0435 \u043F\u043E\u043A\u0440\u044B\u0442\u0438\u0435 \u0434\u0438\u0441\u043A\u0430 \u0431\u0435\u0437 \u0440\u0435\u0433\u0443\u043B\u044F\u0440\u043D\u043E\u0439 \u0441\u0435\u0442\u043A\u0438,
// \u043D\u0430 \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u0431\u044B\u043B \u0431\u044B \u0432\u0438\u0434\u0435\u043D \u043C\u0443\u0430\u0440. \u0421\u043A\u043B\u0430\u0434\u044B\u0432\u0430\u0435\u043C PREMULTIPLIED \u2014 \u0442\u0430\u043A \u0443\u0441\u0440\u0435\u0434\u043D\u044F\u044E\u0442\u0441\u044F \u043F\u043E\u043B\u0443\u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u0435
// \u043F\u0438\u043A\u0441\u0435\u043B\u0438, \u0440\u0430\u0437\u0432\u043E\u0440\u043E\u0442 \u043E\u0434\u0438\u043D \u0438 \u043E\u0431\u0449\u0438\u0439.
float4 vgGather(float2 q, float radius, float2 seed) {
  float4 acc = float4(content.eval(vgInContent(q)));
  if (radius <= 0.25) { return acc; }
  if (radius < 4.0) {
    // \u041C\u0435\u043B\u043A\u0438\u0439 \u0440\u0430\u0437\u0431\u0440\u043E\u0441: \u0441\u043F\u0438\u0440\u0430\u043B\u044C \u0438\u0437 \u0434\u0432\u0443\u0445 \u0434\u0435\u0441\u044F\u0442\u043A\u043E\u0432 \u043E\u0442\u0441\u0447\u0451\u0442\u043E\u0432 \u043B\u043E\u0436\u0438\u0442\u0441\u044F \u0432 \u0442\u0435 \u0436\u0435 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043F\u0438\u043A\u0441\u0435\u043B\u0435\u0439,
    // \u0430 \u0441\u0442\u043E\u0438\u0442 \u0432\u043F\u044F\u0442\u0435\u0440\u043E \u0434\u043E\u0440\u043E\u0436\u0435. \u041A\u0440\u0435\u0441\u0442 \u043F\u043E \u0447\u0435\u0442\u044B\u0440\u0451\u043C \u0442\u043E\u0447\u043A\u0430\u043C \u0434\u0430\u0451\u0442 \u0442\u043E\u0442 \u0436\u0435 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442.
    float r = radius * 0.7;
    acc += float4(content.eval(vgInContent(q + float2(r, 0.0))))
      + float4(content.eval(vgInContent(q - float2(r, 0.0))))
      + float4(content.eval(vgInContent(q + float2(0.0, r))))
      + float4(content.eval(vgInContent(q - float2(0.0, r))));
    return acc * 0.2;
  }
  float ca = cos(2.39996323);
  float sa = sin(2.39996323);
  // \u0421\u043F\u0438\u0440\u0430\u043B\u044C \u0440\u0430\u0437\u0432\u043E\u0440\u0430\u0447\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u043D\u0430 \u0421\u0412\u041E\u0419 \u0443\u0433\u043E\u043B \u0432 \u043A\u0430\u0436\u0434\u043E\u043C \u043F\u0438\u043A\u0441\u0435\u043B\u0435. \u0421 \u043E\u0431\u0449\u0438\u043C \u0434\u043B\u044F \u0432\u0441\u0435\u0445 \u0443\u0433\u043B\u043E\u043C \u0434\u0432\u0430
  // \u0434\u0435\u0441\u044F\u0442\u043A\u0430 \u043E\u0442\u0441\u0447\u0451\u0442\u043E\u0432 \u043B\u043E\u0436\u0430\u0442\u0441\u044F \u0432 \u0441\u043E\u0441\u0435\u0434\u043D\u0438\u0445 \u043F\u0438\u043A\u0441\u0435\u043B\u044F\u0445 \u043E\u0434\u0438\u043D\u0430\u043A\u043E\u0432\u043E, \u0438 \u043D\u0430 \u043C\u0435\u043B\u043A\u043E\u0439 \u0444\u0430\u043A\u0442\u0443\u0440\u0435 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C
  // \u044D\u0442\u043E \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u043D\u0435 \u0440\u0430\u0437\u043C\u044B\u0442\u0438\u0435\u043C, \u0430 \u043A\u043E\u043C\u043A\u0430\u043C\u0438. \u041F\u0438\u043A\u0441\u0435\u043B\u044C\u043D\u044B\u0439 \u043F\u043E\u0432\u043E\u0440\u043E\u0442 \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u0438\u0445 \u0432 \u043C\u0435\u043B\u043A\u043E\u0435 \u0437\u0435\u0440\u043D\u043E \u2014
  // \u0440\u043E\u0432\u043D\u043E \u0442\u043E, \u0447\u0435\u043C \u0438 \u0432\u044B\u0433\u043B\u044F\u0434\u0438\u0442 \u043C\u0430\u0442\u043E\u0432\u0430\u044F \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C.
  float a0 = vgHash(seed) * 6.28318530718;
  float2 dir = float2(cos(a0), sin(a0));
  float wide = radius * 0.5;
  int taps = int(clamp(float(VG_FROST_TAPS) * wide * wide, float(VG_FROST_TAPS), float(VG_FROST_TAPS_MAX)));
  for (int i = 1; i <= VG_FROST_TAPS_MAX; i++) {
    if (i > taps) { break; }
    dir = float2(dir.x * ca - dir.y * sa, dir.x * sa + dir.y * ca);
    float r = radius * sqrt(float(i) / float(taps));
    acc += float4(content.eval(vgInContent(q + dir * r)));
  }
  return acc / float(taps + 1);
}

/* \u041F\u043E\u0442\u043E\u043B\u043E\u043A \u0440\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u044F, dp. \u041F\u0440\u0438\u0432\u044F\u0437\u0430\u043D \u043A \u041C\u0410\u0421\u0428\u0422\u0410\u0411\u0423 \u0442\u043E\u0433\u043E, \u0447\u0442\u043E \u0440\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u0435 \u043E\u0431\u044F\u0437\u0430\u043D\u043E \u0441\u043A\u0440\u044B\u0432\u0430\u0442\u044C: \u0441\u043F\u043E\u0440\u0438\u0442 \u0441
   \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E \u043D\u0430 \u0441\u0442\u0435\u043A\u043B\u0435 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u043D\u044B\u0439 \u0442\u0435\u043A\u0441\u0442 \u043F\u043E\u0434 \u043D\u0438\u043C, \u0430 \u043E\u043D \u0432\u044B\u0441\u043E\u0442\u043E\u0439 11\u201314 dp, \u0438 \u0447\u0442\u043E\u0431\u044B \u0440\u0430\u0437\u0440\u0443\u0448\u0438\u0442\u044C
   \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443 \u0442\u0430\u043A\u043E\u0433\u043E \u0440\u0430\u0437\u043C\u0435\u0440\u0430, \u0440\u0430\u0434\u0438\u0443\u0441\u0430 \u043D\u0443\u0436\u043D\u043E \u043E\u043A\u043E\u043B\u043E \u0435\u0451 \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u044B. \u041F\u0440\u0435\u0436\u043D\u0438\u0435 3.5 dp \u0431\u044B\u043B\u0438 \u043C\u0435\u043B\u044C\u0447\u0435
   \u0441\u0442\u0440\u043E\u043A\u0438: \u0442\u043E\u043D\u043A\u0438\u0439 \u0442\u0435\u043A\u0441\u0442 \u043E\u043D\u0438 \u0441\u043C\u0430\u0437\u044B\u0432\u0430\u043B\u0438, \u0430 \u043F\u043E\u043B\u0443\u0436\u0438\u0440\u043D\u044B\u0439 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u043B \u0441\u043A\u0432\u043E\u0437\u044C \u0441\u0442\u0435\u043A\u043B\u043E \u0446\u0435\u043B\u044B\u043C. */
const float VG_ADAPT_BLUR_MAX = 4.0;
/* \u041D\u0430\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0431\u044B\u0441\u0442\u0440\u043E \u043E\u0442\u043A\u043B\u0438\u043A \u043D\u0430 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u0432\u044B\u0445\u043E\u0434\u0438\u0442 \u043D\u0430 \u043F\u043E\u043B\u043A\u0443. \u041F\u043E\u0434\u043E\u0431\u0440\u0430\u043D\u043E \u043F\u043E \u0440\u0435\u0434\u043A\u043E\u0439
   \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0435: \u0441\u0442\u0440\u043E\u043A\u0430 \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u043D\u043E\u0433\u043E \u0442\u0435\u043A\u0441\u0442\u0430 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u0434\u0430\u0451\u0442 busy \u043E\u043A\u043E\u043B\u043E 0.12 \u2014 \u0437\u0430\u043C\u0435\u0440 \u0437\u043E\u043D\u0434\u0430 \u043F\u043E\u0434
   \u043F\u043B\u0430\u0448\u043A\u043E\u0439 \u0441 \u043F\u0440\u043E\u0435\u0437\u0436\u0430\u044E\u0449\u0438\u043C \u0441\u043F\u0438\u0441\u043A\u043E\u043C, \u2014 \u0438 \u043E\u043D\u0430 \u043E\u0431\u044F\u0437\u0430\u043D\u0430 \u0432\u044B\u0431\u0438\u0440\u0430\u0442\u044C \u0440\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u0435 \u043F\u043E\u0447\u0442\u0438 \u0446\u0435\u043B\u0438\u043A\u043E\u043C. */
const float VG_STRUCTURE_GAIN = 20.0;
/* \u041F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C \u0442\u0435\u043B\u0430 \u043F\u0440\u0438 \u043F\u043E\u043B\u043D\u043E\u043C \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u0438 \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0441\u0442\u0438. \u041F\u043E\u0442\u043E\u043B\u043E\u043A \u043D\u0438\u0437\u043A\u0438\u0439 \u043D\u0430\u043C\u0435\u0440\u0435\u043D\u043D\u043E: \u0432\u044B\u0448\u0435 \u0434\u0435\u0442\u0430\u043B\u044C
   \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u0451\u0442 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0442\u043E, \u0447\u0442\u043E \u043F\u043E\u0434 \u043D\u0435\u0439, \u0438 \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044F \u0432 \u043A\u0440\u0430\u0448\u0435\u043D\u0443\u044E \u043F\u043B\u0430\u0448\u043A\u0443 \u2014 \u0430 \u0447\u0443\u0436\u043E\u0439 \u0442\u0435\u043A\u0441\u0442
   \u0432\u0441\u0451 \u0440\u0430\u0432\u043D\u043E \u0434\u0430\u0432\u0438\u0442 \u043D\u0435 \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C\u044E, \u0430 \u0442\u0435\u043C, \u0447\u0442\u043E \u043E\u043D \u0440\u0435\u0437\u043A\u0438\u0439. */
/* \u041F\u043E\u043B \u043E\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u044F: \u0441\u0442\u043E\u043B\u044C\u043A\u043E \u0441\u0440\u0435\u0434\u044B \u0434\u0435\u0442\u0430\u043B\u044C \u0441 \u043A\u0440\u0430\u0441\u043A\u043E\u0439 \u0434\u0435\u0440\u0436\u0438\u0442 \u0412\u0421\u0415\u0413\u0414\u0410, \u043D\u0435\u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E \u043E\u0442 \u0442\u043E\u0433\u043E, \u0447\u0442\u043E \u043F\u043E\u0434
   \u043D\u0435\u0439. \u041D\u0438\u0437\u043A\u0438\u0439 \u043D\u0430\u043C\u0435\u0440\u0435\u043D\u043D\u043E \u2014 \u0432\u044B\u0448\u0435 \u0434\u0435\u0442\u0430\u043B\u044C \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u0451\u0442 \u0431\u044B\u0442\u044C \u043E\u043A\u043D\u043E\u043C \u043D\u0430\u0434 \u0441\u043F\u043E\u043A\u043E\u0439\u043D\u044B\u043C \u043F\u043E\u043B\u043E\u0442\u043D\u043E\u043C, \u0438 \u044D\u0442\u043E
   \u043B\u043E\u0432\u0438\u0442 check:optics. */
const float VG_GROUND_MIN = 0.50;
/* \u041F\u043E\u0442\u043E\u043B\u043E\u043A: \u0434\u043E \u0441\u0442\u043E\u043B\u044C\u043A\u0438 \u043E\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u0435 \u0434\u043E\u0445\u043E\u0434\u0438\u0442 \u043D\u0430\u0434 \u041F\u0401\u0421\u0422\u0420\u042B\u041C \u043F\u043E\u043B\u043E\u0442\u043D\u043E\u043C, \u0433\u0434\u0435 \u0447\u0443\u0436\u0430\u044F \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 \u0441\u043F\u043E\u0440\u0438\u0442 \u0441
   \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E. \u0420\u0430\u0437\u0432\u043E\u0434\u0438\u0442\u044C \u043F\u043E\u043B \u0438 \u043F\u043E\u0442\u043E\u043B\u043E\u043A \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E: \u043E\u0434\u043D\u0438\u043C \u0447\u0438\u0441\u043B\u043E\u043C \u043B\u0438\u0431\u043E \u0442\u0435\u0440\u044F\u0435\u0442\u0441\u044F \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u043E\u0441\u0442\u044C \u043D\u0430\u0434
   \u0441\u043F\u043E\u043A\u043E\u0439\u043D\u044B\u043C \u0444\u043E\u043D\u043E\u043C, \u043B\u0438\u0431\u043E \u0447\u0443\u0436\u043E\u0439 \u0442\u0435\u043A\u0441\u0442 \u0432\u0441\u0442\u0430\u0451\u0442 \u0432\u0440\u043E\u0432\u0435\u043D\u044C \u0441 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439 \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E \u0434\u0435\u0442\u0430\u043B\u0438. */
const float VG_GROUND_MAX = 0.80;
/* \u0412\u043E \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0440\u0430\u0437 \u043A\u0440\u043E\u043C\u043A\u0430 \u044F\u0440\u0447\u0435 \u0442\u043E\u0433\u043E \u043E\u0442\u0445\u043E\u0434\u0430, \u043A\u043E\u0442\u043E\u0440\u044B\u0439 \u043D\u0435 \u0434\u0430\u043B\u043E \u0442\u0435\u043B\u043E. \u0411\u043E\u043B\u044C\u0448\u0435 \u0435\u0434\u0438\u043D\u0438\u0446\u044B, \u043F\u043E\u0442\u043E\u043C\u0443 \u0447\u0442\u043E
   \u043A\u0440\u043E\u043C\u043A\u0430 \u0443\u0437\u043A\u0430\u044F: \u0442\u043E\u0442 \u0436\u0435 \u0448\u0430\u0433 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u044B \u043D\u0430 \u043F\u043E\u043B\u043E\u0441\u043A\u0435 \u0432 \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043F\u0438\u043A\u0441\u0435\u043B\u0435\u0439 \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0441\u043B\u0430\u0431\u0435\u0435, \u0447\u0435\u043C \u043D\u0430
   \u0432\u0441\u0435\u0439 \u043F\u043B\u043E\u0449\u0430\u0434\u0438 \u0434\u0435\u0442\u0430\u043B\u0438. */
const float VG_RIM_GAIN = 3.2;

half4 main(float2 xy) {
  float2 p = vgTouchWarp(xy - u_center, u_touch, u_pull, u_touchPress, u_touchRadius, u_wave.x, u_wave.y);
  float sd = vgScene(p, u_halfSize, u_corner, u_morphOffset, u_morphHalf, u_morphCorner, u_morphK);
  if (sd > 1.0) { return half4(0.0); }

  float bevel = max(u_bevel, 1.0);
  float t = vgBevelT(sd, bevel);
  float2 n = vgSceneNormal(p, u_halfSize, u_corner, u_morphOffset, u_morphHalf, u_morphCorner, u_morphK);

  // \u0420\u0435\u0436\u0438\u043C \xAB\u0431\u044D\u043A\u0434\u0440\u043E\u043F\xBB \u043E\u0442\u0434\u0430\u0451\u0442 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435 \u043A\u0430\u043A \u0435\u0441\u0442\u044C \u2014 \u044D\u0442\u043E \u043E\u043F\u043E\u0440\u043D\u0430\u044F \u0442\u043E\u0447\u043A\u0430 \u0434\u043B\u044F \u0441\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u044F \u043E\u043F\u0442\u0438\u043A\u0438.
  float on = u_debug > 5.5 && u_debug < 6.5 ? 0.0 : 1.0;
  float magnify = mix(1.0, u_magnify, on);
  float2 s = u_center + p / magnify + n * (u_edgePush * on * pow(t, VG_FALLOFF));

  // \u041F\u041B\u041E\u0429\u0410\u0414\u041D\u041E\u0415 \u0418\u041D\u0422\u0415\u0413\u0420\u0418\u0420\u041E\u0412\u0410\u041D\u0418\u0415. \u041D\u0430\u0441\u0442\u043E\u044F\u0449\u0430\u044F \u043B\u0438\u043D\u0437\u0430 \u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442 \u0441\u0432\u0435\u0442 \u0441 \u043F\u043B\u043E\u0449\u0430\u0434\u0438, \u0430 \u043C\u044B \u0431\u0435\u0440\u0451\u043C \u0442\u043E\u0447\u0435\u0447\u043D\u044B\u0435
  // \u043E\u0442\u0441\u0447\u0451\u0442\u044B \u2014 \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0442\u0430\u043C, \u0433\u0434\u0435 \u0441\u043C\u0435\u0449\u0435\u043D\u0438\u0435 \u0432\u044B\u0431\u043E\u0440\u043A\u0438 \u043C\u0435\u043D\u044F\u0435\u0442\u0441\u044F \u0431\u044B\u0441\u0442\u0440\u043E, \u043F\u043E \u0440\u0435\u0437\u043A\u043E\u043C\u0443 \u0444\u043E\u043D\u0443 \u0438\u0434\u0451\u0442 \u0437\u0435\u0440\u043D\u043E.
  // \u0428\u0438\u0440\u0438\u043D\u0430 \u043F\u043B\u043E\u0449\u0430\u0434\u043A\u0438 \u0440\u0430\u0432\u043D\u0430 \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u0438 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0441\u043C\u0435\u0449\u0435\u043D\u0438\u044F \u043D\u0430 \u043F\u0438\u043A\u0441\u0435\u043B\u044C: \u0441\u043C\u0435\u0449\u0435\u043D\u0438\u0435 \u0440\u0430\u0441\u0442\u0451\u0442 \u043A\u0430\u043A
  // edgePush \xB7 t^FALLOFF \u043F\u043E \u0432\u0441\u0435\u0439 \u0444\u0430\u0441\u043A\u0435, \u0437\u043D\u0430\u0447\u0438\u0442 \u0435\u0433\u043E \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u043D\u0430\u044F \u043F\u043E \u044D\u043A\u0440\u0430\u043D\u0443 \u0435\u0441\u0442\u044C
  // edgePush \xB7 FALLOFF \xB7 t^(FALLOFF\u22121) / bevel.
  float footprint = u_edgePush * VG_FALLOFF * pow(t, VG_FALLOFF - 1.0) / bevel;
  // \u0428\u0435\u0440\u043E\u0445\u043E\u0432\u0430\u0442\u043E\u0441\u0442\u0438 \u0437\u0434\u0435\u0441\u044C \u0411\u041E\u041B\u042C\u0428\u0415 \u041D\u0415\u0422: \u043E\u043D\u0430 \u043C\u0443\u0442\u0438\u0442 \u0432 \u0434\u0438\u0441\u043A\u043E\u0432\u043E\u043C \u0441\u0431\u043E\u0440\u0435 \u043D\u0438\u0436\u0435. \u041F\u043E\u043A\u0430 \u043E\u043D\u0430 \u0441\u0442\u043E\u044F\u043B\u0430 \u0438
  // \u0442\u0443\u0442, \u0443 \u043B\u044E\u0431\u043E\u0433\u043E \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u0430 \u0441 \u043D\u0435\u043D\u0443\u043B\u0435\u0432\u043E\u0439 \u0448\u0435\u0440\u043E\u0445\u043E\u0432\u0430\u0442\u043E\u0441\u0442\u044C\u044E \u0440\u0430\u0437\u0431\u0440\u043E\u0441 \u0432 \u043F\u043B\u043E\u0441\u043A\u043E\u0439 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0435 \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u0432\u0430\u043B
  // \u0432\u044B\u0440\u043E\u0436\u0434\u0430\u0442\u044C\u0441\u044F \u2014 \u0438 \u0442\u0435\u043B\u043E, \u0442\u043E \u0435\u0441\u0442\u044C \u043F\u043E\u0447\u0442\u0438 \u0432\u0441\u044F \u043F\u043B\u043E\u0449\u0430\u0434\u044C \u0434\u0435\u0442\u0430\u043B\u0438, \u0443\u0445\u043E\u0434\u0438\u043B\u043E \u0441 \u043E\u0434\u043D\u043E\u0439 \u0432\u044B\u0431\u043E\u0440\u043A\u0438 \u043D\u0430 \u0448\u0435\u0441\u0442\u044C.
  float spread = max(u_spherical * t * t, footprint) * on;
  float chroma = u_chroma * on * t * t;

  float3 rgb;
  float srcA;

  if (chroma + spread < 0.25) {
    // \u0412 \u043F\u043B\u043E\u0441\u043A\u043E\u043C \u0442\u0435\u043B\u0435 \u0440\u0430\u0437\u0431\u0440\u043E\u0441 \u0438 \u0445\u0440\u043E\u043C\u0430\u0442\u0438\u043A\u0430 \u0432\u044B\u0440\u043E\u0436\u0434\u0430\u044E\u0442\u0441\u044F: \u0432\u0441\u0435 \u043E\u0442\u0441\u0447\u0451\u0442\u044B \u043B\u0435\u0433\u043B\u0438 \u0431\u044B \u0432 \u041E\u0414\u041D\u0423 \u0442\u043E\u0447\u043A\u0443.
    // \u0422\u0435\u043B\u043E \u2014 \u044D\u0442\u043E \u043F\u043E\u0447\u0442\u0438 \u0432\u0441\u044F \u043F\u043B\u043E\u0449\u0430\u0434\u044C \u0441\u0442\u0435\u043A\u043B\u0430, \u0430 \u0432\u044B\u0431\u043E\u0440\u043A\u0430 \u0442\u0435\u043A\u0441\u0442\u0443\u0440\u044B \u0437\u0434\u0435\u0441\u044C \u0441\u0430\u043C\u043E\u0435 \u0434\u043E\u0440\u043E\u0433\u043E\u0435, \u0447\u0442\u043E \u0435\u0441\u0442\u044C.
    half4 c = content.eval(vgInContent(s));
    srcA = float(c.a);
    rgb = srcA > 0.004 ? float3(c.rgb) / srcA : float3(0.0);
  } else {
    // \u0414\u0418\u0421\u041F\u0415\u0420\u0421\u0418\u042F. \u041A\u0430\u0436\u0434\u044B\u0439 \u043A\u0430\u043D\u0430\u043B \u0438\u0434\u0451\u0442 \u043F\u043E \u0421\u0412\u041E\u0415\u0419 \u0442\u0440\u0430\u0435\u043A\u0442\u043E\u0440\u0438\u0438: \u0441\u043C\u0435\u0449\u0435\u043D\u0438\u0435 \u043A\u0430\u043D\u0430\u043B\u0430 \u043F\u0440\u043E\u043F\u043E\u0440\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E
    // \u0435\u0433\u043E \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u0438\u044E \u043F\u043E \u041A\u043E\u0448\u0438, \u0438 \u0432\u0441\u0435 \u0442\u0440\u0438 \u2014 \u0432\u0434\u043E\u043B\u044C \u043E\u0434\u043D\u043E\u0439 \u043D\u043E\u0440\u043C\u0430\u043B\u0438. \u041F\u0430\u0440\u0430 \u043E\u0442\u0441\u0447\u0451\u0442\u043E\u0432 \u043D\u0430 \u043A\u0430\u043D\u0430\u043B
    // \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u043F\u043B\u043E\u0449\u0430\u0434\u043A\u0443 (footprint), \u043E\u0434\u043D\u0430 \u2014 \u0446\u0432\u0435\u0442.
    //
    // content.eval \u043E\u0442\u0434\u0430\u0451\u0442 PREMULTIPLIED \u0446\u0432\u0435\u0442. \u0411\u0440\u0430\u0442\u044C .r/.g/.b \u0438\u0437 \u0420\u0410\u0417\u041D\u042B\u0425 \u0442\u043E\u0447\u0435\u043A \u0438 \u0441\u043A\u043B\u0435\u0438\u0432\u0430\u0442\u044C
    // \u043D\u0430\u043F\u0440\u044F\u043C\u0443\u044E \u043D\u0435\u043B\u044C\u0437\u044F: \u0433\u0434\u0435 \u0430\u043B\u044C\u0444\u0430 \u043C\u0435\u0436\u0434\u0443 \u0432\u044B\u0431\u043E\u0440\u043A\u0430\u043C\u0438 \u043E\u0442\u043B\u0438\u0447\u0430\u0435\u0442\u0441\u044F, \u043A\u0430\u043D\u0430\u043B\u044B \u0434\u0435\u043B\u044F\u0442\u0441\u044F \u043D\u0430 \u0440\u0430\u0437\u043D\u044B\u0439
    // \u043C\u043D\u043E\u0436\u0438\u0442\u0435\u043B\u044C \u0438 \u043D\u0430 \u0433\u0440\u0430\u043D\u0438\u0446\u0430\u0445 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0433\u043E \u0432\u044B\u043B\u0435\u0437\u0430\u0435\u0442 \u0446\u0432\u0435\u0442\u043D\u0430\u044F \u043A\u0430\u0439\u043C\u0430, \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u0432 \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0435 \u043D\u0435\u0442.
    // \u041F\u043E\u044D\u0442\u043E\u043C\u0443 \u0441\u043A\u043B\u0430\u0434\u044B\u0432\u0430\u0435\u043C premultiplied \u0438 \u0434\u0435\u043B\u0438\u043C \u041E\u0414\u0418\u041D \u0440\u0430\u0437 \u043D\u0430 \u043F\u0430\u0440\u0443, \u0432 float: half \u0443 \u043D\u0443\u043B\u044F
    // \u043A\u0432\u0430\u043D\u0442\u0443\u0435\u0442\u0441\u044F \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0433\u0440\u0443\u0431\u043E.
    float2 dR = n * (chroma * VG_CAUCHY.r);
    float2 dG = n * (chroma * VG_CAUCHY.g);
    float2 dB = n * (chroma * VG_CAUCHY.b);
    float2 e = n * spread;
    half4 c0 = content.eval(vgInContent(s + dR - e));
    half4 c1 = content.eval(vgInContent(s + dR + e));
    half4 c2 = content.eval(vgInContent(s + dG - e));
    half4 c3 = content.eval(vgInContent(s + dG + e));
    half4 c4 = content.eval(vgInContent(s + dB - e));
    half4 c5 = content.eval(vgInContent(s + dB + e));

    float aR = float(c0.a + c1.a) * 0.5;
    float aG = float(c2.a + c3.a) * 0.5;
    float aB = float(c4.a + c5.a) * 0.5;
    rgb = float3(
      aR > 0.004 ? float(c0.r + c1.r) * 0.5 / aR : 0.0,
      aG > 0.004 ? float(c2.g + c3.g) * 0.5 / aG : 0.0,
      aB > 0.004 ? float(c4.b + c5.b) * 0.5 / aB : 0.0);
    srcA = (aR + aG + aB) / 3.0;
  }

  // \u041E\u0422\u0420\u0410\u0416\u0415\u041D\u0418\u0415. \u0421\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C, \u0430 \u043D\u0435 \u0432 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438, \u043F\u043E\u0442\u043E\u043C\u0443 \u0447\u0442\u043E \u043E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u2014 \u044D\u0442\u043E \u0444\u0443\u043D\u043A\u0446\u0438\u044F
  // \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u044F, \u0430 \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u0435 \u0432\u0438\u0434\u043D\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0442\u0441\u044E\u0434\u0430: \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C \u0440\u0438\u0441\u0443\u0435\u0442\u0441\u044F \u043F\u043E\u0432\u0435\u0440\u0445 \u043B\u0438\u043D\u0437\u044B \u0438
  // \u0431\u044D\u043A\u0434\u0440\u043E\u043F\u0430 \u043D\u0435 \u0438\u043C\u0435\u0435\u0442 \u0432\u043E\u0432\u0441\u0435.
  //
  // \u0421\u043E\u0431\u0438\u0440\u0430\u0435\u043C \u0435\u0433\u043E \u0421\u041D\u0410\u0420\u0423\u0416\u0418 \u0444\u043E\u0440\u043C\u044B, \u0430 \u043D\u0435 \u0438\u0437-\u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u0430: \u043D\u0430 \u0441\u043A\u043E\u043B\u044C\u0437\u044F\u0449\u0435\u043C \u0443\u0433\u043B\u0435 \u0432 \u0433\u043B\u0430\u0437 \u043F\u0440\u0438\u0445\u043E\u0434\u0438\u0442
  // \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u0435 \u0434\u0435\u0442\u0430\u043B\u0438, \u0430 \u043D\u0435 \u0442\u043E, \u0447\u0442\u043E \u0437\u0430 \u043D\u0435\u0439. \u041E\u0442\u0441\u044E\u0434\u0430 \u0438 \u043F\u043E\u0432\u0435\u0434\u0435\u043D\u0438\u0435 \u2014 \u044F\u0440\u043A\u0430\u044F \u043E\u0431\u043B\u043E\u0436\u043A\u0430 \u0440\u044F\u0434\u043E\u043C \u0437\u0430\u0436\u0438\u0433\u0430\u0435\u0442
  // \u0431\u043B\u0438\u0436\u043D\u044E\u044E \u043A \u043D\u0435\u0439 \u043A\u0440\u043E\u043C\u043A\u0443, \u0430 \u043F\u043E\u0441\u0440\u0435\u0434\u0438 \u043F\u0443\u0441\u0442\u043E\u0439 \u0447\u0435\u0440\u043D\u043E\u0442\u044B \u0441\u0442\u0435\u043A\u043B\u043E \u0447\u0435\u0441\u0442\u043D\u043E \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0442\u0451\u043C\u043D\u044B\u043C.
  //
  // \u0411\u0435\u0440\u0451\u0442\u0441\u044F \u041F\u041B\u041E\u0429\u0410\u0414\u041A\u041E\u0419, \u0430 \u043D\u0435 \u0442\u043E\u0447\u043A\u043E\u0439: \u043A\u0440\u0438\u0432\u0430\u044F \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C \u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442 \u0446\u0435\u043B\u044B\u0439 \u0442\u0435\u043B\u0435\u0441\u043D\u044B\u0439 \u0443\u0433\u043E\u043B, \u0438 \u043E\u0434\u0438\u043D
  // \u0441\u0434\u0432\u0438\u043D\u0443\u0442\u044B\u0439 \u043E\u0442\u0441\u0447\u0451\u0442 \u2014 \u044D\u0442\u043E \u0447\u0438\u0441\u0442\u044B\u0439 \u043F\u0435\u0440\u0435\u043D\u043E\u0441 \u0431\u0435\u0437 \u0441\u0436\u0430\u0442\u0438\u044F, \u0442\u043E \u0435\u0441\u0442\u044C \u043D\u0435\u0438\u0441\u043A\u0430\u0436\u0451\u043D\u043D\u0430\u044F \u041A\u041E\u041F\u0418\u042F \u0441\u043E\u0441\u0435\u0434\u043D\u0435\u0433\u043E
  // \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0433\u043E \u0432\u043D\u0443\u0442\u0440\u0438 \u0441\u0442\u0435\u043A\u043B\u0430 (material-lab.md E-33).
  float slope = vgBevelSlope(t);
  float3 N = normalize(float3(n * slope, 1.0));
  float fres = u_fresnel * pow(1.0 - clamp(N.z, 0.0, 1.0), u_fresnelPower);

  // \u041E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u0436\u0438\u0432\u0451\u0442 \u043D\u0430 \u0424\u0410\u0421\u041A\u0415: \u0432 \u043F\u043B\u043E\u0441\u043A\u043E\u0439 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0435 \u0424\u0440\u0435\u043D\u0435\u043B\u044C \u0440\u0430\u0432\u0435\u043D \u043D\u0443\u043B\u044E \u043F\u043E \u043F\u043E\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u044E, \u0438 \u0432\u043E\u0441\u0435\u043C\u044C
  // \u0432\u044B\u0431\u043E\u0440\u043E\u043A \u0442\u0430\u043C \u0443\u0445\u043E\u0434\u0438\u043B\u0438 \u0431\u044B \u0432\u043F\u0443\u0441\u0442\u0443\u044E \u043F\u043E \u0432\u0441\u0435\u0439 \u043F\u043B\u043E\u0449\u0430\u0434\u0438 \u0434\u0435\u0442\u0430\u043B\u0438. \u0422\u0435\u043B\u0443 \u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0441\u0440\u0435\u0434\u043D\u0435\u0439 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u044B
  // \u043E\u043A\u0440\u0435\u0441\u0442\u043D\u043E\u0441\u0442\u0438 \u2014 \u0435\u0451 \u0438 \u0442\u0430\u043A \u043F\u043E\u0441\u0447\u0438\u0442\u0430\u043B \u0437\u043E\u043D\u0434, \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E.
  float3 refl;
  if (t > 0.02) {
    float2 around = u_center + p + n * (u_reflectReach * mix(0.35, 1.0, clamp(slope / 3.2, 0.0, 1.0)));
    // \u0414\u0432\u0430 \u043A\u043E\u043B\u044C\u0446\u0430, \u0430 \u043D\u0435 \u043E\u0434\u043D\u043E: \u0447\u0435\u0442\u044B\u0440\u0435 \u043E\u0442\u0441\u0447\u0451\u0442\u0430 \u043D\u0430 \u0440\u0430\u0434\u0438\u0443\u0441\u0435 \u0441\u0431\u043E\u0440\u0430 \u0443\u0441\u0440\u0435\u0434\u043D\u044F\u044E\u0442 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0433\u0440\u0443\u0431\u043E, \u0438
    // \u0442\u0435\u043A\u0441\u0442, \u043B\u0435\u0436\u0430\u0449\u0438\u0439 \u0420\u042F\u0414\u041E\u041C \u0441\u043E \u0441\u0442\u0435\u043A\u043B\u043E\u043C, \u043E\u0441\u0442\u0430\u0432\u0430\u043B\u0441\u044F \u0447\u0438\u0442\u0430\u0435\u043C\u044B\u043C \u0432\u043D\u0443\u0442\u0440\u0438 \u043D\u0435\u0433\u043E (E-33 \u2014 \u0442\u0430\u043C \u0436\u0435 \u043F\u0440\u043E \u0442\u043E,
    // \u043F\u043E\u0447\u0435\u043C\u0443 \u043E\u0434\u0438\u043D \u043E\u0442\u0441\u0447\u0451\u0442 \u0432\u043E\u043E\u0431\u0449\u0435 \u043D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C). \u0412\u043E\u0441\u0435\u043C\u044C \u043F\u043E \u0434\u0432\u0443\u043C \u0440\u0430\u0434\u0438\u0443\u0441\u0430\u043C \u0440\u0430\u0437\u043C\u044B\u0432\u0430\u044E\u0442 \u0444\u043E\u0440\u043C\u0443, \u043D\u043E
    // \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442 \u0446\u0432\u0435\u0442 \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u044F, \u0440\u0430\u0434\u0438 \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u0432\u0441\u0451 \u0438 \u0431\u0435\u0440\u0451\u0442\u0441\u044F.
    float p1 = u_reflectReach * 0.75;
    float p2 = u_reflectReach * 0.4;
    float d = 0.7071;
    float4 rsum = float4(content.eval(vgInContent(around + float2(p1, 0.0))))
      + float4(content.eval(vgInContent(around - float2(p1, 0.0))))
      + float4(content.eval(vgInContent(around + float2(0.0, p1))))
      + float4(content.eval(vgInContent(around - float2(0.0, p1))))
      + float4(content.eval(vgInContent(around + float2(p2, p2) * d)))
      + float4(content.eval(vgInContent(around + float2(-p2, p2) * d)))
      + float4(content.eval(vgInContent(around + float2(p2, -p2) * d)))
      + float4(content.eval(vgInContent(around + float2(-p2, -p2) * d)));
    float ra = rsum.a * 0.125;
    refl = ra > 0.004 ? rsum.rgb * 0.125 / ra : float3(0.0);
  } else {
    // \u0412 \u0442\u0435\u043B\u0435 \u0432\u044B\u0431\u043E\u0440\u043A\u0438 \u043D\u0435 \u0431\u0435\u0440\u0451\u043C \u0432\u043E\u0432\u0441\u0435, \u0430 \u0447\u0442\u043E\u0431\u044B \u043D\u0430 \u0433\u0440\u0430\u043D\u0438\u0446\u0435 \u0432\u0435\u0442\u0432\u0435\u0439 \u043D\u0435 \u043F\u043E\u044F\u0432\u0438\u043B\u0441\u044F \u0432\u0438\u0434\u0438\u043C\u044B\u0439 \u0441\u0435\u0440\u043F,
    // \u0437\u0434\u0435\u0441\u044C \u0441\u0442\u043E\u0438\u0442 \u0440\u043E\u0432\u043D\u043E \u0442\u043E, \u0432\u043E \u0447\u0442\u043E \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u0438\u0442 \u0441\u043C\u0435\u0441\u044C \u043D\u0438\u0436\u0435.
    refl = u_probeLuma >= 0.0 ? u_probe : rgb;
  }

  // \u0421\u0432\u0435\u0442, \u0434\u043E\u0445\u043E\u0434\u044F\u0449\u0438\u0439 \u0434\u043E \u0442\u0435\u043B\u0430, \u043E\u0431\u044F\u0437\u0430\u043D \u0431\u044B\u0442\u044C \u0413\u041B\u0410\u0414\u041A\u0418\u041C \u043F\u043E \u0432\u0441\u0435\u0439 \u0434\u0435\u0442\u0430\u043B\u0438: \u043E\u043D \u0432\u0438\u0434\u0435\u043D \u043D\u0430 \u0432\u0441\u0435\u0439 \u043F\u043B\u043E\u0449\u0430\u0434\u0438,
  // \u0430 \u0432\u044B\u0431\u043E\u0440\u043A\u0430 \u043E\u043A\u0440\u0435\u0441\u0442\u043D\u043E\u0441\u0442\u0438 \u0436\u0438\u0432\u0451\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0430 \u0444\u0430\u0441\u043A\u0435. \u0421\u043C\u0435\u0441\u044C \u043D\u0435\u043F\u0440\u0435\u0440\u044B\u0432\u043D\u0430 \u043F\u043E \u043F\u043E\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u044E \u2014 \u043F\u0440\u0438
  // t \u2264 0.02 refl \u0438 \u0435\u0441\u0442\u044C \u043E\u0446\u0435\u043D\u043A\u0430 \u0437\u043E\u043D\u0434\u0430.
  float3 ambient = mix(u_probeLuma >= 0.0 ? u_probe : rgb, refl, smoothstep(0.0, 0.2, t));

  // \u0421\u041F\u0415\u041A\u0422\u0420\u0410\u041B\u042C\u041D\u0410\u042F \u041A\u0420\u041E\u041C\u041A\u0410. \u0418\u043D\u0442\u0435\u0440\u0444\u0435\u0440\u0435\u043D\u0446\u0438\u044F \u0438 \u0434\u0438\u0444\u0440\u0430\u043A\u0446\u0438\u044F \u2014 \u043E\u0431\u0430 \u0432\u043E\u043B\u043D\u043E\u0432\u044B\u0435, \u043E\u0431\u0430 \u0436\u0438\u0432\u0443\u0442 \u0432 \u043E\u0442\u0440\u0430\u0436\u0451\u043D\u043D\u043E\u043C
  // \u043B\u0443\u0447\u0435 \u0438 \u043E\u0431\u0430 \u0437\u0430\u043C\u0435\u0442\u043D\u044B \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0430 \u0441\u043A\u043E\u043B\u044C\u0437\u044F\u0449\u0435\u043C \u0443\u0433\u043B\u0435. \u041F\u043E\u044D\u0442\u043E\u043C\u0443 \u044D\u0442\u043E \u043E\u0434\u0438\u043D \u043C\u043D\u043E\u0436\u0438\u0442\u0435\u043B\u044C \u041E\u0422\u0422\u0415\u041D\u041A\u0410 \u043A
  // \u043E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u044E: ALU \u0431\u0435\u0437 \u0435\u0434\u0438\u043D\u043E\u0439 \u043B\u0438\u0448\u043D\u0435\u0439 \u0432\u044B\u0431\u043E\u0440\u043A\u0438 \u0442\u0435\u043A\u0441\u0442\u0443\u0440\u044B.
  float3 spectral = float3(1.0);
  if (u_iridescence > 0.001) {
    spectral *= mix(float3(1.0), vgInterference(clamp(N.z, 0.0, 1.0)), u_iridescence);
  }
  if (u_diffraction > 0.001) {
    // \u041F\u043E\u043B\u043E\u0441\u044B \u0436\u0438\u0432\u0443\u0442 \u0443 \u0441\u0430\u043C\u043E\u0439 \u043A\u0440\u043E\u043C\u043A\u0438: \u0434\u0430\u043B\u044C\u0448\u0435 \u0432 \u0442\u043E\u043B\u0449\u0435 \u0440\u0430\u0437\u043D\u043E\u0441\u0442\u044C \u0445\u043E\u0434\u0430 \u0442\u0435\u0440\u044F\u0435\u0442 \u043A\u043E\u0433\u0435\u0440\u0435\u043D\u0442\u043D\u043E\u0441\u0442\u044C.
    float w = u_diffraction * smoothstep(0.45, 1.0, t);
    spectral *= mix(float3(1.0), vgDiffraction((1.0 - t) * bevel, bevel), w);
  }
  // \u0421\u043F\u0435\u043A\u0442\u0440 \u0434\u043E\u043C\u0435\u0448\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0422\u041E\u041B\u042C\u041A\u041E \u0432 \u0437\u0435\u0440\u043A\u0430\u043B\u044C\u043D\u0443\u044E \u0447\u0430\u0441\u0442\u044C. \u0420\u0430\u043D\u044C\u0448\u0435 \u043E\u043D \u043C\u043D\u043E\u0436\u0438\u043B refl \u0446\u0435\u043B\u0438\u043A\u043E\u043C, \u0430 \u0442\u043E\u0442 \u0436\u0435
  // refl \u0443\u0445\u043E\u0434\u0438\u0442 \u043F\u043E\u0442\u043E\u043C \u0432 \u043F\u043E\u0434\u0441\u0432\u0435\u0442\u043A\u0443 \u0442\u0435\u043B\u0430 \u2014 \u0438 \u043F\u0435\u0440\u0435\u043B\u0438\u0432\u044B \u043F\u043B\u0451\u043D\u043A\u0438 \u043A\u0440\u0430\u0441\u0438\u043B\u0438 \u0432\u0441\u044E \u0434\u0435\u0442\u0430\u043B\u044C \u0432 \u0446\u0432\u0435\u0442
  // \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0440\u0435\u043D\u0446\u0438\u0438, \u0445\u043E\u0442\u044F \u0436\u0438\u0432\u0443\u0442 \u043E\u043D\u0438 \u0432 \u043E\u0442\u0440\u0430\u0436\u0451\u043D\u043D\u043E\u043C \u043B\u0443\u0447\u0435 \u043D\u0430 \u0441\u043A\u043E\u043B\u044C\u0437\u044F\u0449\u0435\u043C \u0443\u0433\u043B\u0435.
  rgb = mix(rgb, refl * spectral, fres);

  // \u041E\u0426\u0415\u041D\u041A\u0410 \u0424\u041E\u041D\u0410. \u041F\u0440\u0438\u0445\u043E\u0434\u0438\u0442 \u0438\u0437 \u043D\u0430\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u0437\u043E\u043D\u0434\u0430 \u043E\u0434\u043D\u043E\u0439 \u0432\u0435\u043B\u0438\u0447\u0438\u043D\u043E\u0439 \u043D\u0430 \u0432\u0441\u044E \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C: \u043E\u043D
  // \u0440\u0435\u043D\u0434\u0435\u0440\u0438\u0442 \u0437\u0430\u0445\u0432\u0430\u0442 \u0432 \u0441\u0435\u0442\u043A\u0443 16\xD732 \u0438 \u0443\u0441\u0440\u0435\u0434\u043D\u044F\u0435\u0442 \u043F\u0440\u044F\u043C\u043E\u0443\u0433\u043E\u043B\u044C\u043D\u0438\u043A \u044D\u0442\u043E\u0433\u043E \u0441\u0442\u0435\u043A\u043B\u0430.
  //
  // \u0421\u0447\u0438\u0442\u0430\u0442\u044C \u0435\u0451 \u0437\u0434\u0435\u0441\u044C \u043F\u043E \u043E\u0442\u0441\u0447\u0451\u0442\u0430\u043C \u041D\u0415\u041B\u042C\u0417\u042F, \u0438 \u044D\u0442\u043E \u043D\u0435 \u043F\u0440\u043E \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u044E. \u041F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C \u0442\u0435\u043B\u0430 \u2014 \u043D\u0435\u043B\u0438\u043D\u0435\u0439\u043D\u0430\u044F
  // \u0444\u0443\u043D\u043A\u0446\u0438\u044F \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u044B \u0441 \u0438\u0437\u043B\u043E\u043C\u043E\u043C: \u0442\u0430\u043C, \u0433\u0434\u0435 \u043E\u0442\u0441\u0447\u0451\u0442 \u0437\u0430\u0435\u0437\u0436\u0430\u043B \u043D\u0430 \u0431\u0443\u043A\u0432\u0443 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C, \u043E\u0446\u0435\u043D\u043A\u0430 \u043F\u0440\u044B\u0433\u0430\u043B\u0430,
  // \u0430 \u0441 \u043D\u0435\u0439 \u043F\u0440\u044B\u0433\u0430\u043B\u0430 \u0438 \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C. \u041D\u0430 \u044D\u043A\u0440\u0430\u043D\u0435 \u044D\u0442\u043E \u0432\u044B\u0433\u043B\u044F\u0434\u0435\u043B\u043E \u043F\u0440\u0438\u0437\u0440\u0430\u0447\u043D\u044B\u043C\u0438 \u043A\u043E\u043F\u0438\u044F\u043C\u0438 \u0442\u0435\u043A\u0441\u0442\u0430 \u043D\u0430
  // \u0440\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u0438 \u0440\u0430\u0434\u0438\u0443\u0441\u0430 \u0432\u044B\u0431\u043E\u0440\u043A\u0438 \u2014 \u0440\u043E\u0432\u043D\u043E \u0442\u0430 \u0433\u0440\u0435\u0431\u0451\u043D\u043A\u0430, \u0447\u0442\u043E \u0438 \u0432 E-31, \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u0438,
  // \u0430 \u043D\u0435 \u043F\u043E \u0446\u0432\u0435\u0442\u0443. \u041D\u0438\u043A\u0430\u043A\u043E\u0435 \u0447\u0438\u0441\u043B\u043E \u043E\u0442\u0441\u0447\u0451\u0442\u043E\u0432 \u0435\u0451 \u043D\u0435 \u0443\u0431\u0438\u0440\u0430\u0435\u0442: \u043E\u043D\u0430 \u0432 \u0441\u0430\u043C\u043E\u0439 \u0434\u0438\u0441\u043A\u0440\u0435\u0442\u043D\u043E\u0441\u0442\u0438 \u043E\u0446\u0435\u043D\u043A\u0438.
  //
  // \u0417\u0430\u043E\u0434\u043D\u043E \u044D\u0442\u043E \u0434\u0435\u0448\u0435\u0432\u043B\u0435 \u043D\u0430 \u0447\u0435\u0442\u044B\u0440\u0435 \u0432\u044B\u0431\u043E\u0440\u043A\u0438 \u0442\u0435\u043A\u0441\u0442\u0443\u0440\u044B \u0441 \u043F\u0438\u043A\u0441\u0435\u043B\u044F \u0438 \u043C\u0435\u0434\u043B\u0435\u043D\u043D\u0435\u0435 \u043F\u043E \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u2014
  // \u0430\u0434\u0430\u043F\u0442\u0430\u0446\u0438\u044F \u043E\u0431\u044F\u0437\u0430\u043D\u0430 \u0431\u044B\u0442\u044C \u043D\u0435\u0437\u0430\u043C\u0435\u0442\u043D\u043E\u0439, \u0430 \u043D\u0435 \u043C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u043E\u0439.
  float3 wide;
  float busy;
  if (u_probeLuma >= 0.0) {
    wide = u_probe;
    busy = u_probeBusy;
  } else {
    // \u0417\u043E\u043D\u0434 \u0435\u0449\u0451 \u043D\u0435 \u043E\u0442\u0447\u0438\u0442\u0430\u043B\u0441\u044F (\u043F\u0435\u0440\u0432\u044B\u0435 \u043A\u0430\u0434\u0440\u044B) \u2014 \u0434\u0435\u0440\u0436\u0438\u043C\u0441\u044F \u043D\u0430 \u0441\u0432\u043E\u0438\u0445 \u043E\u0442\u0441\u0447\u0451\u0442\u0430\u0445, \u0447\u0442\u043E\u0431\u044B \u0441\u0442\u0435\u043A\u043B\u043E \u043D\u0435
    // \u043C\u0438\u0433\u043D\u0443\u043B\u043E \u043D\u0435\u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u043C \u043D\u0430 \u0441\u0442\u0430\u0440\u0442\u0435.
    float2 wx = float2(u_adaptRadius, 0.0);
    float2 wy = float2(0.0, u_adaptRadius);
    float3 w0 = vgUnpack(content.eval(vgInContent(s + wx)));
    float3 w1 = vgUnpack(content.eval(vgInContent(s - wx)));
    float3 w2 = vgUnpack(content.eval(vgInContent(s + wy)));
    float3 w3 = vgUnpack(content.eval(vgInContent(s - wy)));
    wide = (w0 + w1 + w2 + w3) * 0.25;
    float lw = vgLuma(wide);
    busy = max(max(abs(vgLuma(w0) - lw), abs(vgLuma(w1) - lw)),
               max(abs(vgLuma(w2) - lw), abs(vgLuma(w3) - lw)));
  }
  // \u0421\u0432\u0435\u0442\u043B\u043E\u0442\u0430 \u0432 \u042D\u0422\u041E\u041C \u043C\u0435\u0441\u0442\u0435 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438, \u0430 \u043D\u0435 \u0441\u0440\u0435\u0434\u043D\u044F\u044F \u043F\u043E \u043D\u0435\u0439: \u043F\u043B\u043E\u0441\u043A\u043E\u0441\u0442\u044C \u0437\u043E\u043D\u0434\u0430, \u0437\u0430\u0436\u0430\u0442\u0430\u044F \u0432
  // \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u043D\u044B\u0439 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D, \u0447\u0442\u043E\u0431\u044B \u043D\u0430\u043A\u043B\u043E\u043D \u043D\u0435 \u0443\u0432\u043E\u0434\u0438\u043B \u043E\u0446\u0435\u043D\u043A\u0443 \u0437\u0430 \u043F\u0440\u0435\u0434\u0435\u043B\u044B \u0442\u043E\u0433\u043E, \u0447\u0442\u043E \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u0435\u0441\u0442\u044C.
  float2 nrm = p / max(u_halfSize, float2(1.0));
  float lumWide = u_probeLuma >= 0.0
    ? clamp(u_probeLuma + dot(u_probeSlope, nrm), u_probeRange.x, u_probeRange.y)
    : vgLuma(wide);

  // \u0410\u0414\u0410\u041F\u0422\u0418\u0412\u041D\u041E\u0415 \u0420\u0410\u0421\u0421\u0415\u042F\u041D\u0418\u0415. \u041C\u0443\u0442\u0438\u0442\u044C \u0444\u043E\u043D \u043D\u0443\u0436\u043D\u043E \u0440\u043E\u0432\u043D\u043E \u0442\u0430\u043C, \u0433\u0434\u0435 \u043E\u043D \u043F\u0451\u0441\u0442\u0440\u044B\u0439: \u043D\u0430 \u0440\u043E\u0432\u043D\u043E\u0439 \u0437\u0430\u043B\u0438\u0432\u043A\u0435
  // \u0440\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0434\u0430\u0451\u0442, \u0430 \u043D\u0430 \u0442\u0435\u043A\u0441\u0442\u0435 \u0438 \u043E\u0431\u043B\u043E\u0436\u043A\u0435 \u043E\u043D\u043E \u0438 \u0435\u0441\u0442\u044C \u0442\u043E, \u0447\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442 \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u043F\u043E\u0432\u0435\u0440\u0445
  // \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0439. \u0421\u043C\u0435\u0448\u0438\u0432\u0430\u0442\u044C \u0441 \u0447\u0435\u0442\u044B\u0440\u044C\u043C\u044F \u0448\u0438\u0440\u043E\u043A\u0438\u043C\u0438 \u043E\u0442\u0441\u0447\u0451\u0442\u0430\u043C\u0438 \u041D\u0415\u041B\u042C\u0417\u042F \u2014 \u044D\u0442\u043E \u0433\u0440\u0435\u0431\u0451\u043D\u043A\u0430, \u0430 \u043D\u0435 \u0440\u0430\u0437\u043C\u044B\u0442\u0438\u0435:
  // \u043D\u0430 \u0432\u044B\u0445\u043E\u0434\u0435 \u0447\u0435\u0442\u044B\u0440\u0435 \u0441\u043C\u0435\u0449\u0451\u043D\u043D\u044B\u0435 \u043A\u043E\u043F\u0438\u0438 (material-lab.md E-31). \u0428\u0438\u0440\u043E\u043A\u0438\u0435 \u043E\u0442\u0441\u0447\u0451\u0442\u044B \u0433\u043E\u0434\u044F\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E
  // \u043D\u0430 \u041E\u0426\u0415\u041D\u041A\u0423; \u0432\u0438\u0434\u0438\u043C\u043E\u0435 \u0440\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u0434\u0435\u043B\u0430\u0435\u0442 \u0447\u0435\u0441\u0442\u043D\u044B\u0439 \u0434\u0438\u0441\u043A\u043E\u0432\u044B\u0439 \u0441\u0431\u043E\u0440 \u043F\u043E \u0441\u043F\u0438\u0440\u0430\u043B\u0438.
  //
  // \u0420\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u0435 \u0436\u0438\u0432\u0451\u0442 \u0432 \u0422\u041E\u041B\u0429\u0415, \u0430 \u043D\u0435 \u0432 \u043A\u0440\u043E\u043C\u043A\u0435: \u0443 \u0444\u0430\u0441\u043A\u0438 \u0440\u0430\u0431\u043E\u0442\u0430 \u0434\u0440\u0443\u0433\u0430\u044F \u2014 \u0433\u043D\u0443\u0442\u044C \u043B\u0443\u0447 \u0438 \u0440\u0430\u0441\u0449\u0435\u043F\u043B\u044F\u0442\u044C
  // \u0435\u0433\u043E. \u0420\u0430\u0437\u043C\u044B\u0432\u0430\u044F \u0434\u0435\u0442\u0430\u043B\u044C \u0446\u0435\u043B\u0438\u043A\u043E\u043C, \u0430\u0434\u0430\u043F\u0442\u0430\u0446\u0438\u044F \u0441\u044A\u0435\u0434\u0430\u043B\u0430 \u0438 \u0434\u0438\u0441\u043F\u0435\u0440\u0441\u0438\u044E, \u0438 \u043F\u043E\u0434\u0445\u0432\u0430\u0442 \u0446\u0432\u0435\u0442\u0430.
  // \u0420\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u0435 \u0438\u0434\u0451\u0442 \u043E\u0442 \u0434\u0432\u0443\u0445 \u043F\u0440\u0438\u0447\u0438\u043D: \u043E\u0442 \u0440\u0430\u0437\u043C\u0430\u0445\u0430 \u0444\u043E\u043D\u0430 (\u043C\u0443\u0442\u0438\u0442\u044C \u0435\u0441\u0442\u044C \u0441\u043C\u044B\u0441\u043B \u0442\u0430\u043C, \u0433\u0434\u0435 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C
  // \u0420\u0410\u0417\u041D\u041E\u0415) \u0438 \u043E\u0442 \u0448\u0435\u0440\u043E\u0445\u043E\u0432\u0430\u0442\u043E\u0441\u0442\u0438 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438. \u041E\u0431\u0435 \u0436\u0438\u0432\u0443\u0442 \u0432 \u043E\u0434\u043D\u043E\u043C \u0434\u0438\u0441\u043A\u043E\u0432\u043E\u043C \u0441\u0431\u043E\u0440\u0435.
  //
  // \u041E\u043D\u043E \u041E\u0414\u041D\u041E \u0418 \u0422\u041E \u0416\u0415 \u043F\u043E \u0432\u0441\u0435\u0439 \u043B\u0438\u043D\u0437\u0435. \u0420\u0430\u043D\u044C\u0448\u0435 \u0437\u0434\u0435\u0441\u044C \u0441\u0442\u043E\u044F\u043B \u043C\u043D\u043E\u0436\u0438\u0442\u0435\u043B\u044C, \u0433\u0430\u0441\u0438\u0432\u0448\u0438\u0439 \u0440\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u0435 \u043A
  // \u0444\u0430\u0441\u043A\u0435, \u2014 \u0438 \u0434\u0435\u0442\u0430\u043B\u044C \u0447\u0438\u0442\u0430\u043B\u0430\u0441\u044C \u043A\u0430\u043A \u0448\u0430\u0440 \u0441 \u043C\u0443\u0442\u043D\u043E\u0439 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u043E\u0439 \u0438 \u0440\u0435\u0437\u043A\u0438\u043C \u043E\u0431\u043E\u0434\u043A\u043E\u043C: \u0434\u0432\u0430 \u0440\u0430\u0437\u043D\u044B\u0445
  // \u0441\u0442\u0435\u043A\u043B\u0430 \u0432 \u043E\u0434\u043D\u043E\u0439 \u0444\u043E\u0440\u043C\u0435. \u041B\u0438\u043D\u0437\u0430 \u043E\u0431\u044F\u0437\u0430\u043D\u0430 \u0431\u044B\u0442\u044C \u043E\u0434\u043D\u043E\u0440\u043E\u0434\u043D\u043E\u0439 \u0441\u0440\u0435\u0434\u043E\u0439; \u0437\u0430 \u0440\u0435\u0437\u043A\u043E\u0441\u0442\u044C \u043A\u0440\u043E\u043C\u043A\u0438 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442
  // \u0433\u0435\u043E\u043C\u0435\u0442\u0440\u0438\u044F, \u0430 \u043D\u0435 \u0440\u0430\u0437\u043D\u043E\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043C\u0443\u0442\u0438 \u0432 \u0440\u0430\u0437\u043D\u044B\u0445 \u0435\u0451 \u043C\u0435\u0441\u0442\u0430\u0445.
  //
  // \u0412\u0435\u043B\u0438\u0447\u0438\u043D\u0430 \u043D\u0430\u043C\u0435\u0440\u0435\u043D\u043D\u043E \u0421\u041B\u0410\u0411\u0410\u042F. \u0420\u0430\u0437\u043C\u044B\u0442\u0438\u0435 \u0437\u0434\u0435\u0441\u044C \u0432\u0441\u043F\u043E\u043C\u043E\u0433\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0435: \u043E\u043D\u043E \u0441\u043C\u044F\u0433\u0447\u0430\u0435\u0442 \u0444\u0430\u043A\u0442\u0443\u0440\u0443 \u043F\u043E\u0434
  // \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E, \u043D\u043E \u0440\u0430\u0437\u0432\u043E\u0434\u0438\u0442 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0443 \u043D\u0435 \u043E\u043D\u043E, \u0430 \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C \u0442\u0435\u043B\u0430. \u0414\u0430\u0439 \u0435\u043C\u0443 \u0432\u043E\u043B\u044E \u2014 \u0438 \u0431\u0443\u043A\u0432\u044B \u043F\u043E\u0434
  // \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u044E\u0442\u0441\u044F \u0432 \u043A\u0430\u0448\u0443 \u0438\u0437 \u043F\u0438\u043A\u0441\u0435\u043B\u0435\u0439, \u0447\u0435\u0433\u043E \u043D\u0438\u043A\u0430\u043A\u0430\u044F \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0441\u0442\u044C \u043D\u0435 \u0441\u0442\u043E\u0438\u0442.
  // \u041F\u043E\u0442\u043E\u043B\u043E\u043A \u0436\u0451\u0441\u0442\u043A\u0438\u0439 \u0438 \u043D\u0438\u0437\u043A\u0438\u0439. \u0424\u043E\u0440\u043C\u0443\u043B\u0430 \u0440\u0430\u0441\u0442\u0451\u0442 \u043A\u0430\u043A legibility \xD7 adaptRadius, \u0438 \u043D\u0430 \u043F\u0430\u043D\u0435\u043B\u0438 \u0441
  // legibility 0.95 \u0434\u0430\u0432\u0430\u043B\u0430 10.5 dp \u2014 \u0440\u043E\u0432\u043D\u043E \u0442\u0430 \u043A\u0430\u0448\u0430, \u043E \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u043F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0430\u0435\u0442 \u0430\u0431\u0437\u0430\u0446 \u0432\u044B\u0448\u0435:
  // \u043E\u0431\u043B\u043E\u0436\u043A\u0430 \u043F\u043E\u0434 \u0442\u0435\u043A\u0441\u0442\u043E\u043C \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u043B\u0430\u0441\u044C \u0432 \u043C\u0443\u0442\u043D\u043E\u0435 \u043F\u044F\u0442\u043D\u043E, \u0438 \u044D\u0442\u043E \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u043B\u0438 \u0437\u0430 \u043F\u043B\u043E\u0445\u043E\u0435 \u043F\u0440\u0435\u043B\u043E\u043C\u043B\u0435\u043D\u0438\u0435.
  // \u0427\u0438\u0442\u0430\u0435\u043C\u043E\u0441\u0442\u044C \u043E\u0431\u044F\u0437\u0430\u043D\u0430 \u043D\u0430\u0431\u0438\u0440\u0430\u0442\u044C\u0441\u044F \u041F\u041B\u041E\u0422\u041D\u041E\u0421\u0422\u042C\u042E \u0442\u0435\u043B\u0430 (busyFloor \u043D\u0438\u0436\u0435), \u0430 \u043D\u0435 \u0440\u0430\u0437\u043C\u044B\u0442\u0438\u0435\u043C.
  //
  // \u041E\u0422\u041A\u041B\u0418\u041A \u041D\u0410 \u0421\u0422\u0420\u0423\u041A\u0422\u0423\u0420\u0423 \u041D\u0410\u0421\u042B\u0429\u0410\u0415\u0422\u0421\u042F, \u0430 \u043D\u0435 \u0440\u0430\u0441\u0442\u0451\u0442 \u043B\u0438\u043D\u0435\u0439\u043D\u043E \u043F\u043E \u0441\u0440\u0435\u0434\u043D\u0435\u043C\u0443 \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u0438\u044E. \u0421\u043F\u043E\u0440\u0438\u0442
  // \u0441 \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E \u043D\u0435
  // \u043F\u043B\u043E\u0449\u0430\u0434\u044C \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u044B, \u0430 \u0441\u0430\u043C \u0444\u0430\u043A\u0442 \u0435\u0451 \u043D\u0430\u043B\u0438\u0447\u0438\u044F: \u0441\u0442\u0440\u043E\u043A\u0430 \u0442\u0435\u043A\u0441\u0442\u0430 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u0437\u0430\u043D\u0438\u043C\u0430\u0435\u0442 \u043F\u0440\u043E\u0446\u0435\u043D\u0442\u044B
  // \u043F\u043B\u043E\u0449\u0430\u0434\u0438, \u0438 \u0432 \u0441\u0440\u0435\u0434\u043D\u0435\u043C \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u0438\u0438 \u043E\u043D\u0430 \u0432\u0441\u0435\u0433\u0434\u0430 \u043C\u0430\u043B\u0430 \u2014 \u043B\u0438\u043D\u0435\u0439\u043D\u044B\u0439 \u043E\u0442\u043A\u043B\u0438\u043A \u043E\u0431\u0441\u043B\u0443\u0436\u0438\u0432\u0430\u043B \u0440\u043E\u0432\u043D\u043E \u0442\u043E\u0442
  // \u0441\u043B\u0443\u0447\u0430\u0439, \u0440\u0430\u0434\u0438 \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0441\u0442\u044C \u0438 \u0437\u0430\u0432\u0435\u0434\u0435\u043D\u0430, \u0445\u0443\u0436\u0435 \u0432\u0441\u0435\u0433\u043E. \u0417\u0430\u043C\u0435\u0440: \u043F\u043E\u0434 \u043F\u043B\u0430\u0448\u043A\u043E\u0439 \u0441 \u043F\u0440\u043E\u0435\u0437\u0436\u0430\u044E\u0449\u0438\u043C
  // \u0441\u043F\u0438\u0441\u043A\u043E\u043C busy = 0.12 \u0434\u0430\u0432\u0430\u043B 1.3 dp \u0440\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u044F, \u0438 \u0442\u0435\u043A\u0441\u0442 \u0447\u0438\u0442\u0430\u043B\u0441\u044F \u0441\u043A\u0432\u043E\u0437\u044C \u0441\u0442\u0435\u043A\u043B\u043E \u043D\u0430\u0440\u0430\u0432\u043D\u0435 \u0441 \u0435\u0451
  // \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439 \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E. \u041F\u043E\u0442\u043E\u043B\u043E\u043A \u043F\u0440\u0438 \u044D\u0442\u043E\u043C \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0438 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u043D\u0438\u0437\u043A\u0438\u043C \u2014 \u043E\u043D \u0438 \u0437\u0430\u0449\u0438\u0449\u0430\u0435\u0442
  // \u043E\u0431\u043B\u043E\u0436\u043A\u0443 \u043E\u0442 \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0435\u043D\u0438\u044F \u0432 \u043A\u0430\u0448\u0443.
  float structure = 1.0 - exp(-busy * VG_STRUCTURE_GAIN);
  // \u0420\u0410\u0414\u0418\u0423\u0421 \u041C\u0415\u0420\u042F\u0415\u0422\u0421\u042F \u0412 \u0424\u041E\u041D\u0415, \u0410 \u041D\u0415 \u041D\u0410 \u042D\u041A\u0420\u0410\u041D\u0415. \u0423 \u0444\u0430\u0441\u043A\u0438 \u043B\u0438\u043D\u0437\u0430 \u0441\u0436\u0438\u043C\u0430\u0435\u0442 \u0444\u043E\u043D: \u0448\u0438\u0440\u043E\u043A\u0430\u044F \u043F\u043E\u043B\u043E\u0441\u0430
  // \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0433\u043E \u0443\u043A\u043B\u0430\u0434\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0432 \u0443\u0437\u043A\u0443\u044E \u043F\u043E\u043B\u043E\u0441\u043A\u0443 \u044D\u043A\u0440\u0430\u043D\u0430, \u0438 footprint \u2014 \u044D\u0442\u043E \u0440\u043E\u0432\u043D\u043E \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u044C
  // \u0441\u0436\u0430\u0442\u0438\u044F, \u043E\u043D\u0430 \u0443\u0436\u0435 \u043F\u043E\u0441\u0447\u0438\u0442\u0430\u043D\u0430 \u0432\u044B\u0448\u0435 \u0434\u043B\u044F \u043F\u043B\u043E\u0449\u0430\u0434\u043D\u043E\u0433\u043E \u0438\u043D\u0442\u0435\u0433\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F. \u0420\u0430\u0434\u0438\u0443\u0441, \u0437\u0430\u0434\u0430\u043D\u043D\u044B\u0439 \u0432
  // \u044D\u043A\u0440\u0430\u043D\u043D\u044B\u0445 \u043F\u0438\u043A\u0441\u0435\u043B\u044F\u0445, \u0443 \u0444\u0430\u0441\u043A\u0438 \u043F\u043E\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u0432 (1 + footprint) \u0440\u0430\u0437 \u043C\u0435\u043D\u044C\u0448\u0435 \u0444\u043E\u043D\u0430, \u0447\u0435\u043C \u0432 \u043F\u043B\u043E\u0441\u043A\u043E\u0439
  // \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0435, \u2014 \u0438 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430, \u043A\u043E\u0442\u043E\u0440\u0443\u044E \u0432 \u0442\u0435\u043B\u0435 \u0440\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u0435 \u0443\u0431\u0438\u0440\u0430\u043B\u043E, \u0443 \u043A\u0440\u043E\u043C\u043A\u0438 \u0432\u044B\u0436\u0438\u0432\u0430\u043B\u0430 \u0438 \u0432\u0434\u043E\u0431\u0430\u0432\u043E\u043A
  // \u0443\u0441\u0438\u043B\u0438\u0432\u0430\u043B\u0430\u0441\u044C \u0441\u0436\u0430\u0442\u0438\u0435\u043C. \u0417\u0430\u043C\u0435\u0440: \u0441\u0442\u0440\u043E\u043A\u0430 \u0441\u043F\u0438\u0441\u043A\u0430 \u043F\u043E\u0434 \u043F\u043B\u0430\u0448\u043A\u043E\u0439 \u0434\u0430\u0432\u0430\u043B\u0430 199 \u043F\u0440\u043E\u0442\u0438\u0432 158 \u0443 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439
  // \u043D\u0430\u0434\u043F\u0438\u0441\u0438 \u0434\u0435\u0442\u0430\u043B\u0438, \u0438 \u0432\u0441\u044F \u043F\u043E\u043B\u043E\u0441\u0430 \u0441\u0438\u0434\u0435\u043B\u0430 \u0432 \u0444\u0430\u0441\u043A\u0435, \u0430 \u0432 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0435 \u0435\u0451 \u043D\u0435 \u0431\u044B\u043B\u043E.
  // \u0420\u0430\u0441\u0441\u0435\u044F\u043D\u0438\u0435 \u0432\u0435\u0440\u043D\u0443\u043B\u043E\u0441\u044C \u043A \u0421\u0412\u041E\u0415\u0419, \u043C\u044F\u0433\u043A\u043E\u0439 \u0440\u043E\u043B\u0438 \u0438 \u0441\u043D\u043E\u0432\u0430 \u0440\u0430\u0441\u0442\u0451\u0442 \u043B\u0438\u043D\u0435\u0439\u043D\u043E \u043F\u043E \u043F\u0435\u0441\u0442\u0440\u043E\u0442\u0435. \u0427\u0438\u0442\u0430\u0435\u043C\u043E\u0441\u0442\u044C
  // \u043D\u0430\u0431\u0438\u0440\u0430\u0435\u0442 \u043F\u043E\u0434\u043B\u043E\u0436\u043A\u0430 \u043F\u043E\u0434 \u043A\u0440\u0430\u0441\u043A\u043E\u0439 (vgVeil \u0432 surface-shader.ts), \u0430 \u043E\u043D\u0430 \u0434\u0430\u0451\u0442 \u0442\u0443 \u0436\u0435 \u0440\u0430\u0431\u043E\u0442\u0443 \u0411\u0415\u0417
  // \u0448\u0443\u043C\u0430: \u0434\u0438\u0441\u043A\u043E\u0432\u044B\u0439 \u0441\u0431\u043E\u0440 \u043E\u0446\u0435\u043D\u0438\u0432\u0430\u0435\u0442 \u0444\u043E\u043D \u0442\u043E\u0447\u0435\u0447\u043D\u044B\u043C\u0438 \u043F\u0440\u043E\u0431\u0430\u043C\u0438, \u0438 \u043D\u0430 \u0440\u0435\u0437\u043A\u043E\u043C \u0442\u0435\u043A\u0441\u0442\u0435 \u0434\u0430\u0436\u0435 \u043F\u0440\u0438 \u043F\u043E\u043B\u0443\u0441\u043E\u0442\u043D\u0435
  // \u043F\u0440\u043E\u0431 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \xB110 \u0438\u0437 255 \u2014 \u0434\u0435\u0442\u0430\u043B\u044C \u043F\u043E\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043A\u0440\u0443\u043F\u043E\u0439. \u0420\u0430\u0434\u0438\u0443\u0441, \u043D\u0430 \u043A\u043E\u0442\u043E\u0440\u043E\u043C \u043A\u0440\u0443\u043F\u044B \u043D\u0435 \u0432\u0438\u0434\u043D\u043E,
  // \u0442\u0435\u043A\u0441\u0442 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u043D\u0435 \u0440\u0430\u0437\u0440\u0443\u0448\u0430\u0435\u0442, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0433\u043D\u0430\u0442\u044C\u0441\u044F \u0437\u0430 \u043D\u0438\u043C \u043D\u0435\u0447\u0435\u043C.
  float adaptBlur = max(
    min(busy * u_legibility * u_adaptRadius * 0.5, VG_ADAPT_BLUR_MAX)
      * min(1.0 + footprint, VG_FOOTPRINT_MAX),
    u_frost);
  if (adaptBlur > 0.5) {
    float reach = max(u_reach - length(p), 1.0);
    float4 g = vgGather(s, min(adaptBlur, reach), xy);
    float ga = g.a;
    float3 blurred = ga > 0.004 ? g.rgb / ga : float3(0.0);
    rgb = mix(rgb, blurred, smoothstep(0.5, 2.0, adaptBlur));
  }
  // \u0421\u0432\u0435\u0442\u043B\u043E\u0442\u0430 \u043C\u0435\u0441\u0442\u0430 \u2014 \u044D\u0442\u043E \u043E\u0446\u0435\u043D\u043A\u0430 \u0437\u043E\u043D\u0434\u0430, \u0430 \u043D\u0435 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0430 \u042D\u0422\u041E\u0413\u041E \u043F\u0438\u043A\u0441\u0435\u043B\u044F. \u041F\u043E\u0434\u043C\u0435\u0448\u0438\u0432\u0430\u0442\u044C \u0441\u044E\u0434\u0430
  // \u043F\u0438\u043A\u0441\u0435\u043B\u044C \u043D\u0435\u043B\u044C\u0437\u044F \u043F\u043E \u0442\u043E\u0439 \u0436\u0435 \u043F\u0440\u0438\u0447\u0438\u043D\u0435, \u043F\u043E \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u043E\u0446\u0435\u043D\u043A\u0430 \u0443\u0435\u0445\u0430\u043B\u0430 \u0432 \u0437\u043E\u043D\u0434: \u0438\u0437\u043B\u043E\u043C \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u0438
  // \u043F\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u043B\u044E\u0431\u0443\u044E \u0432\u044B\u0441\u043E\u043A\u0443\u044E \u0447\u0430\u0441\u0442\u043E\u0442\u0443 \u0432 \u0432\u0438\u0434\u0438\u043C\u0443\u044E \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0443.
  float local = lumWide;

  // \u0422\u0415\u041B\u041E \u0421\u0422\u0415\u041A\u041B\u0410. \u0421\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0417\u0414\u0415\u0421\u042C, \u0430 \u043D\u0435 \u0432 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438, \u043F\u043E \u0442\u043E\u0439 \u0436\u0435 \u043F\u0440\u0438\u0447\u0438\u043D\u0435, \u0447\u0442\u043E \u0438 \u043E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u0435:
  // \u0444\u043E\u043D \u0432\u0438\u0434\u0435\u043D \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0442\u0441\u044E\u0434\u0430. \u041F\u043E\u043A\u0430 \u0442\u0438\u043D\u0442 \u0440\u0438\u0441\u043E\u0432\u0430\u043B\u0441\u044F \u043F\u043E\u0432\u0435\u0440\u0445, \u043E\u043D \u0431\u044B\u043B \u043E\u0431\u044F\u0437\u0430\u043D \u0431\u044B\u0442\u044C \u043E\u0434\u0438\u043D\u0430\u043A\u043E\u0432\u044B\u043C \u043D\u0430
  // \u0432\u0441\u0435\u0439 \u0434\u0435\u0442\u0430\u043B\u0438 \u2014 \u0442\u043E\u0447\u0435\u0447\u043D\u043E\u0439 \u0430\u0434\u0430\u043F\u0442\u0430\u0446\u0438\u0438 \u043D\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u043E\u0432\u0430\u043B\u043E \u0432 \u043F\u0440\u0438\u043D\u0446\u0438\u043F\u0435.
  //
  // \u0426\u0435\u043B\u044C \u2014 \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043F\u043E \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0435 \u0441 \u0442\u0435\u043C, \u0447\u0442\u043E \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0440\u0438\u0441\u0443\u0435\u0442 \u041F\u041E\u0412\u0415\u0420\u0425 \u0441\u0442\u0435\u043A\u043B\u0430.
  // \u0423\u043D\u0438\u0444\u043E\u0440\u043C\u0430 u_ink \u0437\u0434\u0435\u0441\u044C \u041F\u041E\u041B\u042F\u0420\u041D\u041E\u0421\u0422\u042C \u043D\u0430\u0434\u043F\u0438\u0441\u0438 (1 \u0441\u0432\u0435\u0442\u043B\u0430\u044F, 0 \u0442\u0451\u043C\u043D\u0430\u044F), \u0430 \u043D\u0435 \u0435\u0451 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0430: \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F
  // \u0441\u0447\u0438\u0442\u0430\u044E\u0442\u0441\u044F \u043D\u0430 \u043A\u043E\u043D\u0446\u0430\u0445 \u0438 \u0441\u043C\u0435\u0448\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u043F\u043E \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u0438. \u0415\u0441\u043B\u0438 \u043F\u043E\u0434\u0441\u0442\u0430\u0432\u043B\u044F\u0442\u044C \u0442\u0435\u043A\u0443\u0449\u0443\u044E \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0443, \u0442\u043E
  // \u043D\u0430 \u043F\u0435\u0440\u0435\u043A\u0440\u0430\u0441\u043A\u0435 \u043D\u0430\u0434\u043F\u0438\u0441\u0438 ink \u043F\u0440\u043E\u0445\u043E\u0434\u0438\u0442 \u0447\u0435\u0440\u0435\u0437 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0443 \u2014 \u0430 \u0441\u0435\u0440\u0430\u044F \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u043E\u0442 \u0442\u0435\u043B\u0430
  // \u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C\u0430, \u0438 \u0441\u0442\u0435\u043A\u043B\u043E \u043D\u0430 \u043F\u043E\u043B\u043F\u0443\u0442\u0438 \u043D\u044B\u0440\u044F\u0435\u0442 \u0442\u0435\u043C\u043D\u0435\u0435, \u0447\u0435\u043C \u0432 \u043E\u0431\u043E\u0438\u0445 \u043A\u043E\u043D\u0435\u0447\u043D\u044B\u0445 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F\u0445.
  float strict = clamp(u_legibility * 2.0, 0.0, 1.0);
  float capLight = mix(VG_BODY_CAP_LOOSE, VG_BODY_CAP_TIGHT, strict);
  float floorDark = 1.0 - capLight;
  float pol = clamp(u_ink, 0.0, 1.0);

  // \u0420\u0410\u0417\u041D\u041E\u0420\u041E\u0414\u041D\u042B\u0419 \u0424\u041E\u041D. \u041A\u043E\u0433\u0434\u0430 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C \u0438 \u0447\u0451\u0440\u043D\u043E\u0435, \u0438 \u0431\u0435\u043B\u043E\u0435 \u0441\u0440\u0430\u0437\u0443, \u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u044F \u043F\u043E \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0435 \u043D\u0435
  // \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u043D\u0438 \u043F\u0440\u0438 \u043A\u0430\u043A\u043E\u0439 \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u0438: \u043D\u0430\u0434 \u043E\u0434\u043D\u043E\u0439 \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u043E\u0439 \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u0442\u043E\u043D\u0435\u0442 \u0432 \u043B\u044E\u0431\u043E\u043C \u0441\u043B\u0443\u0447\u0430\u0435. \u0422\u043E\u0433\u0434\u0430
  // \u0441\u0442\u0435\u043A\u043B\u043E \u0434\u043E\u0433\u043E\u043D\u044F\u0435\u0442 \u041F\u041B\u041E\u0422\u041D\u041E\u0421\u0422\u042C\u042E \u2014 \u0440\u043E\u0432\u043D\u043E \u0442\u043E, \u0447\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442 \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0435\u0435 \u0441\u0442\u0435\u043A\u043B\u043E \u0448\u0435\u0440\u043E\u0445\u043E\u0432\u0430\u0442\u043E\u0441\u0442\u044C\u044E:
  // \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u0451\u0442 \u0431\u044B\u0442\u044C \u043E\u043A\u043D\u043E\u043C. \u0412\u0435\u043B\u0438\u0447\u0438\u043D\u0443 \u0437\u0430\u0434\u0430\u0451\u0442 legibility, \u043F\u043E\u0432\u043E\u0434 \u2014 \u043F\u0435\u0441\u0442\u0440\u043E\u0442\u0430; \u043E\u0442\u043A\u043B\u0438\u043A \u043D\u0430\u0441\u044B\u0449\u0430\u0435\u0442\u0441\u044F
  // \u0440\u0430\u043D\u043E, \u043F\u043E\u0442\u043E\u043C\u0443 \u0447\u0442\u043E \u0441\u043F\u043E\u0440\u0438\u0442 \u0441 \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E \u043D\u0435 \u043F\u043B\u043E\u0449\u0430\u0434\u044C \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u044B, \u0430 \u0441\u0430\u043C \u0444\u0430\u043A\u0442 \u0435\u0451 \u043D\u0430\u043B\u0438\u0447\u0438\u044F.
  // \u041F\u043E\u043B \u0437\u0430\u0434\u0430\u0451\u0442 \u0421\u0410\u041C\u0410 legibility, \u0430 \u043F\u0435\u0441\u0442\u0440\u043E\u0442\u0430 \u043C\u043E\u0436\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0441\u0432\u0435\u0440\u0445\u0443. \u0421\u0442\u0430\u0432\u0438\u0442\u044C \u0435\u0433\u043E \u0432
  // \u0437\u0430\u0432\u0438\u0441\u0438\u043C\u043E\u0441\u0442\u044C \u043E\u0442 \u043F\u0435\u0441\u0442\u0440\u043E\u0442\u044B \u043D\u0435\u043B\u044C\u0437\u044F \u043F\u043E \u0434\u0432\u0443\u043C \u043F\u0440\u0438\u0447\u0438\u043D\u0430\u043C \u0441\u0440\u0430\u0437\u0443: \u0437\u043E\u043D\u0434 \u0443\u0441\u0440\u0435\u0434\u043D\u044F\u0435\u0442, \u0438 \u0441\u0442\u0440\u043E\u043A\u0443 \u0442\u0435\u043A\u0441\u0442\u0430 \u043F\u043E\u0434
  // \u0448\u0438\u0440\u043E\u043A\u043E\u0439 \u0434\u0435\u0442\u0430\u043B\u044C\u044E \u043E\u043D \u0432 \u043F\u0435\u0441\u0442\u0440\u043E\u0442\u0435 \u043F\u043E\u0447\u0442\u0438 \u043D\u0435 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 (\u0437\u0430\u043C\u0435\u0440: busy 0.12 \u0442\u0430\u043C, \u0433\u0434\u0435 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C
  // \u0435\u0434\u0443\u0442 \u0434\u0432\u0435 \u0441\u0442\u0440\u043E\u043A\u0438) \u2014 \u0430 \u043D\u0430 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0438 \u043F\u043E\u043B \u0445\u043E\u0434\u0438\u043B \u0431\u044B \u0432\u0432\u0435\u0440\u0445-\u0432\u043D\u0438\u0437 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u043E\u0446\u0435\u043D\u043A\u043E\u0439, \u0438 \u0442\u0435\u043B\u043E \u0433\u0443\u043B\u044F\u043B\u043E
  // \u0431\u044B \u043F\u043E \u044F\u0440\u043A\u043E\u0441\u0442\u0438. \u0420\u0430\u0437\u043B\u0438\u0447\u0438\u043C\u043E\u0441\u0442\u044C \u0434\u0435\u0442\u0430\u043B\u0438 \u043F\u0440\u0438 \u044D\u0442\u043E\u043C \u043D\u0435 \u0441\u0442\u0440\u0430\u0434\u0430\u0435\u0442: \u0435\u0451 \u043D\u0435\u0441\u0451\u0442 \u043A\u0440\u043E\u043C\u043A\u0430 \u043D\u0438\u0436\u0435, \u0430 \u043D\u0435 \u0442\u0435\u043B\u043E.
  float busyFloor = max(u_legibility * VG_GROUND_MIN,
                        structure * mix(0.06, VG_GROUND_MAX, u_legibility));

  // \u0422\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u0435 \u0413\u0410\u0421\u041D\u0415\u0422 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 legibility: \u0434\u0435\u0442\u0430\u043B\u044C, \u043F\u043E\u0432\u0435\u0440\u0445 \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0440\u0438\u0441\u0443\u044E\u0442, \u0440\u0430\u0437\u0432\u043E\u0434\u0438\u0442\u044C
  // \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0443 \u043D\u0435 \u0441 \u0447\u0435\u043C, \u0438 \u043C\u043E\u0434\u0435\u043B\u044C \u043E\u0431\u0435\u0449\u0430\u0435\u0442 \u0435\u0439 \u043F\u0440\u043E\u0441\u0442\u043E \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u043E\u0435 \u0441\u0442\u0435\u043A\u043B\u043E (material.ts).
  float demand = clamp(u_legibility * 4.0, 0.0, 1.0);

  // \u0422\u0418\u041D\u0422 \u0421\u0420\u0415\u0414\u042B \u0417\u0410\u0414\u0410\u0401\u0422 \u041F\u041E\u041B\u042F\u0420\u041D\u041E\u0421\u0422\u042C \u041D\u0410\u0414\u041F\u0418\u0421\u0418: \u0441\u0432\u0435\u0442\u043B\u043E\u0439 \u043D\u0443\u0436\u043D\u0430 \u0442\u0451\u043C\u043D\u0430\u044F \u0441\u0440\u0435\u0434\u0430, \u0442\u0451\u043C\u043D\u043E\u0439 \u2014 \u0441\u0432\u0435\u0442\u043B\u0430\u044F. \u042D\u0442\u043E
  // \u043D\u0435 \u043E\u0444\u043E\u0440\u043C\u043B\u0435\u043D\u0438\u0435, \u0430 \u0443\u0441\u043B\u043E\u0432\u0438\u0435 \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0441\u0442\u0438: \u043A \u0442\u0438\u043D\u0442\u0443 \u043F\u0440\u0438\u0442\u044F\u0433\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0412\u0421\u0401, \u0447\u0442\u043E \u0432\u0438\u0434\u043D\u043E \u0441\u043A\u0432\u043E\u0437\u044C \u0441\u0442\u0435\u043A\u043B\u043E,
  // \u0438 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u0444\u043E\u043D\u043E\u043C \u043F\u0440\u0438\u0442\u044F\u0433\u0438\u0432\u0430\u0435\u0442\u0441\u044F \u0447\u0443\u0436\u043E\u0439 \u0442\u0435\u043A\u0441\u0442 \u043F\u043E\u0434 \u043D\u0438\u043C. \u0421\u0442\u043E\u0438\u043B\u043E \u0443\u0432\u0435\u0441\u0442\u0438 \u0442\u0438\u043D\u0442 \u043E\u0442 \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u0438 \u2014
  // \u0438 \u0447\u0443\u0436\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430 \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u043B\u0430\u0441\u044C \u044F\u0440\u0447\u0435 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439 \u043D\u0430\u0434\u043F\u0438\u0441\u0438 \u0434\u0435\u0442\u0430\u043B\u0438.
  //
  // \u041D\u043E \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u044C \u0440\u0435\u0448\u0430\u0435\u0442 \u0440\u043E\u0432\u043D\u043E \u0432 \u0442\u043E\u0439 \u043C\u0435\u0440\u0435, \u0432 \u043A\u0430\u043A\u043E\u0439 \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u0432\u043E\u043E\u0431\u0449\u0435 \u0435\u0441\u0442\u044C. \u0422\u0430\u043C, \u0433\u0434\u0435 \u043F\u043E\u0432\u0435\u0440\u0445 \u0441\u0442\u0435\u043A\u043B\u0430
  // \u043D\u0435 \u0440\u0438\u0441\u0443\u044E\u0442 \u043D\u0438\u0447\u0435\u0433\u043E, \u043E\u0431\u0441\u043B\u0443\u0436\u0438\u0432\u0430\u0442\u044C \u0435\u0439 \u043D\u0435\u0447\u0435\u0433\u043E, \u0438 \u0441\u0440\u0435\u0434\u0430 \u043A\u0440\u0430\u0441\u0438\u0442\u0441\u044F \u0442\u0430\u043A, \u0447\u0442\u043E\u0431\u044B \u0434\u0435\u0442\u0430\u043B\u044C \u041E\u0422\u041E\u0428\u041B\u0410 \u041E\u0422
  // \u0424\u041E\u041D\u0410 \u2014 \u044D\u0442\u043E \u0435\u0434\u0438\u043D\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0435, \u0447\u0442\u043E \u043E\u0442 \u043D\u0435\u0451 \u0442\u0430\u043C \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F. \u041F\u043E\u043A\u0430 \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u044C \u0440\u0435\u0448\u0430\u043B\u0430 \u0438 \u0432 \u044D\u0442\u043E\u043C \u0441\u043B\u0443\u0447\u0430\u0435,
  // \u043F\u0443\u0441\u0442\u044B\u0435 \u043A\u043D\u043E\u043F\u043A\u0438 \u0442\u0435\u0440\u044F\u043B\u0438 \u0442\u0435\u043B\u043E: \u0442\u0438\u043D\u0442 \u043F\u043E \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u0438 \u0441\u043C\u043E\u0442\u0440\u0435\u043B \u0442\u0443\u0434\u0430 \u0436\u0435, \u043A\u0443\u0434\u0430 \u0438 \u0444\u043E\u043D.
  float dirEarly = local < 0.5 ? 1.0 : -1.0;
  float away = local < 0.5 ? VG_TINT_LIGHT : VG_TINT_DARK;
  float tintLuma = mix(away, mix(VG_TINT_LIGHT, VG_TINT_DARK, pol), demand);

  // \u0421\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0440\u0435\u0434\u044B \u043D\u0443\u0436\u043D\u043E, \u0447\u0442\u043E\u0431\u044B \u0443\u0432\u0435\u0441\u0442\u0438 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0443 \u043F\u043E\u0434 \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E \u0437\u0430 \u043F\u043E\u0440\u043E\u0433. \u0421\u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u043F\u043E \u041C\u0415\u0421\u0422\u0423:
  // \u0442\u043E\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u0433\u0440\u0430\u0434\u0438\u0435\u043D\u0442\u043D\u043E\u0435, \u0438 \u043D\u0430\u0434 \u0441\u0432\u0435\u0442\u043B\u043E\u0439 \u043F\u043E\u043B\u043E\u0432\u0438\u043D\u043E\u0439 \u043E\u043D\u043E \u043C\u043E\u0436\u0435\u0442 \u0431\u044B\u0442\u044C \u043F\u043B\u043E\u0442\u043D\u0435\u0435, \u0447\u0435\u043C \u043D\u0430\u0434 \u0442\u0451\u043C\u043D\u043E\u0439.
  float needForLight = local > capLight
    ? clamp((local - capLight) / max(local - VG_TINT_DARK, 1e-4), 0.0, 0.92)
    : 0.0;
  float needForDark = local < floorDark
    ? clamp((floorDark - local) / max(VG_TINT_LIGHT - local, 1e-4), 0.0, 0.92)
    : 0.0;
  float needForInk = mix(needForDark, needForLight, pol) * demand;

  // \u0420\u0410\u0417\u041B\u0418\u0427\u0418\u041C\u041E\u0421\u0422\u042C \u0421\u0410\u041C\u041E\u0419 \u0414\u0415\u0422\u0410\u041B\u0418. \u041D\u0430\u0434 \u043E\u0434\u043D\u043E\u0440\u043E\u0434\u043D\u044B\u043C \u0444\u043E\u043D\u043E\u043C \u043F\u0440\u0435\u043B\u043E\u043C\u043B\u044F\u0442\u044C \u043D\u0435\u0447\u0435\u0433\u043E, \u0438 \u0441\u0442\u0435\u043A\u043B\u043E \u0447\u0435\u0441\u0442\u043D\u043E
  // \u0438\u0441\u0447\u0435\u0437\u0430\u0435\u0442 \u2014 \u0434\u043B\u044F \u043A\u0443\u0441\u043A\u0430 \u0444\u043E\u043D\u0430 \u044D\u0442\u043E \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E, \u0434\u043B\u044F \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430 \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u043D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u043E. \u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441
  // \u0438\u0434\u0451\u0442 \u044D\u0442\u0438\u043C \u0436\u0435 \u043A\u0430\u043D\u0430\u043B\u043E\u043C: \u0441\u044B\u0433\u0440\u0430\u043D\u043D\u0430\u044F \u0447\u0430\u0441\u0442\u044C \u2014 \u0443\u0447\u0430\u0441\u0442\u043E\u043A, \u043E\u0442 \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u0442\u0440\u0435\u0431\u0443\u044E\u0442 \u0411\u041E\u041B\u042C\u0428\u0415\u0413\u041E \u043E\u0442\u0445\u043E\u0434\u0430.
  float sep = u_presence + VG_PROGRESS_PRESENCE * vgProgress(p, u_halfSize, u_progress);

  // \u041E\u0442\u043E\u0439\u0442\u0438 \u043E\u0442 \u0444\u043E\u043D\u0430 \u0422\u0415\u041B\u041E\u041C \u043C\u043E\u0436\u043D\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u0435\u0441\u043B\u0438 \u0442\u0438\u043D\u0442 \u0441\u043C\u043E\u0442\u0440\u0438\u0442 \u0412 \u0421\u0422\u041E\u0420\u041E\u041D\u0423 \u041E\u0422 \u0444\u043E\u043D\u0430. \u041D\u0430\u0434 \u0441\u0432\u0435\u0442\u043B\u044B\u043C \u0444\u043E\u043D\u043E\u043C \u0443
  // \u0441\u0432\u0435\u0442\u043B\u043E\u0439 \u043D\u0430\u0434\u043F\u0438\u0441\u0438 \u0442\u0430\u043A \u0438 \u0435\u0441\u0442\u044C \u2014 \u0442\u0451\u043C\u043D\u0430\u044F \u0441\u0440\u0435\u0434\u0430 \u0443\u0432\u043E\u0434\u0438\u0442 \u0442\u0435\u043B\u043E \u0432\u043D\u0438\u0437, \u0438 \u044D\u0442\u043E \u0436\u0435 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0435 \u0438 \u0440\u0430\u0437\u0434\u0435\u043B\u044F\u0435\u0442.
  // \u041D\u0430\u0434 \u0422\u0401\u041C\u041D\u042B\u041C \u0444\u043E\u043D\u043E\u043C \u0442\u0438\u043D\u0442 \u0442\u043E\u0436\u0435 \u0442\u0451\u043C\u043D\u044B\u0439, \u0438\u0434\u0442\u0438 \u0442\u0435\u043B\u0443 \u043D\u0435\u043A\u0443\u0434\u0430: \u0442\u0435\u043C\u043D\u0435\u0435 \u043F\u043E\u0447\u0442\u0438 \u0447\u0451\u0440\u043D\u043E\u0433\u043E \u043D\u0435 \u0431\u044B\u0432\u0430\u0435\u0442.
  float toward = (tintLuma - local) * dirEarly;

  // \u041F\u041B\u041E\u0422\u041D\u041E\u0421\u0422\u042C \u0421\u0427\u0418\u0422\u0410\u0415\u0422\u0421\u042F \u041F\u041E \u041A\u0420\u0410\u0419\u041D\u0415\u0419 \u0421\u0412\u0415\u0422\u041B\u041E\u0422\u0415, \u0410 \u041D\u0415 \u041F\u041E \u0422\u0418\u041D\u0422\u0423. \u0414\u0435\u043B\u0438\u0442\u044C \u0442\u0440\u0435\u0431\u0443\u0435\u043C\u044B\u0439 \u043E\u0442\u0445\u043E\u0434 \u043D\u0430
  // \u0440\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u043E\u0442 \u0442\u0438\u043D\u0442\u0430 \u0434\u043E \u0444\u043E\u043D\u0430 \u043D\u0435\u043B\u044C\u0437\u044F: \u043E\u043D\u0438 \u043C\u043E\u0433\u0443\u0442 \u0441\u043E\u0432\u043F\u0430\u0441\u0442\u044C. \u0421\u0432\u0435\u0442\u043B\u0430\u044F \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u0434\u0430\u0451\u0442 \u0442\u0438\u043D\u0442 0.11,
  // \u0442\u0451\u043C\u043D\u044B\u0439 \u0444\u043E\u043D \u2014 \u0442\u043E\u0436\u0435 0.11, \u0438 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u0435 \u0432 0.05 \u043F\u0440\u043E\u0441\u0438\u0442 \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C 14 \u2014 \u0442\u043E \u0435\u0441\u0442\u044C \u0443\u043F\u0438\u0440\u0430\u0435\u0442\u0441\u044F \u0432
  // \u043A\u043B\u0430\u043C\u043F\u0443, \u0438 \u0441\u0442\u0435\u043A\u043B\u043E \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u043D\u0435\u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u043E\u0439 \u043F\u043B\u0430\u0448\u043A\u043E\u0439. \u0420\u0430\u0441\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u0434\u043E \u041A\u0420\u0410\u042F \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0430 \u043C\u0430\u043B\u043E \u043D\u0435
  // \u0431\u044B\u0432\u0430\u0435\u0442, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0432\u0435\u043B\u0438\u0447\u0438\u043D\u0430 \u0437\u0434\u0435\u0441\u044C \u0432\u0441\u0435\u0433\u0434\u0430 \u043E\u0441\u043C\u044B\u0441\u043B\u0435\u043D\u043D\u0430\u044F, \u0430 \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0442\u0435\u043B\u043E \u0432 \u0438\u0442\u043E\u0433\u0435 \u043D\u0435 \u0434\u043E\u0431\u0440\u0430\u043B\u043E \u2014
  // \u0441\u0447\u0438\u0442\u0430\u0435\u0442 unmet \u043D\u0438\u0436\u0435 \u0438 \u043E\u0442\u0434\u0430\u0451\u0442 \u043A\u0440\u043E\u043C\u043A\u0435.
  float densityForSep = clamp(sep / max(abs(away - local), 1e-4), 0.0, 0.92);
  float density = max(max(u_bodyDensity, busyFloor), max(needForInk, densityForSep));

  // \u0426\u0412\u0415\u0422 \u0422\u0415\u041B\u0410. \u041E\u0442\u0442\u0435\u043D\u043E\u043A \u0441\u0440\u0435\u0434\u044B \u0437\u0430\u0434\u0430\u043D \u0435\u0451 \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C\u044E, \u043D\u043E \u0442\u0435\u043B\u043E \u0435\u0449\u0451 \u0438 \u041A\u0420\u0410\u0421\u0418\u0422\u0421\u042F \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u044B\u043C: \u0441\u0432\u0435\u0442
  // \u0433\u0443\u043B\u044F\u0435\u0442 \u0432\u043D\u0443\u0442\u0440\u0438 \u0441\u0442\u0435\u043A\u043B\u0430 \u043C\u043D\u043E\u0433\u043E\u043A\u0440\u0430\u0442\u043D\u043E \u0438 \u0443\u043D\u043E\u0441\u0438\u0442 \u0441 \u0441\u043E\u0431\u043E\u0439 \u0446\u0432\u0435\u0442 \u0442\u043E\u0433\u043E, \u0447\u0442\u043E \u043F\u043E\u0434 \u043D\u0438\u043C \u0438 \u0432\u043E\u043A\u0440\u0443\u0433 \u043D\u0435\u0433\u043E.
  // \u041F\u043E\u044D\u0442\u043E\u043C\u0443 \u0440\u044F\u0434\u043E\u043C \u0441 \u0436\u0451\u043B\u0442\u043E\u0439 \u043E\u0431\u043B\u043E\u0436\u043A\u043E\u0439 \u0442\u0435\u043F\u043B\u0435\u0435\u0442 \u0432\u0441\u0451 \u0442\u0435\u043B\u043E, \u0430 \u043D\u0435 \u043E\u0434\u043D\u0430 \u043A\u0440\u043E\u043C\u043A\u0430. \u0421\u0432\u0435\u0442\u043B\u043E\u0442\u0430 \u043F\u0440\u0438 \u044D\u0442\u043E\u043C
  // \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0441\u0432\u043E\u044F \u2014 \u043E\u043D\u0430 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0435\u0442 \u0440\u0430\u0431\u043E\u0442\u0443 \u043F\u043E \u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u044E \u0441 \u043D\u0430\u0434\u043F\u0438\u0441\u044C\u044E.
  float3 tintHue = mix(vgHue(u_bodyTint), vgHue(wide * 0.5 + ambient * 0.5), u_colorPickup);

  float3 tint = tintHue * tintLuma;
  rgb = mix(rgb, tint, density);

  // \u0421\u0412\u0415\u0422 \u041E\u041A\u0420\u0423\u0416\u0415\u041D\u0418\u042F. \u0421\u0442\u0435\u043A\u043B\u043E \u043D\u0430 \u0447\u0451\u0440\u043D\u043E\u043C \u043D\u0435 \u0431\u044B\u0432\u0430\u0435\u0442 \u0434\u044B\u0440\u043E\u0439: \u0434\u043E \u043D\u0435\u0433\u043E \u0434\u043E\u0445\u043E\u0434\u0438\u0442 \u0441\u0432\u0435\u0442 \u043E\u0442 \u0442\u043E\u0433\u043E, \u0447\u0442\u043E
  // \u043B\u0435\u0436\u0438\u0442 \u0440\u044F\u0434\u043E\u043C. \u0411\u0435\u0440\u0451\u043C \u0446\u0432\u0435\u0442 \u043E\u043A\u0440\u0435\u0441\u0442\u043D\u043E\u0441\u0442\u0438 (\u0442\u043E\u0442 \u0436\u0435 \u043E\u0442\u0441\u0447\u0451\u0442, \u0447\u0442\u043E \u0438 \u0443 \u043E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u044F), \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u043A\u0440\u043E\u043C\u043A\u0430
  // \u0438 \u0442\u0435\u043B\u043E \u043E\u043A\u0440\u0430\u0448\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0412 \u0426\u0412\u0415\u0422 \u041A\u041E\u041D\u0422\u0415\u041D\u0422\u0410. \u041D\u0430 \u0441\u0432\u0435\u0442\u043B\u043E\u043C \u0444\u043E\u043D\u0435 \u0434\u043E\u0431\u0430\u0432\u043A\u0430 \u0441\u0430\u043C\u0430 \u0441\u0445\u043E\u0434\u0438\u0442 \u043D\u0430 \u043D\u0435\u0442.
  // \u0414\u043E\u0431\u0430\u0432\u043A\u0430 \u041E\u0414\u041D\u0410 \u0418 \u0422\u0410 \u0416\u0415 \u043F\u043E \u0432\u0441\u0435\u0439 \u0434\u0435\u0442\u0430\u043B\u0438. \u0420\u0430\u043D\u044C\u0448\u0435 \u043E\u043D\u0430 \u0448\u043B\u0430 \u043C\u043D\u043E\u0436\u0438\u0442\u0435\u043B\u0435\u043C mix(0.35, 1.0, t) \u2014
  // \u0432\u0442\u0440\u043E\u0435 \u0441\u043B\u0430\u0431\u0435\u0435 \u0432 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0435, \u0447\u0435\u043C \u0443 \u0444\u0430\u0441\u043A\u0438, \u2014 \u0438 \u043D\u0430 \u0442\u0435\u043B\u0435 \u044D\u0442\u043E \u0447\u0438\u0442\u0430\u043B\u043E\u0441\u044C \u043F\u044F\u0442\u043D\u043E\u043C \u0434\u0440\u0443\u0433\u043E\u0433\u043E \u0442\u043E\u043D\u0430 \u043F\u043E
  // \u0446\u0435\u043D\u0442\u0440\u0443: \u0442\u0430 \u0436\u0435 \u0431\u043E\u043B\u0435\u0437\u043D\u044C \xAB\u0434\u0432\u0443\u0445 \u0441\u0442\u0451\u043A\u043E\u043B \u0432 \u043E\u0434\u043D\u043E\u0439 \u0444\u043E\u0440\u043C\u0435\xBB, \u0442\u043E\u043B\u044C\u043A\u043E \u0442\u043E\u043D\u043E\u043C, \u0430 \u043D\u0435 \u043C\u0443\u0442\u044C\u044E. \u041A\u0440\u043E\u043C\u043A\u0443
  // \u0432\u044B\u0434\u0435\u043B\u044F\u0435\u0442 \u0424\u0440\u0435\u043D\u0435\u043B\u044C, \u0443 \u043D\u0435\u0433\u043E \u043D\u0430 \u044D\u0442\u043E \u0441\u0432\u043E\u0451 \u043E\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u0435.
  rgb += ambient * u_edgeLight * (0.12 + 0.55 * (1.0 - local));

  // \u041D\u0415\u0414\u041E\u0411\u0420\u0410\u041D\u041D\u0410\u042F \u0420\u0410\u0417\u041B\u0418\u0427\u0418\u041C\u041E\u0421\u0422\u042C \u0423\u0425\u041E\u0414\u0418\u0422 \u0412 \u041A\u0420\u041E\u041C\u041A\u0423. \u041D\u0430\u0434 \u0442\u0451\u043C\u043D\u044B\u043C \u0444\u043E\u043D\u043E\u043C \u0442\u0435\u043B\u043E \u043E\u0442\u043E\u0439\u0442\u0438 \u043D\u0435 \u043C\u043E\u0436\u0435\u0442: \u0441\u0432\u0435\u0442\u043B\u043E\u0439
  // \u043D\u0430\u0434\u043F\u0438\u0441\u0438 \u043D\u0443\u0436\u043D\u0430 \u0442\u0451\u043C\u043D\u0430\u044F \u0441\u0440\u0435\u0434\u0430, \u0430 \u0442\u0435\u043C\u043D\u0435\u0435 \u043F\u043E\u0447\u0442\u0438 \u0447\u0451\u0440\u043D\u043E\u0433\u043E \u0444\u043E\u043D\u0430 \u043D\u0435 \u0431\u044B\u0432\u0430\u0435\u0442. \u0422\u044F\u043D\u0443\u0442\u044C \u0442\u0435\u043B\u043E \u0432 \u0441\u0432\u0435\u0442\u043B\u043E\u0435
  // \u0440\u0430\u0434\u0438 \u0440\u0430\u0437\u043B\u0438\u0447\u0438\u043C\u043E\u0441\u0442\u0438 \u043D\u0435\u043B\u044C\u0437\u044F \u2014 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u0442\u0435\u043B\u043E\u043C \u0441\u0432\u0435\u0442\u043B\u0435\u0435\u0442 \u0438 \u0447\u0443\u0436\u043E\u0439 \u0442\u0435\u043A\u0441\u0442 \u043F\u043E\u0434 \u0441\u0442\u0435\u043A\u043B\u043E\u043C, \u043E\u043D
  // \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u044F\u0440\u0447\u0435 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u043E\u0439 \u043D\u0430\u0434\u043F\u0438\u0441\u0438 \u0434\u0435\u0442\u0430\u043B\u0438, \u0438 \u0434\u0435\u0442\u0430\u043B\u044C \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u0451\u0442 \u0431\u044B\u0442\u044C \u0447\u0438\u0442\u0430\u0435\u043C\u043E\u0439.
  //
  // \u041F\u043E\u044D\u0442\u043E\u043C\u0443 \u043E\u0441\u0442\u0430\u0442\u043E\u043A \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F \u0431\u0435\u0440\u0451\u0442 \u043D\u0430 \u0441\u0435\u0431\u044F \u0424\u0410\u0421\u041A\u0410: \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u0441\u0432\u0435\u0442 \u043F\u043E \u043A\u0440\u043E\u043C\u043A\u0435, \u043D\u0435 \u0437\u0430\u043D\u044F\u0442\u044B\u0439 \u0443
  // \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u044F. \u042D\u0442\u043E \u0438 \u0435\u0441\u0442\u044C \xAB\u0441\u0442\u0435\u043A\u043B\u043E \u043D\u0430 \u0442\u0451\u043C\u043D\u043E\u043C \u0444\u043E\u043D\u0435 \u0447\u0435\u0441\u0442\u043D\u0435\u0435 \u0447\u0438\u0442\u0430\u0442\u044C \u043A\u0440\u043E\u043C\u043A\u043E\u0439, \u0447\u0435\u043C \u0437\u0430\u043B\u0438\u0432\u043A\u043E\u0439\xBB \u2014 \u0437\u0434\u0435\u0441\u044C
  // \u043E\u043D\u043E \u041F\u041E\u0421\u0427\u0418\u0422\u0410\u041D\u041E, \u0430 \u043D\u0435 \u0437\u0430\u044F\u0432\u043B\u0435\u043D\u043E: \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0442\u0435\u043B\u043E \u043D\u0435 \u0434\u043E\u0431\u0440\u0430\u043B\u043E, \u0441\u0442\u043E\u043B\u044C\u043A\u043E \u043A\u0440\u043E\u043C\u043A\u0430 \u0438 \u043F\u043E\u043B\u0443\u0447\u0438\u0442, \u0438 \u043D\u0430\u0434
  // \u0441\u0432\u0435\u0442\u043B\u044B\u043C \u0444\u043E\u043D\u043E\u043C, \u0433\u0434\u0435 \u0442\u0435\u043B\u043E \u0441\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0441\u0430\u043C\u043E, \u043A\u0440\u043E\u043C\u043A\u0438 \u043D\u0435\u0442 \u0432\u043E\u0432\u0441\u0435.
  // \u0417\u043D\u0430\u043A \u0443 \u043A\u0440\u043E\u043C\u043A\u0438 \u0422\u041E\u0422 \u0416\u0415, \u0427\u0422\u041E \u0423 \u0412\u0421\u0415\u0413\u041E \u041E\u0421\u0422\u0410\u041B\u042C\u041D\u041E\u0413\u041E \u2014 \u043E\u0442 \u0444\u043E\u043D\u0430: \u043D\u0430\u0434 \u0442\u0451\u043C\u043D\u044B\u043C \u043F\u043E\u043B\u043E\u0442\u043D\u043E\u043C \u043E\u043D\u0430 \u0441\u0432\u0435\u0442\u043B\u0435\u0435\u0442,
  // \u043D\u0430\u0434 \u0441\u0432\u0435\u0442\u043B\u044B\u043C \u0442\u0435\u043C\u043D\u0435\u0435\u0442. \u041F\u043E\u043A\u0430 \u043E\u043D\u0430 \u0432\u0441\u0435\u0433\u0434\u0430 \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u043B\u0430 \u0441\u0432\u0435\u0442\u0430, \u043D\u0430\u0434 \u043F\u043E\u0447\u0442\u0438 \u0431\u0435\u043B\u044B\u043C \u043F\u043E\u043B\u043E\u0442\u043D\u043E\u043C \u0435\u0451 \u043F\u0440\u043E\u0441\u0442\u043E
  // \u043D\u0435 \u0431\u044B\u043B\u043E \u0432\u0438\u0434\u043D\u043E \u2014 \u0441\u0432\u0435\u0442 \u043F\u043E \u0441\u0432\u0435\u0442\u0443, \u2014 \u0438 \u0434\u0435\u0442\u0430\u043B\u044C \u0442\u0430\u043C \u043F\u0440\u043E\u043F\u0430\u0434\u0430\u043B\u0430 \u0446\u0435\u043B\u0438\u043A\u043E\u043C.
  float unmet = max(sep - max(density * toward, 0.0), 0.0);
  rgb += float3(dirEarly * unmet * VG_RIM_GAIN * pow(t, 3.0));

  if (u_debug > 9.5 && u_debug < 10.5) { rgb = spectral * 0.5; }
  if (u_debug > 10.5) { rgb = float3(density, sep, max(sep - max(density * toward, 0.0), 0.0)); }

  // \u0421\u0436\u0430\u0442\u0438\u0435 \u2014 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u043C, \u043F\u043E \u0438\u0442\u043E\u0433\u043E\u0432\u043E\u043C\u0443 \u0446\u0432\u0435\u0442\u0443.
  //
  // \u0414\u0438\u0437\u0435\u0440\u0430 \u0437\u0434\u0435\u0441\u044C \u041D\u0415\u0422. \u041E\u043D \u0441\u0442\u043E\u044F\u043B, \u043F\u043E\u043A\u0430 \u0441\u0432\u0435\u0442\u043B\u043E\u0442\u0430 \u0444\u043E\u043D\u0430 \u043E\u0446\u0435\u043D\u0438\u0432\u0430\u043B\u0430\u0441\u044C \u043F\u043E \u043F\u0438\u043A\u0441\u0435\u043B\u044E: \u0442\u0435\u043B\u043E \u0431\u044B\u043B\u043E \u0433\u043B\u0430\u0434\u043A\u043E\u0439
  // \u0444\u0443\u043D\u043A\u0446\u0438\u0435\u0439 \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u044B, \u0438 \u0432\u043E\u0441\u044C\u043C\u0438\u0431\u0438\u0442\u043D\u044B\u0439 \u0432\u044B\u0432\u043E\u0434 \u0448\u0451\u043B \u043F\u043E\u043B\u043E\u0441\u0430\u043C\u0438. \u0422\u0435\u043F\u0435\u0440\u044C \u043E\u0446\u0435\u043D\u043A\u0430 \u043F\u0440\u0438\u0445\u043E\u0434\u0438\u0442 \u0438\u0437 \u0437\u043E\u043D\u0434\u0430
  // \u043E\u0434\u043D\u0438\u043C \u0447\u0438\u0441\u043B\u043E\u043C \u043D\u0430 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C, \u0442\u0438\u043D\u0442 \u0434\u0430\u0451\u0442 \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u043E\u0435 \u0441\u043C\u0435\u0449\u0435\u043D\u0438\u0435, \u0430 \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u0430\u044F \u043D\u0435 \u0431\u0430\u043D\u0434\u0438\u0442 \u2014
  // \u0440\u0430\u0437\u0431\u0438\u0432\u0430\u0442\u044C \u043D\u0435\u0447\u0435\u0433\u043E. \u041E\u0441\u0442\u0430\u043B\u0430\u0441\u044C \u0431\u044B \u0442\u043E\u043B\u044C\u043A\u043E \u043A\u0440\u0443\u043F\u0430 \u043D\u0430 \u0440\u043E\u0432\u043D\u043E\u0439 \u0437\u0430\u043B\u0438\u0432\u043A\u0435, \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u0442\u0430\u043C \u0432\u0437\u044F\u0442\u044C\u0441\u044F \u043D\u0435\u043E\u0442\u043A\u0443\u0434\u0430.
  rgb = vgSoftClip(rgb);

  // \u0410\u043B\u044C\u0444\u0430 \u0432\u044B\u0431\u043E\u0440\u043E\u043A \u043E\u0431\u044F\u0437\u0430\u043D\u0430 \u0434\u043E\u0436\u0438\u0442\u044C \u0434\u043E \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0430: \u0440\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0446\u0432\u0435\u0442 \u043F\u043E \u0438\u0441\u0445\u043E\u0434\u043D\u043E\u0439 \u0430\u043B\u044C\u0444\u0435, \u0430 \u0432\u0435\u0440\u043D\u0443\u0442\u044C
  // \u0441 \u0447\u0443\u0436\u043E\u0439 (\u043C\u0430\u0441\u043A\u043E\u0439 \u0444\u043E\u0440\u043C\u044B) \u2014 \u0437\u043D\u0430\u0447\u0438\u0442 \u0441\u0434\u0435\u043B\u0430\u0442\u044C \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u0439 \u0431\u044D\u043A\u0434\u0440\u043E\u043F \u043D\u0435\u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u044B\u043C \u0438 \u0437\u0430\u0441\u0432\u0435\u0442\u0438\u0442\u044C \u0435\u0433\u043E.
  float alpha = srcA * (1.0 - smoothstep(-1.0, 1.0, sd));
  return half4(half3(clamp(rgb, float3(0.0), float3(1.0)) * alpha), half(alpha));
}
`;

  // ../vire/packages/vireglass/src/surface-shader.ts
  var SURFACE_SHADER = `
uniform shader u_icon;
/** \u0426\u0432\u0435\u0442\u043D\u043E\u0439 \u043A\u043E\u043D\u0442\u0435\u043D\u0442 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u041D\u0410 \u0441\u0442\u0435\u043A\u043B\u0435 \u2014 \u043E\u0431\u043B\u043E\u0436\u043A\u0430, \u043C\u0438\u043D\u0438\u0430\u0442\u044E\u0440\u0430. \u041E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0439 \u0441\u043B\u043E\u0439 \u043E\u0442 \u043C\u0430\u0441\u043A\u0438 \u043A\u0440\u0430\u0441\u043A\u0438:
 *  \u0442\u0430 \u043E\u0434\u043D\u043E\u043A\u0430\u043D\u0430\u043B\u044C\u043D\u0430\u044F \u0438 \u043A\u0440\u0430\u0441\u0438\u0442\u0441\u044F \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u044C\u044E, \u0430 \u044D\u0442\u043E\u0442 \u043D\u0435\u0441\u0451\u0442 \u0441\u0432\u043E\u0439 \u0446\u0432\u0435\u0442 \u043A\u0430\u043A \u0435\u0441\u0442\u044C. */
uniform shader u_overlay;

uniform float2 u_center;
uniform float2 u_halfSize;
uniform float  u_corner;
uniform float  u_bevel;
uniform float  u_thickness;
uniform float2 u_morphOffset;
uniform float2 u_morphHalf;
uniform float  u_morphCorner;
uniform float  u_morphK;

uniform float  u_press;
uniform float  u_active;
uniform float2 u_light;

uniform float  u_specular;
uniform float  u_specularPower;
uniform float  u_edgeDensity;
uniform float  u_dispersion;
uniform float  u_refraction;
uniform float4 u_tint;
uniform float  u_shadow;
uniform float  u_shadowReach;
uniform float  u_presence;
uniform float  u_progress;
uniform float  u_debug;

uniform float  u_iconOn;
uniform float  u_overlayOn;
uniform float  u_iconScale;
uniform float4 u_inkIdle;
uniform float4 u_inkActive;
uniform float2 u_touch;
uniform float2 u_pull;
uniform float  u_touchPress;
uniform float  u_touchRadius;
uniform float2 u_wave;

${VG_SDF}

const float VG_FALLOFF = ${VG_FALLOFF};

/* \u0422\u043E\u043B\u0449\u0438\u043D\u0430, \u043D\u0430 \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u043E\u0442\u043A\u0430\u043B\u0438\u0431\u0440\u043E\u0432\u0430\u043D\u043E \u043F\u043E\u0433\u043B\u043E\u0449\u0435\u043D\u0438\u0435: \u043F\u0440\u0438 \u043D\u0435\u0439 \u043F\u043E\u043B\u043E\u0441\u0430 \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u0435\u0442 \u0441 \u043F\u0440\u0435\u0436\u043D\u0438\u043C \u0441\u0442\u0435\u043A\u043B\u043E\u043C. */
const float VG_REF_THICKNESS = 0.18;
// \u041F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C \u0442\u0438\u043D\u0442\u0430 \u0432 \u043F\u043B\u043E\u0441\u043A\u043E\u0439 \u0441\u0435\u0440\u0435\u0434\u0438\u043D\u0435; \u0443 \u0444\u0430\u0441\u043A\u0438 \u043E\u043D\u0430 \u043C\u043D\u043E\u0436\u0438\u0442\u0441\u044F \u043D\u0430 u_edgeDensity.
const float VG_BODY_DENSITY = 0.19;
/* \u0413\u043B\u0443\u0431\u0438\u043D\u0430 \u043A\u0440\u0430\u0441\u043A\u0438 \u043F\u043E\u0434 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C\u044E, dp. \u041D\u0430 \u0441\u0442\u043E\u043B\u044C\u043A\u043E \u0435\u0451 \u0443\u0432\u043E\u0434\u0438\u0442 \u043D\u043E\u0440\u043C\u0430\u043B\u044C \u0443 \u0441\u0430\u043C\u043E\u0439 \u043A\u0440\u043E\u043C\u043A\u0438. */
const float VG_INK_DEPTH = 4.0;

half4 vgPack(half3 c, float a) { return half4(c * half(a), half(a)); }

half3 vgHeat(float v) {
  float x = clamp(v, 0.0, 1.0);
  return half3(half(clamp(x * 2.2 - 0.2, 0.0, 1.0)),
               half(clamp(1.0 - abs(x - 0.5) * 2.2, 0.0, 1.0)),
               half(clamp(1.2 - x * 2.4, 0.0, 1.0)));
}

half4 main(float2 xy) {
  float2 p = vgTouchWarp(xy - u_center, u_touch, u_pull, u_touchPress, u_touchRadius, u_wave.x, u_wave.y);

  // \u041E\u0431\u0440\u0430\u0442\u043D\u0430\u044F \u0434\u0435\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F: \u0432\u0434\u043E\u043B\u044C \u0432\u0435\u043A\u0442\u043E\u0440\u0430 \u0442\u044F\u0433\u0438 \u0440\u0430\u0441\u0442\u044F\u0436\u0435\u043D\u0438\u0435 A, \u043F\u043E\u043F\u0435\u0440\u0451\u043A \u0441\u0436\u0430\u0442\u0438\u0435 1/sqrt(A). \u0420\u043E\u0432\u043D\u043E
  // \u044D\u0442\u043E\u0442 \u0437\u0430\u043A\u043E\u043D \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0435\u0442 \u0442\u0440\u0430\u043D\u0441\u0444\u043E\u0440\u043C \u0436\u0438\u0432\u043E\u0439 \u043F\u043E\u0434\u043B\u043E\u0436\u043A\u0438 \u043F\u043E\u0434 \u043A\u0430\u043D\u0432\u0430\u0441\u043E\u043C, \u0438\u043D\u0430\u0447\u0435 \u043E\u043D\u0438 \u0440\u0430\u0437\u044A\u0435\u0437\u0436\u0430\u044E\u0442\u0441\u044F.
  // \u0413\u0435\u043E\u043C\u0435\u0442\u0440\u0438\u0438 \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u044F \u0437\u0434\u0435\u0441\u044C \u041D\u0415\u0422 \u2014 \u043D\u0438 \u0442\u044F\u0433\u0438, \u043D\u0438 \u0432\u0437\u0434\u0443\u0442\u0438\u044F \u043E\u0442 \u043D\u0430\u0436\u0430\u0442\u0438\u044F. \u0412\u0441\u0451 \u044D\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442 \u043E\u0434\u0438\u043D
  // \u0442\u0440\u0430\u043D\u0441\u0444\u043E\u0440\u043C \u043E\u0431\u0451\u0440\u0442\u043A\u0438, \u043E\u043D \u0436\u0435 \u043D\u0435\u0441\u0451\u0442 \u043D\u0430\u0442\u0438\u0432\u043D\u0443\u044E \u043B\u0438\u043D\u0437\u0443: \u0448\u0435\u0439\u0434\u0435\u0440 \u0435\u0451 \u043D\u0435 \u0434\u043E\u0441\u0442\u0430\u0451\u0442, \u0430 \u0434\u0432\u0430 \u043A\u043E\u043D\u0432\u0435\u0439\u0435\u0440\u0430
  // \u043D\u0430 \u043E\u0434\u043D\u043E \u0434\u0432\u0438\u0436\u0435\u043D\u0438\u0435 \u0440\u0430\u0441\u0445\u043E\u0434\u044F\u0442\u0441\u044F \u043D\u0430 \u043A\u0430\u0434\u0440, \u0438 \u0441\u043B\u043E\u0438 \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u0432\u0438\u0434\u043D\u043E \u043F\u043E \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u0438.

  float halfMin = max(min(u_halfSize.x, u_halfSize.y), 1.0);
  float bevel = max(u_bevel, 1.0);

  float sd = vgScene(p, u_halfSize, u_corner, u_morphOffset, u_morphHalf, u_morphCorner, u_morphK);
  float t = vgBevelT(sd, bevel);
  float2 n = vgSceneNormal(p, u_halfSize, u_corner, u_morphOffset, u_morphHalf, u_morphCorner, u_morphK);
  float3 N = normalize(float3(n * vgBevelSlope(t), 1.0));
  float3 V = float3(0.0, 0.0, 1.0);

  float bloom = 1.0 + u_press * 0.45;

  // \u041F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u2014 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435, \u0441\u0442\u0430\u0432\u0448\u0435\u0435 \u043F\u043E\u043B\u0435\u043C: \u0441\u044B\u0433\u0440\u0430\u043D\u043D\u0430\u044F \u0447\u0430\u0441\u0442\u044C \u0431\u043B\u0435\u0441\u0442\u0438\u0442 \u0438 \u0441\u0432\u0435\u0442\u0438\u0442\u0441\u044F \u0440\u043E\u0432\u043D\u043E
  // \u043D\u0430\u0441\u0442\u043E\u043B\u044C\u043A\u043E, \u043D\u0430\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0431\u043B\u0435\u0441\u0442\u0438\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u0430\u044F \u0434\u0435\u0442\u0430\u043B\u044C \u0446\u0435\u043B\u0438\u043A\u043E\u043C. \u041A\u0440\u0430\u0441\u043A\u0443 \u044D\u0442\u043E \u041D\u0415 \u0442\u0440\u043E\u0433\u0430\u0435\u0442: \u043F\u0435\u0440\u0435\u043A\u0440\u0430\u0448\u0438\u0432\u0430\u0442\u044C
  // \u043D\u0430\u0434\u043F\u0438\u0441\u044C \u043F\u043E \u0445\u043E\u0434\u0443 \u0442\u0440\u0435\u043A\u0430 \u0437\u043D\u0430\u0447\u0438\u0442 \u043C\u0435\u043D\u044F\u0442\u044C \u0435\u0451 \u043F\u043E\u0441\u0440\u0435\u0434\u0438 \u0441\u043B\u043E\u0432\u0430.
  float lit = max(u_active, vgProgress(p, u_halfSize, u_progress));

  float3 L1 = normalize(float3(u_light * 0.86, 0.42));
  float3 L2 = normalize(float3(-u_light * 0.78, 0.50));
  float bevelMask = smoothstep(0.10, 0.55, t);
  float s1 = pow(max(dot(reflect(-L1, N), V), 0.0), u_specularPower) * 0.85;
  float s2 = pow(max(dot(reflect(-L2, N), V), 0.0), u_specularPower * 1.45) * 0.14;
  float spec = (s1 + s2) * bevelMask * u_specular * bloom * (1.0 + lit * 0.30);

  // \u0421\u0432\u0435\u0442\u044F\u0449\u0435\u0439\u0441\u044F \u043A\u0440\u043E\u043C\u043A\u0438 \u0437\u0434\u0435\u0441\u044C \u0431\u043E\u043B\u044C\u0448\u0435 \u041D\u0415\u0422. \u041E\u043D\u0430 \u0431\u044B\u043B\u0430 \u043E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u0435\u043C, \u043D\u0430\u0440\u0438\u0441\u043E\u0432\u0430\u043D\u043D\u044B\u043C \u0431\u0435\u043B\u044B\u043C \u043F\u043E\u0432\u0435\u0440\u0445, \u0438
  // \u043F\u043E\u0442\u043E\u043C\u0443 \u0432\u044B\u0433\u043B\u044F\u0434\u0435\u043B\u0430 \u043E\u0434\u0438\u043D\u0430\u043A\u043E\u0432\u043E \u043D\u0430\u0434 \u0447\u0451\u0440\u043D\u044B\u043C \u0441\u043F\u0438\u0441\u043A\u043E\u043C \u0438 \u043D\u0430\u0434 \u0441\u0432\u0435\u0442\u043B\u043E\u0439 \u043E\u0431\u043B\u043E\u0436\u043A\u043E\u0439. \u041E\u0442\u0440\u0430\u0436\u0435\u043D\u0438\u0435
  // \u0441\u0447\u0438\u0442\u0430\u0435\u0442 \u043B\u0438\u043D\u0437\u0430 (lens-shader.ts) \u2014 \u0442\u0430\u043C \u0432\u0438\u0434\u0435\u043D \u0431\u044D\u043A\u0434\u0440\u043E\u043F, \u0438 \u043A\u0440\u043E\u043C\u043A\u0430 \u0431\u0435\u0440\u0451\u0442 \u0446\u0432\u0435\u0442 \u043E\u0442 \u0442\u043E\u0433\u043E, \u0447\u0442\u043E
  // \u0440\u0435\u0430\u043B\u044C\u043D\u043E \u043F\u043E\u0434 \u043D\u0435\u0439. \u0417\u0434\u0435\u0441\u044C \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0442\u043E, \u0447\u0442\u043E \u043E\u0442 \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u044F \u043D\u0435 \u0437\u0430\u0432\u0438\u0441\u0438\u0442: \u0431\u043B\u0438\u043A \u043E\u0442 \u041D\u0410\u0428\u0415\u0413\u041E
  // \u043A\u043B\u044E\u0447\u0435\u0432\u043E\u0433\u043E \u0441\u0432\u0435\u0442\u0430, \u043F\u043E\u0433\u043B\u043E\u0449\u0435\u043D\u0438\u0435 \u0441\u0440\u0435\u0434\u044B \u0438 \u0442\u0435\u043D\u044C.
  float facing = dot(n, u_light);

  // \u0422\u043E\u043B\u0449\u0438\u043D\u0430 \u043A\u0430\u043A \u043F\u043E\u0433\u043B\u043E\u0449\u0435\u043D\u0438\u0435: \u043F\u043E\u043B\u043E\u0441\u0430 \u0442\u0430\u043C, \u0433\u0434\u0435 \u043A\u0440\u043E\u043C\u043A\u0443 \u043D\u0435 \u043E\u0441\u0432\u0435\u0449\u0430\u0435\u0442 \u043D\u0438 \u043E\u0434\u0438\u043D \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A. \u0420\u0430\u0441\u0442\u0451\u0442
  // \u0441 \u0444\u0430\u0441\u043A\u043E\u0439, \u043F\u043E\u044D\u0442\u043E\u043C\u0443 \u0442\u043E\u043D\u043A\u043E\u0435 \u0441\u0442\u0435\u043A\u043B\u043E \u0441\u0430\u043C\u043E \u043F\u043E \u0441\u0435\u0431\u0435 \u043F\u0435\u0440\u0435\u0441\u0442\u0430\u0451\u0442 \xAB\u043D\u0430\u043B\u0438\u0432\u0430\u0442\u044C\u0441\u044F\xBB \u0443 \u043A\u0440\u0430\u044F.
  float absorb = smoothstep(0.0, 0.70, t) * (1.0 - smoothstep(0.80, 1.0, t))
    * (1.0 - abs(facing)) * 0.10 * (u_thickness / VG_REF_THICKNESS);

  if (u_debug > 0.5) {
    float inMask = 1.0 - smoothstep(-1.0, 1.0, sd);
    if (u_debug < 1.5) {
      float band = abs(fract(sd / (halfMin * 0.22)) - 0.5) * 2.0;
      half3 c = sd < 0.0 ? half3(0.20, 0.62, 1.0) : half3(1.0, 0.42, 0.22);
      return vgPack(c * half(0.25 + band * 0.75), 1.0);
    }
    if (u_debug < 2.5) { return vgPack(half3(1.0), inMask); }
    if (u_debug < 3.5) { return vgPack(vgHeat(t), inMask); }
    // \u0424\u0440\u0435\u043D\u0435\u043B\u044C \u0442\u0435\u043F\u0435\u0440\u044C \u0443 \u043B\u0438\u043D\u0437\u044B; \u0437\u0434\u0435\u0441\u044C \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u043C \u0435\u0433\u043E \u0424\u041E\u0420\u041C\u0423 \u2014 \u043D\u0430\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0432\u0437\u0433\u043B\u044F\u0434 \u0441\u043A\u043E\u043B\u044C\u0437\u044F\u0449\u0438\u0439.
    if (u_debug < 4.5) { return vgPack(vgHeat(1.0 - clamp(N.z, 0.0, 1.0)), inMask); }
    if (u_debug < 5.5) {
      float push = pow(t, VG_FALLOFF) * u_refraction;
      return vgPack(vgHeat(push), inMask);
    }
    if (u_debug < 6.5) { return half4(0.0); }
    if (u_debug < 7.5) { return vgPack(half3(1.0), spec * inMask); }
    // \u0420\u0430\u0441\u0449\u0435\u043F\u043B\u0435\u043D\u0438\u0435 \u0441\u0447\u0438\u0442\u0430\u0435\u0442 \u043B\u0438\u043D\u0437\u0430; \u0437\u0434\u0435\u0441\u044C \u2014 \u043F\u043E\u043B\u0435, \u043F\u043E \u043A\u043E\u0442\u043E\u0440\u043E\u043C\u0443 \u043E\u043D\u043E \u043D\u0430\u0440\u0430\u0441\u0442\u0430\u0435\u0442.
    if (u_debug < 8.5) { return vgPack(vgHeat(u_dispersion * t * t), inMask); }
    if (u_debug < 9.5) { return vgPack(half3(N * 0.5 + 0.5), inMask); }
    // spectral \u0438 adapt \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u041B\u0418\u041D\u0417\u0410 \u2014 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C \u043E\u0431\u044F\u0437\u0430\u043D\u0430 \u0443\u0439\u0442\u0438 \u0441 \u0434\u043E\u0440\u043E\u0433\u0438.
    return half4(0.0);
  }

  // \u0422\u0435\u043D\u044C \u0438 \u043E\u0440\u0435\u043E\u043B \u0436\u0438\u0432\u0443\u0442 \u0421\u041D\u0410\u0420\u0423\u0416\u0418 \u0444\u043E\u0440\u043C\u044B: \u0432\u043D\u0443\u0442\u0440\u0438 \u0438\u0445 \u043C\u0435\u0441\u0442\u043E \u0437\u0430\u043D\u0438\u043C\u0430\u0435\u0442 \u0441\u0430\u043C\u043E \u0441\u0442\u0435\u043A\u043B\u043E. \u041E\u0442\u0440\u044B\u0432 \u043E\u0442
  // \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430 \u0434\u0435\u0440\u0436\u0438\u0442\u0441\u044F \u0438\u043C\u0435\u043D\u043D\u043E \u043D\u0430 \u0442\u0435\u043D\u0438 \u2014 \u0431\u0435\u0437 \u043D\u0435\u0451 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C \u043B\u0435\u0436\u0438\u0442 \u041D\u0410 \u043A\u0430\u0440\u0442\u0438\u043D\u043A\u0435, \u0430 \u043D\u0435 \u043D\u0430\u0434 \u043D\u0435\u0439.
  // \u0422\u0435\u043D\u044C \u0436\u0438\u0432\u0451\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0443 \u043A\u0440\u043E\u043C\u043A\u0438 \u0438 \u0441\u043D\u0430\u0440\u0443\u0436\u0438: \u043F\u0440\u0438 sd < \u22121 \u043C\u043D\u043E\u0436\u0438\u0442\u0435\u043B\u044C outside \u0438 \u0442\u0430\u043A \u043D\u043E\u043B\u044C.
  // \u0421\u0447\u0438\u0442\u0430\u0442\u044C \u0435\u0451 \u0433\u043B\u0443\u0431\u043E\u043A\u043E \u0432\u043D\u0443\u0442\u0440\u0438 \u0444\u043E\u0440\u043C\u044B \u2014 \u044D\u0442\u043E \u043B\u0438\u0448\u043D\u044F\u044F \u041F\u041E\u041B\u041D\u0410\u042F \u043E\u0446\u0435\u043D\u043A\u0430 SDF \u043D\u0430 \u043A\u0430\u0436\u0434\u044B\u0439 \u0442\u0430\u043A\u043E\u0439 \u043F\u0438\u043A\u0441\u0435\u043B\u044C,
  // \u0430 \u0442\u0435\u043B\u043E \u0437\u0430\u043D\u0438\u043C\u0430\u0435\u0442 \u043F\u043E\u0447\u0442\u0438 \u0432\u0441\u044E \u043F\u043B\u043E\u0449\u0430\u0434\u044C. \u0412\u0435\u0442\u0432\u043B\u0435\u043D\u0438\u0435 \u0437\u0434\u0435\u0441\u044C \u043F\u043E \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u0435, \u043D\u043E \u0440\u0430\u0441\u0445\u043E\u0434\u044F\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E
  // \u043D\u0438\u0442\u0438 \u043D\u0430 \u0441\u0430\u043C\u043E\u0439 \u043A\u0440\u043E\u043C\u043A\u0435.
  float shade = 0.0;
  float halo = 0.0;
  if (sd > -1.0) {
    float outside = smoothstep(-1.0, 1.0, sd);
    float sdDrop = vgScene(p - float2(0.0, u_shadowReach * 0.16), u_halfSize, u_corner,
                           u_morphOffset, u_morphHalf, u_morphCorner, u_morphK);
    float amb = 1.0 - smoothstep(0.0, u_shadowReach, max(sdDrop, 0.0));
    float con = 1.0 - smoothstep(0.0, u_shadowReach * 0.22, max(sd, 0.0));
    shade = (amb * amb * 0.22 + con * con * 0.18) * outside * u_shadow;
    halo = 1.0 - smoothstep(0.0, u_shadowReach * 0.30, max(sd, 0.0));
    halo = halo * halo * lit * 0.10 * outside;
  }

  if (sd > 1.0) {
    return half4(half3(half(halo)), half(halo + shade * (1.0 - halo)));
  }

  float density = u_tint.w;
  float inner = clamp(-sd / halfMin, 0.0, 1.0);
  half3 col = half3(u_tint.rgb);

  // \u0422\u0438\u043D\u0442 \u0421\u0412\u0415\u0422\u041B\u042B\u0419 \u0438 \u0441\u043B\u0430\u0431\u044B\u0439, \u0430 \u043D\u0435 \u0442\u0451\u043C\u043D\u044B\u0439: \u0442\u0451\u043C\u043D\u043E\u0435 \u0441\u0442\u0435\u043A\u043B\u043E \u043D\u0430 \u0442\u0451\u043C\u043D\u043E\u043C \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0435 \u0438\u0441\u0447\u0435\u0437\u0430\u0435\u0442, \u0438 \u0435\u0433\u043E
  // \u043F\u0440\u0438\u0445\u043E\u0434\u0438\u0442\u0441\u044F \u0434\u0435\u0440\u0436\u0430\u0442\u044C \u0436\u0438\u0440\u043D\u043E\u0439 \u043A\u0440\u043E\u043C\u043A\u043E\u0439 \u2014 \u043E\u0442 \u044D\u0442\u043E\u0433\u043E \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u0445\u0440\u043E\u043C\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u0439 \u0431\u0443\u0441\u0438\u043D\u043E\u0439.
  // \u041F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C \u0442\u0438\u043D\u0442\u0430 \u0443 \u0444\u0430\u0441\u043A\u0438 \u2014 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u0430\u044F \u0432\u0435\u043B\u0438\u0447\u0438\u043D\u0430: \u0444\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u0438 \u0444\u0430\u0441\u043A\u0430 \u0433\u043D\u0451\u0442 \u0441\u0432\u0435\u0442 \u0441\u0438\u043B\u044C\u043D\u0435\u0435, \u043D\u043E
  // \u043C\u0443\u0442\u043D\u0435\u0435 \u041D\u0415 \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F. \u0421\u0446\u0435\u043F\u043B\u0435\u043D\u043D\u044B\u0435, \u043E\u043D\u0438 \u0434\u0430\u0432\u0430\u043B\u0438 \u043C\u043E\u043B\u043E\u0447\u043D\u043E\u0435 \u043A\u043E\u043B\u044C\u0446\u043E \u043F\u043E \u0432\u0441\u0435\u043C\u0443 \u043E\u0431\u0432\u043E\u0434\u0443.
  float body = mix(VG_BODY_DENSITY, VG_BODY_DENSITY * u_edgeDensity, smoothstep(0.10, 0.62, t)) * density;
  float vignette = smoothstep(0.15, 1.0, inner) * 0.19 * density;
  // \u041F\u0440\u0438\u0431\u0430\u0432\u043A\u0438 \u043F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u0438 \u043D\u0430 \u043D\u0430\u0436\u0430\u0442\u0438\u0435 \u0437\u0434\u0435\u0441\u044C \u041D\u0415\u0422. \u041E\u043D\u0430 \u0437\u0430\u0434\u0443\u043C\u044B\u0432\u0430\u043B\u0430\u0441\u044C \u043A\u0430\u043A \xAB\u0434\u0435\u0442\u0430\u043B\u044C \u0437\u0430\u043C\u0435\u0442\u043D\u0435\u0435 \u043F\u043E\u0434
  // \u043F\u0430\u043B\u044C\u0446\u0435\u043C\xBB, \u043D\u043E \u0442\u044F\u043D\u0435\u0442 \u0442\u0435\u043B\u043E \u043A \u0442\u0438\u043D\u0442\u0443, \u0430 \u0442\u0438\u043D\u0442 \u0437\u0430\u0432\u0438\u0441\u0438\u0442 \u043E\u0442 \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u0438: \u043D\u0430\u0434 \u0441\u0432\u0435\u0442\u043B\u044B\u043C \u0444\u043E\u043D\u043E\u043C
  // (\u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u044C \u0442\u0451\u043C\u043D\u0430\u044F) \u043D\u0430\u0436\u0430\u0442\u0438\u0435 \u0422\u0415\u041C\u041D\u0418\u041B\u041E \u0434\u0435\u0442\u0430\u043B\u044C. \u041F\u0440\u0438\u0441\u0443\u0442\u0441\u0442\u0432\u0438\u0435 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u044E\u0442 \u0434\u0435\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043F\u043E\u043B\u044F
  // vgTouchWarp \u0438 \u0440\u0430\u0441\u0446\u0432\u0435\u0442\u0430\u044E\u0449\u0438\u0439 \u0431\u043B\u0438\u043A \u043D\u0438\u0436\u0435 \u2014 \u0438\u043C \u0437\u043D\u0430\u043A \u043F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u0438 \u0431\u0435\u0437\u0440\u0430\u0437\u043B\u0438\u0447\u0435\u043D.
  float a = max(body, vignette);

  // \u0426\u0432\u0435\u0442 \u0442\u0435\u043B\u0430 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C \u041D\u0415 \u0442\u0440\u043E\u0433\u0430\u0435\u0442. \u041F\u043E\u0434\u043C\u0435\u0448\u0438\u0432\u0430\u043D\u0438\u0435 \u0444\u0438\u043A\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u0433\u043E \u0441\u0435\u0440\u043E\u0433\u043E \u0441\u044E\u0434\u0430 \u043C\u0435\u043D\u044F\u043B\u043E \u0437\u043D\u0430\u043A
  // \u044D\u0444\u0444\u0435\u043A\u0442\u0430 \u043E\u0442 \u0444\u043E\u043D\u0430: \u043D\u0430\u0434 \u0442\u0451\u043C\u043D\u044B\u043C \u0434\u0435\u0442\u0430\u043B\u044C \u0441\u0432\u0435\u0442\u043B\u0435\u043B\u0430, \u043D\u0430\u0434 \u0441\u0432\u0435\u0442\u043B\u044B\u043C \u2014 \u0442\u0435\u043C\u043D\u0435\u043B\u0430, \u0445\u043E\u0442\u044F \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 \u043E\u0434\u043D\u043E
  // \u0438 \u0442\u043E \u0436\u0435. \u0410\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u044E\u0442 \u0431\u043B\u0438\u043A \u0438 \u043F\u043E\u0434\u0441\u0432\u0435\u0442\u043A\u0430 \u043A\u0440\u043E\u043C\u043A\u0438 \u0432\u044B\u0448\u0435: \u0438\u043C \u0444\u043E\u043D \u0431\u0435\u0437\u0440\u0430\u0437\u043B\u0438\u0447\u0435\u043D.
  a = a + absorb;
  col *= 1.0 - half(absorb * 1.2);

  // \u0417\u041D\u0410\u0427\u041E\u041A \u041B\u0415\u0416\u0418\u0422 \u041F\u041E\u0414 \u041F\u041E\u0412\u0415\u0420\u0425\u041D\u041E\u0421\u0422\u042C\u042E, \u0430 \u043D\u0435 \u043D\u0430\u043A\u043B\u0435\u0435\u043D \u043D\u0430 \u043D\u0435\u0451: \u0440\u0430\u043D\u044C\u0448\u0435 \u043E\u043D \u043F\u043E\u0434\u043C\u0435\u0448\u0438\u0432\u0430\u043B\u0441\u044F \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u043C,
  // \u043F\u043E\u0432\u0435\u0440\u0445 \u0431\u043B\u0438\u043A\u0430, \u0438 \u0447\u0438\u0442\u0430\u043B\u0441\u044F \u043F\u043B\u043E\u0441\u043A\u0438\u043C \u0441\u0442\u0438\u043A\u0435\u0440\u043E\u043C \u043D\u0430 \u043E\u0431\u044A\u0451\u043C\u043D\u043E\u043C \u0441\u0442\u0435\u043A\u043B\u0435. \u0423 \u043A\u0440\u043E\u043C\u043A\u0438 \u0435\u0433\u043E \u0443\u0432\u043E\u0434\u0438\u0442 \u043D\u043E\u0440\u043C\u0430\u043B\u044C,
  // \u043A\u0430\u043A \u0432\u0441\u0451, \u0447\u0442\u043E \u0432\u0438\u0434\u043D\u043E \u0441\u043A\u0432\u043E\u0437\u044C \u0441\u0442\u0435\u043A\u043B\u043E, \u0430 \u0431\u043B\u0438\u043A \u043B\u043E\u0436\u0438\u0442\u0441\u044F \u0421\u0412\u0415\u0420\u0425\u0423 \u2014 \u043E\u043D \u0436\u0438\u0432\u0451\u0442 \u043D\u0430 \u0441\u0430\u043C\u043E\u0439 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438.
  //
  // \u041D\u0438\u043A\u0430\u043A\u043E\u0439 \u0442\u0435\u043D\u0438 \u043F\u043E\u0434 \u0437\u043D\u0430\u0447\u043A\u043E\u043C \u0437\u0434\u0435\u0441\u044C \u041D\u0415\u0422. \u041E\u043D\u0430 \u0434\u0435\u043B\u0430\u043B\u0430\u0441\u044C \u0440\u0430\u0437\u043D\u0438\u0446\u0435\u0439 \u0434\u0432\u0443\u0445 \u0441\u043C\u0435\u0449\u0451\u043D\u043D\u044B\u0445 \u0432\u044B\u0431\u043E\u0440\u043E\u043A \u043C\u0430\u0441\u043A\u0438 \u0438
  // \u0434\u0430\u0432\u0430\u043B\u0430 \u043F\u043E \u043A\u0440\u0430\u044E \u0432\u0442\u043E\u0440\u043E\u0439 \u043A\u043E\u043D\u0442\u0443\u0440 \u2014 \u0433\u0440\u0430\u043D\u0438\u0446\u044B \u0437\u043D\u0430\u0447\u043A\u0430 \u0432\u044B\u0433\u043B\u044F\u0434\u0435\u043B\u0438 \u0440\u0432\u0430\u043D\u044B\u043C\u0438.
  // \u0421\u0414\u0412\u0418\u0413 \u041A\u0420\u0410\u0421\u041A\u0418 \u0417\u0410\u0414\u0410\u041D \u0415\u0401 \u0413\u041B\u0423\u0411\u0418\u041D\u041E\u0419, \u0410 \u041D\u0415 \u0428\u0418\u0420\u0418\u041D\u041E\u0419 \u0424\u0410\u0421\u041A\u0418. \u041A\u0440\u0430\u0441\u043A\u0430 \u043B\u0435\u0436\u0438\u0442 \u0443 \u0441\u0430\u043C\u043E\u0439 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438, \u0438
  // \u0443\u0432\u043E\u0434\u0438\u0442 \u0435\u0451 \u0440\u043E\u0432\u043D\u043E \u0442\u0430 \u0442\u043E\u043D\u043A\u0430\u044F \u0442\u043E\u043B\u0449\u0430, \u0447\u0442\u043E \u043D\u0430\u0434 \u043D\u0435\u0439, \u2014 \u0430 \u043D\u0435 \u0442\u043E, \u043D\u0430\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0448\u0438\u0440\u043E\u043A\u0443\u044E \u0444\u0430\u0441\u043A\u0443 \u0441\u043D\u044F\u043B\u0438 \u0443
  // \u044D\u0442\u043E\u0433\u043E \u043A\u0443\u0441\u043A\u0430 \u0441\u0442\u0435\u043A\u043B\u0430. \u0414\u043E\u043B\u0435\u0439 \u0444\u0430\u0441\u043A\u0438 \u044D\u0442\u043E \u0438 \u0431\u044B\u043B\u043E: \u043D\u0430 \u0442\u043E\u043D\u043A\u043E\u043C \u0441\u0442\u0435\u043A\u043B\u0435 \u0441\u0434\u0432\u0438\u0433 \u0432\u044B\u0445\u043E\u0434\u0438\u043B 4 dp \u0438 \u0432\u0441\u0451
  // \u0441\u0445\u043E\u0434\u0438\u043B\u043E\u0441\u044C, \u0430 \u043D\u0430 \u0442\u043E\u043B\u0441\u0442\u043E\u043C \u2014 8, \u0438 \u043E\u0431\u043B\u043E\u0436\u043A\u0430, \u043E\u0442\u0431\u0438\u0442\u0430\u044F \u043E\u0442 \u043A\u0440\u0430\u044F \u043D\u0430 6, \u0440\u0430\u0441\u0442\u044F\u0433\u0438\u0432\u0430\u043B\u0430\u0441\u044C \u043A \u043A\u0440\u043E\u043C\u043A\u0435 \u0438
  // \u0432\u044B\u043B\u0435\u0437\u0430\u043B\u0430 \u0437\u0430 \u0433\u0430\u0431\u0430\u0440\u0438\u0442. \u041F\u043E\u0442\u043E\u043B\u043E\u043A \u0430\u0431\u0441\u043E\u043B\u044E\u0442\u043D\u044B\u0439: \u0443 \u043A\u0440\u0430\u0441\u043A\u0438 \u043E\u0434\u043D\u0430 \u0433\u043B\u0443\u0431\u0438\u043D\u0430 \u043F\u0440\u0438 \u043B\u044E\u0431\u043E\u043C \u0441\u0442\u0435\u043A\u043B\u0435.
  float2 inkShift = n * (min(u_bevel * 0.5, VG_INK_DEPTH) * t);
  float2 inkUv = u_center + p - inkShift;

  half4 ink = u_icon.eval(inkUv * u_iconScale) * half(u_iconOn);

  // \u041F\u041E\u0414\u041B\u041E\u0416\u041A\u0410 \u041F\u041E\u0414 \u041A\u0420\u0410\u0421\u041A\u041E\u0419. \u0427\u0438\u0442\u0430\u0435\u043C\u043E\u0441\u0442\u044C \u2014 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u0435 \u041C\u0415\u0421\u0422\u041D\u041E\u0415, \u0430 \u043D\u0435 \u043E\u0431\u0449\u0435\u0435 \u043F\u043E \u0434\u0435\u0442\u0430\u043B\u0438. \u0413\u0430\u0441\u0438\u0442\u044C \u0444\u043E\u043D \u043F\u043E
  // \u0432\u0441\u0435\u0439 \u043F\u043B\u043E\u0449\u0430\u0434\u0438 \u0437\u043D\u0430\u0447\u0438\u0442 \u043F\u043B\u0430\u0442\u0438\u0442\u044C \u043F\u0440\u043E\u0437\u0440\u0430\u0447\u043D\u043E\u0441\u0442\u044C\u044E \u0442\u0430\u043C, \u0433\u0434\u0435 \u0433\u0430\u0441\u0438\u0442\u044C \u043D\u0435\u0447\u0435\u0433\u043E: \u043F\u043E\u0434 \u043F\u0443\u0441\u0442\u044B\u043C \u043C\u0435\u0441\u0442\u043E\u043C \u0441\u0442\u0435\u043A\u043B\u043E
  // \u043E\u0431\u044F\u0437\u0430\u043D\u043E \u043E\u0441\u0442\u0430\u0432\u0430\u0442\u044C\u0441\u044F \u0441\u0442\u0435\u043A\u043B\u043E\u043C. \u041F\u043B\u043E\u0442\u043D\u043E\u0441\u0442\u044C \u043F\u043E\u0434\u043D\u0438\u043C\u0430\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0434 \u0441\u0430\u043C\u043E\u0439 \u043A\u0440\u0430\u0441\u043A\u043E\u0439 \u0438 \u0432 \u043A\u0430\u0439\u043C\u0435
  // \u0432\u043E\u043A\u0440\u0443\u0433 \u043D\u0435\u0451 \u2014 \u0442\u0430\u043A \u043D\u0430 \u0441\u0442\u0435\u043A\u043B\u0435 \u043C\u0430\u0442\u0438\u0440\u0443\u044E\u0442 \u0437\u043E\u043D\u0443 \u043F\u043E\u0434 \u0433\u0440\u0430\u0432\u0438\u0440\u043E\u0432\u043A\u043E\u0439, \u0430 \u043D\u0435 \u0432\u0435\u0441\u044C \u043B\u0438\u0441\u0442.
  //
  // \u041F\u043E\u043B\u0435 \u043A\u0430\u0439\u043C\u044B \u043F\u0440\u0438\u0445\u043E\u0434\u0438\u0442 \u0413\u041E\u0422\u041E\u0412\u042B\u041C, \u043A\u0440\u0430\u0441\u043D\u044B\u043C \u043A\u0430\u043D\u0430\u043B\u043E\u043C \u043C\u0430\u0441\u043A\u0438 (\u043A\u043E\u043D\u0442\u0440\u0430\u043A\u0442 \u043E\u043F\u0438\u0441\u0430\u043D \u0443 iconMask \u0432 \u0440\u0435\u043D\u0434\u0435\u0440\u0435\u0440\u0435):
  // \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0440\u0430\u0437\u043C\u044B\u0432\u0430\u0435\u0442 \u043A\u0440\u0430\u0441\u043A\u0443 \u043E\u0434\u0438\u043D \u0440\u0430\u0437 \u043D\u0430 \u043A\u0430\u0434\u0440 \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0438\u043C \u0433\u0430\u0443\u0441\u0441\u0438\u0430\u043D\u043E\u043C. \u0421\u0447\u0438\u0442\u0430\u0442\u044C \u044D\u0442\u043E \u043F\u043E\u043B\u0435 \u0437\u0434\u0435\u0441\u044C
  // \u043D\u0435\u0447\u0435\u043C: \u043A\u043E\u043B\u044C\u0446\u043E \u043E\u0442\u0441\u0447\u0451\u0442\u043E\u0432 \u0432\u043E\u043A\u0440\u0443\u0433 \u043F\u0438\u043A\u0441\u0435\u043B\u044F \u2014 \u0442\u043E \u0436\u0435 \u043D\u0435\u0434\u043E\u0441\u044D\u043C\u043F\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435, \u0447\u0442\u043E \u0438 \u0432 \u0434\u0438\u0441\u043A\u043E\u0432\u043E\u043C \u0441\u0431\u043E\u0440\u0435,
  // \u0438 \u043F\u043E\u0434\u043B\u043E\u0436\u043A\u0430 \u0432\u044B\u0445\u043E\u0434\u0438\u043B\u0430 \u0440\u0432\u0430\u043D\u043E\u0439, \u0441 \u0432\u0438\u0434\u0438\u043C\u043E\u0439 \u0433\u0440\u0430\u043D\u0438\u0446\u0435\u0439 \u0432\u043E\u043A\u0440\u0443\u0433 \u043A\u0430\u0436\u0434\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u044B \u0431\u0443\u043A\u0432.

  half inkA = ink.g * half(mix(0.82, 1.0, u_active));
  half3 inkCol = mix(half3(u_inkIdle.rgb), half3(u_inkActive.rgb), half(u_active));
  col = col * (1.0 - inkA) + inkCol * inkA;

  // \u0426\u0412\u0415\u0422\u041D\u041E\u0419 \u041A\u041E\u041D\u0422\u0415\u041D\u0422 \u041B\u0415\u0416\u0418\u0422 \u0422\u0410\u041C \u0416\u0415, \u0413\u0414\u0415 \u041A\u0420\u0410\u0421\u041A\u0410 \u2014 \u0432\u043D\u0443\u0442\u0440\u0438 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u0430 \u0438 \u043D\u0430 \u0442\u043E\u0439 \u0436\u0435 \u043A\u043E\u043E\u0440\u0434\u0438\u043D\u0430\u0442\u0435. \u0418\u043D\u0430\u0447\u0435
  // \u0434\u0435\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u0432\u0435\u0434\u0451\u0442 \u0438\u0445 \u043F\u043E\u0440\u043E\u0437\u043D\u044C: \u043F\u0440\u0438 \u043D\u0430\u0436\u0430\u0442\u0438\u0438 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0438 \u0430\u0440\u0442\u0438\u0441\u0442 \u0442\u0440\u044F\u0441\u0443\u0442\u0441\u044F \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u044C\u044E,
  // \u0430 \u043E\u0431\u043B\u043E\u0436\u043A\u0430 \u0441\u0442\u043E\u0438\u0442 \u043D\u0430 \u043C\u0435\u0441\u0442\u0435, \u043F\u043E\u0442\u043E\u043C\u0443 \u0447\u0442\u043E \u043E\u043D\u0430 \u0431\u044B\u043B\u0430 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u043C \u0441\u043B\u043E\u0435\u043C \u043F\u043E\u0432\u0435\u0440\u0445 \u0441\u0442\u0435\u043A\u043B\u0430. \u041F\u043E\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u044C \u0435\u0433\u043E
  // \u043D\u0435 \u0442\u0440\u043E\u0433\u0430\u0435\u0442 \u2014 \u0443 \u043D\u0435\u0433\u043E \u0441\u0432\u043E\u0439 \u0446\u0432\u0435\u0442, \u0438 \u043F\u043E\u0434\u043C\u0435\u043D\u044F\u0442\u044C \u0435\u0433\u043E \u043D\u0435\u0447\u0435\u043C.
  half4 over = u_overlay.eval(inkUv * u_iconScale) * half(u_overlayOn);
  col = col * (1.0 - over.a) + over.rgb * over.a;

  col += half3(spec) * half3(0.98, 0.99, 1.0);

  // \u0410\u043B\u044C\u0444\u0430 \u0431\u043B\u0438\u043A\u0430 \u0438\u0434\u0451\u0442 \u0432\u0440\u043E\u0432\u0435\u043D\u044C \u0441 \u0435\u0433\u043E \u044F\u0440\u043A\u043E\u0441\u0442\u044C\u044E: \u043F\u0440\u0438 \u0437\u0430\u043D\u0438\u0436\u0435\u043D\u043D\u043E\u0439 \u0430\u043B\u044C\u0444\u0435 premultiplied \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442
  // \u0433\u0430\u0441\u043D\u0435\u0442 \u0438 \u0431\u043B\u0438\u043A \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u043D\u0435\u0432\u0438\u0434\u0438\u043C\u044B\u043C \u043D\u0430 \u0442\u0451\u043C\u043D\u043E\u043C \u0444\u043E\u043D\u0435.
  a = clamp(a + spec, 0.0, 1.0);
  a = max(a, max(float(inkA), float(over.a)));
  a *= 1.0 - smoothstep(-1.0, 1.0, sd);

  col = clamp(col, half3(0.0), half3(1.0));
  return half4(col * half(a), half(a + shade * (1.0 - a)));
}
`;

  // ../vire/packages/vireglass/src/adaptation.ts
  var import_react = __toESM(require_react(), 1);
  var TINT_DARK = 0.07;
  var TINT_LIGHT = 0.94;
  var BODY_CAP_LOOSE = 0.62;
  var BODY_CAP_TIGHT = 0.38;
  var MAX_DENSITY = 0.92;
  var clamp3 = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  function bodyCap(legibility) {
    return BODY_CAP_LOOSE + (BODY_CAP_TIGHT - BODY_CAP_LOOSE) * clamp3(legibility * 2, 0, 1);
  }
  function bodyDensityFor(local, legibility, bodyDensity2, polarity, spread = 0) {
    const cap = bodyCap(legibility);
    const need = polarity > 0.5 ? local > cap ? clamp3((local - cap) / Math.max(local - TINT_DARK, 1e-4), 0, MAX_DENSITY) : 0 : local < 1 - cap ? clamp3((1 - cap - local) / Math.max(TINT_LIGHT - local, 1e-4), 0, MAX_DENSITY) : 0;
    const s = clamp3(spread, 0, 1);
    const busyFloor = s * (0.15 + (0.85 - 0.15) * clamp3(legibility, 0, 1));
    const demand = clamp3(legibility * 4, 0, 1);
    return Math.max(bodyDensity2, need * demand, busyFloor);
  }
  function bodyLuma(local, legibility, bodyDensity2, polarity, spread = 0, edgeLight2 = 0) {
    const tint = polarity > 0.5 ? TINT_DARK : TINT_LIGHT;
    const density2 = bodyDensityFor(local, legibility, bodyDensity2, polarity, spread);
    const lift = local * edgeLight2 * (0.12 + 0.55 * (1 - local));
    return clamp3(local + (tint - local) * density2 + lift, 0, 1);
  }
  function shouldInkBeLight(sample, legibility, wasLight) {
    const hi = sample.hi ?? sample.luma;
    const decisive = sample.luma * 0.75 + hi * 0.25;
    const cost = bodyDensityFor(decisive, legibility, 0, 1);
    const wantsFlip = wasLight ? cost > FLIP_DENSITY : cost < RETURN_DENSITY;
    return wantsFlip ? !wasLight : wasLight;
  }
  var FLIP_DENSITY = 0.48;
  var RETURN_DENSITY = 0.4;
  var CONFIRMATIONS = 3;

  // ../vire/packages/vireglass/src/adapters.ts
  var NO_TOUCH = {
    x: 0,
    y: 0,
    pullX: 0,
    pullY: 0,
    press: 0,
    radius: 0,
    waveAmp: 0,
    wavePhase: 0
  };
  var NO_MORPH = { offsetX: 0, offsetY: 0, width: 0, height: 0, cornerRadius: 0, smoothing: 0 };
  var NO_PROGRESS = -1;
  var lensMagnify = (o) => 1 + (o.refractionScale - 1) * o.refraction;
  var shapes = /* @__PURE__ */ new Map();
  function channel(entries) {
    const uniformValues = [];
    let shape = shapes.get(entries.length);
    let same = shape !== void 0;
    for (let i = 0; i < entries.length; i += 1) {
      const [name, value] = entries[i];
      const v = typeof value === "number" ? [value] : value;
      if (same && (shape.names[i] !== name || shape.sizes[i] !== v.length)) same = false;
      for (const x of v) uniformValues.push(x);
    }
    if (!same) {
      shape = {
        names: entries.map((e) => e[0]),
        sizes: entries.map((e) => typeof e[1] === "number" ? 1 : e[1].length)
      };
      shapes.set(entries.length, shape);
    }
    return { uniformNames: shape.names, uniformSizes: shape.sizes, uniformValues };
  }
  function toLensProps(optics, geometry, density2, options = {}) {
    const morph = options.morph ?? NO_MORPH;
    const touch = options.touch ?? NO_TOUCH;
    const g = options.groupProbe;
    const group = g && g.length >= 9 ? [
      ["u_probeLuma", g[0]],
      ["u_probeBusy", g[1]],
      ["u_probeRange", [g[2], g[3]]],
      ["u_probeSlope", [g[4], g[5]]],
      ["u_probe", [g[6], g[7], g[8]]]
    ] : [];
    const d = density2;
    const halfW = geometry.width * d / 2;
    const halfH = geometry.height * d / 2;
    const halfMin = Math.min(halfW, halfH);
    return {
      shaderSource: LENS_SHADER,
      glassWidth: geometry.width,
      glassHeight: geometry.height,
      ...channel([
        ["u_halfSize", [halfW, halfH]],
        ["u_corner", Math.min(geometry.cornerRadius * d, halfMin)],
        ["u_bevel", Math.max(bevelDp(geometry, optics) * d, 1)],
        ["u_magnify", lensMagnify(optics)],
        ["u_edgePush", edgePushDp(geometry, optics) * d],
        ["u_chroma", chromaDp(geometry, optics) * d],
        ["u_spherical", sphericalDp(geometry, optics) * d],
        // Мутность от шероховатости поверхности. Живёт в том же дисковом сборе, что и
        // адаптивное рассеяние, и гасится к фаске: там работа другая — гнуть луч и расщеплять.
        ["u_frost", optics.blur * d],
        ["u_ink", optics.ink],
        ["u_legibility", optics.legibility],
        ["u_presence", optics.presence],
        ["u_adaptRadius", optics.adaptRadius * d],
        ["u_bodyTint", [optics.tint.r, optics.tint.g, optics.tint.b]],
        ["u_bodyDensity", optics.bodyDensity],
        ["u_edgeLight", optics.edgeLight],
        ["u_fresnel", optics.fresnel],
        ["u_fresnelPower", optics.fresnelPower],
        // Кромка собирает свет в окрестности детали — это радиус вокруг формы, а не её фаска.
        ["u_reflectReach", optics.gatherRadiusDp * d],
        ["u_film", optics.film],
        ["u_iridescence", optics.iridescence],
        ["u_diffraction", optics.diffraction],
        ["u_colorPickup", optics.colorPickup],
        ["u_morphOffset", [morph.offsetX * d, morph.offsetY * d]],
        ["u_morphHalf", [morph.width * d / 2, morph.height * d / 2]],
        ["u_morphCorner", morph.cornerRadius * d],
        ["u_morphK", morph.smoothing * d],
        ["u_touch", [touch.x * d, touch.y * d]],
        ["u_pull", [touch.pullX * d, touch.pullY * d]],
        ["u_touchPress", touch.press],
        ["u_touchRadius", touch.radius * d],
        ["u_wave", [touch.waveAmp * d, touch.wavePhase]],
        ["u_progress", options.progress ?? NO_PROGRESS],
        ["u_debug", debugIndex(options.debug ?? "normal")],
        ...group
      ])
    };
  }
  function toSurfaceUniforms(optics, geometry, options = {}) {
    const morph = options.morph ?? NO_MORPH;
    const touch = options.touch ?? NO_TOUCH;
    const pad = surfacePadDp(geometry, options.dragLimit ?? 0, morph);
    return {
      u_center: [geometry.width / 2 + pad, geometry.height / 2 + pad],
      u_halfSize: [geometry.width / 2, geometry.height / 2],
      u_corner: Math.min(geometry.cornerRadius, halfMinDp(geometry)),
      u_bevel: bevelDp(geometry, optics),
      u_thickness: bevelFraction(geometry, optics),
      u_morphOffset: [morph.offsetX, morph.offsetY],
      u_morphHalf: [morph.width / 2, morph.height / 2],
      u_morphCorner: morph.cornerRadius,
      u_morphK: morph.smoothing,
      u_specular: optics.specular,
      u_specularPower: optics.specularPower,
      u_edgeDensity: optics.edgeDensity,
      u_dispersion: optics.dispersion,
      u_refraction: optics.refraction,
      // Плотность тинта гасится, когда тело считает линза: рисовать его дважды значит
      // получить двойную заливку, а адаптация у поверхности всё равно невозможна — фона она
      // не видит. Сам цвет остаётся: по нему идёт поглощение у кромки.
      u_tint: [
        optics.tint.r,
        optics.tint.g,
        optics.tint.b,
        options.bodyInLens ? 0 : optics.tintStrength
      ],
      u_shadow: options.shadow ?? 1,
      u_shadowReach: shadowReachDp(geometry),
      u_touch: [touch.x, touch.y],
      u_pull: [touch.pullX, touch.pullY],
      u_touchPress: touch.press,
      u_touchRadius: touch.radius,
      u_wave: [touch.waveAmp, touch.wavePhase],
      u_presence: optics.presence,
      u_progress: options.progress ?? NO_PROGRESS,
      u_debug: debugIndex(options.debug ?? "normal")
    };
  }
  var REST_LIGHT = [-0.577, -0.817];
  var DYNAMIC_UNIFORMS = ["u_press", "u_active", "u_light"];
  var ICON_UNIFORMS = ["u_iconOn", "u_iconScale", "u_inkIdle", "u_inkActive"];
  var OVERLAY_UNIFORMS = ["u_overlayOn"];

  // ../vire/packages/vireglass/src/targets/glsl.ts
  function sizeUniformName(sampler) {
    return sampler.startsWith("u_") ? `${sampler}Size` : `u_${sampler}Size`;
  }
  function convertVecTypes(src) {
    return src.replace(/\bfloat([234])\b/g, "vec$1");
  }
  function convertHalfTypes(src) {
    return src.replace(/\bhalf([234])\b/g, "vec$1").replace(/\bhalf\b/g, "float");
  }
  function convertShaderUniforms(src) {
    return src.replace(/uniform\s+shader\s+(\w+)\s*;/g, (_match, name) => {
      return `uniform sampler2D ${name};
uniform vec2 ${sizeUniformName(name)};`;
    });
  }
  function convertEvalCalls(src) {
    const samplers = /* @__PURE__ */ new Set();
    const declRe = /uniform\s+sampler2D\s+(\w+)\s*;/g;
    for (let m = declRe.exec(src); m; m = declRe.exec(src)) samplers.add(m[1]);
    if (samplers.size === 0) return src;
    const callRe = /(\w+)\.eval\(/g;
    let out = "";
    let cursor = 0;
    for (let m = callRe.exec(src); m; m = callRe.exec(src)) {
      const name = m[1];
      if (!samplers.has(name)) continue;
      const argStart = m.index + m[0].length;
      let depth = 1;
      let i = argStart;
      while (i < src.length && depth > 0) {
        if (src[i] === "(") depth += 1;
        else if (src[i] === ")") depth -= 1;
        i += 1;
      }
      const args = src.slice(argStart, i - 1);
      out += src.slice(cursor, m.index);
      out += `texture(${name}, (${args}) / ${sizeUniformName(name)})`;
      cursor = i;
      callRe.lastIndex = i;
    }
    out += src.slice(cursor);
    return out;
  }
  function convertReturns(mainBody) {
    return mainBody.replace(/\breturn\s+([^;]+);/g, "fragColor = $1; return;");
  }
  var ENTRY_RE = /half4\s+main\s*\(\s*float2\s+(\w+)\s*\)\s*\{/;
  function convertEntryPoint(src) {
    const match = ENTRY_RE.exec(src);
    if (!match) {
      throw new Error('vireglass/targets/glsl: entry point "half4 main(float2 xy)" not found');
    }
    const bodyStart = match.index + match[0].length;
    let depth = 1;
    let i = bodyStart;
    while (i < src.length && depth > 0) {
      if (src[i] === "{") depth += 1;
      else if (src[i] === "}") depth -= 1;
      i += 1;
    }
    const bodyEnd = i - 1;
    const param = match[1];
    const body = convertReturns(src.slice(bodyStart, bodyEnd));
    const head = src.slice(0, match.index);
    const tail = src.slice(i);
    return `${head}void main() {
  vec2 ${param} = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
${body}}${tail}`;
  }
  function addPrologue(src) {
    return "#version 300 es\nprecision highp float;\n\nout vec4 fragColor;\nuniform vec2 u_resolution;\n\n" + src;
  }
  function toGLSL(shaderSource) {
    let out = shaderSource;
    out = convertEntryPoint(out);
    out = convertShaderUniforms(out);
    out = convertEvalCalls(out);
    out = convertVecTypes(out);
    out = convertHalfTypes(out);
    out = addPrologue(out);
    return out;
  }

  // ../vire/packages/vireglass/src/web/gl.ts
  var FULLSCREEN_TRIANGLE_VERTEX_SOURCE = `#version 300 es
const vec2 VG_POS[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() {
  gl_Position = vec4(VG_POS[gl_VertexID], 0.0, 1.0);
}
`;
  function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("vireglass/web: gl.createShader \u0432\u0435\u0440\u043D\u0443\u043B null");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader) ?? "(\u043D\u0435\u0442 \u043B\u043E\u0433\u0430)";
      gl.deleteShader(shader);
      throw new Error(`vireglass/web: \u0448\u0435\u0439\u0434\u0435\u0440 \u043D\u0435 \u0441\u043A\u043E\u043C\u043F\u0438\u043B\u0438\u0440\u043E\u0432\u0430\u043B\u0441\u044F:
${log}`);
    }
    return shader;
  }
  function createProgram(gl, vertexSource, fragmentSource) {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    if (!program) throw new Error("vireglass/web: gl.createProgram \u0432\u0435\u0440\u043D\u0443\u043B null");
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program) ?? "(\u043D\u0435\u0442 \u043B\u043E\u0433\u0430)";
      gl.deleteProgram(program);
      throw new Error(`vireglass/web: \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u0430 \u043D\u0435 \u0441\u043B\u0438\u043D\u043A\u043E\u0432\u0430\u043B\u0430\u0441\u044C:
${log}`);
    }
    return program;
  }
  function drawFullscreenTriangle(gl) {
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function createTexture(gl, options) {
    const texture = gl.createTexture();
    if (!texture) throw new Error("vireglass/web: gl.createTexture \u0432\u0435\u0440\u043D\u0443\u043B null");
    const internalFormat = options.internalFormat ?? gl.RGBA8;
    const format = options.format ?? gl.RGBA;
    const type = options.type ?? gl.UNSIGNED_BYTE;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      internalFormat,
      options.width,
      options.height,
      0,
      format,
      type,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
  }
  function createFramebuffer(gl, texture) {
    const fbo = gl.createFramebuffer();
    if (!fbo) throw new Error("vireglass/web: gl.createFramebuffer \u0432\u0435\u0440\u043D\u0443\u043B null");
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`vireglass/web: FBO \u043D\u0435\u043F\u043E\u043B\u043E\u043D, \u0441\u0442\u0430\u0442\u0443\u0441 ${status}`);
    }
    return fbo;
  }
  function bindTextureAt(gl, unit, texture, program, uniformName) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const loc = gl.getUniformLocation(program, uniformName);
    gl.uniform1i(loc, unit);
  }

  // ../vire/packages/vireglass/src/web/probe.ts
  var PROBE_GRID_WIDTH = 48;
  var PROBE_GRID_HEIGHT = 96;
  var DOWNSAMPLE_FRAGMENT_SOURCE = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform sampler2D u_content;
uniform vec2 u_contentSize;
uniform vec2 u_gridSize;

// \u041E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u044F\u0447\u0435\u0439\u043A\u0430 \u2192 UV \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0433\u043E. \u041D\u0415 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0432\u0438\u0434\u0438\u043C\u043E\u043C\u0443 \u0432\u0435\u0440\u0445\u0443/\u043D\u0438\u0437\u0443 \u043A\u0430\u043D\u0432\u0430\u0441\u0430 \u2014 \u044D\u0442\u043E
// \u0432\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u0438\u0439 \u043F\u0440\u043E\u0445\u043E\u0434, \u0435\u0433\u043E \u0431\u0443\u0444\u0435\u0440 \u043D\u0438\u043A\u043E\u0433\u0434\u0430 \u043D\u0435 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F, \u0442\u043E\u043B\u044C\u043A\u043E \u0447\u0438\u0442\u0430\u0435\u0442\u0441\u044F \u043E\u0431\u0440\u0430\u0442\u043D\u043E \u043D\u0430 CPU \u0442\u043E\u0439
// \u0436\u0435 \u0444\u043E\u0440\u043C\u0443\u043B\u043E\u0439 (\u0441\u043C. rectStats \u043D\u0438\u0436\u0435). \u0421\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435 \u043D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F \u0441 \u0431\u043B\u0438\u0442-\u043F\u0440\u043E\u0445\u043E\u0434\u043E\u043C \u043D\u0435 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F.
void main() {
  vec2 uv = gl_FragCoord.xy / u_gridSize;
  vec3 sum = vec3(0.0);
  const int N = 5;
  vec2 block = u_contentSize / u_gridSize;
  vec2 origin = uv * u_contentSize;
  for (int y = 0; y < N; y++) {
    for (int x = 0; x < N; x++) {
      vec2 p = origin + (vec2(float(x), float(y)) + 0.5) * (block / float(N));
      sum += texture(u_content, p / u_contentSize).rgb;
    }
  }
  fragColor = vec4(sum / float(N * N), 1.0);
}
`;
  function pickDownsampleFormat(gl) {
    const hasFloat = gl.getExtension("EXT_color_buffer_float") !== null;
    return hasFloat ? { internalFormat: gl.RGBA32F, type: gl.FLOAT, floatPrecision: true } : { internalFormat: gl.RGBA8, type: gl.UNSIGNED_BYTE, floatPrecision: false };
  }
  function luma(r, g, b) {
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function rectStats(buffer, floatPrecision, gridW, gridH, contentWidth, contentHeight, rect) {
    const x0 = rect.centerX - rect.halfWidth;
    const x1 = rect.centerX + rect.halfWidth;
    const y0 = rect.centerY - rect.halfHeight;
    const y1 = rect.centerY + rect.halfHeight;
    const lumas = [];
    const nx = [];
    const ny = [];
    let sr = 0;
    let sg = 0;
    let sb = 0;
    const norm = floatPrecision ? 1 : 255;
    for (let row = 0; row < gridH; row++) {
      const cy = (row + 0.5) / gridH * contentHeight;
      if (cy < y0 || cy > y1) continue;
      for (let col = 0; col < gridW; col++) {
        const cx = (col + 0.5) / gridW * contentWidth;
        if (cx < x0 || cx > x1) continue;
        const i = (row * gridW + col) * 4;
        const r = buffer[i] / norm;
        const g = buffer[i + 1] / norm;
        const b = buffer[i + 2] / norm;
        lumas.push(luma(r, g, b));
        nx.push((cx - rect.centerX) / Math.max(rect.halfWidth, 1));
        ny.push((cy - rect.centerY) / Math.max(rect.halfHeight, 1));
        sr += r;
        sg += g;
        sb += b;
      }
    }
    const n = lumas.length;
    if (n === 0) return null;
    let mean = 0;
    for (const v of lumas) mean += v;
    mean /= n;
    let busy = 0;
    for (const v of lumas) busy += Math.abs(v - mean);
    busy = busy / n * 2;
    const sorted = [...lumas].sort((a, b) => a - b);
    const percentile = (p) => {
      const idx = p * (n - 1);
      const lo = Math.floor(idx);
      const hi = Math.ceil(idx);
      return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
    };
    const slope = (xs) => {
      let mx = 0;
      for (const v of xs) mx += v;
      mx /= n;
      let sxx = 0;
      let sxl = 0;
      for (let i = 0; i < n; i++) {
        const dx = xs[i] - mx;
        sxx += dx * dx;
        sxl += dx * (lumas[i] - mean);
      }
      return sxx > 1e-6 ? sxl / sxx : 0;
    };
    return {
      luma: mean,
      busy: Math.min(busy, 1),
      lo: percentile(0.1),
      hi: percentile(0.9),
      slopeX: slope(nx),
      slopeY: slope(ny),
      r: sr / n,
      g: sg / n,
      b: sb / n
    };
  }
  function createProbe(gl, vertexSource) {
    const program = createProgram(gl, vertexSource, DOWNSAMPLE_FRAGMENT_SOURCE);
    const format = pickDownsampleFormat(gl);
    const texture = gl.createTexture();
    if (!texture) throw new Error("vireglass/web/probe: gl.createTexture \u0432\u0435\u0440\u043D\u0443\u043B null");
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      format.internalFormat,
      PROBE_GRID_WIDTH,
      PROBE_GRID_HEIGHT,
      0,
      gl.RGBA,
      format.type,
      null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
    const fbo = createFramebuffer(gl, texture);
    const byteSize = PROBE_GRID_WIDTH * PROBE_GRID_HEIGHT * 4 * (format.floatPrecision ? 4 : 1);
    const slots = [0, 1].map(() => {
      const buffer = gl.createBuffer();
      if (!buffer) throw new Error("vireglass/web/probe: gl.createBuffer \u0432\u0435\u0440\u043D\u0443\u043B null");
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, buffer);
      gl.bufferData(gl.PIXEL_PACK_BUFFER, byteSize, gl.STREAM_READ);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      return { buffer, sync: null, pending: false };
    });
    let cursor = 0;
    let latestRaw = null;
    const contentLoc = gl.getUniformLocation(program, "u_content");
    const contentSizeLoc = gl.getUniformLocation(program, "u_contentSize");
    const gridSizeLoc = gl.getUniformLocation(program, "u_gridSize");
    function pollReady(slot) {
      if (!slot.pending || !slot.sync) return;
      const status = gl.clientWaitSync(slot.sync, 0, 0);
      if (status === gl.TIMEOUT_EXPIRED) return;
      gl.deleteSync(slot.sync);
      slot.sync = null;
      slot.pending = false;
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, slot.buffer);
      const out = format.floatPrecision ? new Float32Array(PROBE_GRID_WIDTH * PROBE_GRID_HEIGHT * 4) : new Uint8Array(PROBE_GRID_WIDTH * PROBE_GRID_HEIGHT * 4);
      gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, out);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      latestRaw = out;
    }
    function sample(contentTexture, contentWidth, contentHeight, rect) {
      for (const slot2 of slots) pollReady(slot2);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, PROBE_GRID_WIDTH, PROBE_GRID_HEIGHT);
      gl.useProgram(program);
      bindTextureAt(gl, 0, contentTexture, program, "u_content");
      gl.uniform1i(contentLoc, 0);
      gl.uniform2f(contentSizeLoc, contentWidth, contentHeight);
      gl.uniform2f(gridSizeLoc, PROBE_GRID_WIDTH, PROBE_GRID_HEIGHT);
      gl.disable(gl.BLEND);
      drawFullscreenTriangle(gl);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const slot = slots[cursor];
      cursor = (cursor + 1) % slots.length;
      if (!slot.pending) {
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, fbo);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, slot.buffer);
        gl.readPixels(0, 0, PROBE_GRID_WIDTH, PROBE_GRID_HEIGHT, gl.RGBA, format.type, 0);
        gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
        slot.sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        slot.pending = true;
      }
      return statsFor(contentWidth, contentHeight, rect);
    }
    function statsFor(contentWidth, contentHeight, rect) {
      if (!latestRaw) return null;
      return rectStats(
        latestRaw,
        format.floatPrecision,
        PROBE_GRID_WIDTH,
        PROBE_GRID_HEIGHT,
        contentWidth,
        contentHeight,
        rect
      );
    }
    function destroy() {
      for (const slot of slots) {
        if (slot.sync) gl.deleteSync(slot.sync);
        gl.deleteBuffer(slot.buffer);
      }
      gl.deleteFramebuffer(fbo);
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
    }
    return { sample, statsFor, destroy };
  }

  // ../vire/packages/vireglass/src/web/renderer.ts
  var BLIT_FRAGMENT_SOURCE = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform sampler2D u_content;
uniform vec2 u_resolution;
void main() {
  // \u0422\u043E\u0442 \u0436\u0435 \u0444\u043B\u0438\u043F Y, \u0447\u0442\u043E \u0434\u0435\u043B\u0430\u0435\u0442 \u0442\u0440\u0430\u043D\u0441\u043F\u0430\u0439\u043B\u0435\u0440 \u0434\u043B\u044F \u043B\u0438\u043D\u0437\u044B/\u043F\u043E\u0432\u0435\u0440\u0445\u043D\u043E\u0441\u0442\u0438 (targets/glsl.ts):
  // content \u0437\u0430\u043B\u0438\u0442 \u0438\u0437 2D-\u043A\u0430\u043D\u0432\u0430\u0441\u0430 \u0411\u0415\u0417 \u043F\u0435\u0440\u0435\u0432\u043E\u0440\u043E\u0442\u0430, \u0435\u0433\u043E V=0 \u2014 \u0432\u0435\u0440\u0445\u043D\u044F\u044F \u0441\u0442\u0440\u043E\u043A\u0430 \u0441\u0446\u0435\u043D\u044B. \u0417\u0434\u0435\u0441\u044C \u0442\u043E\u0442
  // \u0436\u0435 \u043F\u043E\u0440\u044F\u0434\u043E\u043A, \u0438\u043D\u0430\u0447\u0435 \u0444\u043E\u043D \u0438 \u0442\u043E, \u0447\u0442\u043E \u0447\u0435\u0440\u0435\u0437 \u043D\u0435\u0433\u043E \u043F\u0440\u0435\u043B\u043E\u043C\u043B\u044F\u0435\u0442 \u043B\u0438\u043D\u0437\u0430, \u0440\u0430\u0437\u044A\u0435\u0437\u0436\u0430\u044E\u0442\u0441\u044F \u043F\u043E \u0432\u0435\u0440\u0442\u0438\u043A\u0430\u043B\u0438.
  vec2 uv = gl_FragCoord.xy / u_resolution;
  uv.y = 1.0 - uv.y;
  fragColor = texture(u_content, uv);
}
`;
  function locationCache(gl, program) {
    const cache = /* @__PURE__ */ new Map();
    return (name) => {
      let loc = cache.get(name);
      if (loc === void 0) {
        loc = gl.getUniformLocation(program, name);
        cache.set(name, loc);
      }
      return loc;
    };
  }
  function setUniform(gl, loc, value) {
    if (!loc) return;
    if (typeof value === "number") {
      gl.uniform1f(loc, value);
      return;
    }
    switch (value.length) {
      case 1:
        gl.uniform1f(loc, value[0]);
        break;
      case 2:
        gl.uniform2f(loc, value[0], value[1]);
        break;
      case 3:
        gl.uniform3f(loc, value[0], value[1], value[2]);
        break;
      case 4:
        gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
        break;
      default:
        throw new Error(`vireglass/web: \u043D\u0435\u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0430\u043D\u043D\u044B\u0439 \u0440\u0430\u0437\u043C\u0435\u0440 \u0443\u043D\u0438\u0444\u043E\u0440\u043C\u044B (${value.length})`);
    }
  }
  function applyChannel(gl, get, names, sizes, values) {
    let cursor = 0;
    for (let i = 0; i < names.length; i += 1) {
      const size = sizes[i];
      setUniform(gl, get(names[i]), values.slice(cursor, cursor + size));
      cursor += size;
    }
  }
  function applyObject(gl, get, values) {
    for (const name of Object.keys(values)) setUniform(gl, get(name), values[name]);
  }
  function createVireGlassRenderer(canvas, options = {}) {
    const context = canvas.getContext("webgl2", {
      preserveDrawingBuffer: true,
      alpha: options.alpha ?? false,
      antialias: false
    });
    if (!context) throw new Error("vireglass/web: WebGL2 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D");
    const gl = context;
    const blitProgram = createProgram(gl, FULLSCREEN_TRIANGLE_VERTEX_SOURCE, BLIT_FRAGMENT_SOURCE);
    const lensProgram = createProgram(gl, FULLSCREEN_TRIANGLE_VERTEX_SOURCE, toGLSL(LENS_SHADER));
    const surfaceProgram = createProgram(
      gl,
      FULLSCREEN_TRIANGLE_VERTEX_SOURCE,
      toGLSL(SURFACE_SHADER)
    );
    const probe = createProbe(gl, FULLSCREEN_TRIANGLE_VERTEX_SOURCE);
    const blitLoc = locationCache(gl, blitProgram);
    const lensLoc = locationCache(gl, lensProgram);
    const surfaceLoc = locationCache(gl, surfaceProgram);
    let width = canvas.width;
    let height = canvas.height;
    let sceneCanvas = document.createElement("canvas");
    let sceneCtx = sceneCanvas.getContext("2d");
    if (!sceneCtx) throw new Error("vireglass/web: 2D-\u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 \u0441\u0446\u0435\u043D\u044B \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D");
    const settled = /* @__PURE__ */ new Map();
    const SETTLE2 = 0.12;
    function settleStats(index, fresh) {
      const prev = settled.get(index);
      if (!prev) {
        settled.set(index, fresh);
        return fresh;
      }
      const mix = (a, b) => a + (b - a) * SETTLE2;
      const next = {
        luma: mix(prev.luma, fresh.luma),
        busy: mix(prev.busy, fresh.busy),
        lo: mix(prev.lo, fresh.lo),
        hi: mix(prev.hi, fresh.hi),
        slopeX: mix(prev.slopeX, fresh.slopeX),
        slopeY: mix(prev.slopeY, fresh.slopeY),
        r: mix(prev.r, fresh.r),
        g: mix(prev.g, fresh.g),
        b: mix(prev.b, fresh.b)
      };
      settled.set(index, next);
      return next;
    }
    let contentTexture = createTexture(gl, {
      width: Math.max(width, 1),
      height: Math.max(height, 1)
    });
    const iconTexture = createTexture(gl, { width: 1, height: 1 });
    const colorTexture = createTexture(gl, { width: 1, height: 1 });
    gl.bindTexture(gl.TEXTURE_2D, iconTexture);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      1,
      1,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 0])
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
    function resize(widthPx, heightPx) {
      width = Math.max(1, Math.round(widthPx));
      height = Math.max(1, Math.round(heightPx));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      sceneCanvas = document.createElement("canvas");
      sceneCanvas.width = width;
      sceneCanvas.height = height;
      sceneCtx = sceneCanvas.getContext("2d");
      if (!sceneCtx) throw new Error("vireglass/web: 2D-\u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 \u0441\u0446\u0435\u043D\u044B \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D");
      gl.deleteTexture(contentTexture);
      contentTexture = createTexture(gl, { width, height });
    }
    function render(options2) {
      if (!sceneCtx) throw new Error("vireglass/web: \u0440\u0435\u043D\u0434\u0435\u0440\u0435\u0440 \u043D\u0435 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D (resize \u043D\u0435 \u0432\u044B\u0437\u0432\u0430\u043D)");
      sceneCtx.clearRect(0, 0, width, height);
      options2.scene(sceneCtx, width, height, options2.offsetX ?? 0, options2.offsetY ?? 0);
      gl.bindTexture(gl.TEXTURE_2D, contentTexture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, sceneCanvas);
      gl.bindTexture(gl.TEXTURE_2D, null);
      if (options2.colorLayer) {
        gl.bindTexture(gl.TEXTURE_2D, colorTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, options2.colorLayer);
      }
      if (options2.iconMask) {
        gl.bindTexture(gl.TEXTURE_2D, iconTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, options2.iconMask);
        gl.bindTexture(gl.TEXTURE_2D, null);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.disable(gl.BLEND);
      gl.disable(gl.SCISSOR_TEST);
      if (options2.backdrop ?? true) {
        gl.useProgram(blitProgram);
        bindTextureAt(gl, 0, contentTexture, blitProgram, "u_content");
        setUniform(gl, blitLoc("u_resolution"), [width, height]);
        drawFullscreenTriangle(gl);
      } else {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      const probes = [];
      for (let index = 0; index < options2.pieces.length; index += 1) {
        const piece = options2.pieces[index];
        const halfWidth = piece.geometry.width * options2.density / 2;
        const halfHeight = piece.geometry.height * options2.density / 2;
        const rect = {
          centerX: piece.centerX,
          centerY: piece.centerY,
          halfWidth,
          halfHeight
        };
        const fresh = index === 0 ? probe.sample(contentTexture, width, height, rect) : probe.statsFor(width, height, rect);
        const stats = fresh ? settleStats(index, fresh) : null;
        probes.push(stats);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        const morphReach = piece.morph ? Math.hypot(piece.morph.offsetX, piece.morph.offsetY) + Math.max(piece.morph.width, piece.morph.height) / 2 + piece.morph.smoothing : 0;
        const touchReach = piece.touch ? Math.hypot(piece.touch.pullX, piece.touch.pullY) + piece.touch.waveAmp * 2 : 0;
        const padPx = (lensPadDp(piece.geometry, piece.optics) + surfacePadDp(piece.geometry, 0) + morphReach + touchReach) * options2.density;
        const left = Math.max(0, Math.floor(piece.centerX - halfWidth - padPx));
        const right = Math.min(width, Math.ceil(piece.centerX + halfWidth + padPx));
        const top = Math.max(0, Math.floor(height - (piece.centerY + halfHeight + padPx)));
        const bottom = Math.min(height, Math.ceil(height - (piece.centerY - halfHeight - padPx)));
        gl.enable(gl.SCISSOR_TEST);
        gl.scissor(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
        const withLens = piece.lens ?? true;
        if (withLens) {
          gl.useProgram(lensProgram);
          bindTextureAt(gl, 0, contentTexture, lensProgram, "content");
          setUniform(gl, lensLoc("u_contentSize"), [width, height]);
          setUniform(gl, lensLoc("u_resolution"), [width, height]);
          setUniform(gl, lensLoc("u_center"), [piece.centerX, piece.centerY]);
          setUniform(gl, lensLoc("u_reach"), Math.max(width, height));
          setUniform(gl, lensLoc("u_contentMin"), [1, 1]);
          setUniform(gl, lensLoc("u_contentMax"), [width - 1, height - 1]);
          if (stats) {
            setUniform(gl, lensLoc("u_probeLuma"), stats.luma);
            setUniform(gl, lensLoc("u_probeBusy"), stats.busy);
            setUniform(gl, lensLoc("u_probeRange"), [stats.lo, stats.hi]);
            setUniform(gl, lensLoc("u_probeSlope"), [stats.slopeX, stats.slopeY]);
            setUniform(gl, lensLoc("u_probe"), [stats.r, stats.g, stats.b]);
          } else {
            setUniform(gl, lensLoc("u_probeLuma"), -1);
          }
          const lens = toLensProps(piece.optics, piece.geometry, options2.density, {
            debug: options2.debug,
            morph: piece.morph,
            touch: piece.touch,
            progress: piece.progress
          });
          applyChannel(gl, lensLoc, lens.uniformNames, lens.uniformSizes, lens.uniformValues);
          drawFullscreenTriangle(gl);
        }
        gl.useProgram(surfaceProgram);
        const rawSurface = toSurfaceUniforms(piece.optics, piece.geometry, {
          debug: options2.debug,
          morph: piece.morph,
          bodyInLens: withLens,
          touch: piece.touch,
          progress: piece.progress
        });
        const d = options2.density;
        applyObject(gl, surfaceLoc, {
          ...rawSurface,
          u_center: [piece.centerX, piece.centerY],
          u_halfSize: [rawSurface.u_halfSize[0] * d, rawSurface.u_halfSize[1] * d],
          u_corner: rawSurface.u_corner * d,
          u_bevel: rawSurface.u_bevel * d,
          u_morphOffset: [rawSurface.u_morphOffset[0] * d, rawSurface.u_morphOffset[1] * d],
          u_morphHalf: [rawSurface.u_morphHalf[0] * d, rawSurface.u_morphHalf[1] * d],
          u_morphCorner: rawSurface.u_morphCorner * d,
          u_morphK: rawSurface.u_morphK * d,
          u_shadowReach: rawSurface.u_shadowReach * d,
          u_touch: [rawSurface.u_touch[0] * d, rawSurface.u_touch[1] * d],
          u_pull: [rawSurface.u_pull[0] * d, rawSurface.u_pull[1] * d],
          u_touchRadius: rawSurface.u_touchRadius * d,
          u_wave: [rawSurface.u_wave[0] * d, rawSurface.u_wave[1]]
        });
        setUniform(gl, surfaceLoc(DYNAMIC_UNIFORMS[0]), piece.press ?? 0);
        setUniform(gl, surfaceLoc(DYNAMIC_UNIFORMS[1]), piece.active ?? 0);
        setUniform(gl, surfaceLoc(DYNAMIC_UNIFORMS[2]), REST_LIGHT);
        const hasIcon = Boolean(piece.icon && options2.iconMask);
        setUniform(gl, surfaceLoc(ICON_UNIFORMS[0]), hasIcon ? 1 : 0);
        setUniform(gl, surfaceLoc(ICON_UNIFORMS[1]), 1);
        setUniform(gl, surfaceLoc(ICON_UNIFORMS[2]), piece.inkIdle ?? [1, 1, 1, 1]);
        setUniform(gl, surfaceLoc(ICON_UNIFORMS[3]), piece.inkActive ?? [1, 1, 1, 1]);
        bindTextureAt(gl, 1, iconTexture, surfaceProgram, "u_icon");
        setUniform(gl, surfaceLoc("u_iconSize"), hasIcon ? [width, height] : [1, 1]);
        const hasColor = Boolean(piece.overlay && options2.colorLayer);
        setUniform(gl, surfaceLoc(OVERLAY_UNIFORMS[0]), hasColor ? 1 : 0);
        bindTextureAt(gl, 2, colorTexture, surfaceProgram, "u_overlay");
        setUniform(gl, surfaceLoc("u_overlaySize"), hasColor ? [width, height] : [1, 1]);
        setUniform(gl, surfaceLoc("u_resolution"), [width, height]);
        drawFullscreenTriangle(gl);
      }
      gl.disable(gl.SCISSOR_TEST);
      return { probes };
    }
    function destroy() {
      probe.destroy();
      gl.deleteProgram(blitProgram);
      gl.deleteProgram(lensProgram);
      gl.deleteProgram(surfaceProgram);
      gl.deleteTexture(contentTexture);
      gl.deleteTexture(iconTexture);
      gl.deleteTexture(colorTexture);
    }
    return { resize, render, destroy };
  }

  // src/glass/entry.ts
  var MATERIAL = materialForInk(
    // Шероховатость — на потолке модели: у листового материала 0.85, и сквозь него всё
    // ещё пролезают светлые пятна от текста страницы. Деталь лежит поверх живого текста,
    // мутность здесь работает на читаемость, а не на красоту.
    { ...VIREGLASS_CONTROL_MATERIAL, roughness: MATERIAL_RANGES.roughness[1] },
    true
  );
  var SETTLE = 0.12;
  var density = () => window.devicePixelRatio || 1;
  function displacementMap(width, height, radius, bevel, push) {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return "";
    const img = ctx.createImageData(w, h);
    const hx = w / 2;
    const hy = h / 2;
    const r = Math.min(radius, Math.min(hx, hy));
    const band = Math.max(1, bevel);
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const px = x + 0.5 - hx;
        const py = y + 0.5 - hy;
        const qx = Math.abs(px) - (hx - r);
        const qy = Math.abs(py) - (hy - r);
        const mx = Math.max(qx, 0);
        const my = Math.max(qy, 0);
        const d = Math.hypot(mx, my) + Math.min(Math.max(qx, qy), 0) - r;
        let nx = 0;
        let ny = 0;
        if (d < 0) {
          const t = Math.min(1, Math.max(0, 1 + d / band));
          if (t > 0) {
            if (mx > 0 && my > 0) {
              const len = Math.hypot(mx, my) || 1;
              nx = mx / len * Math.sign(px);
              ny = my / len * Math.sign(py);
            } else if (qx > qy) {
              nx = Math.sign(px);
            } else {
              ny = Math.sign(py);
            }
            const k = -(t * t);
            nx *= k;
            ny *= k;
          }
        }
        const i = (y * w + x) * 4;
        img.data[i] = Math.round(128 + nx * 127);
        img.data[i + 1] = Math.round(128 + ny * 127);
        img.data[i + 2] = 128;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
  }
  function createGlassSurface(canvas, maxWidth, maxHeight) {
    const renderer = createVireGlassRenderer(canvas, { alpha: true });
    const deform = createDeform();
    const widest = roundedRectGeometry(maxWidth, maxHeight, 28);
    const pad = Math.ceil(lensPadDp(widest, resolveOptics(MATERIAL)) + surfacePadDp(widest));
    const boxW = maxWidth + pad * 2;
    const boxH = maxHeight + pad * 2;
    canvas.style.width = boxW + "px";
    canvas.style.height = boxH + "px";
    let scale = 0;
    function fit(next) {
      if (next === scale) return;
      scale = next;
      renderer.resize(Math.ceil(boxW * scale), Math.ceil(boxH * scale));
    }
    fit(density());
    let backdrop = "#ffffff";
    let spreadTarget = 0;
    let spread = 0;
    let settledAlpha = -1;
    let settledLevel = -1;
    let aimAlpha = -1;
    let aimLevel = -1;
    let inkLight = true;
    let confirmations = 0;
    let last = null;
    let prev = 0;
    let shape = widest;
    const scene = (ctx, w, h) => {
      ctx.fillStyle = backdrop;
      ctx.fillRect(0, 0, w, h);
    };
    return {
      /** Отступ канваса за габарит детали: тень, фаска и сбор света уходят наружу формы. */
      pad,
      setBackdropColor(color) {
        backdrop = color;
      },
      /** Разнородность фона под деталью, 0…1 — параметр `spread` модели. Зонд снимает её
       *  с нарисованной сцены, а наша сцена ровная: пестроту живой страницы туда не подать.
       *  Без неё модель считает фон однородным и плотности не требует — тогда подписи
       *  панели ложатся прямо на текст страницы. */
      setSpread(value) {
        spreadTarget = Math.min(1, Math.max(0, value));
      },
      /** Доехали ли параметры материала до цели — по этому решают, рисовать ли дальше.
       *  Спрашивать только про пестроту мало: плотность и цвет тела подъезжают своим
       *  SETTLE, а полярность надписи ждёт CONFIRMATIONS кадров. Остановись раньше —
       *  и на медленной машине панель замирает недоехавшей: тело вполсилы, надпись
       *  прежней полярности. Ровно так это и выглядит на слабом GPU. */
      settled: () => Math.abs(spread - spreadTarget) < 5e-3 && confirmations === 0 && (aimAlpha < 0 || Math.abs(settledAlpha - aimAlpha) < 2e-3) && (aimLevel < 0 || Math.abs(settledLevel - aimLevel) < 0.5),
      /** Отклик на курсор — пружины ядра и его же пропорции, что на стенде:
       *  ход тяги и радиус пальца берутся от полуразмера детали, не «на глаз». */
      grab: (x, y) => deform.grab(x, y, 3.2),
      drag(dx, dy) {
        deform.drag(dx, dy, 0.14 * halfMinDp(shape));
      },
      release: () => deform.release(1.8),
      idle: () => deform.idle(),
      /**
       * Преломление живого DOM: карта смещений под feDisplacementMap плюс величина
       * сдвига и мутность — всё из оптики ядра. Пересчитывается только на смену формы:
       * это растр, и гонять его каждый кадр морфинга незачем.
       */
      refraction(width, height, cornerRadius) {
        const geometry = roundedRectGeometry(width, height, cornerRadius);
        const optics = resolveOptics(MATERIAL);
        const bevel = bevelDp(geometry, optics);
        const push = bevel * optics.refraction;
        return {
          map: displacementMap(width, height, cornerRadius, bevel, push),
          scale: push * 2,
          blur: optics.blur
        };
      },
      /** Возвращает, должна ли надпись поверх стекла быть светлой. */
      draw(width, height, cornerRadius, anchor = "br") {
        fit(density());
        const now = performance.now();
        deform.step(prev ? Math.min((now - prev) / 1e3, 0.25) : 0);
        prev = now;
        const geometry = roundedRectGeometry(width, height, cornerRadius);
        shape = geometry;
        const d = deform.sample();
        const material = { ...activeMaterial(MATERIAL, d.active), ink: inkLight ? 1 : 0 };
        const optics = applyToggles(resolveOptics(material), { tint: false });
        const left = anchor === "bl" || anchor === "tl" ? pad : boxW - pad - width;
        const top = anchor === "tl" || anchor === "tr" ? pad : boxH - pad - height;
        const centerX = (left + width / 2) * scale;
        const centerY = (top + height / 2) * scale;
        const { probes } = renderer.render({
          density: scale,
          debug: "normal",
          scene,
          backdrop: false,
          pieces: [
            {
              optics,
              geometry,
              centerX,
              centerY,
              lens: false,
              press: d.press,
              active: d.active,
              // Успокоившаяся деталь — ровно нейтральный материал. Точка касания живёт
              // дольше самой деформации, и на сменившей габарит форме она остаётся
              // продавленной в устаревшем месте — видно пятном на пустом месте.
              touch: deform.idle() ? void 0 : {
                x: d.touchX,
                y: d.touchY,
                pullX: d.pullX,
                pullY: d.pullY,
                press: d.press,
                radius: 0.72 * halfMinDp(geometry),
                waveAmp: d.waveAmp,
                wavePhase: d.wavePhase
              }
            }
          ]
        });
        const stats = probes[0];
        last = stats;
        if (stats) {
          const wants = shouldInkBeLight(stats, material.legibility, inkLight);
          if (wants === inkLight) {
            confirmations = 0;
          } else if (++confirmations >= CONFIRMATIONS) {
            inkLight = wants;
            confirmations = 0;
          }
        }
        spread += (spreadTarget - spread) * SETTLE;
        const local = stats ? stats.luma : 1;
        const alpha = bodyDensityFor(local, material.legibility, optics.bodyDensity, material.ink, spread);
        const aim = bodyLuma(local, material.legibility, optics.bodyDensity, material.ink, spread);
        const tint = alpha > 1e-3 ? (aim - local * (1 - alpha)) / alpha : material.ink > 0.5 ? 0 : 1;
        const level = Math.round(Math.min(1, Math.max(0, tint)) * 255);
        aimAlpha = alpha;
        aimLevel = level;
        settledAlpha = settledAlpha < 0 ? alpha : settledAlpha + (alpha - settledAlpha) * SETTLE;
        settledLevel = settledLevel < 0 ? level : settledLevel + (level - settledLevel) * SETTLE;
        return {
          inkLight,
          body: `rgba(${Math.round(settledLevel)}, ${Math.round(settledLevel)}, ${Math.round(settledLevel)}, ${settledAlpha.toFixed(3)})`
        };
      },
      /** Последний замер фона и решение по надписи — для отладки материала. */
      probe: () => ({ stats: last, inkLight, backdrop }),
      destroy: () => renderer.destroy()
    };
  }
  return __toCommonJS(entry_exports);
})();
