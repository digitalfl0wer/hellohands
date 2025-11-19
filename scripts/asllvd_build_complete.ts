#!/usr/bin/env tsx
/**
 * ASLLVD Complete Pack Building Pipeline
 *
 * Executes the complete ASLLVD pack building pipeline:
 * 1. Generates labels.jsonl from processed clips with metadata and checksums
 * 2. Builds pack definitions (packs.generated.json) matching frozen sign lists
 * 3. Validates pack completeness and generates comprehensive reports
 *
 * Usage: pnpm asllvd:build-complete
 */

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

interface PipelineStep {
  name: string;
  script: string;
  description: string;
}

const steps: PipelineStep[] = [
  {
    name: 'labels',
    script: 'asllvd_labels.ts',
    description: 'Generate labels.jsonl with metadata and checksums',
  },
  {
    name: 'packs',
    script: 'asllvd_packs.ts',
    description: 'Build pack definitions matching frozen sign lists',
  },
  {
    name: 'coverage',
    script: 'asllvd_coverage.ts',
    description: 'Validate pack completeness and coverage',
  },
];

function runScript(
  script: string,
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn('npx', ['tsx', `scripts/${script}`], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output); // Real-time output
    });

    proc.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output); // Real-time output
    });

    proc.on('close', (code) => {
      resolve({ stdout, stderr, code: code || 0 });
    });
  });
}

async function main(): Promise<void> {
  console.log('🚀 ASLLVD Complete Pack Building Pipeline');
  console.log('='.repeat(60));
  console.log('📋 Executing steps:');
  for (const [index, step] of steps.entries()) {
    console.log(`   ${index + 1}. ${step.name}: ${step.description}`);
  }
  console.log('='.repeat(60));
  console.log();

  const results: Array<{ step: PipelineStep; result: any; success: boolean }> = [];
  let overallSuccess = true;

  for (const [index, step] of steps.entries()) {
    console.log(`\n🔄 Step ${index + 1}/${steps.length}: ${step.name}`);
    console.log(`📝 ${step.description}`);
    console.log(`🔧 Running: tsx scripts/${step.script}`);
    console.log('-'.repeat(40));

    try {
      const result = await runScript(step.script);
      const success = result.code === 0;

      results.push({ step, result, success });

      if (success) {
        console.log(`✅ Step ${index + 1} completed successfully`);
      } else {
        console.log(`❌ Step ${index + 1} failed with exit code ${result.code}`);
        overallSuccess = false;
        // Continue with remaining steps even if one fails
      }
    } catch (error) {
      console.error(`💥 Step ${index + 1} crashed:`, error);
      results.push({ step, result: { error }, success: false });
      overallSuccess = false;
    }
  }

  // Pipeline summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 ASLLVD PIPELINE EXECUTION SUMMARY');
  console.log('='.repeat(60));

  for (const [index, { step, success }] of results.entries()) {
    const status = success ? '✅' : '❌';
    console.log(`   ${status} Step ${index + 1}: ${step.name} - ${step.description}`);
  }

  const successCount = results.filter((r) => r.success).length;
  const totalSteps = results.length;

  console.log(
    `\n🎯 Overall Status: ${successCount}/${totalSteps} steps completed successfully`,
  );

  if (overallSuccess) {
    console.log('\n🎉 Pipeline completed successfully!');
    console.log('\n📁 Generated files:');
    console.log('   ├── data/processed/asllvd/labels.jsonl');
    console.log('   └── practice/packs.generated.json');
    console.log('\n💡 Next steps:');
    console.log('   • Review pack coverage in the summary above');
    console.log('   • Check that overall coverage meets requirements (≥90%)');
    console.log('   • Integrate generated packs into training pipeline');
  } else {
    console.log(
      '\n⚠️  Pipeline completed with errors - check individual step outputs above',
    );
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Ensure data/processed/asllvd/clips/ contains video files');
    console.log('   • Verify practice/packs.manual.json exists and is valid');
    console.log('   • Check that ffmpeg/ffprobe are installed (for labels generation)');
  }

  console.log('\n' + '='.repeat(60));

  process.exit(overallSuccess ? 0 : 1);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⏹️  Pipeline interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n\n⏹️  Pipeline terminated');
  process.exit(143);
});

main().catch((error) => {
  console.error('\n💥 Pipeline orchestrator crashed:', error);
  process.exit(1);
});
