"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import ChapterLayout, { chapterProgressForm } from "../../chapter-layout";
import ChapterNavigation from "../../chapter-navigation";
import ChapterTitle from "../pengantar/chapter-title";
import { returnToPreviousChapter } from "../../progress-action";
import type { Progress } from "../../progress";
import TutorialStep from "../tutorial/tutorial-step";
import { tutorialCompletionStep } from "../tutorial/tutorial-flow";
import PracticeGraph, { nodeNames, practiceEdges, type PracticeNode } from "./practice-graph";
import { latihanPanelName, readLatihanSnapshot, type LatihanSnapshot } from "./latihan-state";

const latihanTitle = "Latihan Topological Sort";
const practiceHints = [
    "Hitung panah yang ujungnya mengarah ke node. Abaikan panah yang sudah dihapus.",
    "Cari node yang tidak memiliki panah masuk.",
    "Ikuti arah panah dari node yang dipilih. Pilih hanya panah yang berawal di sana.",
    "Klik node terpilih untuk menambahkannya ke Urutan Sorting.",
    "Lihat hasilnya di Urutan Sorting.",
];

export default function Latihan({ progress, initialOpen, storageKey }: { progress: Progress; initialOpen: boolean; storageKey: string | null }) {
    const [open, setOpen] = useState(initialOpen);
    const [restored, setRestored] = useState(false);
    const [step, setStep] = useState(0);
    const [queue, setQueue] = useState<PracticeNode[]>([]);
    const [selected, setSelected] = useState<PracticeNode | null>(null);
    const [marked, setMarked] = useState<string[]>([]);
    const [values, setValues] = useState<Partial<Record<PracticeNode, string>>>({});
    const [review, setReview] = useState<{ correct: boolean; message: string } | null>(null);
    const [queuedFrom, setQueuedFrom] = useState<DOMRect | null>(null);

    useLayoutEffect(() => {
        const saved = storageKey && readLatihanSnapshot(storageKey);
        if (saved) {
            setStep(saved.step);
            setQueue(saved.queue);
            setSelected(saved.selected);
            setMarked(saved.marked);
            setValues(saved.values);
            setReview(saved.review);
        }
        setRestored(true);
    }, [storageKey]);

    useLayoutEffect(() => {
        if (!restored || !storageKey) return;
        const snapshot: LatihanSnapshot = { step, queue, selected, marked, values, review };
        try {
            sessionStorage.setItem(storageKey, JSON.stringify(snapshot));
        } catch {
            // The worksheet can still be used when browser storage is unavailable.
        }
    }, [restored, storageKey, step, queue, selected, marked, values, review]);

    useEffect(() => {
        function restorePanel() {
            if (window.location.pathname === "/latihan") {
                setOpen(new URLSearchParams(window.location.search).get("panel") === latihanPanelName);
            }
        }
        window.addEventListener("popstate", restorePanel);
        return () => window.removeEventListener("popstate", restorePanel);
    }, []);

    function showWorksheet(visible: boolean) {
        setOpen(visible);
        const url = new URL(window.location.href);
        if (visible) url.searchParams.set("panel", latihanPanelName);
        else url.searchParams.delete("panel");
        window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    }
    const complete = queue.length === nodeNames.length;
    const canContinue = open && complete && step === tutorialCompletionStep;
    const iteration = Math.min(queue.length + 1, nodeNames.length);
    const remaining = practiceEdges.filter(([from]) => !queue.includes(from));
    const outgoing = remaining.filter(([from]) => from === selected).map(([from, to]) => from + to);
    const removed = [
        ...practiceEdges.filter(([from]) => queue.includes(from)).map(([from, to]) => from + to),
        ...outgoing.filter((edge) => marked.includes(edge)),
    ];
    const degree = (node: PracticeNode) => remaining.filter(([, to]) => to === node).length;
    const incorrect = nodeNames.filter((node) => !queue.includes(node) && values[node] !== String(degree(node)));

    function check() {
        if (complete) return;

        if (review) {
            if (review.correct) setStep(step + 1);
            else {
                if (step === 1) setSelected(null);
                if (step === 2) setMarked([]);
            }
            setReview(null);
            return;
        }

        if (step === 0) {
            setReview(incorrect.length === 0
                ? { correct: true, message: "Jawaban benar, semua in-degree node sudah tepat!" }
                : { correct: false, message: "Jawaban belum tepat. Periksa kembali in-degree yang ditandai." });
        } else if (step === 1) {
            setReview(selected && degree(selected) === 0
                ? { correct: true, message: "Jawaban benar, node yang dipilih sudah tepat!" }
                : { correct: false, message: "Pilih node yang memiliki in-degree 0." });
        } else if (step === 2) {
            const correct = marked.length === outgoing.length && outgoing.every((edge) => marked.includes(edge));
            setReview(correct
                ? { correct: true, message: "Jawaban benar, semua outgoing edge sudah dipilih!" }
                : { correct: false, message: "Jawaban belum tepat. Pilih semua panah keluar dari node terpilih saja." });
        }
    }

    function activateNode(node: PracticeNode, button: HTMLButtonElement) {
        if (step === 1) {
            setSelected(node);
            return;
        }
        if (step !== 3 || node !== selected || queue.includes(node)) return;

        const next = [...queue, node];
        setQueuedFrom(button.getBoundingClientRect());
        setQueue(next);
        setSelected(null);
        setMarked([]);
        setValues(Object.fromEntries(next.map((entry) => [entry, "0"])));
        setStep(next.length === nodeNames.length ? tutorialCompletionStep : 0);
    }

    return (
        <ChapterLayout
            progress={progress}
            percent={queue.length / nodeNames.length * 100}
            title={latihanTitle}
            skipDisabled
            navigation={
                <>
                    <form id="previous-chapter" action={returnToPreviousChapter.bind(null, progress)} hidden />
                    <ChapterNavigation
                        isFirstPage={false}
                        prevForm={open ? undefined : "previous-chapter"}
                        onPrev={open ? () => showWorksheet(false) : undefined}
                        nextForm={canContinue ? chapterProgressForm : undefined}
                        nextDisabled={open && !canContinue}
                        nextLabel={canContinue && progress === "latihan" ? "Lanjut ke SUS Form" : undefined}
                        onNext={open ? undefined : () => showWorksheet(true)}
                    />
                </>
            }
        >
            <div className="chapter-panel" inert={open}>
                <ChapterTitle section="Bagian 3" title={latihanTitle} />
            </div>
            <section id={latihanPanelName} className="chapter-panel" aria-label="Lembar latihan" inert={!open}>
                {restored && <TutorialStep stage={iteration * 5 + step} practice={{
                    step, iteration, queue,
                    review,
                    queuedFrom,
                    checkLabel: review ? (review.correct ? "Lanjut" : "Ulangi") : "Periksa",
                    checkDisabled: step === 3 || complete,
                    onCheck: check,
                    hint: practiceHints[step],
                    graph: <PracticeGraph step={step} queue={queue} selected={selected} removed={removed} marked={marked} values={values}
                        review={review ? (review.correct ? "correct" : "wrong") : undefined}
                        incorrectDegrees={incorrect} outgoing={outgoing}
                        onValue={(node, value) => setValues((previous) => ({ ...previous, [node]: value }))}
                        onNode={activateNode} onCheck={check}
                        onEdge={(edge) => setMarked((previous) => previous.includes(edge) ? previous.filter((item) => item !== edge) : [...previous, edge])} />,
                }} />}
            </section>
        </ChapterLayout>
    );
}
