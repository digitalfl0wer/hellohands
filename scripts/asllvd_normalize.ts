import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

interface PipelineStats {
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  stepResults: Array<{
    step: string;
    success: boolean;
    error?: string;
    duration?: number;
  }>;
}

async function runScript(
  scriptPath: string,
  stepName: string,
): Promise<{ success: boolean; error?: string; duration: number }> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    console.log(`\n[asllvd_normalize] Starting step: ${stepName}`);
    console.log(`[asllvd_normalize] Running: tsx ${scriptPath}`);

    const proc = spawn('tsx', [scriptPath], {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    proc.on('error', (err) => {
      const duration = Date.now() - startTime;
      console.error(`[asllvd_normalize] ✗ ${stepName} failed with error: ${err.message}`);
      resolve({ success: false, error: err.message, duration });
    });

    proc.on('exit', (code) => {
      const duration = Date.now() - startTime;
      if (code === 0) {
        console.log(
          `[asllvd_normalize] ✓ ${stepName} completed successfully in ${(duration / 1000).toFixed(1)}s`,
        );
        resolve({ success: true, duration });
      } else {
        const error = `Process exited with code ${code}`;
        console.error(`[asllvd_normalize] ✗ ${stepName} failed: ${error}`);
        resolve({ success: false, error, duration });
      }
    });
  });
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
}

async function main(): Promise<void> {
  const scriptsDir = resolve('scripts');

  console.log('🎬 ASLLVD Normalization Pipeline Starting...');
  console.log('================================================');

  const stats: PipelineStats = {
    totalSteps: 0,
    completedSteps: 0,
    failedSteps: 0,
    stepResults: [],
  };

  const pipelineSteps = [
    {
      name: 'Video Trimming & Normalization',
      script: resolve(scriptsDir, 'asllvd_trim.ts'),
      description:
        'Process raw videos: trim by frame boundaries, normalize to 30fps/320px MP4',
    },
    {
      name: 'Poster Generation',
      script: resolve(scriptsDir, 'asllvd_poster.ts'),
      description: 'Extract mid-sign frames as PNG posters from normalized clips',
    },
    {
      name: 'Labels Generation',
      script: resolve(scriptsDir, 'asllvd_labels.ts'),
      description: 'Generate labels.jsonl with checksums and pack mappings',
    },
  ];

  stats.totalSteps = pipelineSteps.length;
  const overallStartTime = Date.now();

  // Execute pipeline steps sequentially
  for (const step of pipelineSteps) {
    console.log(`\n📋 ${step.name}`);
    console.log(`   ${step.description}`);

    const result = await runScript(step.script, step.name);

    stats.stepResults.push({
      step: step.name,
      success: result.success,
      error: result.error,
      duration: result.duration,
    });

    if (result.success) {
      stats.completedSteps++;
    } else {
      stats.failedSteps++;
      // Continue with remaining steps even if one fails
    }
  }

  const overallDuration = Date.now() - overallStartTime;

  // Generate final summary
  console.log('\n================================================');
  console.log('🏁 ASLLVD Normalization Pipeline Complete');
  console.log('================================================');

  console.log('\n📊 PIPELINE SUMMARY:');
  console.log(`   Total Steps: ${stats.totalSteps}`);
  console.log(`   Completed: ${stats.completedSteps}`);
  console.log(`   Failed: ${stats.failedSteps}`);
  console.log(`   Overall Duration: ${formatDuration(overallDuration)}`);

  console.log('\n📋 STEP RESULTS:');
  for (const result of stats.stepResults) {
    const status = result.success ? '✓' : '✗';
    const duration = result.duration ? formatDuration(result.duration) : 'N/A';
    console.log(`   ${status} ${result.step} (${duration})`);
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  }

  console.log('\n📁 OUTPUT STRUCTURE:');
  console.log('   data/processed/asllvd/');
  console.log('   ├── clips/          # Normalized MP4 videos (30fps, 320px)');
  console.log('   ├── posters/        # PNG poster frames');
  console.log('   └── labels.jsonl    # Dataset labels with checksums');

  if (stats.failedSteps > 0) {
    console.log('\n⚠️  Some steps failed. Check the errors above.');
    console.log('   You may need to:');
    console.log('   - Ensure ffmpeg and ffprobe are installed');
    console.log('   - Check that raw video files exist in data/raw/asllvd/');
    console.log('   - Verify the manifest file data/asllvd_manifest.csv exists');

    process.exit(1);
  } else {
    console.log('\n🎉 All steps completed successfully!');
    console.log('   The ASLLVD dataset has been normalized and is ready for use.');

    process.exit(0);
  }
}

main().catch((e) => {
  console.error('\n💥 Pipeline failed with fatal error:', e);
  process.exit(1);
});
