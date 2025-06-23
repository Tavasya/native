const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');
const postcssImport = require('postcss-import');
const postcssNested = require('postcss-nested');

module.exports = {
  plugins: [
    tailwindcss,
    autoprefixer,
    postcssImport,
    postcssNested,
  ],
};
