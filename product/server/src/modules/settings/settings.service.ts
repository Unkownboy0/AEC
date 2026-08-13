import { prisma } from '../../lib/prisma';
import { SETTING_DEFINITIONS, validateSettingChanges } from './settings.catalog';

export class SettingsService {
  async catalog() {
    const stored = await prisma.systemSetting.findMany({
      where: { key: { in: SETTING_DEFINITIONS.map((definition) => definition.key) } },
    });
    const values = new Map(stored.map((setting) => [setting.key, setting.value]));
    return SETTING_DEFINITIONS.map(({ schema: _schema, ...definition }) => ({
      ...definition,
      value: values.get(definition.key) ?? definition.defaultValue,
      source: values.has(definition.key) ? 'DATABASE' : 'DEFAULT',
    }));
  }

  preview(changes: unknown) {
    const normalized = validateSettingChanges(changes);
    return Object.entries(normalized).map(([key, value]) => {
      const definition = SETTING_DEFINITIONS.find((item) => item.key === key)!;
      return { key, label: definition.label, proposedValue: value, impact: definition.impact, restartRequired: Boolean(definition.restartRequired) };
    });
  }

  async update(changes: unknown, actor: { id: string }, request: { ip?: string; userAgent?: string }) {
    const normalized = validateSettingChanges(changes);
    const keys = Object.keys(normalized);
    const beforeRows = await prisma.systemSetting.findMany({ where: { key: { in: keys } } });
    const before = new Map(beforeRows.map((row) => [row.key, row.value]));

    await prisma.$transaction(async (tx) => {
      for (const [key, value] of Object.entries(normalized)) {
        await tx.systemSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
      }
      const changesForAudit = keys.map((key) => ({ key, oldValue: before.get(key) ?? null, newValue: normalized[key] }));
      await tx.userActivityLog.create({
        data: {
          userId: actor.id,
          action: 'UPDATE',
          module: 'SETTING',
          description: `Configuration changed: ${JSON.stringify(changesForAudit)}`,
          ipAddress: request.ip,
          userAgent: request.userAgent,
        },
      });
    });

    return { values: normalized, impact: this.preview(normalized) };
  }
}
