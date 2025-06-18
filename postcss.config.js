module.exports = {
  plugins: [
    require('@tailwindcss/postcss')(), // <-- this is the key fix
    require('autoprefixer'),
  ],
}