import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

const getSecretKey = (): Buffer => {
  const key = process.env.CLINICAL_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('CRITICAL: Missing CLINICAL_ENCRYPTION_KEY in environment variables.');
  }
  return Buffer.from(key, 'hex');
};

/**
 * Encripta texto usando AES-256-GCM.
 * Retorna el formato: iv:authTag:encryptedData
 */
export function encryptClinicalData(text: string | null | undefined): string | null {
  if (!text) return null;

  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error("Error during clinical encryption:", error);
    throw new Error("Failed to encrypt clinical data.");
  }
}

/**
 * Desencripta el texto en formato iv:authTag:encryptedData.
 * Falla inmediatamente si el authTag no coincide, alertando manipulación.
 */
export function decryptClinicalData(hash: string | null | undefined): string | null {
  if (!hash) return null;
  
  const parts = hash.split(':');
  if (parts.length !== 3) {
    console.error("AUDIT ALERT: Formato de cifrado inválido detectado. Posible manipulación de BD.");
    throw new Error('Error de Integridad: Formato de datos clínicos inválido.');
  }
  
  const [ivHex, authTagHex, encryptedText] = parts;
  
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error("CRITICAL AUDIT ALERT: Falló la validación del authTag en GCM. Los datos clínicos fueron manipulados directamente en la base de datos.");
    throw new Error('Error de Integridad: Fallo de desencriptación (authTag inválido).');
  }
}
