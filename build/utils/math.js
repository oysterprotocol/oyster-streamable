"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var clamp = (exports.clamp = function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
});
