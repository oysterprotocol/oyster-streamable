import Upload from "./upload";
import UploadProgress from "./uploadProgress";
import Download from "./download";

/**
 * Importing oyster-streamable
 *
 * @module oyster-streamable
 * @typicalname Oyster
 *
 * @example <caption>As an ES Module</caption>
 * ```js
 * import Oyster from 'oyster-streamable'
 * ```
 *
 * @example <caption>As a Node Module</caption>
 * ```js
 * const Oyster = require(`oyster-streamable`)
 * ```
 *
 * @example <caption>As a UMD Module</caption>
 * ```js
 * window.Oyster = Oyster.default
 * ```
 */
export default { Upload, UploadProgress, Download };
