"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ChapterLayout, { chapterProgressForm } from "../chapter-layout";
import ChapterNavigation from "../chapter-navigation";
import { recordStepVisit, switchChapter } from "../progress-action";
import type { Progress } from "../progress";
import Pengantar, { panelNames } from "./pengantar/pengantar";
import Tutorial, { tutorialTitle } from "./tutorial/tutorial";
import { layoutTour, tutorialCompletionStage, tutorialLastStage, tutorialPanelName, tutorialStageFromParam } from "./tutorial/tutorial-flow";

export default function ChapterFlow({ progress: initialProgress, initialTutorialStage }: { progress: Progress; initialTutorialStage?: number }) {
    const params = useSearchParams();
    const panel = params.get("panel");
    const [{ progress, pageIndex }, setChapter] = useState(() => ({
        progress: initialProgress,
        pageIndex: initialProgress.endsWith("tutorial")
            ? Number(initialTutorialStage !== undefined || panel === tutorialPanelName)
            : Math.max(0, panelNames.indexOf(panel ?? "")),
    }));
    const [error, setError] = useState(false);
    const [tutorialStage, setTutorialStage] = useState(() => initialTutorialStage ?? (
        initialProgress.endsWith("tutorial") && panel === tutorialPanelName ? tutorialStageFromParam(params.get("stage")) : 0
    ));
    const [playing, setPlaying] = useState(false);
    const [continuationReady, setContinuationReady] = useState(false);
    const switching = useRef(false);
    const isTutorial = progress === "tutorial" || progress === "replay-tutorial";
    const isTutorialPanel = isTutorial && pageIndex === 1;
    const lastPageIndex = panelNames.length - 1;
    const isLastPage = pageIndex === lastPageIndex;
    const isTutorialComplete = isTutorialPanel && tutorialStage === tutorialLastStage;

    useEffect(() => {
        if (!isTutorialComplete) return;
        const timer = window.setTimeout(() => setContinuationReady(true), 500);
        return () => window.clearTimeout(timer);
    }, [isTutorialComplete]);

    useLayoutEffect(() => {
        if (!isTutorialPanel) return;
        const url = new URL(window.location.href);
        if (url.pathname !== "/tutorial" || url.searchParams.get("panel") !== tutorialPanelName) return;
        const stage = isTutorialComplete ? tutorialCompletionStage : String(tutorialStage);
        if (url.searchParams.get("stage") === stage) return;
        url.searchParams.set("stage", stage);
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }, [isTutorialPanel, isTutorialComplete, tutorialStage]);

    useEffect(() => {
        if (!playing || !isTutorialPanel || isTutorialComplete) return;
        const timer = window.setTimeout(() => {
            if (tutorialStage + 1 === tutorialLastStage) {
                setContinuationReady(false);
                setPlaying(false);
            }
            setTutorialStage(tutorialStage + 1);
        }, 1200);
        return () => window.clearTimeout(timer);
    }, [playing, isTutorialPanel, isTutorialComplete, tutorialStage]);

    useEffect(() => {
        async function restoreChapter() {
            const { pathname, search } = window.location;
            const step = pathname === "/tutorial" ? "tutorial" : pathname === "/pengantar" ? "pengantar" : null;
            if (!step) return;
            const params = new URLSearchParams(search);
            const panel = params.get("panel");
            try {
                const visited = await recordStepVisit(step);
                if (!visited || window.location.pathname !== pathname || window.location.search !== search) return;
                setPlaying(false);
                setContinuationReady(false);
                setTutorialStage(step === "tutorial" && panel === tutorialPanelName ? tutorialStageFromParam(params.get("stage")) : 0);
                setChapter({
                    progress: visited,
                    pageIndex: step === "tutorial" ? Number(panel === tutorialPanelName) : Math.max(0, panelNames.indexOf(panel ?? "")),
                });
            } catch {
                setError(true);
            }
        }

        window.addEventListener("popstate", restoreChapter);
        return () => window.removeEventListener("popstate", restoreChapter);
    }, []);

    function goToPage(index: number) {
        if (switching.current) return;
        setPlaying(false);
        setTutorialStage(0);
        setChapter({ progress, pageIndex: index });
        const url = new URL(window.location.href);
        url.searchParams.delete("stage");
        if (index === 0) url.searchParams.delete("panel");
        else url.searchParams.set("panel", isTutorial ? tutorialPanelName : panelNames[index]);
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }

    function goNext() {
        if (isTutorialPanel) {
            if (tutorialStage + 1 === tutorialLastStage) setContinuationReady(false);
            setPlaying(false);
            setTutorialStage(tutorialStage + 1);
        } else if (isTutorial) {
            goToPage(1);
        } else if (isLastPage) {
            void goToOtherChapter();
        } else {
            goToPage(pageIndex + 1);
        }
    }

    function goPrev() {
        if (isTutorialPanel && tutorialStage > 0) {
            setPlaying(false);
            setTutorialStage(tutorialStage - 1);
        } else if (isTutorial && !isTutorialPanel) {
            void goToOtherChapter();
        } else {
            goToPage(pageIndex - 1);
        }
    }

    function toggleDemonstration() {
        if (isTutorialComplete) {
            setTutorialStage(layoutTour.length);
            setPlaying(true);
        } else {
            setPlaying(!playing);
        }
    }

    function skipIntroduction() {
        setPlaying(false);
        setTutorialStage(layoutTour.length);
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
            window.history.pushState(null, "", isTutorial ? "/pengantar?panel=langkah" : "/tutorial");
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
            percent={isTutorial ? (tutorialStage / tutorialLastStage) * 100 : (pageIndex / lastPageIndex) * 100}
            title={isTutorial ? tutorialTitle : undefined}
            skipDisabled={!isTutorial && isLastPage}
            onSkip={isTutorial ? undefined : (event) => {
                event.preventDefault();
                if (!isLastPage) void goToOtherChapter();
            }}
            navigation={
                <>
                    <ChapterNavigation
                        isFirstPage={!isTutorial && pageIndex === 0}
                        prevLabel={isTutorial && !isTutorialPanel ? "Kembali ke Bagian 1" : undefined}
                        nextLabel={isTutorialComplete ? "Lanjut ke Bagian 3" : !isTutorial && isLastPage ? "Lanjut ke Bagian 2" : undefined}
                        nextAccent={isTutorialComplete || (!isTutorial && isLastPage)}
                        nextForm={isTutorialComplete ? chapterProgressForm : undefined}
                        nextDisabled={isTutorialComplete && !continuationReady}
                        onPrev={goPrev}
                        onNext={isTutorialComplete ? undefined : goNext}
                    />
                    {error && <p role="alert">Gagal berpindah bagian. Coba lagi.</p>}
                </>
            }
        >
            <Pengantar activePage={isTutorial ? -1 : pageIndex} />
            <Tutorial
                activePage={isTutorial ? pageIndex : -1}
                stage={tutorialStage}
                playing={playing}
                onTogglePlayback={toggleDemonstration}
                onTourPrev={goPrev}
                onTourNext={goNext}
                onTourSkip={skipIntroduction}
            />
        </ChapterLayout>
    );
}
