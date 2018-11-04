export default {
    input: './static/typescript/out/main.js',
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
            'moment': 'moment',
            'plotly.js': 'Plotly',
        },
    },
    external: [
        'react',
        'react-dom',
        'redux',
        'react-redux',
        'immer',
        'moment',
        'plotly.js',
    ],
    onwarn: warning => {
        if (warning.code === 'THIS_IS_UNDEFINED') return;
        console.error(warning.message);
    },
    watch: {
        clearScreen: false,
    },
}
