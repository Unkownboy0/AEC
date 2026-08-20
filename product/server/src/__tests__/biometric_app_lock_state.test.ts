import assert from 'assert';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const statePath = path.join(__dirname, '../../../client/src/platform/biometric-lock-state.ts');
const compiled = ts.transpileModule(fs.readFileSync(statePath, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleBox: { exports: any } = { exports: {} };
new Function('module', 'exports', compiled)(moduleBox, moduleBox.exports);
const { BiometricLockStateMachine } = moduleBox.exports;

const machine = new BiometricLockStateMachine(60_000);
assert.strictEqual(machine.value.phase, 'initializing', 'native lock starts fail-closed');
assert.strictEqual(machine.initialize(false).phase, 'disabled', 'disabled preference does not prompt');
assert.strictEqual(machine.initialize(true).phase, 'locked', 'enabled preference locks cold start');
assert.strictEqual(machine.beginUnlock(), true, 'first prompt starts');
assert.strictEqual(machine.beginUnlock(), false, 'second prompt is rejected while one is active');
assert.strictEqual(machine.finishUnlock(false).phase, 'locked', 'failed/cancelled prompt remains locked');
assert.strictEqual(machine.beginUnlock(), true, 'retry can start after failure');
assert.strictEqual(machine.finishUnlock(true).phase, 'unlocked', 'successful biometric unlocks locally');
machine.background(1_000);
assert.strictEqual(machine.foreground(30_000).phase, 'unlocked', 'resume before timeout stays unlocked');
machine.background(40_000);
assert.strictEqual(machine.foreground(100_000).phase, 'locked', 'resume at timeout relocks');
assert.strictEqual(machine.logout().phase, 'locked', 'logout clears unlocked state but preserves preference');

const gateSource = fs.readFileSync(path.join(__dirname, '../../../client/src/components/shared/BiometricLockGate.tsx'), 'utf8');
assert.match(gateSource, /phase === 'disabled' \|\| phase === 'unlocked'/, 'children render only after a resolved safe state');
assert.match(gateSource, /promptRef\.current/, 'single-flight prompt guard is present');
assert.match(gateSource, /campusos_app_background/, 'background timestamp lifecycle is handled');
assert.doesNotMatch(gateSource, /if \(!locked\) return/, 'old fail-open render path is removed');

console.log('✅ Biometric app-lock state machine and fail-closed gate contract passed');
