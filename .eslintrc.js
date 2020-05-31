module.exports = {
    "env": {
        "browser": true,
        "es6": true
    },
    "extends": [
        "plugin:@typescript-eslint/recommended",  // recommended typescript rule set
        "prettier/@typescript-eslint",  // Uses eslint-config-prettier to disable conflicting ts-eslint rules
        "plugin:prettier/recommended"   // display prettier errors as ESLint errors (has to be last in array)
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parser": "@typescript-eslint/parser",  // Use the typescript parser
    "parserOptions": {
        "ecmaVersion": 2020,    // Allows for the parsing of modern ECMAScript features
        "sourceType": "module"  // Allows for the use of imports
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "no-console": 1,  // just warnings for console.log etc
        "@typescript-eslint/no-use-before-define": 0,
        "@typescript-eslint/triple-slash-reference": 0,
        "@typescript-eslint/no-inferrable-types": 1,
        "@typescript-eslint/no-empty-function": 1,
        "@typescript-eslint/camelcase": 1,
        "@typescript-eslint/interface-name-prefix": 0,
        "@typescript-eslint/no-explicit-any": 0
    }
}
