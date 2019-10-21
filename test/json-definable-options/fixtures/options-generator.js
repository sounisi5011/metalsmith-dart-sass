module.exports = (files, metalsmith, defaultOptions) => {
  return {
    pattern: [...defaultOptions.pattern, '!**/_*/**'],
    options: {
      includePaths: ['node_modules'],
      outputStyle: 'compressed',
      linefeed: 'crlf',
    },
  };
};
