import storyData from '../../../klab/story-data.json';

/** The same chapter and scene records used by the legacy story screen. */
function chapter(id: string) {
  const value = storyData.chapters.find(item => item.id === id);
  if (!value) throw new Error(`Missing story chapter ${id}`);
  return value;
}
export const CHAPTER_ONE = chapter('a1-ch01');
export const CHAPTER_TWO = chapter('a1-ch02');
export const CHAPTER_THREE = chapter('a1-ch03');
export const KIOSK_SCENE = CHAPTER_TWO.scenes.find(scene => scene.id === 's01')!;
