import ChapterTitle from "./chapter-title";
import Definisi from "./definisi";
import Langkah from "./langkah";

const chapterPages = [ChapterTitle, Definisi, Langkah];
export const panelNames = ["judul", "definisi", "langkah"];

export default function Pengantar({ activePage }: { activePage: number }) {
    return chapterPages.map((Panel, index) => (
        <div className="chapter-panel" inert={index !== activePage} key={panelNames[index]}>
            <Panel active={index === activePage} />
        </div>
    ));
}
