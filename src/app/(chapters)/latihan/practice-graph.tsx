export const practiceNodes = {
    A: [80, 220], B: [280, 94], C: [680, 94],
    D: [480, 220], E: [280, 292], F: [680, 292],
} as const;

export type PracticeNode = keyof typeof practiceNodes;
export const nodeNames = Object.keys(practiceNodes) as PracticeNode[];
export const practiceEdges = [
    ["A", "B"], ["A", "D"], ["A", "E"], ["B", "C"], ["C", "F"],
    ["D", "B"], ["D", "C"], ["D", "E"], ["D", "F"], ["F", "E"],
] as const;

type Props = {
    step: number;
    queue: readonly PracticeNode[];
    selected: PracticeNode | null;
    removed: readonly string[];
    marked: readonly string[];
    values: Partial<Record<PracticeNode, string>>;
    review?: "correct" | "wrong";
    incorrectDegrees: readonly PracticeNode[];
    outgoing: readonly string[];
    onValue: (node: PracticeNode, value: string) => void;
    onNode: (node: PracticeNode, button: HTMLButtonElement) => void;
    onEdge: (edge: string) => void;
    onCheck: () => void;
};

export default function PracticeGraph({ step, queue, selected, removed, marked, values, review, incorrectDegrees, outgoing, onValue, onNode, onEdge, onCheck }: Props) {
    const outgoingRemoved = step >= 2 && outgoing.every((edge) => removed.includes(edge));
    const complete = queue.length === nodeNames.length;

    return (
        <div className="practice-graph" role="group" aria-label={complete ? `Jalur akhir: ${queue.join(" → ")}` : "Graf latihan"}>
            <svg className="practice-edges" viewBox="0 0 760 394" width="760" height="394">
                {practiceEdges.map(([from, to]) => {
                    const edge = from + to;
                    const [x, y] = practiceNodes[from];
                    const [endX, endY] = practiceNodes[to];
                    const distance = Math.hypot(endX - x, endY - y);
                    const dx = (endX - x) / distance;
                    const dy = (endY - y) / distance;
                    const onFinalPath = complete && queue[queue.indexOf(from) + 1] === to;
                    const gone = !onFinalPath && removed.includes(edge);
                    const interactive = step === 2 && !gone && !review;
                    const isMarked = marked.includes(edge);
                    const highlighted = onFinalPath || (step === 2 && !gone && outgoing.includes(edge));
                    const feedback = step === 2 && review === "wrong" && isMarked && !gone ? "wrong" : undefined;
                    const points = { x1: x + dx * 36, y1: y + dy * 36, x2: endX - dx * 36, y2: endY - dy * 36 };
                    const baseX = points.x2 - dx * 22.5;
                    const baseY = points.y2 - dy * 22.5;
                    const tipX = points.x2 + dx * 2.5;
                    const tipY = points.y2 + dy * 2.5;
                    const arrowhead = `${baseX - dy * 12.5},${baseY + dx * 12.5} ${tipX},${tipY} ${baseX + dy * 12.5},${baseY - dx * 12.5}`;

                    return (
                        <g key={edge} className="practice-edge" data-removed={gone} data-marked={isMarked} data-highlighted={highlighted} data-review={feedback}
                            role={interactive ? "button" : undefined} tabIndex={interactive ? 0 : undefined}
                            aria-label={interactive ? `Edge ${from} ke ${to}` : undefined}
                            aria-pressed={interactive ? isMarked : undefined}
                            aria-hidden={!interactive}
                            onClick={interactive ? () => onEdge(edge) : undefined}
                            onKeyDown={interactive ? (event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    onEdge(edge);
                                }
                            } : undefined}>
                            <line className="practice-edge-hit" {...points} />
                            <line className="practice-edge-line" {...points} />
                            <polygon points={arrowhead} fill="currentColor" pointerEvents="none" />
                        </g>
                    );
                })}
            </svg>
            {nodeNames.map((node) => {
                const [x, y] = practiceNodes[node];
                const sorted = queue.includes(node);
                const chosen = selected === node;
                const canQueue = step === 3 && chosen;
                const degreeFeedback = step === 0 && review && !sorted ? (incorrectDegrees.includes(node) ? "wrong" : "correct") : undefined;
                return (
                    <div key={node} className="practice-node" data-label-below={node === "E" || node === "F"} style={{ left: x, top: y }}>
                        <button type="button" className="node-circle" aria-label={canQueue ? `Tambahkan node ${node} ke Urutan Sorting` : `Pilih node ${node}`}
                            data-selected={chosen && (step > 1 || review === "correct")} data-sorted={sorted}
                            data-pending={chosen && step === 1 && !review}
                            data-review={chosen && step === 1 ? review : undefined}
                            aria-pressed={step === 1 && !sorted ? chosen : undefined}
                            disabled={sorted || Boolean(review) || (step !== 1 && !canQueue)}
                            onClick={(event) => onNode(node, event.currentTarget)}><span>{node}</span></button>
                        <label className="in-degree-container" data-review={degreeFeedback}>
                            <span>In-Degree:</span>
                            <input className="in-degree-value" type="text" inputMode="numeric" maxLength={1}
                                aria-label={`In-degree ${node}`} placeholder="?" value={values[node] ?? ""}
                                aria-invalid={degreeFeedback === "wrong" || undefined}
                                disabled={sorted || (chosen && outgoingRemoved)} readOnly={step !== 0 || Boolean(review)}
                                onChange={(event) => onValue(node, event.target.value.replace(/\D/g, ""))}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" && !event.repeat && !review) onCheck();
                                }} />
                        </label>
                    </div>
                );
            })}
        </div>
    );
}
