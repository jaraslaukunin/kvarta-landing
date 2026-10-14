/**
 * GitHub Pages раздаёт проект по адресу /<репозиторий>/, поэтому все локальные
 * ссылки на файлы собираем через этот помощник. На обычном хостинге
 * NEXT_PUBLIC_BASE_PATH пустой и путь остаётся прежним.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function asset(path: string) {
  return `${BASE_PATH}${path}`;
}
