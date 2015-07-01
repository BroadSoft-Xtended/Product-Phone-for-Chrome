var path = require('path');
var _ = require('lodash');

var pattern = function(file) {
  return {pattern: file, included: true, served: true, watched: false};
};

var endsWith = function(substr) {
  return function(str) {
    return str.indexOf(substr) === (str.length - substr.length);
  };
};

var framework = function(files) {
  var sinonPath = path.resolve(require.resolve('sinon'), '../../pkg/sinon.js');
  if (!_(files).map('pattern').find(endsWith(path.relative(__dirname, sinonPath)))) {
    files.unshift(pattern(sinonPath));
  }

  var chaiPath = path.resolve(require.resolve('chai'), '../chai.js');
  if (!_(files).map('pattern').find(endsWith(path.relative(__dirname, chaiPath)))) {
    files.unshift(pattern(chaiPath));
    files.push(pattern(path.join(__dirname, 'chai-adapter.js')));
  }

  files.push(pattern(path.resolve(require.resolve('sinon-chai'))));
};

framework.$inject = ['config.files'];
module.exports = {'framework:sinon-chai': ['factory', framework]};
