import { Injectable, BadRequestException } from '@nestjs/common';
import { randomBytes, createCipheriv, createDecipheriv, privateEncrypt, publicDecrypt, constants, generateKeyPairSync } from 'crypto';
import { readFileSync } from 'fs';

function readKey(path?: string) {
  if (!path) return undefined;
  return readFileSync(path, 'utf8');
}

function base64UrlEncode(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(str: string) {
  const pad = 4 - (str.length % 4 || 4);
  const s = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad === 4 ? 0 : pad);
  return Buffer.from(s, 'base64');
}

@Injectable()
export class CryptoService {
  private readonly privateKey: string;
  private readonly publicKey: string;

  constructor() {
    const priv = process.env.PRIVATE_KEY_PATH ? readKey(process.env.PRIVATE_KEY_PATH) : process.env.RSA_PRIVATE_KEY;
    const pub = process.env.PUBLIC_KEY_PATH ? readKey(process.env.PUBLIC_KEY_PATH) : process.env.RSA_PUBLIC_KEY;
    if (!priv || !pub) {
      const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
      this.privateKey = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString();
      this.publicKey = publicKey.export({ type: 'pkcs1', format: 'pem' }).toString();
    } else {
      this.privateKey = priv;
      this.publicKey = pub;
    }
  }

  async encrypt(payload: string): Promise<{ data1: string; data2: string }> {
    if (!payload || typeof payload !== 'string' || payload.length > 2000) throw new BadRequestException('Invalid payload');
    if (process.env.MOCK_MODE === 'true') {
      const data2Json = JSON.stringify({ iv: '', tag: '', ct: base64UrlEncode(Buffer.from(payload, 'utf8')) });
      return { data1: 'mock', data2: base64UrlEncode(Buffer.from(data2Json, 'utf8')) };
    }
    const aesKey = randomBytes(32);
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', aesKey, iv);
    const ciphertext = Buffer.concat([cipher.update(Buffer.from(payload, 'utf8')), cipher.final()]);
    const tag = cipher.getAuthTag();
    const data2Json = JSON.stringify({
      iv: base64UrlEncode(iv),
      tag: base64UrlEncode(tag),
      ct: base64UrlEncode(ciphertext)
    });
    const data2 = base64UrlEncode(Buffer.from(data2Json, 'utf8'));
    const encKey = privateEncrypt(
      { key: this.privateKey, padding: constants.RSA_PKCS1_PADDING },
      aesKey
    );
    const data1 = base64UrlEncode(encKey);
    return { data1, data2 };
  }

  async decrypt(data1: string, data2: string): Promise<string> {
    if (!data1 || !data2) throw new BadRequestException('Invalid input');
    if (process.env.MOCK_MODE === 'true' && data1 === 'mock') {
      const decoded = JSON.parse(base64UrlDecode(data2).toString('utf8')) as { iv: string; tag: string; ct: string };
      return base64UrlDecode(decoded.ct).toString('utf8');
    }
    const encKey = base64UrlDecode(data1);
    const aesKey = publicDecrypt(
      { key: this.publicKey, padding: constants.RSA_PKCS1_PADDING },
      encKey
    );
    const decoded = JSON.parse(base64UrlDecode(data2).toString('utf8')) as { iv: string; tag: string; ct: string };
    const iv = base64UrlDecode(decoded.iv);
    const tag = base64UrlDecode(decoded.tag);
    const ct = base64UrlDecode(decoded.ct);
    const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
    return plaintext;
  }
}
