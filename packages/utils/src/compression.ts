import * as zlib from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(zlib.gzip);
const gunzipAsync = promisify(zlib.gunzip);
const brotliCompressAsync = promisify(zlib.brotliCompress);
const brotliDecompressAsync = promisify(zlib.brotliDecompress);

export interface ICompressionStats {
  originalBytes: number;
  compressedBytes: number;
  ratio: number;
  savingsPercentage: number;
}

export class CompressionUtil {
  /**
   * Compress string or buffer using GZIP
   */
  public static async compressGzip(input: string | Buffer): Promise<Buffer> {
    const buffer = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
    return gzipAsync(buffer, { level: 6 });
  }

  /**
   * Decompress GZIP buffer back to string or buffer
   */
  public static async decompressGzip(compressed: Buffer): Promise<string> {
    const decompressed = await gunzipAsync(compressed);
    return decompressed.toString('utf8');
  }

  /**
   * Compress string or buffer using Brotli
   */
  public static async compressBrotli(input: string | Buffer): Promise<Buffer> {
    const buffer = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
    return brotliCompressAsync(buffer, {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 4, // Fast web quality
      },
    });
  }

  /**
   * Decompress Brotli buffer back to string
   */
  public static async decompressBrotli(compressed: Buffer): Promise<string> {
    const decompressed = await brotliDecompressAsync(compressed);
    return decompressed.toString('utf8');
  }

  /**
   * Synchronous GZIP compression for hot-path caching
   */
  public static compressSync(input: string | Buffer): Buffer {
    const buffer = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
    return zlib.gzipSync(buffer, { level: 4 });
  }

  /**
   * Synchronous GZIP decompression
   */
  public static decompressSync(compressed: Buffer): string {
    return zlib.gunzipSync(compressed).toString('utf8');
  }

  /**
   * Calculate compression statistics
   */
  public static calculateStats(original: string | Buffer, compressed: Buffer): ICompressionStats {
    const originalBytes = typeof original === 'string' ? Buffer.byteLength(original, 'utf8') : original.length;
    const compressedBytes = compressed.length;
    const ratio = Math.round((compressedBytes / (originalBytes || 1)) * 100) / 100;
    const savingsPercentage = Math.round((1 - compressedBytes / (originalBytes || 1)) * 1000) / 10;

    return {
      originalBytes,
      compressedBytes,
      ratio,
      savingsPercentage,
    };
  }
}
