export interface Course {
  id: string; title: string; url: string; provider?: string; order: number;
  completed: boolean; score: number | null; archived: boolean;
}

export function validateScore(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100);
}

export function safeUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password || value.length > 2048)
    throw new Error('Bitte eine gültige HTTPS-Kursadresse ohne Zugangsdaten eingeben.');
  return url.href;
}

export function parseCourses(value: unknown): Course[] {
  if (!Array.isArray(value) || value.length > 1000) throw new Error('Ungültige Kursliste (maximal 1000 Kurse).');
  const ids = new Set<string>();
  return value.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('Ungültiger Kurs.');
    const c = item as Record<string, unknown>;
    const allowed = ['id', 'title', 'url', 'provider', 'order', 'completed', 'score', 'archived'];
    if (Object.keys(c).some(key => !allowed.includes(key)) ||
      typeof c.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(c.id) || ids.has(c.id) ||
      typeof c.title !== 'string' || !c.title.trim() || c.title.length > 200 ||
      typeof c.url !== 'string' || typeof c.order !== 'number' || !Number.isSafeInteger(c.order) ||
      typeof c.completed !== 'boolean' || !validateScore(c.score) || (!c.completed && c.score !== null) ||
      (c.provider !== undefined && (typeof c.provider !== 'string' || c.provider.length > 100)) ||
      (c.archived !== undefined && typeof c.archived !== 'boolean')) throw new Error('Ungültige Kursdaten. Noten müssen ganze Zahlen von 0 bis 100 sein und gehören zu abgeschlossenen Kursen.');
    ids.add(c.id);
    return { id: c.id, title: c.title.trim(), url: safeUrl(c.url), order: c.order,
      completed: c.completed, score: c.score, archived: c.archived === true,
      ...(c.provider ? { provider: c.provider as string } : {}) };
  });
}

export function ordered(courses: Course[]): Course[] {
  return [...courses].sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}
export function nextCourse(courses: Course[]): Course | undefined {
  return ordered(courses).find(c => !c.archived && !c.completed);
}
export function setCompletion(course: Course, completed: boolean): Course {
  return { ...course, completed, score: completed ? course.score : null };
}
export function progress(courses: Course[]) {
  const active = courses.filter(c => !c.archived);
  const completed = active.filter(c => c.completed).length;
  return { completed, total: active.length, percent: active.length ? Math.round(completed / active.length * 100) : 0 };
}
export function averageScore(courses: Course[]): number | null {
  const scores = courses.filter(c => !c.archived && c.completed && c.score !== null).map(c => c.score!);
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
}
