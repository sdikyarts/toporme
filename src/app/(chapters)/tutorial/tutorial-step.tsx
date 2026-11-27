import { useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
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
        step: number;
        iteration: number;
        queue: readonly string[];
        graph: ReactNode;
        review: { correct: boolean; message: string } | null;
        checkLabel: string;
        checkDisabled: boolean;
        queuedFrom: DOMRect | null;
        hint: string;
        onCheck: () => void;
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

export default function TutorialStep({ stage, playing, onTogglePlayback, onTourPrev, onTourNext, onTourSkip, practice }: TutorialStepProps) {
    const tour = practice ? undefined : layoutTour[stage];
    const demo = practice ? undefined : demonstration[stage - layoutTour.length];
    const frame = practice ?? demo;
    const inactiveDegrees = demo?.inactiveDegree ? [...demo.queue, demo.inactiveDegree] : demo?.queue;
    const complete = frame?.step === tutorialCompletionStep;
    const queuedFrom = practice?.queuedFrom;
    const queueList = useRef<HTMLDivElement>(null);
    const descriptionId = useId();
    const hintId = useId();
    const materialId = useId();
    const materialDialog = useRef<HTMLDialogElement>(null);
    const hintAnchor = useRef<HTMLDivElement>(null);
    const hintTrigger = useRef<HTMLButtonElement>(null);
    const [hintOpen, setHintOpen] = useState(false);
    const [notification, setNotification] = useState({ message: "", visible: false });
    const [expansion, setExpansion] = useState<{ stage: number; cards: Record<number, boolean> }>({ stage, cards: {} });
    const steps = useRef<HTMLDivElement>(null);
    const thumb = useRef<HTMLDivElement>(null);
    const drag = useRef<{ y: number; scrollTop: number } | null>(null);

    useLayoutEffect(() => {
        const list = queueList.current;
        const node = list?.lastElementChild;
        if (!queuedFrom || !list || !(node instanceof HTMLElement)) return;

        list.scrollLeft = list.scrollWidth;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const target = node.getBoundingClientRect();
        if (!target.width || !queuedFrom.width) return;
        const movingNode = node.cloneNode(true) as HTMLElement;
        movingNode.setAttribute("aria-hidden", "true");
        Object.assign(movingNode.style, {
            position: "fixed",
            left: `${target.left}px`,
            top: `${target.top}px`,
            width: `${target.width}px`,
            height: `${target.height}px`,
            transformOrigin: "top left",
            pointerEvents: "none",
            zIndex: "10",
            animation: "none",
        });
        document.body.append(movingNode);
        const duration = 300;
        const travel = movingNode.animate([
            { transform: `translate(${queuedFrom.left - target.left}px, ${queuedFrom.top - target.top}px) scale(${queuedFrom.width / target.width})` },
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

    useEffect(() => {
        if (!notification.visible) return;
        const timeout = window.setTimeout(() => setNotification({ ...notification, visible: false }), 3200);
        return () => window.clearTimeout(timeout);
    }, [notification]);

    useEffect(() => {
        if (!hintOpen) return;

        function dismissOutside(event: globalThis.PointerEvent) {
            if (event.target instanceof Node && !hintAnchor.current?.contains(event.target)) setHintOpen(false);
        }

        function dismissOnEscape(event: KeyboardEvent) {
            if (event.key !== "Escape") return;
            setHintOpen(false);
            hintTrigger.current?.focus();
        }

        document.addEventListener("pointerdown", dismissOutside, true);
        document.addEventListener("keydown", dismissOnEscape);
        return () => {
            document.removeEventListener("pointerdown", dismissOutside, true);
            document.removeEventListener("keydown", dismissOnEscape);
        };
    }, [hintOpen]);

    function notifyUnavailable(feature: string) {
        setNotification({ message: `Fitur ${feature} belum tersedia di tutorial.`, visible: true });
    }

    useLayoutEffect(() => {
        const list = steps.current!;
        const indicator = thumb.current!;
        let hideThumb: ReturnType<typeof setTimeout> | undefined;

        function updateThumb() {
            const { clientHeight, scrollHeight, scrollTop } = list;
            const overflow = scrollHeight - clientHeight;
            const canScroll = clientHeight > 0 && overflow > 1;
            list.toggleAttribute("data-fade-top", canScroll && scrollTop > 1);
            list.toggleAttribute("data-fade-bottom", canScroll && scrollTop < overflow - 1);
            indicator.hidden = clientHeight === 0 || overflow <= 0;
            if (indicator.hidden) return;
            const height = Math.max(24, (clientHeight / scrollHeight) * clientHeight);
            indicator.style.height = `${height}px`;
            indicator.style.top = `${(scrollTop / overflow) * (clientHeight - height)}px`;
        }

        function onScroll() {
            updateThumb();
            if (indicator.hidden) return;
            indicator.dataset.scrolling = "true";
            clearTimeout(hideThumb);
            hideThumb = setTimeout(() => { delete indicator.dataset.scrolling; }, 900);
        }
        const observer = new ResizeObserver(updateThumb);
        observer.observe(list);
        for (const card of list.children) observer.observe(card);
        list.addEventListener("scroll", onScroll, { passive: true });
        list.addEventListener("animationend", updateThumb);
        updateThumb();
        return () => {
            observer.disconnect();
            list.removeEventListener("scroll", onScroll);
            list.removeEventListener("animationend", updateThumb);
            clearTimeout(hideThumb);
        };
    }, [complete]);

    useLayoutEffect(() => {
        const list = steps.current;
        const card = list?.querySelector<HTMLElement>('[aria-current="step"]');
        if (!list || !card) return;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        function scrollToCurrent(list: HTMLElement, card: HTMLElement) {
            const bounds = list.getBoundingClientRect();
            const current = card.getBoundingClientRect();
            if (current.top >= bounds.top && current.bottom <= bounds.bottom) return;
            const offset = current.top < bounds.top ? current.top - bounds.top : current.bottom - bounds.bottom;
            list.scrollTo({ top: list.scrollTop + offset, behavior: reducedMotion ? "instant" : "smooth" });
        }

        const timeout = window.setTimeout(() => scrollToCurrent(list, card), reducedMotion ? 0 : 260);
        return () => window.clearTimeout(timeout);
    }, [stage, practice?.review]);

    function dragThumb(event: PointerEvent<HTMLDivElement>) {
        const list = steps.current;
        if (!drag.current || !list) return;
        const travel = list.clientHeight - event.currentTarget.offsetHeight;
        if (travel > 0) {
            list.scrollTop = drag.current.scrollTop + (event.clientY - drag.current.y) * (list.scrollHeight - list.clientHeight) / travel;
        }
    }

    const helpButtons = (
        <div className="tutorial-help-buttons">
            <div className="worksheet-hint-anchor" ref={hintAnchor}>
                <button ref={hintTrigger} type="button" className="chapter-button tutorial-icon-button tutorial-hint-button" aria-label="Hint" title="Hint" data-usability-feature="hint"
                    aria-expanded={hintOpen} aria-controls={hintId} onClick={() => setHintOpen((open) => !open)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 18h6m-5 4h4m-5-7c0-2-3-3-3-7a6 6 0 0 1 12 0c0 4-3 5-3 7" />
                    </svg>
                    <span>Hint</span>
                </button>
                <div id={hintId} className="worksheet-hint-popup" hidden={!hintOpen} role="status">
                    {practice?.hint ?? "Fitur Hint belum tersedia di tutorial."}
                </div>
            </div>
            <button type="button" className="chapter-button tutorial-icon-button tutorial-material-button" aria-label="Baca Materi" title="Baca Materi" data-usability-feature="material"
                aria-haspopup="dialog" onClick={() => materialDialog.current?.showModal()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 6v15M3 4h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5v15h-5a4 4 0 0 0-4 2 4 4 0 0 0-4-2H3z" />
                </svg>
                <span>Baca Materi</span>
            </button>
        </div>
    );
    const checkButton = <button type="button" className="chapter-button tutorial-check-button" disabled={practice?.checkDisabled} data-usability-feature="check"
        onClick={practice?.onCheck ?? (() => notifyUnavailable("Periksa"))}>{practice?.checkLabel ?? "Periksa"}</button>;

    return (
        <div className="orme-container" data-tour-target={tour?.target} data-demo-complete={complete}>
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
                    <Definisi showIllustration={false} />
                    <Langkah showIllustration={false} />
                </div>
            </dialog>
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
                                            onClick={() => setExpansion((previous) => ({
                                                stage,
                                                cards: { ...(previous.stage === stage ? previous.cards : {}), [index]: !expanded },
                                            }))}
                                        >
                                            <span className="langkah-langkah-card-content">
                                                <span className="langkah-langkah-card-label">Langkah {index + 1}</span>
                                                <strong className="langkah-langkah-card-title">{title}</strong>
                                                <span id={id} className="tutorial-step-details" aria-hidden={!expanded}>
                                                    <span className="langkah-langkah-card-description">
                                                        {practice && index === 3 ? "Klik node terpilih untuk menambahkannya ke Urutan Sorting." : description}
                                                    </span>
                                                </span>
                                                {review && <span className="practice-review-message" role="status">{review.message}</span>}
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
                <div className="urutan-sorting-container">
                    <div className="urutan-sorting-content">
                        <h1>Urutan Sorting</h1>
                        <div ref={queueList} className="urutan-sorting-queue" aria-live={practice ? "polite" : undefined} aria-label={frame?.queue.length ? `Urutan Sorting: ${frame.queue.join(", ")}` : "Urutan Sorting kosong"}>
                            {frame?.queue.map((node) => (
                                <span key={node} className="node-circle tutorial-queue-node" data-queued-by-click={practice ? "" : undefined}><span>{node}</span></span>
                            ))}
                        </div>
                        <div className="tutorial-graph-controls">
                            {helpButtons}
                            {checkButton}
                        </div>
                    </div>
                </div>
                <div className="graph-container">
                    <div className="tutorial-notification" role="status" aria-atomic="true" data-visible={notification.visible}>
                        <span aria-hidden={!notification.visible}>{notification.message}</span>
                    </div>
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
                                        <div className="in-degree-container">
                                            <div className="in-degree-content">
                                                <div className="in-degree-attribute">
                                                    <h1>In-Degree</h1>
                                                    <h1>:</h1>
                                                </div>
                                                <input className="in-degree-value" type="text" inputMode="numeric" placeholder="?" aria-label="In-degree B" readOnly disabled={inactiveDegrees?.includes("B")} value={demo?.degrees?.B ?? ""} />
                                            </div>
                                        </div>
                                        <div className="node-circle" data-selected={demo?.selected === "B"} data-sorted={frame?.queue.includes("B")}>
                                            <h1>B</h1>
                                        </div>
                                    </div>
                                    <div className="node-v1">
                                        <div className="in-degree-container">
                                            <div className="in-degree-content">
                                                <div className="in-degree-attribute">
                                                    <h1>In-Degree</h1>
                                                    <h1>:</h1>
                                                </div>
                                                <input className="in-degree-value" type="text" inputMode="numeric" placeholder="?" aria-label="In-degree C" readOnly disabled={inactiveDegrees?.includes("C")} value={demo?.degrees?.C ?? ""} />
                                            </div>
                                        </div>
                                        <div className="node-circle" data-selected={demo?.selected === "C"} data-sorted={frame?.queue.includes("C")}>
                                            <h1>C</h1>
                                        </div>
                                    </div>
                                    <div className="node-v1">
                                        <div className="node-circle" data-selected={demo?.selected === "A"} data-sorted={frame?.queue.includes("A")}>
                                            <h1>A</h1>
                                        </div>
                                        <div className="in-degree-container">
                                            <div className="in-degree-content">
                                                <div className="in-degree-attribute">
                                                    <h1>In-Degree</h1>
                                                    <h1>:</h1>
                                                </div>
                                                <input className="in-degree-value" type="text" inputMode="numeric" placeholder="?" aria-label="In-degree A" readOnly disabled={inactiveDegrees?.includes("A")} value={demo?.degrees?.A ?? ""} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="node-v1">
                                        <div className="node-circle" data-selected={demo?.selected === "D"} data-sorted={frame?.queue.includes("D")}>
                                            <h1>D</h1>
                                        </div>
                                        <div className="in-degree-container">
                                            <div className="in-degree-content">
                                                <div className="in-degree-attribute">
                                                    <h1>In-Degree</h1>
                                                    <h1>:</h1>
                                                </div>
                                                <input className="in-degree-value" type="text" inputMode="numeric" placeholder="?" aria-label="In-degree D" readOnly disabled={inactiveDegrees?.includes("D")} value={demo?.degrees?.D ?? ""} />
                                            </div>
                                        </div>
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
