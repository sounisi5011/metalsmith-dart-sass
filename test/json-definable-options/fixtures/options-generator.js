module.exports = (files, metalsmith, defaultOptions) => {
  return {
    pattern: [...defaultOptions.pattern, '!**/_*/**'],
    sassOptions: {
      includePaths: ['node_modules'],
      outputStyle: 'compressed',
      linefeed: 'crlf',
    },
  };
};
