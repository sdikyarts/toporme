import ChapterPage from "../chapter-page";
import { chapterTabTitles } from "../chapter-titles";

export const metadata = { title: chapterTabTitles.pengantar };

export default function Page() {
  return <ChapterPage step="pengantar" />;
}
