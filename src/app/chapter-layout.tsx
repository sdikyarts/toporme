import type { FormEventHandler, ReactNode } from "react";
import ProgressBar from "./progress-bar";
import ProgressButton from "./progress-button";
import { advanceProgress } from "./progress-action";
import type { Progress } from "./progress";

type ChapterLayoutProps = {
    progress: Progress;
    percent: number;
    title?: string;
    skipDisabled?: boolean;
    onSkip?: FormEventHandler<HTMLFormElement>;
    children: ReactNode;
    navigation: ReactNode;
};

export default function ChapterLayout({ progress, percent, title = "Pengantar Topological Sort", skipDisabled, onSkip, children, navigation }: ChapterLayoutProps) {
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
                            <h1>{title}</h1>
                            <ProgressBar percent={percent} label="Progress" />
                        </div>
                        <form action={advanceProgress.bind(null, progress)} onSubmit={onSkip}>
                            <ProgressButton className="chapter-button" disabled={skipDisabled}>Skip Bagian</ProgressButton>
                        </form>
                    </div>
                    <div className="page-content">{children}</div>
                    {navigation}
                </div>
            </div>
        </main>
    );
}
