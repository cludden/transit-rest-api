'use strict';

module.exports = function(grunt){
    grunt.initConfig({
        mocha_istanbul: {
            coverage: {
                src: ['test/tests/**/*.test.js'],
                options: {
                    coverageFolder: 'coverage',
                    mask: '**/*.test.js',
                }
            },
            partial: {
                src: []
            }
        }
    });

    grunt.loadNpmTasks('grunt-mocha-istanbul');

    grunt.registerTask('coverage', ['mocha_istanbul:coverage']);
    grunt.registerTask('partial-coverage', function() {
        var tests = Array.prototype.slice.call(arguments, 0).map(function(test) {
            return 'test/' + test + '.test.js';
        });
        if (tests.length > 0) {
            grunt.config('mocha_istanbul.partial.src', [].concat(tests));
        }
        grunt.task.run('mocha_istanbul:partial');
    });
};
