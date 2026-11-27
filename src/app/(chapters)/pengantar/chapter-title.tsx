export default function ChapterTitle({ section = "Bagian 1", title = "Pengantar Topological Sort" }: { section?: string; title?: string } = {}) {
    return (
        <div className="chapter-title">
            <h2>{section}</h2>
            <h1>{title}</h1>
        </div>
    );
}
