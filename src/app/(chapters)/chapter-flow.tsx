"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ChapterLayout from "../chapter-layout";
import ChapterNavigation from "../chapter-navigation";
import { advanceProgress, recordStepVisit, switchChapter } from "../progress-action";
import type { Progress } from "../progress";
import type { AttemptOutcome } from "../usability";
import { chapterTabTitles } from "./chapter-titles";
import { useChapterUsability } from "./use-chapter-usability";
import { latihanTitle, useLatihan } from "./latihan/latihan";
import { latihanPanelName } from "./latihan/latihan-state";
import Pengantar, { panelNames } from "./pengantar/pengantar";
import Tutorial, { tutorialTitle } from "./tutorial/tutorial";
import { layoutTour, tutorialCompletionPath, tutorialCompletionStage, tutorialLastStage, tutorialPanelName, tutorialStageFromParam } from "./tutorial/tutorial-flow";

export default function ChapterFlow({ progress: initialProgress, initialTutorialStage, initialLatihanOpen, storageScope }: {
    progress: Progress;
    initialTutorialStage?: number;
    initialLatihanOpen?: boolean;
    storageScope: string | null;
}) {
    const params = useSearchParams();
    const panel = params.get("panel");
    const [{ progress, pageIndex }, setChapter] = useState(() => ({
        progress: initialProgress,
        pageIndex: initialProgress.endsWith("latihan")
            ? Number(initialLatihanOpen ?? (panel === latihanPanelName))
            : initialProgress.endsWith("tutorial")
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
    const isLatihan = progress === "latihan" || progress === "replay-latihan";
    useChapterUsability(isLatihan ? "latihan" : isTutorial ? "tutorial" : "pengantar", progress.startsWith("replay-"));
    const latihanProgress = initialProgress.startsWith("replay-") ? "replay-latihan" : "latihan";
    const latihan = useLatihan(isLatihan ? pageIndex : -1, storageScope ? `toporme:latihan:v1:${storageScope}:${latihanProgress}` : null);
    const isTutorialPanel = isTutorial && pageIndex === 1;
    const lastPageIndex = panelNames.length - 1;
    const isLastPage = pageIndex === lastPageIndex;
    const isTutorialComplete = isTutorialPanel && tutorialStage === tutorialLastStage;
    const isSusContinuation = latihan.canContinue && progress === "latihan";
    const tutorialPercent = isTutorialPanel
        ? (Math.max(0, tutorialStage - layoutTour.length) / (tutorialLastStage - layoutTour.length)) * 100
        : 0;

    const chapterTitle = isLatihan ? latihanTitle : isTutorial ? tutorialTitle : "Pengantar Topological Sort";
    const tabTitle = isLatihan ? chapterTabTitles.latihan : isTutorial ? chapterTabTitles.tutorial : chapterTabTitles.pengantar;

    useEffect(() => {
        document.title = `${tabTitle} - TopORME`;
    }, [tabTitle]);

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
            const step = pathname === "/latihan" ? "latihan" : pathname === "/tutorial" ? "tutorial" : pathname === "/pengantar" ? "pengantar" : null;
            if (!step) return;
            const params = new URLSearchParams(search);
            const panel = params.get("panel");
            try {
                const visited = await recordStepVisit(step);
                if (!visited || window.location.pathname !== pathname || window.location.search !== search) return;
                setPlaying(false);
                setContinuationReady(false);
                if (step === "tutorial") {
                    setTutorialStage(panel === tutorialPanelName ? tutorialStageFromParam(params.get("stage")) : 0);
                }
                setChapter({
                    progress: visited,
                    pageIndex: step === "latihan" ? Number(panel === latihanPanelName)
                        : step === "tutorial" ? Number(panel === tutorialPanelName)
                        : Math.max(0, panelNames.indexOf(panel ?? "")),
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
        if (isTutorial) setTutorialStage(0);
        setChapter({ progress, pageIndex: index });
        const url = new URL(window.location.href);
        url.searchParams.delete("stage");
        if (index === 0) url.searchParams.delete("panel");
        else url.searchParams.set("panel", isLatihan ? latihanPanelName : isTutorial ? tutorialPanelName : panelNames[index]);
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
        window.scrollTo({ top: 0, behavior: "instant" });
    }

    function goNext() {
        if (switching.current) return;
        if (isLatihan) {
            if (pageIndex === 0) goToPage(1);
        } else if (isTutorialPanel) {
            if (isTutorialComplete) {
                if (continuationReady) void goToOtherChapter("/latihan");
                return;
            }
            if (tutorialStage + 1 === tutorialLastStage) setContinuationReady(false);
            setPlaying(false);
            setTutorialStage(tutorialStage + 1);
        } else if (isTutorial) {
            goToPage(1);
        } else if (isLastPage) {
            void goToOtherChapter("/tutorial");
        } else {
            goToPage(pageIndex + 1);
        }
    }

    function goPrev() {
        if (switching.current) return;
        if (isLatihan && pageIndex === 0) {
            void goToOtherChapter(tutorialCompletionPath);
        } else if (isTutorialPanel && tutorialStage > 0) {
            setPlaying(false);
            setTutorialStage(tutorialStage - 1);
        } else if (isTutorial && !isTutorialPanel) {
            void goToOtherChapter("/pengantar?panel=langkah");
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

    async function goToOtherChapter(path: string, outcome: AttemptOutcome = "completed") {
        if (switching.current) return;
        switching.current = true;
        setError(false);
        try {
            const destination = await switchChapter(progress, path === "/latihan", outcome);
            if (!destination) {
                setError(true);
                return;
            }
            window.history.pushState(null, "", path);
            window.scrollTo({ top: 0, behavior: "instant" });
            setPlaying(false);
            setContinuationReady(false);
            if (path === tutorialCompletionPath) setTutorialStage(tutorialLastStage);
            else if (path === "/tutorial") setTutorialStage(0);
            setChapter({
                progress: destination,
                pageIndex: path === tutorialCompletionPath ? 1 : path.startsWith("/pengantar") ? lastPageIndex : 0,
            });
        } catch {
            setError(true);
        } finally {
            switching.current = false;
        }
    }

    return (
        <ChapterLayout
            progress={progress}
            percent={isLatihan ? latihan.percent : isTutorial ? tutorialPercent : (pageIndex / lastPageIndex) * 100}
            title={chapterTitle}
            skipDisabled={isLatihan || (!isTutorial && isLastPage)}
            onSkip={(event) => {
                event.preventDefault();
                if (isLatihan) return;
                if (isTutorial) void goToOtherChapter("/latihan", "skipped");
                else if (!isLastPage) void goToOtherChapter("/tutorial", "skipped");
            }}
            navigation={
                <>
                    {latihan.canContinue && (
                        <form id="latihan-continuation" action={advanceProgress.bind(null, progress)} hidden />
                    )}
                    <ChapterNavigation
                        isFirstPage={!isTutorial && !isLatihan && pageIndex === 0}
                        prevLabel={isTutorial && !isTutorialPanel ? "Kembali ke Bagian 1" : undefined}
                        nextLabel={isLatihan ? (isSusContinuation ? "Lanjut ke SUS Form" : undefined) : isTutorialComplete ? "Lanjut ke Bagian 3" : !isTutorial && isLastPage ? "Lanjut ke Bagian 2" : undefined}
                        nextAccent={isLatihan ? isSusContinuation : isTutorialComplete || (!isTutorial && isLastPage)}
                        nextForm={latihan.canContinue ? "latihan-continuation" : undefined}
                        nextDisabled={isLatihan ? pageIndex === 1 && !latihan.canContinue : isTutorialComplete && !continuationReady}
                        onPrev={goPrev}
                        onNext={latihan.canContinue ? undefined : goNext}
                    />
                    {error && <p role="alert">Gagal berpindah bagian. Coba lagi.</p>}
                </>
            }
        >
            <Pengantar activePage={isTutorial || isLatihan ? -1 : pageIndex} />
            <Tutorial
                activePage={isTutorial ? pageIndex : -1}
                stage={tutorialStage}
                playing={playing}
                onTogglePlayback={toggleDemonstration}
                onTourPrev={goPrev}
                onTourNext={goNext}
                onTourSkip={skipIntroduction}
            />
            {latihan.panels}
        </ChapterLayout>
    );
}
