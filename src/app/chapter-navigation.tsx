type ChapterNavigationProps = {
  isFirstPage: boolean;
  prevForm?: string;
  prevLabel?: string;
  nextForm?: string;
  nextLabel?: string;
  nextAccent?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
};

export default function ChapterNavigation({ isFirstPage, prevForm, prevLabel = "Prev", nextForm, nextLabel = "Next", nextAccent, onPrev, onNext }: ChapterNavigationProps) {
  return (
    <div className="page-footer">
        <button type={prevForm ? "submit" : "button"} form={prevForm} className="chapter-button" disabled={isFirstPage} onClick={onPrev}>
            <svg className="chapter-chevron" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path
                    d="M13 4 L7 10 L13 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            {prevLabel}
        </button>
        <p>© 2026 TopORME. All Rights Reserved.</p>
        <button type={nextForm ? "submit" : "button"} form={nextForm} className={nextAccent ? "chapter-button chapter-button-accent" : "chapter-button"} onClick={onNext}>
            {nextLabel}
            <svg className="chapter-chevron" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                <path
                    d="M7 4 L13 10 L7 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </button>
    </div>
  );
}
