webpackHotUpdate("static\\development\\pages\\index.js",{

/***/ "./components/BaseLayout.tsx":
/*!***********************************!*\
  !*** ./components/BaseLayout.tsx ***!
  \***********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _Header__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Header */ "./components/Header.tsx");
/* harmony import */ var _Footer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Footer */ "./components/Footer.tsx");
var _jsxFileName = "D:\\Users\\jansen\\git\\intermix_gh-pages\\components\\BaseLayout.tsx";

var __jsx = react__WEBPACK_IMPORTED_MODULE_0___default.a.createElement;


var pages = [{
  name: "Getting Started",
  href: "/getting_started"
}, {
  name: "API",
  href: "/api"
}];
var fullYear = new Date().getFullYear();

var BaseLayout = function BaseLayout(_ref) {
  var children = _ref.children,
      _ref$title = _ref.title,
      title = _ref$title === void 0 ? "intermix" : _ref$title;
  return __jsx("div", {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 26
    },
    __self: this
  }, __jsx(_Header__WEBPACK_IMPORTED_MODULE_1__["default"], {
    title: title,
    links: pages,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 27
    },
    __self: this
  }), children, __jsx(_Footer__WEBPACK_IMPORTED_MODULE_2__["default"], {
    year: fullYear.toString(),
    __source: {
      fileName: _jsxFileName,
      lineNumber: 29
    },
    __self: this
  }));
};

/* harmony default export */ __webpack_exports__["default"] = (BaseLayout);

/***/ })

})
//# sourceMappingURL=index.js.95cce0cce5ba56f0c159.hot-update.js.map