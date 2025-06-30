import OpenAI from 'openai';
import { env } from './env';

export async function checkOpenAIKey(): Promise<{ valid: boolean; error?: string }> {
  try {
    if (!env.OPENAI_API_KEY) {
      return { 
        valid: false, 
        error: 'OPENAI_API_KEY ist nicht konfiguriert. Bitte setzen Sie den API-Schlüssel in der .env Datei.' 
      };
    }

    // Check if key format is valid
    if (!env.OPENAI_API_KEY.startsWith('sk-')) {
      return { 
        valid: false, 
        error: 'OPENAI_API_KEY hat ein ungültiges Format. Der Schlüssel sollte mit "sk-" beginnen.' 
      };
    }

    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    // Make a simple API call to verify the key
    console.log('🔑 Überprüfe OpenAI API-Schlüssel...');
    await openai.models.list();
    
    console.log('✅ OpenAI API-Schlüssel ist gültig!');
    return { valid: true };
  } catch (error) {
    console.error('❌ OpenAI API-Schlüssel ist ungültig:', error instanceof Error ? error.message : 'Unbekannter Fehler');
    
    if (error instanceof OpenAI.APIError && error.status === 401) {
      return { 
        valid: false, 
        error: `Der OpenAI API-Schlüssel ist ungültig oder abgelaufen. Bitte überprüfen Sie Ihren Schlüssel unter https://platform.openai.com/api-keys` 
      };
    }
    
    return { 
      valid: false, 
      error: `Fehler beim Überprüfen des API-Schlüssels: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` 
    };
  }
}