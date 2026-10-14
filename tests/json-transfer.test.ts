import { describe, it, expect } from 'vitest';
import { importScheduleFromJson, exportScheduleAsJson } from '../src/services/json-transfer';
import { DEFAULT_SETTINGS } from '../src/domain/types';
import type { Lesson, Settings } from '../src/domain/types';

describe('json-transfer', () => {
  const settings: Settings = {
    ...DEFAULT_SETTINGS,
    groupName: 'ЭКС-ПОРТ-ТЕСТ'
  };

  const lessons: Lesson[] = [
    {
      uid: 'l-1',
      w: 1,
      d: 3,
      title: 'Тестовый предмет',
      typeClass: 'badge-lecture',
      typeName: 'Лекция',
      start: '11:50',
      end: '13:20'
    }
  ];

  it('correctly exports and imports back schedule data', () => {
    const exportedJson = JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      lessons
    });

    const res = importScheduleFromJson(exportedJson);
    expect(res.success).toBe(true);
    expect(res.data?.settings?.groupName).toBe('ЭКС-ПОРТ-ТЕСТ');
    expect(res.data?.lessons).toHaveLength(1);
    expect(res.data?.lessons?.[0].title).toBe('Тестовый предмет');
  });

  it('rejects invalid json gracefully', () => {
    const res = importScheduleFromJson('{ invalid json }');
    expect(res.success).toBe(false);
    expect(res.message).toContain('Ошибка');
  });

  it('rejects non-object payload', () => {
    const res = importScheduleFromJson('12345');
    expect(res.success).toBe(false);
  });
});
