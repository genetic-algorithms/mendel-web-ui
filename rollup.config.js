export default {
    input: './static/js/main.js',
    output: {
        file: './static/js/bundle.js',
        format: 'iife',
        sourcemap: false,
        globals: {
            'react': 'React',
            'react-dom': 'ReactDOM',
            'redux': 'Redux',
            'react-redux': 'ReactRedux',
            'immer': 'immer',
        },
    },
    external: [
        'react',
        'react-dom',
        'redux',
        'react-redux',
        'immer',
    ],
}
