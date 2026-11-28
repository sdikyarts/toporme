import type { ComponentPropsWithoutRef } from "react";

type GraphInDegreeProps = ComponentPropsWithoutRef<"input"> & {
    node: string;
    review?: "correct" | "wrong";
};

export default function GraphInDegree({ node, review, ...inputProps }: GraphInDegreeProps) {
    return (
        <label className="in-degree-container" data-review={review}>
            <span className="in-degree-label">In-Degree:</span>
            <input {...inputProps} className="in-degree-value" type="text" inputMode="numeric"
                aria-label={`In-degree ${node}`} placeholder="?" />
        </label>
    );
}
