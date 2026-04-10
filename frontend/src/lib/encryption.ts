/**
 * Encrypts a file using AES-256-GCM encryption
 */
export async function encryptFile(file: File): Promise<{
  encryptedData: ArrayBuffer;
  encryptionKey: string;
}> {
  try {
    if (!file || file.size === 0) {
      throw new Error('Invalid file: file is empty or undefined');
    }

    // Read file as ArrayBuffer
    const fileData = await file.arrayBuffer();

    if (!fileData || fileData.byteLength === 0) {
      throw new Error('Failed to read file data');
    }

    // Generate a random encryption key
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Generate a random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the file data
    const encryptedContent = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      fileData
    );

    // Export the key to store it
    const exportedKey = await crypto.subtle.exportKey('raw', key);
    const keyArray = new Uint8Array(exportedKey);
    const keyHex = Array.from(keyArray)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Validate key format
    if (keyHex.length !== 64) {
      throw new Error('Generated encryption key has invalid length');
    }

    // Combine IV and encrypted content
    const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedContent), iv.length);

    return {
      encryptedData: combined.buffer,
      encryptionKey: keyHex,
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt file: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Decrypts a file using AES-256-GCM encryption
 */
export async function decryptFile(
  encryptedData: ArrayBuffer,
  keyHex: string
): Promise<ArrayBuffer> {
  try {
    // Validate input
    if (!encryptedData || encryptedData.byteLength === 0) {
      throw new Error('Invalid encrypted data: data is empty');
    }

    if (!keyHex || typeof keyHex !== 'string') {
      throw new Error('Invalid encryption key: key is missing or not a string');
    }

    // Remove any whitespace from key
    keyHex = keyHex.trim();

    if (keyHex.length !== 64) {
      throw new Error(`Invalid encryption key format: expected 64 characters, got ${keyHex.length}`);
    }

    // Validate hex format
    if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
      throw new Error('Invalid encryption key format: key must be 64 hexadecimal characters');
    }

    // Convert hex key back to bytes
    const keyArray = new Uint8Array(
      keyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    // Import the key
    const key = await crypto.subtle.importKey(
      'raw',
      keyArray,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['decrypt']
    );

    // Extract IV and encrypted content
    const combined = new Uint8Array(encryptedData);
    if (combined.length < 12) {
      throw new Error('Encrypted data is too short: missing IV');
    }

    const iv = combined.slice(0, 12);
    const encryptedContent = combined.slice(12);

    if (encryptedContent.length === 0) {
      throw new Error('Encrypted data is too short: missing content');
    }

    // Decrypt the content
    const decryptedContent = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedContent
    );

    if (!decryptedContent || decryptedContent.byteLength === 0) {
      throw new Error('Decryption resulted in empty data');
    }

    return decryptedContent;
  } catch (error) {
    console.error('Decryption error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('operation-specific reason') || 
          error.name === 'OperationError') {
        throw new Error('Failed to decrypt file: Invalid encryption key or corrupted data');
      }
      throw new Error('Failed to decrypt file: ' + error.message);
    }
    
    throw new Error('Failed to decrypt file: Unknown error');
  }
}
