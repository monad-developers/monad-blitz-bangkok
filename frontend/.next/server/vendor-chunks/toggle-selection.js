/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/toggle-selection";
exports.ids = ["vendor-chunks/toggle-selection"];
exports.modules = {

/***/ "(ssr)/../node_modules/toggle-selection/index.js":
/*!*************************************************!*\
  !*** ../node_modules/toggle-selection/index.js ***!
  \*************************************************/
/***/ ((module) => {

eval("\nmodule.exports = function () {\n  var selection = document.getSelection();\n  if (!selection.rangeCount) {\n    return function () {};\n  }\n  var active = document.activeElement;\n\n  var ranges = [];\n  for (var i = 0; i < selection.rangeCount; i++) {\n    ranges.push(selection.getRangeAt(i));\n  }\n\n  switch (active.tagName.toUpperCase()) { // .toUpperCase handles XHTML\n    case 'INPUT':\n    case 'TEXTAREA':\n      active.blur();\n      break;\n\n    default:\n      active = null;\n      break;\n  }\n\n  selection.removeAllRanges();\n  return function () {\n    selection.type === 'Caret' &&\n    selection.removeAllRanges();\n\n    if (!selection.rangeCount) {\n      ranges.forEach(function(range) {\n        selection.addRange(range);\n      });\n    }\n\n    active &&\n    active.focus();\n  };\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vbm9kZV9tb2R1bGVzL3RvZ2dsZS1zZWxlY3Rpb24vaW5kZXguanMiLCJtYXBwaW5ncyI6IjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLGtCQUFrQiwwQkFBMEI7QUFDNUM7QUFDQTs7QUFFQSwwQ0FBMEM7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQOztBQUVBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQGJsaXR6bmFkL2Zyb250ZW5kLy4uL25vZGVfbW9kdWxlcy90b2dnbGUtc2VsZWN0aW9uL2luZGV4LmpzP2YzMWMiXSwic291cmNlc0NvbnRlbnQiOlsiXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHNlbGVjdGlvbiA9IGRvY3VtZW50LmdldFNlbGVjdGlvbigpO1xuICBpZiAoIXNlbGVjdGlvbi5yYW5nZUNvdW50KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHt9O1xuICB9XG4gIHZhciBhY3RpdmUgPSBkb2N1bWVudC5hY3RpdmVFbGVtZW50O1xuXG4gIHZhciByYW5nZXMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWxlY3Rpb24ucmFuZ2VDb3VudDsgaSsrKSB7XG4gICAgcmFuZ2VzLnB1c2goc2VsZWN0aW9uLmdldFJhbmdlQXQoaSkpO1xuICB9XG5cbiAgc3dpdGNoIChhY3RpdmUudGFnTmFtZS50b1VwcGVyQ2FzZSgpKSB7IC8vIC50b1VwcGVyQ2FzZSBoYW5kbGVzIFhIVE1MXG4gICAgY2FzZSAnSU5QVVQnOlxuICAgIGNhc2UgJ1RFWFRBUkVBJzpcbiAgICAgIGFjdGl2ZS5ibHVyKCk7XG4gICAgICBicmVhaztcblxuICAgIGRlZmF1bHQ6XG4gICAgICBhY3RpdmUgPSBudWxsO1xuICAgICAgYnJlYWs7XG4gIH1cblxuICBzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgc2VsZWN0aW9uLnR5cGUgPT09ICdDYXJldCcgJiZcbiAgICBzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCk7XG5cbiAgICBpZiAoIXNlbGVjdGlvbi5yYW5nZUNvdW50KSB7XG4gICAgICByYW5nZXMuZm9yRWFjaChmdW5jdGlvbihyYW5nZSkge1xuICAgICAgICBzZWxlY3Rpb24uYWRkUmFuZ2UocmFuZ2UpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgYWN0aXZlICYmXG4gICAgYWN0aXZlLmZvY3VzKCk7XG4gIH07XG59O1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/../node_modules/toggle-selection/index.js\n");

/***/ })

};
;