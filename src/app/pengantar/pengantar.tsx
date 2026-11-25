import { advanceProgress } from "../progress-action";
import ProgressButton from "../progress-button";
import ProgressBar from "../progress-bar";
import type { Progress } from "../progress";
import ChapterTitle from "./chapter-title";

export default function Pengantar({ progress }: { progress: Progress }) {
    return (
        <main>
            <div className="pengantar-container">
                <div className="content-container">
                    <div className="progress-bar-container">
                        <div className="progress-bar-app-logo">
                            <h1>
                                <span className="text-top">Top</span>
                                <span className="text-o">O</span>
                                <span className="text-rme">RME</span>
                            </h1>
                        </div>
                        <div className="progress-bar-chapter">
                            <h1>Pengantar Topological Sort</h1>
                            <ProgressBar percent={0} label="Progress" />
                        </div>
                        <form action={advanceProgress.bind(null, progress)}>
                            <ProgressButton className="chapter-button">Skip Bagian</ProgressButton>
                        </form>
                    </div>
                    <div className="page-content">
                        <ChapterTitle />
                    </div>
                    <div className="page-footer">
                        <button type="button" className="chapter-button" disabled>
                            <span className="chapter-chevron chapter-chevron-left" aria-hidden="true" />
                            Prev
                        </button>
                        <button type="button" className="chapter-button" disabled>
                            Next
                            <span className="chapter-chevron" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
