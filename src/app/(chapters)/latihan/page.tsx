import ChapterPage from "../chapter-page";
import { latihanPanelName } from "./latihan-state";

export default async function Page({ searchParams }: PageProps<"/latihan">) {
  const { panel } = await searchParams;
  return <ChapterPage step="latihan" initialLatihanOpen={panel === latihanPanelName} />;
}
