import { useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import GraphInDegree from "../../graph-in-degree";
import { demonstration, layoutTour, tutorialCompletionStep } from "./tutorial-flow";
import Definisi from "../pengantar/definisi";
import Langkah from "../pengantar/langkah";

const tutorialSteps = [
    { title: "Tentukan atau perbarui in-degree setiap node.", description: "Lihat angka in-degree pada graf." },
    { title: "Pilih node yang memiliki in-degree 0 (tidak memiliki incoming edge).", description: "Amati node yang disorot." },
    { title: "Hapus semua outgoing edge dari node yang telah dipilih tersebut", description: "Amati panah yang dihapus satu per satu." },
    { title: "Tambahkan node yang outgoing edge-nya sudah dihapus ke Urutan Sorting.", description: "Amati perubahan pada Urutan Sorting." },
    { title: "Proses topological sort selesai", description: "Lihat hasil di Urutan Sorting." },
];

export type TutorialStepProps = {
    stage: number;
    playing?: boolean;
    onTogglePlayback?: () => void;
    onTourPrev?: () => void;
    onTourNext?: () => void;
    onTourSkip?: () => void;
    practice?: {
        active: boolean;
        step: number;
        iteration: number;
        queue: readonly string[];
        graph: ReactNode;
        review: { correct: boolean; message: string } | null;
        feedbackOpen: boolean;
        checkDisabled: boolean;
        queuedFrom: DOMRect | null;
        hint: string;
        onCheck: () => void;
        onDismissFeedback: () => void;
        onResolveFeedback: () => void;
    };
};

function GraphViewport({ practice, children }: { practice: boolean; children: ReactNode }) {
    return (
        <>
            {practice && <p className="practice-graph-scroll-hint">Geser graf ke samping untuk melihat semua node.</p>}
            <div className="graph-viewport" data-practice={practice} tabIndex={practice ? 0 : undefined}
                role={practice ? "region" : undefined} aria-label={practice ? "Area graf latihan" : undefined}>
                <div className="graph-content">{children}</div>
            </div>
        </>
    );
}

function revealStep(list: HTMLDivElement, card: HTMLElement) {
    let cancelled = false;
    const details = card.querySelector(".tutorial-step-details");

    function scrollToCard() {
        if (cancelled) return;
        const bounds = list.getBoundingClientRect();
        const target = card.getBoundingClientRect();
        const zoom = list.currentCSSZoom ?? 1;
        const bottom = bounds.bottom - 6 * zoom;
        const offset = target.bottom > bottom ? target.bottom - bottom : Math.min(0, target.top - bounds.top);
        if (offset === 0) return;

        list.scrollTo({
            top: list.scrollTop + offset / zoom,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        });
    }

    const animations = details?.getAnimations() ?? [];
    if (animations.length) void Promise.allSettled(animations.map((animation) => animation.finished)).then(scrollToCard);
    else scrollToCard();

    return () => { cancelled = true; };
}

export default function TutorialStep({ stage, playing, onTogglePlayback, onTourPrev, onTourNext, onTourSkip, practice }: TutorialStepProps) {
    const tour = practice ? undefined : layoutTour[stage];
    const demo = practice ? undefined : demonstration[stage - layoutTour.length];
    const frame = practice ?? demo;
    const inactiveDegrees = demo?.inactiveDegree ? [...demo.queue, demo.inactiveDegree] : demo?.queue;
    const complete = frame?.step === tutorialCompletionStep;
    const queuedFrom = practice?.queuedFrom;
    const queueList = useRef<HTMLDivElement>(null);
    const queueId = useId();
    const descriptionId = useId();
    const hintId = useId();
    const materialId = useId();
    const feedbackTitleId = useId();
    const feedbackMessageId = useId();
    const worksheet = useRef<HTMLDivElement>(null);
    const materialDialog = useRef<HTMLDialogElement>(null);
    const feedbackDialog = useRef<HTMLDialogElement>(null);
    const feedbackAction = useRef<HTMLButtonElement>(null);
    const checkButton = useRef<HTMLButtonElement>(null);
    const feedbackOpen = Boolean(practice?.feedbackOpen && practice.review);
    const hintPopup = useRef<HTMLDivElement>(null);
    const hintTrigger = useRef<HTMLButtonElement>(null);
    const [hintOpen, setHintOpen] = useState(false);
    const [queueExpanded, setQueueExpanded] = useState(true);
    const [wasComplete, setWasComplete] = useState(complete);
    const [expansion, setExpansion] = useState<{ stage: number; cards: Record<number, boolean> }>({ stage, cards: {} });
    const steps = useRef<HTMLDivElement>(null);
    const expandedCard = useRef<HTMLButtonElement>(null);
    const thumb = useRef<HTMLDivElement>(null);
    const drag = useRef<{ y: number; scrollTop: number } | null>(null);

    if (complete !== wasComplete) {
        setWasComplete(complete);
        if (complete) setQueueExpanded(true);
    }

    useLayoutEffect(() => {
        const dialog = feedbackDialog.current;
        if (!dialog) return;
        if (feedbackOpen && !dialog.open) {
            dialog.showModal();
            feedbackAction.current?.focus();
        } else if (!feedbackOpen && dialog.open) {
            dialog.close();
            if (checkButton.current?.disabled) {
                worksheet.current?.querySelector<HTMLButtonElement>(".practice-node .node-circle:enabled")?.focus();
            } else {
                checkButton.current?.focus({ preventScroll: true });
            }
        }
    }, [feedbackOpen]);

    const practiceActive = practice?.active;
    useEffect(() => {
        if (!practiceActive) return;

        function handleEnter(event: KeyboardEvent) {
            if (event.key !== "Enter" || event.defaultPrevented || event.isComposing ||
                event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || materialDialog.current?.open) return;

            const modal = feedbackDialog.current?.open;
            const action = modal ? feedbackAction.current : checkButton.current;
            const target = event.target;
            if (event.repeat) {
                if (modal || target === action) event.preventDefault();
                return;
            }
            if (target instanceof Element && target.closest('button, input, select, textarea, summary, a[href], [contenteditable], [role="button"]')) return;
            if (!action || action.disabled) return;

            event.preventDefault();
            action.click();
        }

        document.addEventListener("keydown", handleEnter, true);
        return () => document.removeEventListener("keydown", handleEnter, true);
    }, [practiceActive]);

    useLayoutEffect(() => {
        const list = queueList.current;
        const node = list?.lastElementChild;
        if (!queuedFrom || !list || !(node instanceof HTMLElement)) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const target = node.getBoundingClientRect();
        if (!target.width || !queuedFrom.width) return;
        const zoom = document.body.currentCSSZoom ?? 1;
        const { backgroundColor, borderColor } = getComputedStyle(node);
        const movingNode = node.cloneNode(true) as HTMLElement;
        movingNode.setAttribute("aria-hidden", "true");
        Object.assign(movingNode.style, {
            position: "fixed",
            left: `${target.left / zoom}px`,
            top: `${target.top / zoom}px`,
            width: `${target.width / zoom}px`,
            height: `${target.height / zoom}px`,
            backgroundColor,
            borderColor,
            transformOrigin: "top left",
            pointerEvents: "none",
            zIndex: "10",
            animation: "none",
        });
        document.body.append(movingNode);
        const duration = 300;
        const travel = movingNode.animate([
            { transform: `translate(${(queuedFrom.left - target.left) / zoom}px, ${(queuedFrom.top - target.top) / zoom}px) scale(${queuedFrom.width / target.width})` },
            { transform: "none" },
        ], { duration, easing: "ease-in-out" });
        const reveal = node.animate([{ opacity: 0 }, { opacity: 0 }], { duration });
        travel.onfinish = () => movingNode.remove();

        return () => {
            travel.cancel();
            reveal.cancel();
            movingNode.remove();
        };
    }, [queuedFrom]);

    useLayoutEffect(() => {
        if (!hintOpen) return;
        const popup = hintPopup.current!;
        const trigger = hintTrigger.current!;
        const sorting = trigger.closest<HTMLElement>(".urutan-sorting-container")!;
        const worksheet = sorting.closest<HTMLElement>(".orme-container")!;

        function positionHint() {
            const zoom = popup.currentCSSZoom ?? 1;
            const inset = 8 * zoom;
            const gap = 6 * zoom;
            const triggerBounds = trigger.getBoundingClientRect();
            const sortingBounds = sorting.getBoundingClientRect();
            const worksheetBounds = worksheet.getBoundingClientRect();
            const { clientWidth, clientHeight } = document.documentElement;
            const left = Math.max(inset, sortingBounds.left + inset);
            const right = Math.min(clientWidth - inset, sortingBounds.right - inset);
            const top = Math.max(inset, worksheetBounds.top + inset);
            const bottom = Math.min(clientHeight - inset, worksheetBounds.bottom - inset);

            popup.style.maxWidth = `${Math.max(0, right - left) / zoom}px`;
            popup.style.maxHeight = `${Math.max(0, bottom - top) / zoom}px`;
            const { width, height } = popup.getBoundingClientRect();
            const below = triggerBounds.bottom + gap;
            const above = triggerBounds.top - gap - height;
            const x = Math.max(left, Math.min(triggerBounds.left, right - width));
            const y = below + height <= bottom ? below : Math.max(top, above);
            popup.style.left = `${x / zoom}px`;
            popup.style.top = `${y / zoom}px`;
            popup.style.visibility = triggerBounds.bottom > top && triggerBounds.top < bottom ? "visible" : "hidden";
        }

        const observer = new ResizeObserver(positionHint);
        observer.observe(popup);
        observer.observe(sorting);
        observer.observe(worksheet);
        window.addEventListener("resize", positionHint);
        window.addEventListener("scroll", positionHint, true);
        positionHint();
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", positionHint);
            window.removeEventListener("scroll", positionHint, true);
            popup.style.removeProperty("visibility");
        };
    }, [hintOpen]);

    useLayoutEffect(() => {
        const list = steps.current!;
        const indicator = thumb.current!;
        function updateThumb() {
            const { clientHeight, scrollHeight, scrollTop } = list;
            const overflow = scrollHeight - clientHeight;
            const canScroll = clientHeight > 0 && overflow > 1;
            list.toggleAttribute("data-fade-top", canScroll && scrollTop > 1);
            list.toggleAttribute("data-fade-bottom", canScroll && scrollTop < overflow - 1);
            indicator.hidden = !canScroll;
            if (indicator.hidden) return;
            const height = Math.max(24, (clientHeight / scrollHeight) * clientHeight);
            indicator.style.height = `${height}px`;
            indicator.style.top = `${(scrollTop / overflow) * (clientHeight - height)}px`;
        }

        const observer = new ResizeObserver(updateThumb);
        observer.observe(list);
        for (const card of list.children) observer.observe(card);
        list.addEventListener("scroll", updateThumb, { passive: true });
        list.addEventListener("animationend", updateThumb);
        updateThumb();
        return () => {
            observer.disconnect();
            list.removeEventListener("scroll", updateThumb);
            list.removeEventListener("animationend", updateThumb);
        };
    }, [complete]);

    useLayoutEffect(() => {
        const list = steps.current;
        const card = list?.querySelector<HTMLElement>('[aria-current="step"]');
        if (list && card) return revealStep(list, card);
    }, [stage, practice?.review]);

    useLayoutEffect(() => {
        const card = expandedCard.current;
        expandedCard.current = null;
        if (steps.current && card && expansion.stage === stage) return revealStep(steps.current, card);
    }, [expansion, stage]);

    function dragThumb(event: PointerEvent<HTMLDivElement>) {
        const list = steps.current;
        if (!drag.current || !list) return;
        const travel = list.getBoundingClientRect().height - event.currentTarget.getBoundingClientRect().height;
        if (travel > 0) {
            const distance = event.clientY - drag.current.y;
            list.scrollTop = drag.current.scrollTop + distance * (list.scrollHeight - list.clientHeight) / travel;
        }
    }

    const helpButtons = (
        <div className="tutorial-help-buttons">
            <button ref={hintTrigger} type="button" className="chapter-button tutorial-icon-button tutorial-hint-button" aria-label="Hint" title="Hint"
                aria-expanded={hintOpen} aria-controls={hintId} popoverTarget={hintId}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 18h6m-5 4h4m-5-7c0-2-3-3-3-7a6 6 0 0 1 12 0c0 4-3 5-3 7" />
                </svg>
                <span>Hint</span>
            </button>
            <div ref={hintPopup} id={hintId} className="worksheet-hint-popup" popover="auto" role="status"
                onToggle={(event) => setHintOpen(event.currentTarget.matches(":popover-open"))}>
                {practice?.hint ?? "Fitur Hint belum tersedia di tutorial."}
            </div>
            <button type="button" className="chapter-button tutorial-icon-button tutorial-material-button" aria-label="Baca Materi" title="Baca Materi"
                aria-haspopup="dialog" onClick={() => materialDialog.current?.showModal()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 6v15M3 4h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3z" />
                </svg>
                <span>Baca Materi</span>
            </button>
        </div>
    );
    return (
        <div ref={worksheet} className="orme-container" data-tour-target={tour?.target} data-demo-complete={complete}>
            <dialog
                ref={materialDialog}
                className="worksheet-material-dialog"
                aria-labelledby={materialId}
                onClick={(event) => {
                    if (event.target === event.currentTarget) event.currentTarget.close();
                }}
            >
                <div className="worksheet-material-panel">
                    <header className="worksheet-material-header">
                        <h2 id={materialId}>Materi Pengantar</h2>
                        <button type="button" className="chapter-button" onClick={() => materialDialog.current?.close()}>Tutup</button>
                    </header>
                    <div className="worksheet-material-body" tabIndex={0} role="region" aria-labelledby={materialId}>
                        <Definisi showIllustration={false} />
                        <Langkah showIllustration={false} />
                    </div>
                </div>
            </dialog>
            {practice && (
                <dialog ref={feedbackDialog} className="worksheet-material-dialog practice-feedback-dialog"
                    aria-labelledby={feedbackTitleId} aria-describedby={feedbackMessageId}
                    onCancel={(event) => { event.preventDefault(); practice.onDismissFeedback(); }}
                    onClick={(event) => { if (event.target === event.currentTarget) practice.onDismissFeedback(); }}>
                    <div className="practice-feedback-panel">
                        <h2 id={feedbackTitleId}>Hasil pemeriksaan</h2>
                        <p id={feedbackMessageId}>{practice.review?.message}</p>
                        <div className="practice-feedback-actions">
                            <button type="button" className="chapter-button practice-feedback-dismiss" onClick={practice.onDismissFeedback}>Tutup</button>
                            <button ref={feedbackAction} type="button" className="chapter-button practice-feedback-action"
                                data-correct={practice.review?.correct} onClick={practice.onResolveFeedback}>
                                {practice.review?.correct ? "Lanjut" : "Coba lagi"}
                            </button>
                        </div>
                    </div>
                </dialog>
            )}
            <div className="orme-content-left">
                <div className="langkah-langkah-container">
                    <div className="langkah-langkah-content">
                        <div className="langkah-langkah-header">
                            <h1>Langkah-langkah</h1>
                            <div className="langkah-langkah-iterasi-counter">
                                <span>{frame ? `Iterasi ke-${frame.iteration}` : "Iterasi ke-n"}</span>
                            </div>
                        </div>
                        <div className="langkah-langkah-scroll-area">
                            <div ref={steps} className="langkah-langkah-steps" tabIndex={0} role="region" aria-label="Langkah-langkah">
                                {tutorialSteps.slice(0, complete ? tutorialSteps.length : tutorialCompletionStep).map(({ title, description }, index) => {
                                    const current = frame?.step === index;
                                    const review = current ? practice?.review : null;
                                    const expanded = (expansion.stage === stage ? expansion.cards[index] : undefined) ?? (current || (!frame && index === 0));
                                    const id = `${descriptionId}-${index}`;

                                    return (
                                        <button
                                            key={title}
                                            type="button"
                                            className="langkah-langkah-card"
                                            aria-current={current ? "step" : undefined}
                                            aria-expanded={expanded}
                                            aria-controls={id}
                                            data-inactive={Boolean(frame) && !current}
                                            data-review={practice && index < practice.step ? "correct" : review ? (review.correct ? "correct" : "wrong") : undefined}
                                            onClick={(event) => {
                                                expandedCard.current = expanded ? null : event.currentTarget;
                                                setExpansion((previous) => ({
                                                    stage,
                                                    cards: { ...(previous.stage === stage ? previous.cards : {}), [index]: !expanded },
                                                }));
                                            }}
                                        >
                                            <span className="langkah-langkah-card-content">
                                                <span className="langkah-langkah-card-label">Langkah {index + 1}</span>
                                                <strong className="langkah-langkah-card-title">{title}</strong>
                                                <span id={id} className="tutorial-step-details" aria-hidden={!expanded}>
                                                    <span className="langkah-langkah-card-description">
                                                        {practice && index === 3 ? "Klik node terpilih untuk menambahkannya ke Urutan Sorting." : description}
                                                    </span>
                                                </span>
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div
                                ref={thumb}
                                className="langkah-langkah-scroll-thumb"
                                aria-hidden="true"
                                onPointerDown={(event) => {
                                    if (event.button !== 0 || !steps.current) return;
                                    drag.current = { y: event.clientY, scrollTop: steps.current.scrollTop };
                                    event.currentTarget.setPointerCapture(event.pointerId);
                                }}
                                onPointerMove={dragThumb}
                                onLostPointerCapture={() => { drag.current = null; }}
                            />
                        </div>
                        {demo && (
                            <button type="button" className="chapter-button tutorial-playback" onClick={onTogglePlayback}>
                                {complete ? "Putar ulang" : playing ? "Jeda" : "Putar otomatis"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {tour && (
                <aside className="tutorial-tour-overlay" aria-label="Pengenalan layout">
                    <div className="tutorial-tour-copy" aria-live="polite" aria-atomic="true">
                        <span className="langkah-langkah-card-label">Pengenalan {stage + 1} / {layoutTour.length}</span>
                        <div key={tour.target} className="tutorial-tour-message">
                            <h2 className="langkah-langkah-card-title">{tour.title}</h2>
                            <p className="langkah-langkah-card-description">{tour.description}</p>
                        </div>
                    </div>
                    <nav className="tutorial-tour-navigation" aria-label="Navigasi pengenalan">
                        <button type="button" className="tutorial-tour-skip" onClick={onTourSkip}>Lewati Pengenalan</button>
                        <button type="button" className="chapter-button" aria-label="Pengenalan sebelumnya" onClick={onTourPrev} disabled={stage === 0}>
                            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                                <path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <button type="button" className="chapter-button" aria-label={stage === layoutTour.length - 1 ? "Mulai demonstrasi" : "Pengenalan berikutnya"} onClick={onTourNext}>
                            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
                                <path d="M7.5 4.5 13 10l-5.5 5.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </nav>
                </aside>
            )}
            <div className="orme-content-right">
                <div className="urutan-sorting-container" data-compact={!queueExpanded || undefined}>
                    <div className="urutan-sorting-content">
                        <h1>
                            <button type="button" className="urutan-sorting-toggle" aria-expanded={queueExpanded} aria-controls={queueId}
                                onClick={() => setQueueExpanded((expanded) => !expanded)}>
                                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                                    <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                <span>Urutan Sorting</span>
                            </button>
                        </h1>
                        <div id={queueId} ref={queueList} className="urutan-sorting-queue" role="group" tabIndex={queueExpanded ? undefined : 0}
                            aria-live={practice ? "polite" : undefined} aria-label={frame?.queue.length ? `Urutan Sorting: ${frame.queue.join(", ")}` : "Urutan Sorting kosong"}>
                            {frame?.queue.map((node) => (
                                <span key={node} className="node-circle tutorial-queue-node" data-queued-by-click={practice ? "" : undefined}><span>{node}</span></span>
                            ))}
                        </div>
                        <div className="tutorial-graph-controls">
                            {helpButtons}
                            <button
                                ref={checkButton}
                                type="button"
                                className="chapter-button tutorial-check-button"
                                disabled={practice?.checkDisabled ?? true}
                                data-demo-only={!practice || undefined}
                                aria-label="Periksa"
                                aria-haspopup={practice ? "dialog" : undefined}
                                title={practice ? undefined : "Periksa tersedia di Latihan"}
                                onClick={practice?.onCheck}
                            >
                                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="m5 12 4 4L19 6" />
                                </svg>
                                <span>Periksa</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="graph-container">
                    <GraphViewport practice={Boolean(practice)}>
                        {practice ? practice.graph : <div className="topological-sort-graph-v1">
                            <div className="directed-acyclic-graph-v1">
                                <div className="edges-v1">
                                    <svg className="edge-v1-bc" data-removed={demo?.removed.includes("BC")} data-highlighted={demo?.highlightedEdges?.includes("BC")} xmlns="http://www.w3.org/2000/svg" width="187" height="29" viewBox="0 0 187 29" aria-hidden="true">
                                        <line x1="0" y1="14.4338" x2="164.5" y2="14.4338" />
                                        <path d="M187 14.4338L162 8.10623e-05V28.8676L187 14.4338Z" />
                                    </svg>
                                    <svg className="edge-v1-bd" data-removed={demo?.removed.includes("BD")} data-highlighted={demo?.highlightedEdges?.includes("BD")} xmlns="http://www.w3.org/2000/svg" width="200" height="149" viewBox="0 0 200 149" aria-hidden="true">
                                        <line x1="1.4837" y1="2.01221" x2="181.375" y2="134.659" />
                                        <path d="M199.484 148.012L187.929 121.558L170.796 144.792L199.484 148.012Z" />
                                    </svg>
                                    <svg className="edge-v1-cd" data-removed={demo?.removed.includes("CD")} data-highlighted={demo?.highlightedEdges?.includes("CD")} xmlns="http://www.w3.org/2000/svg" width="29" height="136" viewBox="0 0 29 136" aria-hidden="true">
                                        <line x1="14.4337" y1="0" x2="14.4337" y2="113.5" />
                                        <path d="M14.4337 136L28.8675 111L-3.6156e-05 111L14.4337 136Z" />
                                    </svg>
                                    <svg className="edge-v1-ab" data-removed={demo?.removed.includes("AB")} data-highlighted={demo?.highlightedEdges?.includes("AB")} xmlns="http://www.w3.org/2000/svg" width="29" height="137" viewBox="0 0 29 137" aria-hidden="true">
                                        <line x1="14.4338" y1="137" x2="14.4338" y2="22.5" />
                                        <path d="M14.4338 0L1.51315e-05 25L28.8675 25L14.4338 0Z" />
                                    </svg>
                                    <svg className="edge-v1-ad" data-removed={demo?.removed.includes("AD")} data-highlighted={demo?.highlightedEdges?.includes("AD")} xmlns="http://www.w3.org/2000/svg" width="187" height="29" viewBox="0 0 187 29" aria-hidden="true">
                                        <line x1="0" y1="14.4337" x2="164.5" y2="14.4337" />
                                        <path d="M187 14.4337L162 -2.68455e-05L162 28.8675L187 14.4337Z" />
                                    </svg>
                                </div>
                                <div className="nodes-v1">
                                    <div className="node-v1">
                                        <GraphInDegree node="B" readOnly disabled={inactiveDegrees?.includes("B")} value={demo?.degrees?.B ?? ""} />
                                        <div className="node-circle" data-selected={demo?.selected === "B"} data-sorted={frame?.queue.includes("B")}>
                                            <h1>B</h1>
                                        </div>
                                    </div>
                                    <div className="node-v1">
                                        <GraphInDegree node="C" readOnly disabled={inactiveDegrees?.includes("C")} value={demo?.degrees?.C ?? ""} />
                                        <div className="node-circle" data-selected={demo?.selected === "C"} data-sorted={frame?.queue.includes("C")}>
                                            <h1>C</h1>
                                        </div>
                                    </div>
                                    <div className="node-v1">
                                        <div className="node-circle" data-selected={demo?.selected === "A"} data-sorted={frame?.queue.includes("A")}>
                                            <h1>A</h1>
                                        </div>
                                        <GraphInDegree node="A" readOnly disabled={inactiveDegrees?.includes("A")} value={demo?.degrees?.A ?? ""} />
                                    </div>
                                    <div className="node-v1">
                                        <div className="node-circle" data-selected={demo?.selected === "D"} data-sorted={frame?.queue.includes("D")}>
                                            <h1>D</h1>
                                        </div>
                                        <GraphInDegree node="D" readOnly disabled={inactiveDegrees?.includes("D")} value={demo?.degrees?.D ?? ""} />
                                    </div>
                                </div>
                            </div>
                        </div>}
                    </GraphViewport>
                </div>
            </div>
        </div>
    );
}
