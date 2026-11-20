// Pencocokan opsi pilihan ganda: satu sumber aturan dengan Agent 2.
// Opsi harus sama persis dengan kunci/alternatif sah (trim + spasi ganda),
// sementara kapitalisasi tetap berarti ("musik" != "Musik").
import { choiceMatches as exactChoiceMatches } from "../srs/answers";

export type ChoiceAnswer = { answer: string; altAnswers?: string[] };

export function choiceMatches(option: string, item: ChoiceAnswer): boolean {
  return exactChoiceMatches(option, item.answer, item.altAnswers ?? []);
}
