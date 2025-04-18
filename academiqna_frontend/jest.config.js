module.exports = {
    transform: {
      '^.+\\.[jt]sx?$': 'babel-jest',
    },
    moduleNameMapper: {
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    transformIgnorePatterns: [
      'node_modules/(?!axios)', // ✅ transform axios
    ],
    testEnvironment: 'jsdom',
  };
  