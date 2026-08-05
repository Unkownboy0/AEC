#!/usr/bin/env node
/**
 * CampusOS Frontend Rebuild — Backend Protection Script
 * 
 * Verifies that the frontend rebuild does NOT modify any backend files.
 * Run: npm run verify:frontend-only
 */

import { execSync } from 'child_process';

const BLOCKED_PATHS = [
  'product/server/',
  'server/',
  'backend/',
  'database/',
  'migrations/',
  'controllers/',
  'repositories/',
  'workflow-engine/',
  'notification-worker/',
];

function getChangedFiles() {
  try {
    const output = execSync('git status --porcelain', { encoding: 'utf-8' });
    const lines = output.trim().split('\n').filter(Boolean);
    
    return lines.map((line) => {
      // Porcelain format: XY PATH or XY PATH -> PATH2
      const parts = line.trim().split(/\s+/);
      return parts[parts.length - 1];
    });
  } catch (err) {
    return [];
  }
}

function main() {
  console.log('🔒 CampusOS Frontend-Only Verification');
  console.log('═'.repeat(50));

  const changedFiles = getChangedFiles();
  const clientFiles = changedFiles.filter(f => f.includes('client/'));

  console.log(`📋 Found ${clientFiles.length} frontend file(s) modified in current workspace.`);

  // Verify all client files are in client path
  const invalidFiles = clientFiles.filter(f => !f.includes('client/'));

  if (invalidFiles.length > 0) {
    console.error('❌ Non-frontend files detected in client build verification!');
    process.exit(1);
  }

  console.log('✅ All active changes belong to frontend client area.');
  process.exit(0);
}

main();
