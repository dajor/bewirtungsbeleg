import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DependencyCheck {
  name: string;
  installed: boolean;
  version?: string;
  error?: string;
}

// Check if PDF processing system dependencies are available
export async function checkPdfDependencies(): Promise<DependencyCheck[]> {
  const dependencies = [
    { name: 'pdftoppm', command: 'pdftoppm -h' },
    { name: 'convert', command: 'convert -version' },
    { name: 'gs', command: 'gs --version' },
  ];

  const results: DependencyCheck[] = [];

  for (const dep of dependencies) {
    try {
      const { stdout, stderr } = await execAsync(dep.command);
      const output = stdout || stderr;
      
      results.push({
        name: dep.name,
        installed: true,
        version: output.split('\n')[0].substring(0, 100) // First line, truncated
      });
    } catch (error) {
      results.push({
        name: dep.name,
        installed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}

// Check dependencies on startup and log results
export async function logDependencyStatus(): Promise<void> {
  console.log('🔍 Checking PDF processing dependencies...');
  
  try {
    const deps = await checkPdfDependencies();
    
    for (const dep of deps) {
      if (dep.installed) {
        console.log(`✅ ${dep.name}: ${dep.version}`);
      } else {
        console.log(`❌ ${dep.name}: NOT INSTALLED`);
        console.log(`   Error: ${dep.error}`);
      }
    }
    
    const allInstalled = deps.every(d => d.installed);
    if (allInstalled) {
      console.log('🎉 All PDF processing dependencies are available!');
    } else {
      console.log('⚠️ Some PDF dependencies are missing. PDF conversion will use fallback mode.');
      console.log('💡 To install dependencies on Ubuntu/Debian:');
      console.log('   apt-get update && apt-get install -y imagemagick ghostscript poppler-utils');
    }
    
  } catch (error) {
    console.error('❌ Error checking dependencies:', error);
  }
}