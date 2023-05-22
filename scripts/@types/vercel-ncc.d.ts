/*
 * ☕ @noelware/s3-action: Simple and fast GitHub Action to upload objects to Amazon S3 easily.
 * Copyright (c) 2021-2023 Noelware, LLC. <team@noelware.org>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

declare module '@vercel/ncc' {
    export interface Options<Watch extends boolean = false> {
        /** Custom cache path, or `false` to disable caching */
        cache?: string | false;

        /** External packages to leave as required of the build */
        externals?: string[];

        /** Directory outside of  which never to emit assets in */
        filterAssetBase?: string;

        /** Minifies the output content */
        minify?: boolean;

        /** Generates sourcemaps when building */
        sourceMap?: boolean;

        /** Relative path to treat sources from into the related sourcemap */
        sourceMapBasePrefix?: string;

        /** When outputted, the file includes `source-map-support` in the output file; increases output by ~32KB */
        sourceMapRegister?: boolean;

        /** Whether to watch the input files to build the finialized output */
        watch?: Watch;

        /** Generates a licenses file in the final output */
        license?: string;

        quiet?: boolean;
        debugLog?: boolean;
        v8cache?: boolean;
        assetBuilds?: boolean;
    }

    export interface OutputResult {
        code: string;
        map?: string;
        assets: Record<string, { source: Buffer; permissions?: any }>;
        symlinks: Record<string, any>;
        stats: any;
    }

    export interface Watcher {
        handler({ err, code, map, assets }: OutputResult & { err?: Error }): void;
        rebuild(callback: () => void): void;
        close(): void;
    }

    function ncc(input: string, options: Options<false>): Promise<OutputResult>;
    function ncc(input: string, options: Options<true>): Promise<Watcher>;

    export default ncc;
}
