import { nodeNames, practiceEdges, type PracticeNode } from "./practice-graph";

export const latihanPanelName = "latihan-step";

export type LatihanSnapshot = {
    step: number;
    queue: PracticeNode[];
    selected: PracticeNode | null;
    marked: string[];
    values: Partial<Record<PracticeNode, string>>;
    review: { correct: boolean; message: string } | null;
};

export function readLatihanSnapshot(key: string): LatihanSnapshot | null {
    try {
        const saved = sessionStorage.getItem(key);
        if (!saved) return null;
        const snapshot = JSON.parse(saved) as LatihanSnapshot;
        if (!snapshot || !Number.isInteger(snapshot.step) || snapshot.step < 0 || snapshot.step > 4) return null;
        if (!Array.isArray(snapshot.queue) || !snapshot.queue.every((node) => nodeNames.includes(node))
            || new Set(snapshot.queue).size !== snapshot.queue.length) return null;
        if (snapshot.selected !== null && !nodeNames.includes(snapshot.selected)) return null;
        if (!Array.isArray(snapshot.marked) || !snapshot.marked.every((edge) => practiceEdges.some(([from, to]) => from + to === edge))) return null;
        if (!snapshot.values || typeof snapshot.values !== "object" || !Object.entries(snapshot.values).every(([node, value]) =>
            nodeNames.includes(node as PracticeNode) && typeof value === "string" && /^\d?$/.test(value))) return null;
        if (snapshot.review !== null && (typeof snapshot.review?.correct !== "boolean" || typeof snapshot.review.message !== "string")) return null;
        return snapshot;
    } catch {
        return null;
    }
}
