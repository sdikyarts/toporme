export const layoutTour = [
    { target: "welcome", title: "Selamat datang di TopORME!", description: "Kenali bagian-bagian lembar kerja, lalu lihat bagaimana topological sort mengurutkan node pada graf." },
    { target: "navigation", title: "Navigasi tutorial", description: "Gunakan Prev dan Next untuk berpindah tahap. Bilah di atas menunjukkan kemajuan tutorial." },
    { target: "steps", title: "Langkah-langkah", description: "Panel ini menunjukkan langkah yang sedang dilakukan dan nomor iterasinya." },
    { target: "queue", title: "Urutan Sorting", description: "Node ditambahkan ke antrean ini setelah semua outgoing edge-nya dihapus." },
    { target: "graph", title: "Graf dan in-degree", description: "Panah menunjukkan arah edge. Angka di dekat setiap node menunjukkan jumlah edge yang masih masuk." },
    { target: "hint", title: "Hint", description: "Di lembar kerja, Hint memberi petunjuk untuk langkah yang sedang dikerjakan." },
    { target: "material", title: "Baca Materi", description: "Di lembar kerja, Baca Materi membuka kembali penjelasan topological sort." },
    { target: "check", title: "Periksa", description: "Di lembar kerja, Periksa mengecek jawabanmu. Di tutorial ini, demonstrasi akan menampilkan hasilnya secara otomatis." },
    { target: "skip", title: "Skip Bagian", description: "Gunakan Skip Bagian jika ingin langsung ke latihan. Pilih Next untuk mulai melihat demonstrasi." },
] as const;

const nodes = ["A", "B", "C", "D"] as const;
type Node = typeof nodes[number];
const edges = [
    ["A", "B"], ["A", "D"], ["B", "C"], ["B", "D"], ["C", "D"],
] as const;

type Frame = {
    iteration: number;
    step: number;
    degrees?: Record<Node, number>;
    queue: readonly Node[];
    selected?: Node;
    inactiveDegree?: Node;
    removed: readonly string[];
    highlightedEdges?: readonly string[];
};

export const tutorialCompletionStep = 4;
export const tutorialPanelName = "tutorial-step";
export const tutorialCompletionStage = "complete";
export const tutorialCompletionPath = `/tutorial?panel=${tutorialPanelName}&stage=${tutorialCompletionStage}`;

function buildDemonstration(): Frame[] {
    const frames: Frame[] = [{ iteration: 1, step: 0, queue: [], removed: [] }];
    let queue: Node[] = [];
    let remaining = [...edges];
    const degrees = () => Object.fromEntries(
        nodes.map((node) => [node, remaining.filter(([, to]) => to === node).length]),
    ) as Record<Node, number>;
    const removed = () => edges.filter((edge) => !remaining.includes(edge)).map(([from, to]) => `${from}${to}`);

    for (let iteration = 1; iteration <= nodes.length; iteration++) {
        const currentDegrees = degrees();
        const selected = nodes.find((node) => !queue.includes(node) && currentDegrees[node] === 0);
        if (!selected) throw new Error("Tutorial graph must be acyclic");

        frames.push({ iteration, step: 0, degrees: currentDegrees, queue, removed: removed() });
        frames.push({ iteration, step: 1, degrees: currentDegrees, queue, selected, removed: removed() });

        const outgoing = remaining.filter(([from]) => from === selected);
        for (let index = 0; index <= outgoing.length; index++) {
            frames.push({
                iteration,
                step: 2,
                degrees: currentDegrees,
                queue,
                selected,
                inactiveDegree: index === outgoing.length ? selected : undefined,
                removed: removed(),
                highlightedEdges: outgoing.slice(index).map(([from, to]) => `${from}${to}`),
            });
            if (index < outgoing.length) remaining = remaining.filter((edge) => edge !== outgoing[index]);
        }

        queue = [...queue, selected];
        frames.push({ iteration, step: 3, degrees: currentDegrees, queue, removed: removed() });
    }

    frames.push({ iteration: nodes.length, step: tutorialCompletionStep, degrees: degrees(), queue, removed: removed() });
    return frames;
}

export const demonstration = buildDemonstration();
export const tutorialLastStage = layoutTour.length + demonstration.length - 1;

export function tutorialStageFromParam(value: string | null | undefined) {
    if (value === tutorialCompletionStage) return tutorialLastStage;
    if (!value || !/^\d+$/.test(value)) return 0;
    const stage = Number(value);
    return stage <= tutorialLastStage ? stage : 0;
}
