var path = require("path");

module.exports = function (grunt) {
	grunt.loadNpmTasks('grunt-gitbook');
	grunt.loadNpmTasks('grunt-gh-pages');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-http-server');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-open');

    grunt.initConfig({
        'gitbook': {
            development: {
                input: "./",
                title: "Java字节码技术学习笔记",
                description: "Java字节码技术学习笔记",
                github: "skyao/leaning-java-bytecode"
            }
        },
        'gh-pages': {
            options: {
                base: '_book'
            },
            src: ['**']
        },
        'clean': {
            files: '_book'
        },
        'http-server': {
            'dev': {
                // the server root directory
                root: '_book',

                port: 4000,
                host: "0.0.0.0",

                showDir : true,
                autoIndex: true,
                ext: "html",
				runInBackground: true,
				logFn: function(req, res, error) { },
				openBrowser : true
            }
        }, 
		
		// grunt-open will open your browser at the project's URL
		open: {
			all: {
				path: 'http://127.0.0.1:4000/index.html'
			}
		},

		watch: {
			css: {
				files: ['**/*.md'],
				tasks: ['gitbook'],
				options: {
					spawn: false, 
					livereload: true,
				},
		  },
		},
    });
	
	grunt.event.on('watch', function(action, filepath, target) {
		grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
	});

    grunt.registerTask('test', [
        'gitbook',
        'http-server',
		'open',
		'watch',		
    ]);
    grunt.registerTask('publish', [
        'gitbook',
		'gh-pages',
        'clean'
    ]);
    grunt.registerTask('default', 'gitbook');
};
