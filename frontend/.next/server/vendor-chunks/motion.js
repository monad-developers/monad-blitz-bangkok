"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/motion";
exports.ids = ["vendor-chunks/motion"];
exports.modules = {

/***/ "(ssr)/../node_modules/motion/dist/animate.cjs.js":
/*!**************************************************!*\
  !*** ../node_modules/motion/dist/animate.cjs.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\n\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\n\nvar dom = __webpack_require__(/*! @motionone/dom */ \"(ssr)/../node_modules/@motionone/dom/dist/index.cjs.js\");\nvar utils = __webpack_require__(/*! @motionone/utils */ \"(ssr)/../node_modules/@motionone/utils/dist/index.cjs.js\");\nvar animation = __webpack_require__(/*! @motionone/animation */ \"(ssr)/../node_modules/@motionone/animation/dist/index.cjs.js\");\n\nfunction animateProgress(target, options = {}) {\n    return dom.withControls([\n        () => {\n            const animation$1 = new animation.Animation(target, [0, 1], options);\n            animation$1.finished.catch(() => { });\n            return animation$1;\n        },\n    ], options, options.duration);\n}\nfunction animate(target, keyframesOrOptions, options) {\n    const factory = utils.isFunction(target) ? animateProgress : dom.animate;\n    return factory(target, keyframesOrOptions, options);\n}\n\nexports.animate = animate;\nexports.animateProgress = animateProgress;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vbm9kZV9tb2R1bGVzL21vdGlvbi9kaXN0L2FuaW1hdGUuY2pzLmpzIiwibWFwcGluZ3MiOiJBQUFhOztBQUViLDhDQUE2QyxFQUFFLGFBQWEsRUFBQzs7QUFFN0QsVUFBVSxtQkFBTyxDQUFDLDhFQUFnQjtBQUNsQyxZQUFZLG1CQUFPLENBQUMsa0ZBQWtCO0FBQ3RDLGdCQUFnQixtQkFBTyxDQUFDLDBGQUFzQjs7QUFFOUMsNkNBQTZDO0FBQzdDO0FBQ0E7QUFDQTtBQUNBLGdEQUFnRDtBQUNoRDtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsZUFBZTtBQUNmLHVCQUF1QiIsInNvdXJjZXMiOlsid2VicGFjazovL0BibGl0em5hZC9mcm9udGVuZC8uLi9ub2RlX21vZHVsZXMvbW90aW9uL2Rpc3QvYW5pbWF0ZS5janMuanM/NmZhZCJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbnZhciBkb20gPSByZXF1aXJlKCdAbW90aW9ub25lL2RvbScpO1xudmFyIHV0aWxzID0gcmVxdWlyZSgnQG1vdGlvbm9uZS91dGlscycpO1xudmFyIGFuaW1hdGlvbiA9IHJlcXVpcmUoJ0Btb3Rpb25vbmUvYW5pbWF0aW9uJyk7XG5cbmZ1bmN0aW9uIGFuaW1hdGVQcm9ncmVzcyh0YXJnZXQsIG9wdGlvbnMgPSB7fSkge1xuICAgIHJldHVybiBkb20ud2l0aENvbnRyb2xzKFtcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgYW5pbWF0aW9uJDEgPSBuZXcgYW5pbWF0aW9uLkFuaW1hdGlvbih0YXJnZXQsIFswLCAxXSwgb3B0aW9ucyk7XG4gICAgICAgICAgICBhbmltYXRpb24kMS5maW5pc2hlZC5jYXRjaCgoKSA9PiB7IH0pO1xuICAgICAgICAgICAgcmV0dXJuIGFuaW1hdGlvbiQxO1xuICAgICAgICB9LFxuICAgIF0sIG9wdGlvbnMsIG9wdGlvbnMuZHVyYXRpb24pO1xufVxuZnVuY3Rpb24gYW5pbWF0ZSh0YXJnZXQsIGtleWZyYW1lc09yT3B0aW9ucywgb3B0aW9ucykge1xuICAgIGNvbnN0IGZhY3RvcnkgPSB1dGlscy5pc0Z1bmN0aW9uKHRhcmdldCkgPyBhbmltYXRlUHJvZ3Jlc3MgOiBkb20uYW5pbWF0ZTtcbiAgICByZXR1cm4gZmFjdG9yeSh0YXJnZXQsIGtleWZyYW1lc09yT3B0aW9ucywgb3B0aW9ucyk7XG59XG5cbmV4cG9ydHMuYW5pbWF0ZSA9IGFuaW1hdGU7XG5leHBvcnRzLmFuaW1hdGVQcm9ncmVzcyA9IGFuaW1hdGVQcm9ncmVzcztcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/../node_modules/motion/dist/animate.cjs.js\n");

/***/ }),

/***/ "(ssr)/../node_modules/motion/dist/main.cjs.js":
/*!***********************************************!*\
  !*** ../node_modules/motion/dist/main.cjs.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

eval("\n\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\n\nvar dom = __webpack_require__(/*! @motionone/dom */ \"(ssr)/../node_modules/@motionone/dom/dist/index.cjs.js\");\nvar types = __webpack_require__(/*! @motionone/types */ \"(ssr)/../node_modules/@motionone/types/dist/index.cjs.js\");\nvar animate = __webpack_require__(/*! ./animate.cjs.js */ \"(ssr)/../node_modules/motion/dist/animate.cjs.js\");\n\n\n\nexports.animate = animate.animate;\nObject.keys(dom).forEach(function (k) {\n\tif (k !== 'default' && !exports.hasOwnProperty(k)) Object.defineProperty(exports, k, {\n\t\tenumerable: true,\n\t\tget: function () { return dom[k]; }\n\t});\n});\nObject.keys(types).forEach(function (k) {\n\tif (k !== 'default' && !exports.hasOwnProperty(k)) Object.defineProperty(exports, k, {\n\t\tenumerable: true,\n\t\tget: function () { return types[k]; }\n\t});\n});\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vbm9kZV9tb2R1bGVzL21vdGlvbi9kaXN0L21haW4uY2pzLmpzIiwibWFwcGluZ3MiOiJBQUFhOztBQUViLDhDQUE2QyxFQUFFLGFBQWEsRUFBQzs7QUFFN0QsVUFBVSxtQkFBTyxDQUFDLDhFQUFnQjtBQUNsQyxZQUFZLG1CQUFPLENBQUMsa0ZBQWtCO0FBQ3RDLGNBQWMsbUJBQU8sQ0FBQywwRUFBa0I7Ozs7QUFJeEMsZUFBZTtBQUNmO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixFQUFFO0FBQ0YsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQixFQUFFO0FBQ0YsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL0BibGl0em5hZC9mcm9udGVuZC8uLi9ub2RlX21vZHVsZXMvbW90aW9uL2Rpc3QvbWFpbi5janMuanM/ZjliZiJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbnZhciBkb20gPSByZXF1aXJlKCdAbW90aW9ub25lL2RvbScpO1xudmFyIHR5cGVzID0gcmVxdWlyZSgnQG1vdGlvbm9uZS90eXBlcycpO1xudmFyIGFuaW1hdGUgPSByZXF1aXJlKCcuL2FuaW1hdGUuY2pzLmpzJyk7XG5cblxuXG5leHBvcnRzLmFuaW1hdGUgPSBhbmltYXRlLmFuaW1hdGU7XG5PYmplY3Qua2V5cyhkb20pLmZvckVhY2goZnVuY3Rpb24gKGspIHtcblx0aWYgKGsgIT09ICdkZWZhdWx0JyAmJiAhZXhwb3J0cy5oYXNPd25Qcm9wZXJ0eShrKSkgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGssIHtcblx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuXHRcdGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gZG9tW2tdOyB9XG5cdH0pO1xufSk7XG5PYmplY3Qua2V5cyh0eXBlcykuZm9yRWFjaChmdW5jdGlvbiAoaykge1xuXHRpZiAoayAhPT0gJ2RlZmF1bHQnICYmICFleHBvcnRzLmhhc093blByb3BlcnR5KGspKSBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgaywge1xuXHRcdGVudW1lcmFibGU6IHRydWUsXG5cdFx0Z2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiB0eXBlc1trXTsgfVxuXHR9KTtcbn0pO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/../node_modules/motion/dist/main.cjs.js\n");

/***/ })

};
;