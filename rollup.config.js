import { terser } from "rollup-plugin-terser";

const config = [
  {
    input: 'index.js',
    output: {
      file: 'dist/wazir.min.js',
      format: 'es'
    },
    plugins: [
      terser()
    ]
  },
];

export default config