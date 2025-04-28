export default {
  plugins: {
    // Using conditional plugins to prevent errors if packages aren't installed
    ...(process.env.NODE_ENV === 'production' ? { 'autoprefixer': {} } : {})
  }
}