module.exports = {
  purge: [
    './views/*.handlebars',
    './views/layouts/*.handlebars',
    './views/partials/*.handlebars'
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      gridTemplateRows: {
        '7': 'repeat(7, minmax(0, 1fr))',
        '8': 'repeat(8, minmax(0, 1fr))',
        '9': 'repeat(9, minmax(0, 1fr))'
      },
      gridRow: {
        'span-7': 'span 7 / span 7',
        'span-8': 'span 8 / span 8',
        'span-9': 'span 9 / span 9',
      }
    },
    container: {
      center: true,
      padding: '2rem'
    }
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
