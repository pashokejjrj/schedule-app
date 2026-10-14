import { describe, it, expect } from 'vitest';
import { checkCollision } from '../src/domain/collision';
import type { Lesson } from '../src/domain/types';

describe('checkCollision', () => {
  const existing: Lesson[] = [
    {
      uid: '1',
      w: 1,
      d: 1,
      title: 'Математика',
      typeClass: 'badge-lecture',
      typeName: 'Лекция',
      start: '08:30',
      end: '10:00'
    },
    {
      uid: '2',
      w: 1,
      d: 1,
      title: 'Физика',
      typeClass: 'badge-practice',
      typeName: 'Практика',
      start: '10:10',
      end: '11:40'
    }
  ];

  it('detects overlapping lessons on the same week and day', () => {
    const target: Lesson = {
      uid: '3',
      w: 1,
      d: 1,
      title: 'Химия',
      typeClass: 'badge-lab',
      typeName: 'Лабораторная',
      start: '09:30',
      end: '11:00'
    };
    const res = checkCollision(target, existing);
    expect(res).toHaveLength(2);
    expect(res[0].uid).toBe('1');
    expect(res[1].uid).toBe('2');
  });

  it('ignores lessons on different days or weeks', () => {
    const diffDay: Lesson = {
      uid: '4',
      w: 1,
      d: 2,
      title: 'Химия',
      typeClass: 'badge-lab',
      typeName: 'Лабораторная',
      start: '08:30',
      end: '10:00'
    };
    expect(checkCollision(diffDay, existing)).toHaveLength(0);

    const diffWeek: Lesson = {
      uid: '5',
      w: 2,
      d: 1,
      title: 'Химия',
      typeClass: 'badge-lab',
      typeName: 'Лабораторная',
      start: '08:30',
      end: '10:00'
    };
    expect(checkCollision(diffWeek, existing)).toHaveLength(0);
  });

  it('ignores self collision when editing existing lesson', () => {
    const editing: Lesson = { ...existing[0], start: '08:30', end: '10:00' };
    expect(checkCollision(editing, existing, '1')).toHaveLength(0);
  });

  it('allows adjacent non-overlapping times', () => {
    const adjacent: Lesson = {
      uid: '6',
      w: 1,
      d: 1,
      title: 'Химия',
      typeClass: 'badge-lab',
      typeName: 'Лабораторная',
      start: '10:00',
      end: '10:10'
    };
    expect(checkCollision(adjacent, existing)).toHaveLength(0);
  });
});
