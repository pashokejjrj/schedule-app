import type { Lesson } from './types';
import { timeToMinutes } from './time';

export function checkCollision(
  target: Pick<Lesson, 'uid' | 'w' | 'd' | 'start' | 'end'>,
  lessons: Lesson[],
  excludeUid?: string
): Lesson[] {
  const { uid, w, d, start, end } = target;
  if (!start || !end || !(w >= 1) || !(d >= 1)) {
    return [];
  }

  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);
  const skipUid = excludeUid !== undefined ? excludeUid : uid;

  return lessons.filter(l => {
    if ((skipUid && l.uid === skipUid) || l.w !== w || l.d !== d) return false;
    return !(endMin <= timeToMinutes(l.start) || startMin >= timeToMinutes(l.end));
  });
}
