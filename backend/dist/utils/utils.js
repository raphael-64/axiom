"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.greet = void 0;
const console_1 = require("console");
// src/utils.ts
const greet = (name) => {
    (0, console_1.log)(`Hello, ${name}!`);
    return "hi";
};
exports.greet = greet;
// You can add more utility functions here
