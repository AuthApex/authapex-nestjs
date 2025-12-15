import resolve from '@rollup/plugin-node-resolve';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import { dts } from 'rollup-plugin-dts';
import path from 'path';

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap: false,
    },
    plugins: [
      peerDepsExternal(),
      typescript({ tsconfig: './tsconfig.json' }),
      resolve(),
      commonjs(),
      copy({
        targets: [
          { src: './package.json', dest: 'dist' },
          { src: './README.md', dest: 'dist' },
        ],
      }),
    ],
  },
  {
    input: 'dist/types/index.d.ts',
    output: [
      {
        file: 'dist/index.d.ts',
        format: 'cjs',
      },
    ],
    plugins: [
      alias({
        entries: [
          {
            find: '@',
            replacement: path.resolve('./dist/types'),
          },
        ],
      }),
      dts(),
      del({
        targets: 'dist/types',
        hook: 'buildEnd',
      }),
    ],
  },
];