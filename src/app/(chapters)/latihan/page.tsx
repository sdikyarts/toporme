import ChapterPage from "../chapter-page";
import { latihanPanelName } from "./latihan-state";

export const metadata = { title: "Latihan Topological Sort" };

export default async function Page({ searchParams }: PageProps<"/latihan">) {
  const { panel } = await searchParams;
  return <ChapterPage step="latihan" initialLatihanOpen={panel === latihanPanelName} />;
}
