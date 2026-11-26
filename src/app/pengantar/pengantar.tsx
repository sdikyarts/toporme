"use client";

import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import ChapterLayout, { chapterProgressForm } from "../chapter-layout";
import ChapterNavigation from "../chapter-navigation";
import { switchChapter } from "../progress-action";
import type { Progress } from "../progress";
import ChapterTitle from "./chapter-title";
import Definisi from "./definisi";
import Langkah from "./langkah";

const chapterPages = [ChapterTitle, Definisi, Langkah];
const panelNames = ["judul", "definisi", "langkah"];

export default function Pengantar({ progress: initialProgress }: { progress: Progress }) {
    const panel = useSearchParams().get("panel");
    const [{ progress, pageIndex }, setChapter] = useState(() => ({
        progress: initialProgress,
        pageIndex: Math.max(0, panelNames.indexOf(panel ?? "")),
    }));
    const [error, setError] = useState(false);
    const switching = useRef(false);
    const isTutorial = progress === "tutorial" || progress === "replay-tutorial";
    const lastPageIndex = chapterPages.length - 1;
    const isLastPage = pageIndex === lastPageIndex;

    function goToPage(index: number) {
        if (switching.current) return;
        const url = new URL(window.location.href);
        if (index === 0) url.searchParams.delete("panel");
        else url.searchParams.set("panel", panelNames[index]);
        window.history.replaceState(null, "", url);
        setChapter({ progress, pageIndex: index });
    }

    async function goToOtherChapter() {
        if (switching.current) return;
        switching.current = true;
        setError(false);
        try {
            const destination = await switchChapter(progress);
            if (!destination) {
                setError(true);
                return;
            }
            window.history.replaceState(null, "", isTutorial ? "/pengantar?panel=langkah" : "/tutorial");
            setChapter({ progress: destination, pageIndex: isTutorial ? lastPageIndex : 0 });
        } catch {
            setError(true);
        } finally {
            switching.current = false;
        }
    }

    return (
        <ChapterLayout
            progress={progress}
            percent={isTutorial ? 0 : (pageIndex / lastPageIndex) * 100}
            title={isTutorial ? "Tutorial Topological Sort" : undefined}
            skipDisabled={!isTutorial && isLastPage}
            onSkip={isTutorial ? undefined : (event) => {
                event.preventDefault();
                if (!isLastPage) void goToOtherChapter();
            }}
            navigation={
                <>
                    <ChapterNavigation
                        isFirstPage={!isTutorial && pageIndex === 0}
                        prevLabel={isTutorial ? "Kembali ke Bagian 1" : undefined}
                        nextForm={isTutorial ? chapterProgressForm : undefined}
                        nextLabel={!isTutorial && isLastPage ? "Lanjut ke Bagian 2" : undefined}
                        nextAccent={!isTutorial && isLastPage}
                        onPrev={isTutorial ? goToOtherChapter : () => goToPage(pageIndex - 1)}
                        onNext={isTutorial ? undefined : isLastPage ? goToOtherChapter : () => goToPage(pageIndex + 1)}
                    />
                    {error && <p role="alert">Gagal berpindah bagian. Coba lagi.</p>}
                </>
            }
        >
            {chapterPages.map((Panel, index) => (
                <div className="chapter-panel" inert={isTutorial || index !== pageIndex} key={index}>
                    <Panel active={!isTutorial && index === pageIndex} />
                </div>
            ))}
            <div className="chapter-panel" inert={!isTutorial}>
                <ChapterTitle section="Bagian 2" title="Tutorial Topological Sort" />
            </div>
        </ChapterLayout>
    );
}
