// Pemeriksaan kompilasi (type-only): komponen 2a dapat didaftarkan langsung
// lewat registerFeatureView milik 1a tanpa wrapper. Tidak ada runtime import
// dari routeView, sehingga tidak ada siklus modul.
import type { ComponentType } from 'react';
import type { ViewProps } from '../../app/routeView';
import { LessonFlow, ReadingFlow, CheckpointFlow } from './index';

export const lessonAsFeatureView: ComponentType<ViewProps> = LessonFlow;
export const readingAsFeatureView: ComponentType<ViewProps> = ReadingFlow;
export const checkpointAsFeatureView: ComponentType<ViewProps> = CheckpointFlow;
