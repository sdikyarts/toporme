import ChapterPage from "../chapter-page";
import { chapterTabTitles } from "../chapter-titles";
import { latihanPanelName } from "./latihan-state";

export const metadata = { title: chapterTabTitles.latihan };

export default async function Page({ searchParams }: PageProps<"/latihan">) {
  const { panel } = await searchParams;
  return <ChapterPage step="latihan" initialLatihanOpen={panel === latihanPanelName} />;
}
